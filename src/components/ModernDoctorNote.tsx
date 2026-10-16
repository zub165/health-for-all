import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  Biotech as LabIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  Medication as MedIcon,
  MonitorHeart as VitalsIcon,
  DocumentScanner as RadIcon,
  Save as SaveIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi } from '../services/api';
import { icd10Api, ICD10Code } from '../services/icd10Api';
import {
  medicationApi,
  MedicationResult,
  RxPrescription,
} from '../services/medicationApi';
import { patientLabService, PatientLabOrder } from '../services/patientLabService';
import { labApi, LabTest } from '../services/labApi';
import {
  icdLabRecommendApi,
  IcdRecommendResult,
} from '../services/icdLabRecommendApi';
import { GODADDY_BACKENDS, LAB_IMAGING_CODES } from '../config/godaddyBackends';
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

const ICD_API = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';
const RX_API = 'https://clinicaltables.nlm.nih.gov/api/rxterms/v3/search';

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

function isImagingTest(test: LabTest): boolean {
  const code = (test.test_code || '').toUpperCase();
  if ((LAB_IMAGING_CODES as readonly string[]).includes(code)) return true;
  return (test.category_name || '').toLowerCase().includes('imaging');
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
  const [ordering, setOrdering] = useState(false);
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
  const [commonIcd, setCommonIcd] = useState<ICD10Code[]>([]);
  const [icdApiStatus, setIcdApiStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
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
  const [catalog, setCatalog] = useState<LabTest[]>([]);
  const [catalogStatus, setCatalogStatus] = useState<'idle' | 'ok' | 'fail' | 'cached'>('idle');
  const [catalogSource, setCatalogSource] = useState('');
  const [labPick, setLabPick] = useState<LabTest | null>(null);
  const [radPick, setRadPick] = useState<LabTest | null>(null);
  const [orderPriority, setOrderPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');

  const [rxList, setRxList] = useState<RxPrescription[]>([]);
  const [rxPick, setRxPick] = useState<MedicationResult | null>(null);
  const [rxQuery, setRxQuery] = useState('');
  const [rxOptions, setRxOptions] = useState<MedicationResult[]>([]);
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSig, setRxSig] = useState('1 tablet by mouth daily');
  const [rxQty, setRxQty] = useState('30');
  const [rxRefills, setRxRefills] = useState('0');
  const [rxApiStatus, setRxApiStatus] = useState<'idle' | 'ok' | 'fail'>('idle');
  const [icdSuggest, setIcdSuggest] = useState<IcdRecommendResult | null>(null);
  const [icdSuggestLoading, setIcdSuggestLoading] = useState(false);

  const [liveVitals, setLiveVitals] = useState<Vitals[]>(patientVitals);

  useEffect(() => {
    setLiveVitals(patientVitals);
  }, [patientVitals]);

  const refreshRx = useCallback(() => {
    if (!patient.id) return;
    setRxList(medicationApi.getPrescriptions(patient.id));
  }, [patient.id]);

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

  const loadCatalog = useCallback(async () => {
    setCatalogStatus('idle');
    setCatalogSource('');
    const res = await labApi.getTests();
    const rows = (res.data || []).filter((t) => t.is_active !== false);
    if (rows.length > 0) {
      setCatalog(rows);
      setCatalogSource(res.source || 'live');
      setCatalogStatus(res.source === 'live' ? 'ok' : 'cached');
    } else {
      setCatalog([]);
      setCatalogStatus('fail');
    }
  }, []);

  useEffect(() => {
    void loadLabs();
    void loadCatalog();
    refreshRx();
  }, [loadLabs, loadCatalog, refreshRx, refreshToken]);

  // AI: ICD-10 → recommended labs / radiology (live GoDaddy + local fallback)
  useEffect(() => {
    if (icdCodes.length === 0) {
      setIcdSuggest(null);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setIcdSuggestLoading(true);
      try {
        const res = await icdLabRecommendApi.recommend(icdCodes.map((c) => c.code));
        if (!cancelled) setIcdSuggest(res);
      } catch {
        if (!cancelled) setIcdSuggest(null);
      } finally {
        if (!cancelled) setIcdSuggestLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [icdCodes]);

  // Preload common ICD-10 + ping NIH API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const common = await icd10Api.getCommonHealthFairCodes();
      if (!cancelled && common.data) setCommonIcd(common.data);
      try {
        const probe = await icd10Api.searchCodes('hypertension', 5);
        if (!cancelled) {
          setIcdApiStatus(probe.success && (probe.data?.length || 0) > 0 ? 'ok' : 'fail');
          if (probe.data?.length) setIcdOptions(probe.data);
        }
      } catch {
        if (!cancelled) setIcdApiStatus('fail');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!icdQuery.trim()) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      setIcdLoading(true);
      const res = await icd10Api.searchCodes(icdQuery, 15);
      if (!cancelled) {
        setIcdOptions(res.data || []);
        setIcdApiStatus(res.success ? 'ok' : 'fail');
        setIcdLoading(false);
      }
    }, 250);
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
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [medQuery]);

  useEffect(() => {
    if (!rxQuery.trim()) {
      setRxOptions([]);
      return;
    }
    let cancelled = false;
    const t = setTimeout(async () => {
      setRxLoading(true);
      const res = await medicationApi.search(rxQuery, 15);
      if (!cancelled) {
        setRxOptions(res.data || []);
        setRxApiStatus(res.success && (res.data?.length || 0) > 0 ? 'ok' : 'fail');
        setRxLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [rxQuery]);

  const latestVitals = liveVitals[0];
  const healthScore = useMemo(
    () => patient.soapNote?.assessment?.healthScore ?? patient.health_risk_score ?? 100,
    [patient]
  );
  const riskLevel = useMemo(() => {
    if (healthScore >= 80) return 'Low Risk';
    if (healthScore >= 60) return 'Moderate Risk';
    return 'High Risk';
  }, [healthScore]);

  const labCatalog = useMemo(() => catalog.filter((t) => !isImagingTest(t)), [catalog]);
  const radCatalog = useMemo(() => catalog.filter((t) => isImagingTest(t)), [catalog]);

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const addIcd = (code: ICD10Code) => {
    setIcdCodes((prev) => (prev.some((c) => c.code === code.code) ? prev : [...prev, code]));
  };

  const buildUpdatedPatient = (): Patient => {
    const diagnosisParts = [
      ...icdCodes.map((c) => `${c.code} — ${c.description}`),
      clinicalDiagnosis.trim(),
    ].filter(Boolean);
    const uniqueDiagnosis = Array.from(new Set(diagnosisParts)).join('; ');

    const rxLines = patient.id ? medicationApi.formatPlanLines(patient.id) : '';
    const orderLines = labOrders
      .map((o) => `${o.kind === 'radiology' ? 'Radiology' : 'Lab'}: ${o.testCode} ${o.testName} (${o.status})`)
      .join('\n');
    const mergedPlan = [treatmentPlan.trim(), rxLines, orderLines].filter(Boolean).join('\n\n');

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
          treatmentPlan: mergedPlan,
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
        setSaveMsg('Clinical note saved (ICD + Rx + Labs synced to patient record)');
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
    await Promise.all([loadLabs(), loadCatalog()]);
    refreshRx();
    notifyAppDataChanged();
    setSyncing(false);
    setSaveMsg('Synced ICD catalog check, labs, radiology & Rx from hybrid APIs');
  };

  const placeOrder = async (test: LabTest, kind: 'lab' | 'radiology') => {
    if (!patient.id) {
      setError('Patient ID missing — cannot order');
      return;
    }
    setOrdering(true);
    setError(null);
    try {
      const res = await patientLabService.createOrder({
        patientId: patient.id,
        patientName: displayName,
        test,
        orderedBy: doctorName,
        priority: orderPriority,
        notes: `Ordered from clinical note Plan (${kind})`,
        kind,
      });
      if (!res.success) {
        setError(res.error || 'Order failed');
      } else {
        setSaveMsg(
          `${kind === 'radiology' ? 'Radiology' : 'Lab'} ordered: ${test.test_code} — ${test.test_name}` +
            (res.backendSynced ? ' (GoDaddy synced)' : ' (saved locally; backend pending)')
        );
        await loadLabs();
        notifyAppDataChanged();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order failed');
    } finally {
      setOrdering(false);
    }
  };

  const addPrescription = () => {
    if (!patient.id || !rxPick) {
      setError('Select a medication from the Rx API search first');
      return;
    }
    medicationApi.createPrescription({
      patientId: patient.id,
      drugName: rxPick.name,
      sig: rxSig,
      quantity: rxQty,
      refills: rxRefills,
      prescribedBy: doctorName,
      source: rxPick.source,
    });
    if (!medications.includes(rxPick.name)) {
      setMedications((prev) => [...prev, rxPick.name]);
    }
    const line = `Rx: ${rxPick.name} — ${rxSig} qty ${rxQty}`;
    setTreatmentPlan((prev) => (prev.includes(line) ? prev : [prev, line].filter(Boolean).join('\n')));
    refreshRx();
    setRxPick(null);
    setRxQuery('');
    setSaveMsg(`Prescription added via ${rxPick.source === 'rxterms' ? 'NIH RxTerms' : 'medication'} API`);
    notifyAppDataChanged();
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
        background: 'linear-gradient(165deg, #e8f4f2 0%, #f7faf9 35%, #ffffff 100%)',
      }}
    >
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
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 600 }}
              />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              <Chip size="small" label={`${patient.age ?? '—'} yrs`} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
              <Chip size="small" label={patient.gender || '—'} sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }} />
              {patient.email && (
                <Chip size="small" label={patient.email} sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff' }} />
              )}
              <Chip size="small" label={`Score ${healthScore}`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              {icdCodes.length > 0 && (
                <Chip size="small" label={`${icdCodes.length} ICD-10`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              )}
              {rxList.length > 0 && (
                <Chip size="small" label={`${rxList.length} Rx`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              )}
              {labOrders.length > 0 && (
                <Chip size="small" label={`${labOrders.length} orders`} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              )}
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
          <Tab label="A · ICD-10 Assessment" />
          <Tab label="P · Rx · Labs · Plan" />
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
                      }}
                    />
                  );
                })}
              </Box>
            </Box>
            <TextField label="Allergies" value={allergies} onChange={(e) => setAllergies(e.target.value)} fullWidth />
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#0d7377' }}>
                Current medications (home meds)
              </Typography>
              <Autocomplete
                freeSolo
                options={medOptions}
                getOptionLabel={(o) => (typeof o === 'string' ? o : o.name)}
                loading={medLoading}
                inputValue={medQuery}
                onInputChange={(_, v) => setMedQuery(v)}
                onChange={(_, value) => {
                  const name = typeof value === 'string' ? value : value?.name;
                  if (name && !medications.includes(name)) setMedications((p) => [...p, name]);
                  setMedQuery('');
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Search home meds (RxTerms)" placeholder="metformin…" />
                )}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                {medications.map((m) => (
                  <Chip key={m} label={m} onDelete={() => setMedications((p) => p.filter((x) => x !== m))} />
                ))}
              </Box>
            </Box>
            <TextField label="Family history" value={familyHistory} onChange={(e) => setFamilyHistory(e.target.value)} fullWidth />
            <TextField label="Social history" value={socialHistory} onChange={(e) => setSocialHistory(e.target.value)} fullWidth />
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
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No vitals yet.
                </Typography>
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
            <Alert severity="info">
              Order Labs / Radiology / Rx from the <strong>P · Rx · Labs · Plan</strong> tab (API-linked).
            </Alert>
          </Stack>
        )}

        {/* ASSESSMENT — ICD-10 */}
        {soapTab === 2 && (
          <Stack spacing={2}>
            <Alert
              severity={icdApiStatus === 'fail' ? 'warning' : 'success'}
              sx={{ borderRadius: 2 }}
            >
              <strong>ICD-10 API linked:</strong> NIH Clinical Tables
              <br />
              <Typography variant="caption" component="span" sx={{ wordBreak: 'break-all' }}>
                {ICD_API}
              </Typography>
              {icdApiStatus === 'ok' && ' · live search OK'}
              {icdApiStatus === 'fail' && ' · using local common-code fallback'}
            </Alert>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#0d7377' }}>
                Add ICD-10 diagnosis (search API)
              </Typography>
              <Autocomplete
                options={icdOptions.length ? icdOptions : commonIcd}
                getOptionLabel={(o) => `${o.code} — ${o.description}`}
                loading={icdLoading}
                filterOptions={(x) => x}
                inputValue={icdQuery}
                onInputChange={(_, v) => setIcdQuery(v)}
                onChange={(_, value) => {
                  if (value) addIcd(value);
                  setIcdQuery('');
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Type HTN, diabetes, I10, asthma…"
                    helperText="Results come from NIH ICD-10-CM API + local aliases"
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

              <Typography variant="caption" sx={{ mt: 1.5, mb: 0.5, display: 'block', fontWeight: 600 }}>
                Common health-fair codes (click to add)
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {commonIcd.map((c) => (
                  <Chip
                    key={c.code}
                    clickable
                    color={icdCodes.some((x) => x.code === c.code) ? 'primary' : 'default'}
                    variant={icdCodes.some((x) => x.code === c.code) ? 'filled' : 'outlined'}
                    label={`${c.code} ${c.description}`}
                    onClick={() => addIcd(c)}
                    sx={{ borderRadius: 2, maxWidth: '100%' }}
                  />
                ))}
              </Box>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
                Selected diagnoses ({icdCodes.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {icdCodes.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No ICD-10 codes yet — search above or tap a common code.
                  </Typography>
                )}
                {icdCodes.map((c) => (
                  <Chip
                    key={c.code}
                    color="primary"
                    label={`${c.code} — ${c.description}`}
                    onDelete={() => setIcdCodes((prev) => prev.filter((x) => x.code !== c.code))}
                    sx={{ borderRadius: 2 }}
                  />
                ))}
              </Box>
            </Paper>

            {(icdSuggestLoading || (icdSuggest && icdSuggest.matched_rules.length > 0)) && (
              <Paper
                variant="outlined"
                sx={{ p: 1.5, borderRadius: 2, borderColor: '#80cbc4', bgcolor: '#f1faf8' }}
              >
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={800} color="#0d7377">
                    AI · Labs & radiology for ICD-10
                  </Typography>
                  {icdSuggestLoading && <CircularProgress size={16} />}
                  {icdSuggest && (
                    <Chip
                      size="small"
                      color={icdSuggest.source === 'live' ? 'success' : 'info'}
                      label={icdSuggest.source === 'live' ? 'GoDaddy live API' : 'Local guideline map'}
                    />
                  )}
                </Stack>
                {icdSuggest?.matched_rules.map((r) => (
                  <Alert key={`${r.icd_matched}-${r.condition}`} severity="info" sx={{ mb: 1, py: 0.5 }}>
                    <strong>{r.icd_matched}</strong> → {r.condition}: {r.rationale}
                  </Alert>
                ))}
                {icdSuggest && (
                  <>
                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                      Suggested labs — click to order
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                      {icdSuggest.labs.map((t) => (
                        <Chip
                          key={`lab-${t.test_code}`}
                          clickable
                          color="primary"
                          variant="outlined"
                          label={`${t.test_code} ${t.test_name}`}
                          onClick={() => void placeOrder(t, 'lab')}
                          disabled={ordering}
                        />
                      ))}
                      {icdSuggest.labs.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                          No catalog matches yet — open Plan tab after Sync APIs.
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                      Suggested radiology / cardiac studies — click to order
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                      {icdSuggest.imaging.map((t) => (
                        <Chip
                          key={`img-${t.test_code}`}
                          clickable
                          color="secondary"
                          variant="outlined"
                          label={`${t.test_code} ${t.test_name}`}
                          onClick={() =>
                            void placeOrder(t, isImagingTest(t) ? 'radiology' : 'lab')
                          }
                          disabled={ordering}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {icdSuggest.disclaimer}
                      <br />
                      API: {GODADDY_BACKENDS.labManagement.icdRecommendations}
                    </Typography>
                  </>
                )}
              </Paper>
            )}

            <TextField
              label="Clinical assessment / free-text"
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
            />
            <TextField
              label="Risk factors"
              value={riskFactors}
              onChange={(e) => setRiskFactors(e.target.value)}
              fullWidth
            />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Health score <strong>{healthScore}/100</strong> · {riskLevel}
            </Alert>
          </Stack>
        )}

        {/* PLAN — Rx + Labs + Radiology */}
        {soapTab === 3 && (
          <Stack spacing={2}>
            {/* AI recommendations ALWAYS first on Plan — was only on Assessment before */}
            <Paper
              variant="outlined"
              sx={{ p: 1.5, borderRadius: 2, borderColor: '#0d7377', bgcolor: '#e8f5f4' }}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }} flexWrap="wrap">
                <Typography variant="subtitle1" fontWeight={800} color="#0d7377">
                  AI recommendations (ICD-10 → Labs & Radiology)
                </Typography>
                {icdSuggestLoading && <CircularProgress size={16} />}
                {icdSuggest && (
                  <Chip
                    size="small"
                    color={icdSuggest.source === 'live' ? 'success' : 'info'}
                    label={
                      icdSuggest.source === 'live'
                        ? 'Live GoDaddy API'
                        : 'Guideline map (offline OK)'
                    }
                  />
                )}
              </Stack>

              {icdCodes.length === 0 ? (
                <>
                  <Alert severity="warning" sx={{ mb: 1 }}>
                    No ICD-10 codes selected yet. Tap a common diagnosis below (or use the{' '}
                    <strong>A · ICD-10 Assessment</strong> tab) — AI will then suggest labs and
                    imaging to order.
                  </Alert>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Quick-add ICD-10 to unlock AI orders
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {(commonIcd.length ? commonIcd : [
                      { code: 'I10', description: 'Essential hypertension' },
                      { code: 'E11.9', description: 'Type 2 diabetes mellitus' },
                      { code: 'E78.5', description: 'Hyperlipidemia' },
                      { code: 'I50.9', description: 'Heart failure' },
                      { code: 'J44.9', description: 'COPD' },
                      { code: 'Z00.00', description: 'General adult exam' },
                    ]).slice(0, 12).map((c) => (
                      <Chip
                        key={c.code}
                        clickable
                        color="primary"
                        variant="outlined"
                        label={`${c.code} ${c.description}`}
                        onClick={() => addIcd(c)}
                        sx={{ borderRadius: 2 }}
                      />
                    ))}
                  </Box>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                    {icdCodes.map((c) => (
                      <Chip
                        key={c.code}
                        size="small"
                        color="primary"
                        label={c.code}
                        onDelete={() =>
                          setIcdCodes((prev) => prev.filter((x) => x.code !== c.code))
                        }
                      />
                    ))}
                  </Box>
                  {icdSuggest?.matched_rules.map((r) => (
                    <Alert
                      key={`${r.icd_matched}-${r.condition}`}
                      severity="info"
                      sx={{ mb: 1, py: 0.5 }}
                    >
                      <strong>{r.icd_matched}</strong> → {r.condition}: {r.rationale}
                    </Alert>
                  ))}
                  {icdSuggest && icdSuggest.matched_rules.length === 0 && !icdSuggestLoading && (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      No guideline match for {icdCodes.map((c) => c.code).join(', ')}. Try I10,
                      E11.9, E78.5, I50.9, or J44.9.
                    </Alert>
                  )}
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Suggested labs — click to order
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
                    {(icdSuggest?.labs || []).map((t) => (
                      <Chip
                        key={`plan-lab-${t.test_code}`}
                        clickable
                        color="primary"
                        label={`Order ${t.test_code}`}
                        onClick={() => void placeOrder(t, 'lab')}
                        disabled={ordering}
                      />
                    ))}
                    {icdSuggest && icdSuggest.labs.length === 0 && !icdSuggestLoading && (
                      <Typography variant="body2" color="text.secondary">
                        No lab matches in catalog — Sync APIs or pick from Lab orders below.
                      </Typography>
                    )}
                  </Box>
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
                    Suggested radiology / cardiac — click to order
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {(icdSuggest?.imaging || []).map((t) => (
                      <Chip
                        key={`plan-img-${t.test_code}`}
                        clickable
                        color="secondary"
                        label={`Order ${t.test_code}`}
                        onClick={() =>
                          void placeOrder(t, isImagingTest(t) ? 'radiology' : 'lab')
                        }
                        disabled={ordering}
                      />
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    {icdSuggest?.disclaimer}
                    <br />
                    API: {GODADDY_BACKENDS.labManagement.icdRecommendations}
                  </Typography>
                </>
              )}
            </Paper>

            {/* RX */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#80cbc4' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <MedIcon sx={{ color: '#0d7377' }} />
                <Typography variant="subtitle1" fontWeight={800} color="#0d7377">
                  Medication Rx prescriptions
                </Typography>
                <Chip
                  size="small"
                  label={rxApiStatus === 'ok' ? 'RxTerms API OK' : 'RxTerms API'}
                  color={rxApiStatus === 'ok' ? 'success' : 'default'}
                />
              </Stack>
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                API: <code>{RX_API}</code>
                <br />
                GoDaddy: <code>{GODADDY_BACKENDS.hospitalFinder.httpsBase}/api/medications/</code>
              </Alert>
              <Autocomplete
                options={rxOptions}
                getOptionLabel={(o) => `${o.name} (${o.source})`}
                loading={rxLoading}
                value={rxPick}
                inputValue={rxQuery}
                onInputChange={(_, v) => setRxQuery(v)}
                onChange={(_, v) => setRxPick(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search drug (RxTerms API)"
                    placeholder="metformin, lisinopril, atorvastatin…"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {rxLoading ? <CircularProgress size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                <TextField
                  label="Sig / directions"
                  value={rxSig}
                  onChange={(e) => setRxSig(e.target.value)}
                  fullWidth
                  size="small"
                />
                <TextField
                  label="Qty"
                  value={rxQty}
                  onChange={(e) => setRxQty(e.target.value)}
                  sx={{ width: { sm: 100 } }}
                  size="small"
                />
                <TextField
                  label="Refills"
                  value={rxRefills}
                  onChange={(e) => setRxRefills(e.target.value)}
                  sx={{ width: { sm: 100 } }}
                  size="small"
                />
                <Button
                  variant="contained"
                  onClick={addPrescription}
                  disabled={!rxPick}
                  sx={{ bgcolor: '#0d7377', whiteSpace: 'nowrap' }}
                >
                  Add Rx
                </Button>
              </Stack>
              <Box sx={{ mt: 1.5 }}>
                {rxList.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No prescriptions yet — search API and click Add Rx.
                  </Typography>
                ) : (
                  <Stack spacing={0.75}>
                    {rxList.map((r) => (
                      <Paper key={r.id} variant="outlined" sx={{ p: 1, borderRadius: 1.5 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {r.drugName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {r.sig} · qty {r.quantity || '—'} · refills {r.refills || '0'} · via {r.source}
                            </Typography>
                          </Box>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              medicationApi.cancelPrescription(r.id);
                              refreshRx();
                            }}
                          >
                            Cancel
                          </Button>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>

            {/* LABS */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#80cbc4' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <LabIcon sx={{ color: '#0d7377' }} />
                <Typography variant="subtitle1" fontWeight={800} color="#0d7377">
                  Lab orders
                </Typography>
                <Chip
                  size="small"
                  label={
                    catalogStatus === 'ok'
                      ? `${labCatalog.length} tests · live GoDaddy`
                      : catalogStatus === 'cached'
                        ? `${labCatalog.length} tests · ${catalogSource || 'cached'}`
                        : catalogStatus === 'fail'
                          ? 'Catalog failed'
                          : 'Loading…'
                  }
                  color={
                    catalogStatus === 'ok'
                      ? 'success'
                      : catalogStatus === 'cached'
                        ? 'info'
                        : catalogStatus === 'fail'
                          ? 'warning'
                          : 'default'
                  }
                />
                {labsLoading && <CircularProgress size={16} />}
              </Stack>
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                Catalog: <code>{GODADDY_BACKENDS.labManagement.tests}</code>
                <br />
                Patient attach: <code>{GODADDY_BACKENDS.hospitalFinder.labResults}</code>
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={labCatalog}
                  getOptionLabel={(t) => `${t.test_code} — ${t.test_name}`}
                  value={labPick}
                  onChange={(_, v) => setLabPick(v)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select lab test from GoDaddy catalog" size="small" />
                  )}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    label="Priority"
                    value={orderPriority}
                    onChange={(e) => setOrderPriority(e.target.value as typeof orderPriority)}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="stat">STAT</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  disabled={!labPick || ordering}
                  onClick={() => labPick && void placeOrder(labPick, 'lab')}
                  sx={{ bgcolor: '#0d7377' }}
                >
                  {ordering ? <CircularProgress size={18} color="inherit" /> : 'Order lab'}
                </Button>
              </Stack>
            </Paper>

            {/* RADIOLOGY */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, borderColor: '#80cbc4' }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <RadIcon sx={{ color: '#0d7377' }} />
                <Typography variant="subtitle1" fontWeight={800} color="#0d7377">
                  Radiology / imaging orders
                </Typography>
                <Chip size="small" label={`${radCatalog.length} imaging tests`} />
              </Stack>
              <Alert severity="info" sx={{ mb: 1.5, py: 0.5 }}>
                Imaging codes (XRAY / CT / MRI / US) from the same GoDaddy lab catalog.
              </Alert>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Autocomplete
                  sx={{ flex: 1 }}
                  options={radCatalog}
                  getOptionLabel={(t) => `${t.test_code} — ${t.test_name}`}
                  value={radPick}
                  onChange={(_, v) => setRadPick(v)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select radiology study" size="small" />
                  )}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  disabled={!radPick || ordering}
                  onClick={() => radPick && void placeOrder(radPick, 'radiology')}
                >
                  Order radiology
                </Button>
                {onOpenLab && (
                  <Button variant="outlined" onClick={onOpenLab}>
                    Full Lab tab
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Existing orders */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                Active lab & radiology orders ({labOrders.length})
              </Typography>
              {labOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  None yet — order above; they sync to the Lab tab and Objective notes.
                </Typography>
              ) : (
                <Stack spacing={0.5}>
                  {labOrders.map((o) => (
                    <Typography key={o.id} variant="body2">
                      <Chip
                        size="small"
                        label={o.kind}
                        color={o.kind === 'radiology' ? 'secondary' : 'primary'}
                        sx={{ mr: 1, height: 22 }}
                      />
                      <strong>{o.testCode}</strong> {o.testName}
                      {o.resultValue ? ` → ${o.resultValue}` : ''} · {o.status} · {o.source}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Paper>

            <TextField
              label="Treatment plan notes"
              value={treatmentPlan}
              onChange={(e) => setTreatmentPlan(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              helperText="Rx lines are appended automatically when you Add Rx"
            />
            <TextField label="Follow-up" value={followUp} onChange={(e) => setFollowUp(e.target.value)} fullWidth />
            <TextField
              label="Patient education"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              fullWidth
              multiline
              minRows={2}
            />
            <TextField label="Referrals" value={referrals} onChange={(e) => setReferrals(e.target.value)} fullWidth />
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
          Sync APIs
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
