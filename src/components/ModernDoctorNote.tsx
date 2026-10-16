import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Biotech as LabIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  Medication as MedIcon,
  MonitorHeart as VitalsIcon,
  Save as SaveIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi } from '../services/api';
import { icd10Api, ICD10Code } from '../services/icd10Api';
import { medicationApi, MedicationResult } from '../services/medicationApi';
import { patientLabService, PatientLabOrder } from '../services/patientLabService';
import { notifyAppDataChanged } from '../context/AppDataContext';

const SYMPTOM_BUBBLES = [
  'Headache',
  'Chest pain',
  'Shortness of breath',
  'Dizziness',
  'Fatigue',
  'Fever',
  'Cough',
  'Nausea',
  'Abdominal pain',
  'Back pain',
  'Joint pain',
  'Palpitations',
  'Edema',
  'Anxiety',
  'Insomnia',
  'Vision changes',
  'Weight loss',
  'Polyuria',
  'Nocturia',
  'Syncope',
] as const;

interface ModernDoctorNoteProps {
  patient: Patient;
  patientVitals: Vitals[];
  doctorName: string;
  onSave: (updatedPatient: Patient) => void;
  onClose: () => void;
  onRecordVitals: () => void;
  onOpenLab?: () => void;
  refreshToken?: number;
}

function parseSymptoms(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !/^no symptoms/i.test(s));
}

function parseIcdFromDiagnosis(text?: string): ICD10Code[] {
  if (!text) return [];
  const codes: ICD10Code[] = [];
  const re = /\b([A-Z]\d{2}(?:\.\d{1,4})?)\s*[—–-]?\s*([^;|\n]*)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    codes.push({ code: m[1].toUpperCase(), description: (m[2] || '').trim() || m[1] });
  }
  return codes;
}

const ModernDoctorNote: React.FC<ModernDoctorNoteProps> = ({
  patient,
  patientVitals,
  doctorName,
  onSave,
  onClose,
  onRecordVitals,
  onOpenLab,
  refreshToken = 0,
}) => {
  const displayName =
    patient.name ||
    patient.full_name ||
    `${patient.first_name || ''} ${patient.last_name || ''}`.trim() ||
    'Patient';

  const [soapTab, setSoapTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [chiefComplaint, setChiefComplaint] = useState(
    patient.soapNote?.subjective?.chiefComplaint || ''
  );
  const [hpi, setHpi] = useState(patient.soapNote?.subjective?.historyOfPresentIllness || '');
  const [symptoms, setSymptoms] = useState<string[]>(
    parseSymptoms(patient.soapNote?.subjective?.symptoms)
  );
  const [allergies, setAllergies] = useState(
    (Array.isArray(patient.allergies)
      ? patient.allergies.join(', ')
      : patient.allergies) ||
      patient.soapNote?.subjective?.allergies ||
      ''
  );
  const [medications, setMedications] = useState<string[]>(() => {
    const raw =
      patient.soapNote?.subjective?.medications ||
      patient.medicationList ||
      (patient.current_medications || []).join(', ') ||
      '';
    return raw
      .split(/[,;]/)
      .map((s) => s.trim())
      .filter((s) => s && !/^none/i.test(s));
  });
  const [familyHistory, setFamilyHistory] = useState(
    patient.soapNote?.subjective?.familyHistory || patient.familyHistory || ''
  );
  const [socialHistory, setSocialHistory] = useState(
    patient.soapNote?.subjective?.socialHistory ||
      `Age: ${patient.age ?? '—'}, Gender: ${patient.gender || '—'}`
  );
  const [physicalExam, setPhysicalExam] = useState(
    patient.soapNote?.objective?.physicalExam || ''
  );
  const [labNotes, setLabNotes] = useState(patient.soapNote?.objective?.labResults || '');
  const [diagnosticTests, setDiagnosticTests] = useState(
    patient.soapNote?.objective?.diagnosticTests || ''
  );
  const [clinicalDiagnosis, setClinicalDiagnosis] = useState(
    patient.soapNote?.assessment?.clinicalDiagnosis || ''
  );
  const [differential, setDifferential] = useState(
    patient.soapNote?.assessment?.differentialDiagnosis || ''
  );
  const [riskFactors, setRiskFactors] = useState(
    patient.soapNote?.assessment?.riskFactors || ''
  );
  const [icdCodes, setIcdCodes] = useState<ICD10Code[]>(() =>
    parseIcdFromDiagnosis(patient.soapNote?.assessment?.clinicalDiagnosis)
  );
  const [treatmentPlan, setTreatmentPlan] = useState(
    patient.soapNote?.plan?.treatmentPlan || ''
  );
  const [followUp, setFollowUp] = useState(
    patient.soapNote?.plan?.followUpInstructions || ''
  );
  const [education, setEducation] = useState(
    patient.soapNote?.plan?.patientEducation || ''
  );
  const [referrals, setReferrals] = useState(patient.soapNote?.plan?.referrals || '');

  const [icdOptions, setIcdOptions] = useState<ICD10Code[]>([]);
  const [icdLoading, setIcdLoading] = useState(false);
  const [icdQuery, setIcdQuery] = useState('');
  const [medOptions, setMedOptions] = useState<MedicationResult[]>([]);
  const [medLoading, setMedLoading] = useState(false);
  const [medQuery, setMedQuery] = useState('');

  const [labOrders, setLabOrders] = useState<PatientLabOrder[]>([]);
  const [labsLoading, setLabsLoading] = useState(false);
  const [liveVitals, setLiveVitals] = useState<Vitals[]>(patientVitals);

  useEffect(() => {
    setLiveVitals(patientVitals);
  }, [patientVitals]);

  const loadLabs = useCallback(async () => {
    if (!patient.id) return;
    setLabsLoading(true);
    try {
      const list = await patientLabService.getOrdersForPatient(patient.id, displayName);
      setLabOrders(list);
      if (list.length > 0) {
        const summary = list
          .map(
            (o) =>
              `${o.testCode} ${o.testName}${o.resultValue ? `: ${o.resultValue}` : ''} (${o.status})`
          )
          .join('; ');
        setLabNotes((prev) => prev || summary);
      }
    } catch {
      setLabOrders([]);
    } finally {
      setLabsLoading(false);
    }
  }, [patient.id, displayName]);

  useEffect(() => {
    void loadLabs();
  }, [loadLabs, refreshToken]);

  useEffect(() => {
    if (!icdQuery.trim()) {
      setIcdOptions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIcdLoading(true);
      const res = await icd10Api.searchCodes(icdQuery, 12);
      if (!cancelled) {
        setIcdOptions(res.data || []);
        setIcdLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [icdQuery]);

  useEffect(() => {
    if (!medQuery.trim()) {
      setMedOptions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setMedLoading(true);
      const res = await medicationApi.search(medQuery, 12);
      if (!cancelled) {
        setMedOptions(res.data || []);
        setMedLoading(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [medQuery]);

  const latestVitals = liveVitals[0];

  const healthScore = useMemo(() => {
    return (
      patient.soapNote?.assessment?.healthScore ??
      patient.health_risk_score ??
      100
    );
  }, [patient]);

  const riskLevel = useMemo(() => {
    if (healthScore >= 80) return 'Low Risk';
    if (healthScore >= 60) return 'Moderate Risk';
    return 'High Risk';
  }, [healthScore]);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const buildUpdatedPatient = (): Patient => {
    const diagnosisParts = [
      ...icdCodes.map((c) => `${c.code} — ${c.description}`),
      clinicalDiagnosis.trim(),
    ].filter(Boolean);

    const uniqueDiagnosis = Array.from(new Set(diagnosisParts)).join('; ');

    return {
      ...patient,
      allergies,
      medicationList: medications.join(', '),
      current_medications: medications,
      familyHistory,
      soapNote: {
        subjective: {
          chiefComplaint,
          historyOfPresentIllness: hpi,
          symptoms: symptoms.join(', '),
          allergies,
          medications: medications.join(', '),
          familyHistory,
          socialHistory,
          psychologicalAssessment: patient.soapNote?.subjective?.psychologicalAssessment || '',
        },
        objective: {
          physicalExam,
          labResults: labNotes,
          diagnosticTests,
          vitalSigns: latestVitals
            ? {
                bloodPressure: latestVitals.bloodPressure || 'Not recorded',
                heartRate: String(latestVitals.heartRate ?? 'Not recorded'),
                temperature: String(latestVitals.temperature ?? 'Not recorded'),
                oxygenSaturation: String(latestVitals.oxygenSaturation ?? 'Not recorded'),
                bloodSugar: String(latestVitals.bloodSugar ?? 'Not recorded'),
                weight: String(latestVitals.weight ?? 'Not recorded'),
                height: String(latestVitals.height ?? 'Not recorded'),
                carotidDoppler: latestVitals.carotidDoppler || 'Not recorded',
              }
            : patient.soapNote?.objective?.vitalSigns,
        },
        assessment: {
          clinicalDiagnosis: uniqueDiagnosis,
          differentialDiagnosis: differential,
          riskFactors,
          healthScore,
          riskLevel,
        },
        plan: {
          treatmentPlan,
          followUpInstructions: followUp,
          patientEducation: education,
          referrals,
        },
      },
      lastUpdated: new Date().toISOString(),
      updatedBy: doctorName,
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveMsg(null);
    try {
      const updated = buildUpdatedPatient();
      const response = await patientApi.update(patient.id!, updated);
      if (!response.success) {
        setError(response.message || 'Save failed — note kept locally');
      } else {
        setSaveMsg('Clinical note saved to GoDaddy and synced across tabs');
      }
      onSave(updated);
      notifyAppDataChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
      onSave(buildUpdatedPatient());
      notifyAppDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    await loadLabs();
    notifyAppDataChanged();
    setSyncing(false);
    setSaveMsg('Synced labs & patient data from hybrid storage');
  };

  const vitalChip = (label: string, value: string | number | undefined) => (
    <Chip
      key={label}
      size="small"
      variant="outlined"
      label={`${label}: ${value ?? '—'}`}
      sx={{ borderRadius: 2 }}
    />
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 520,
        bgcolor: 'linear-gradient(180deg, #f0f7f6 0%, #ffffff 40%)',
        background: 'linear-gradient(165deg, #e8f4f2 0%, #f7faf9 35%, #ffffff 100%)',
      }}
    >
      {/* Compact patient header */}
      <Box
        sx={{
          px: 2.5,
          pt: 2,
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(120deg, #0d7377 0%, #14919b 55%, #2a9d8f 100%)',
          color: '#fff',
        }}
      >
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
              <HospitalIcon fontSize="small" />
              <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                {displayName}
              </Typography>
              <Chip
                size="small"
                label={riskLevel}
                sx={{
                  bgcolor: healthScore >= 80 ? 'rgba(255,255,255,0.25)' : 'rgba(255,200,100,0.35)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              <Chip size="small" label={`${patient.age ?? '—'} yrs`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
              <Chip size="small" label={patient.gender || '—'} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
              {patient.email && (
                <Chip size="small" label={patient.email} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
              )}
              {(patient.phone || patient.phoneNumber) && (
                <Chip
                  size="small"
                  label={patient.phone || patient.phoneNumber}
                  sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }}
                />
              )}
              <Chip size="small" label={`Score ${healthScore}`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
            </Stack>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#fff' }} aria-label="Close">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ px: 2, pt: 1.5 }}>
        {(error || saveMsg) && (
          <Alert
            severity={error ? 'error' : 'success'}
            sx={{ mb: 1.5 }}
            onClose={() => {
              setError(null);
              setSaveMsg(null);
            }}
          >
            {error || saveMsg}
          </Alert>
        )}

        <Tabs
          value={soapTab}
          onChange={(_, v) => setSoapTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            mb: 1.5,
            '& .MuiTab-root': { minHeight: 40, textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#0d7377' },
            '& .MuiTabs-indicator': { bgcolor: '#0d7377', height: 3, borderRadius: 2 },
          }}
        >
          <Tab label="S · Subjective" />
          <Tab label="O · Objective" />
          <Tab label="A · Assessment" />
          <Tab label="P · Plan" />
        </Tabs>
      </Box>

      <Box sx={{ px: 2.5, pb: 2, flex: 1, overflow: 'auto', maxHeight: '62vh' }}>
        {/* SUBJECTIVE */}
        {soapTab === 0 && (
          <Stack spacing={2}>
            <TextField
              label="Chief complaint"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              fullWidth
              placeholder="What brings the patient in today?"
            />
            <TextField
              label="History of present illness"
              value={hpi}
              onChange={(e) => setHpi(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#0d7377', fontWeight: 700 }}>
                Symptoms — tap bubbles
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {SYMPTOM_BUBBLES.map((s) => {
                  const on = symptoms.includes(s);
                  return (
                    <Chip
                      key={s}
                      label={s}
                      clickable
                      onClick={() => toggleSymptom(s)}
                      color={on ? 'primary' : 'default'}
                      variant={on ? 'filled' : 'outlined'}
                      sx={{
                        borderRadius: '999px',
                        fontWeight: on ? 600 : 500,
                        bgcolor: on ? '#0d7377' : undefined,
                        '&:hover': { bgcolor: on ? '#14919b' : 'action.hover' },
                      }}
                    />
                  );
                })}
              </Box>
              {symptoms.length > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Selected: {symptoms.join(', ')}
                </Typography>
              )}
            </Box>

            <TextField
              label="Allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              fullWidth
              placeholder="NKDA or list allergies"
            />

            <Box>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <MedIcon fontSize="small" sx={{ color: '#0d7377' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0d7377' }}>
                  Medications (RxTerms API)
                </Typography>
              </Stack>
              <Autocomplete
                freeSolo
                options={medOptions}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                loading={medLoading}
                inputValue={medQuery}
                onInputChange={(_, v) => setMedQuery(v)}
                onChange={(_, value) => {
                  const name = typeof value === 'string' ? value : value?.name;
                  if (name && !medications.includes(name)) {
                    setMedications((prev) => [...prev, name]);
                  }
                  setMedQuery('');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search & add medication"
                    placeholder="e.g. metformin, lisinopril"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {medLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                {medications.map((m) => (
                  <Chip
                    key={m}
                    label={m}
                    onDelete={() => setMedications((prev) => prev.filter((x) => x !== m))}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
                {medications.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No medications on file
                  </Typography>
                )}
              </Box>
            </Box>

            <TextField
              label="Family history"
              value={familyHistory}
              onChange={(e) => setFamilyHistory(e.target.value)}
              fullWidth
              multiline
              minRows={1}
            />
            <TextField
              label="Social history"
              value={socialHistory}
              onChange={(e) => setSocialHistory(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {/* OBJECTIVE */}
        {soapTab === 1 && (
          <Stack spacing={2}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#b2dfdb' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <VitalsIcon sx={{ color: '#0d7377' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Vitals (synced)
                  </Typography>
                </Stack>
                <Button size="small" variant="outlined" onClick={onRecordVitals}>
                  Record vitals
                </Button>
              </Stack>
              {latestVitals ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {vitalChip('BP', latestVitals.bloodPressure)}
                  {vitalChip('HR', latestVitals.heartRate)}
                  {vitalChip('Temp', latestVitals.temperature)}
                  {vitalChip('SpO₂', latestVitals.oxygenSaturation)}
                  {vitalChip('Glucose', latestVitals.bloodSugar)}
                  {vitalChip('Weight', latestVitals.weight)}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No vitals yet — use Record vitals (shared with Vitals tab).
                </Typography>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#b2dfdb' }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <LabIcon sx={{ color: '#0d7377' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    Labs & radiology ({labOrders.length})
                  </Typography>
                  {labsLoading && <CircularProgress size={16} />}
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Refresh from GoDaddy hybrid">
                    <IconButton size="small" onClick={() => void handleSync()} disabled={syncing}>
                      <SyncIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {onOpenLab && (
                    <Button size="small" variant="outlined" onClick={onOpenLab}>
                      Lab tab
                    </Button>
                  )}
                </Stack>
              </Stack>
              {labOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No orders yet. Order from Lab tab — they appear here automatically.
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {labOrders.slice(0, 8).map((o) => (
                    <Typography key={o.id} variant="body2">
                      <strong>{o.testCode}</strong> {o.testName}
                      {o.resultValue ? ` → ${o.resultValue}` : ''} · {o.status}
                      <Chip
                        size="small"
                        label={o.kind}
                        sx={{ ml: 1, height: 20 }}
                        color={o.kind === 'radiology' ? 'secondary' : 'primary'}
                      />
                    </Typography>
                  ))}
                </Stack>
              )}
            </Paper>

            <TextField
              label="Physical examination"
              value={physicalExam}
              onChange={(e) => setPhysicalExam(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Lab / imaging notes"
              value={labNotes}
              onChange={(e) => setLabNotes(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Diagnostic tests"
              value={diagnosticTests}
              onChange={(e) => setDiagnosticTests(e.target.value)}
              fullWidth
            />
          </Stack>
        )}

        {/* ASSESSMENT */}
        {soapTab === 2 && (
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#0d7377' }}>
                ICD-10 diagnosis codes
              </Typography>
              <Autocomplete
                options={icdOptions}
                getOptionLabel={(o) => `${o.code} — ${o.description}`}
                loading={icdLoading}
                inputValue={icdQuery}
                onInputChange={(_, v) => setIcdQuery(v)}
                onChange={(_, value) => {
                  if (value && !icdCodes.some((c) => c.code === value.code)) {
                    setIcdCodes((prev) => [...prev, value]);
                  }
                  setIcdQuery('');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search ICD-10 (NIH Clinical Tables)"
                    placeholder="HTN, diabetes, I10…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {icdLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                {icdCodes.map((c) => (
                  <Chip
                    key={c.code}
                    color="primary"
                    variant="outlined"
                    label={`${c.code} ${c.description}`}
                    onDelete={() => setIcdCodes((prev) => prev.filter((x) => x.code !== c.code))}
                    sx={{ borderRadius: 2, maxWidth: '100%' }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              label="Clinical assessment / free-text diagnosis"
              value={clinicalDiagnosis}
              onChange={(e) => setClinicalDiagnosis(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Differential diagnosis"
              value={differential}
              onChange={(e) => setDifferential(e.target.value)}
              fullWidth
              multiline
              minRows={1}
            />
            <TextField
              label="Risk factors"
              value={riskFactors}
              onChange={(e) => setRiskFactors(e.target.value)}
              fullWidth
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Health score <strong>{healthScore}/100</strong> · {riskLevel} — synced from assessment /
              vitals across Doctor & AI Assessment tabs.
            </Alert>
          </Stack>
        )}

        {/* PLAN */}
        {soapTab === 3 && (
          <Stack spacing={2}>
            <TextField
              label="Treatment plan"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              fullWidth
              multiline
              minRows={3}
              placeholder="Medications, lifestyle, procedures…"
            />
            <TextField
              label="Follow-up"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              fullWidth
            />
            <TextField
              label="Patient education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField
              label="Referrals"
              value={referrals}
              onChange={(e) => setReferrals(e.target.value)}
              fullWidth
            />
          </Stack>
        )}
      </Box>

      <Divider />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{ p: 2, justifyContent: 'flex-end', bgcolor: '#fafafa' }}
      >
        <Button onClick={onClose}>Close</Button>
        <Button startIcon={<SyncIcon />} onClick={() => void handleSync()} disabled={syncing}>
          Sync tabs
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={() => void handleSave()}
          disabled={saving}
          sx={{ bgcolor: '#0d7377', '&:hover': { bgcolor: '#0a5c5f' } }}
        >
          Save clinical note
        </Button>
      </Stack>
    </Box>
  );
};

export default ModernDoctorNote;
