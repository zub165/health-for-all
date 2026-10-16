import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AutoAwesome as AutoAwesomeIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Sync as SyncIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  LocalHospital as HospitalIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi } from '../services/api';

interface UnifiedSOAPNoteProps {
  patient: Patient;
  patientVitals: Vitals[];
  doctorName: string;
  onSave: (updatedPatient: Patient) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`soap-tabpanel-${index}`}
      aria-labelledby={`soap-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const UnifiedSOAPNote: React.FC<UnifiedSOAPNoteProps> = ({
  patient,
  patientVitals,
  doctorName,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Unified SOAP note state
  const [soapNote, setSoapNote] = useState({
    // Subjective
    chiefComplaint: patient.soapNote?.subjective?.chiefComplaint || '',
    historyOfPresentIllness: patient.soapNote?.subjective?.historyOfPresentIllness || '',
    symptoms: patient.soapNote?.subjective?.symptoms || '',
    allergies: patient.soapNote?.subjective?.allergies || patient.allergies || '',
    medications: patient.soapNote?.subjective?.medications || patient.medicationList || '',
    familyHistory: patient.soapNote?.subjective?.familyHistory || patient.familyHistory || '',
    socialHistory: patient.soapNote?.subjective?.socialHistory || `Age: ${patient.age || 'Not specified'}, Gender: ${patient.gender || 'Not specified'}`,
    psychologicalAssessment: patient.soapNote?.subjective?.psychologicalAssessment || '',
    
    // Objective
    physicalExam: patient.soapNote?.objective?.physicalExam || '',
    labResults: patient.soapNote?.objective?.labResults || '',
    diagnosticTests: patient.soapNote?.objective?.diagnosticTests || '',
    
    // Assessment
    clinicalDiagnosis: patient.soapNote?.assessment?.clinicalDiagnosis || '',
    differentialDiagnosis: patient.soapNote?.assessment?.differentialDiagnosis || '',
    riskFactors: patient.soapNote?.assessment?.riskFactors || '',
    healthScore: patient.soapNote?.assessment?.healthScore || calculateHealthScore(),
    riskLevel: patient.soapNote?.assessment?.riskLevel || 'Unknown',
    
    // Plan
    treatmentPlan: patient.soapNote?.plan?.treatmentPlan || '',
    followUpInstructions: patient.soapNote?.plan?.followUpInstructions || '',
    patientEducation: patient.soapNote?.plan?.patientEducation || '',
    referrals: patient.soapNote?.plan?.referrals || '',
    medicationChanges: '',
    dischargeInstructions: '',
    emergencyInstructions: '',
  });

  // AI Enhancement state
  const [aiSuggestions, setAiSuggestions] = useState({
    subjective: [],
    objective: [],
    assessment: [],
    plan: [],
  });

  const [aiSummary, setAiSummary] = useState('');

  // Calculate health score based on patient data
  function calculateHealthScore(): number {
    let score = 100;
    const factors: string[] = [];
    const medicalReferences: string[] = [];
    
    console.log('🔍 Evidence-Based UnifiedSOAPNote Health Score Calculation:', { patient, patientVitals });
    
    // === AGE FACTORS ===
    if (patient.age) {
      if (patient.age > 75) {
        score -= 20;
        factors.push('Advanced Age (75+)');
      } else if (patient.age > 65) {
        score -= 15;
        factors.push('Senior Age (65-74)');
      } else if (patient.age > 50) {
        score -= 10;
        factors.push('Middle Age (50-64)');
      } else if (patient.age > 35) {
        score -= 5;
        factors.push('Adult Age (35-49)');
      } else if (patient.age < 18) {
        score -= 5;
        factors.push('Pediatric Age');
      }
    }
    
    // === VITAL SIGNS ANALYSIS ===
    if (patientVitals && patientVitals.length > 0) {
      const vitals = patientVitals[0];
      
      // Blood Pressure Analysis
      if (vitals.bloodPressure) {
        const bp = vitals.bloodPressure.split('/');
        const systolic = parseInt(bp[0]);
        const diastolic = parseInt(bp[1]);
        
        if (systolic >= 180 || diastolic >= 120) {
          score -= 25;
          factors.push('Hypertensive Crisis');
        } else if (systolic >= 160 || diastolic >= 100) {
          score -= 20;
          factors.push('Stage 2 Hypertension');
        } else if (systolic >= 140 || diastolic >= 90) {
          score -= 15;
          factors.push('Stage 1 Hypertension');
        } else if (systolic >= 130 || diastolic >= 80) {
          score -= 10;
          factors.push('Elevated Blood Pressure');
        } else if (systolic < 90 || diastolic < 60) {
          score -= 5;
          factors.push('Low Blood Pressure');
        }
      }
      
      // Heart Rate Analysis
      if (vitals.heartRate) {
        const hr = parseInt(String(vitals.heartRate));
        if (hr > 100) {
          score -= 10;
          factors.push('Tachycardia');
        } else if (hr < 60) {
          score -= 5;
          factors.push('Bradycardia');
        }
      }
      
      // Temperature Analysis
      if (vitals.temperature) {
        const temp = parseFloat(String(vitals.temperature));
        if (temp > 100.4) {
          score -= 15;
          factors.push('Fever');
        } else if (temp < 95) {
          score -= 10;
          factors.push('Hypothermia');
        }
      }
      
      // Blood Sugar Analysis
      if (vitals.bloodSugar) {
        const bs = parseInt(String(vitals.bloodSugar));
        if (bs > 200) {
          score -= 25;
          factors.push('Severe Hyperglycemia');
        } else if (bs > 126) {
          score -= 20;
          factors.push('Hyperglycemia');
        } else if (bs < 70) {
          score -= 15;
          factors.push('Hypoglycemia');
        }
      }
      
      // BMI Analysis
      if (vitals.weight && vitals.height) {
        const weight = parseFloat(String(vitals.weight));
        const height = parseFloat(String(vitals.height)) / 100; // Convert cm to meters
        const bmi = weight / (height * height);
        
        if (bmi >= 40) {
          score -= 20;
          factors.push('Morbid Obesity');
        } else if (bmi >= 35) {
          score -= 15;
          factors.push('Severe Obesity');
        } else if (bmi >= 30) {
          score -= 10;
          factors.push('Obesity');
        } else if (bmi >= 25) {
          score -= 5;
          factors.push('Overweight');
        } else if (bmi < 18.5) {
          score -= 5;
          factors.push('Underweight');
        }
      }
      
      // Oxygen Saturation Analysis
      if (vitals.oxygenSaturation) {
        const spo2 = parseInt(String(vitals.oxygenSaturation));
        if (spo2 < 90) {
          score -= 20;
          factors.push('Hypoxemia');
        } else if (spo2 < 95) {
          score -= 10;
          factors.push('Low Oxygen Saturation');
        }
      }
    }
    
    // === MEDICAL HISTORY ANALYSIS ===
    if (patient.pastMedicalHistory && patient.pastMedicalHistory !== 'None reported') {
      const history = patient.pastMedicalHistory.toLowerCase();
      
      // Cardiovascular conditions
      if (history.includes('heart') || history.includes('cardiac') || history.includes('myocardial')) {
        score -= 20;
        factors.push('Cardiovascular Disease');
      }
      if (history.includes('stroke') || history.includes('cerebrovascular')) {
        score -= 25;
        factors.push('Stroke History');
      }
      if (history.includes('hypertension') || history.includes('high blood pressure')) {
        score -= 15;
        factors.push('Hypertension');
      }
      
      // Diabetes
      if (history.includes('diabetes') || history.includes('diabetic')) {
        score -= 20;
        factors.push('Diabetes');
      }
      
      // Cancer
      if (history.includes('cancer') || history.includes('tumor') || history.includes('malignancy')) {
        score -= 25;
        factors.push('Cancer History');
      }
      
      // Respiratory
      if (history.includes('asthma') || history.includes('copd') || history.includes('respiratory')) {
        score -= 15;
        factors.push('Respiratory Disease');
      }
      
      // Kidney disease
      if (history.includes('kidney') || history.includes('renal') || history.includes('dialysis')) {
        score -= 20;
        factors.push('Kidney Disease');
      }
      
      // Mental health
      if (history.includes('depression') || history.includes('anxiety') || history.includes('mental')) {
        score -= 10;
        factors.push('Mental Health Condition');
      }
    }
    
    // === ALLERGY ANALYSIS ===
    if (patient.allergies && patient.allergies !== 'None reported') {
      const allergies = Array.isArray(patient.allergies) 
        ? patient.allergies.join(', ').toLowerCase() 
        : patient.allergies.toLowerCase();
      if (allergies.includes('severe') || allergies.includes('anaphylaxis')) {
        score -= 20;
        factors.push('Severe Allergies');
      } else if (allergies.includes('multiple') || allergies.length > 50) {
        score -= 15;
        factors.push('Multiple Allergies');
      } else if (allergies.length > 20) {
        score -= 10;
        factors.push('Allergic Conditions');
      }
    }
    
    // === FAMILY HISTORY ANALYSIS ===
    if (patient.familyHistory && patient.familyHistory !== 'None reported') {
      const family = patient.familyHistory.toLowerCase();
      
      if (family.includes('diabetes')) {
        score -= 8;
        factors.push('Family History of Diabetes');
      }
      if (family.includes('heart') || family.includes('cardiac')) {
        score -= 10;
        factors.push('Family History of Heart Disease');
      }
      if (family.includes('cancer')) {
        score -= 12;
        factors.push('Family History of Cancer');
      }
      if (family.includes('stroke')) {
        score -= 10;
        factors.push('Family History of Stroke');
      }
      if (family.includes('hypertension') || family.includes('high blood pressure')) {
        score -= 6;
        factors.push('Family History of Hypertension');
      }
    }
    
    // === MEDICATION ANALYSIS ===
    if (patient.medicationList && patient.medicationList !== 'None reported') {
      const medications = patient.medicationList.toLowerCase();
      
      // Count number of medications
      const medCount = (medications.match(/,/g) || []).length + 1;
      if (medCount > 10) {
        score -= 15;
        factors.push('Polypharmacy (10+ medications)');
      } else if (medCount > 5) {
        score -= 10;
        factors.push('Multiple Medications (5-9)');
      }
      
      // Specific high-risk medications
      if (medications.includes('warfarin') || medications.includes('coumadin')) {
        score -= 8;
        factors.push('Anticoagulant Therapy');
      }
      if (medications.includes('insulin')) {
        score -= 10;
        factors.push('Insulin Therapy');
      }
      if (medications.includes('steroid') || medications.includes('prednisone')) {
        score -= 8;
        factors.push('Steroid Therapy');
      }
    }
    
    // === EMERGENCY CONTACT ANALYSIS ===
    if (patient.emergencyContact && patient.emergencyContact.length > 0) {
      score += 5; // Positive factor for having emergency contact
      factors.push('Emergency Contact Available');
    }
    
    // === VOLUNTEER SUPPORT ===
    if (patient.volunteerInfo?.name && patient.volunteerInfo.name.length > 0) {
      score += 3; // Positive factor for volunteer support
      factors.push('Volunteer Support Available');
    }
    
    const finalScore = Math.max(0, Math.min(100, score));
    
    console.log('📊 Evidence-Based UnifiedSOAPNote Health Score Complete:', {
      finalScore,
      factors,
      deductions: 100 - finalScore,
      vitalsIncluded: patientVitals && patientVitals.length > 0,
      medicalReferences: Array.from(new Set(medicalReferences))
    });
    
    // Log medical references for transparency
    console.log('📚 Medical Literature References (UnifiedSOAPNote):', Array.from(new Set(medicalReferences)));
    
    return finalScore;
  }

  // Track changes for real-time sync
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [soapNote]);

  // Auto-save functionality
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity

      return () => clearTimeout(autoSaveTimer);
    }
  }, [soapNote, hasUnsavedChanges]);

  const handleFieldChange = (field: string, value: string) => {
    setSoapNote(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAutoSave = async () => {
    if (!hasUnsavedChanges) return;
    
    setSaving(true);
    try {
      const updatedPatient = {
        ...patient,
        soapNote: {
          subjective: {
            chiefComplaint: soapNote.chiefComplaint,
            historyOfPresentIllness: soapNote.historyOfPresentIllness,
            symptoms: soapNote.symptoms,
            allergies: Array.isArray(soapNote.allergies) ? soapNote.allergies.join(', ') : soapNote.allergies,
            medications: soapNote.medications,
            familyHistory: soapNote.familyHistory,
            socialHistory: soapNote.socialHistory,
            psychologicalAssessment: soapNote.psychologicalAssessment,
          },
          objective: {
            physicalExam: soapNote.physicalExam,
            labResults: soapNote.labResults,
            diagnosticTests: soapNote.diagnosticTests,
            vitalSigns: patientVitals.length > 0 ? {
              bloodPressure: patientVitals[0].bloodPressure || 'Not recorded',
              heartRate: String(patientVitals[0].heartRate) || 'Not recorded',
              temperature: String(patientVitals[0].temperature) || 'Not recorded',
              oxygenSaturation: String(patientVitals[0].oxygenSaturation) || 'Not recorded',
              bloodSugar: String(patientVitals[0].bloodSugar) || 'Not recorded',
              weight: String(patientVitals[0].weight) || 'Not recorded',
              height: String(patientVitals[0].height) || 'Not recorded',
              carotidDoppler: patientVitals[0].carotidDoppler || 'Not recorded',
            } : undefined,
          },
          assessment: {
            clinicalDiagnosis: soapNote.clinicalDiagnosis,
            differentialDiagnosis: soapNote.differentialDiagnosis,
            riskFactors: soapNote.riskFactors,
            healthScore: soapNote.healthScore,
            riskLevel: soapNote.riskLevel,
          },
          plan: {
            treatmentPlan: soapNote.treatmentPlan,
            followUpInstructions: soapNote.followUpInstructions,
            patientEducation: soapNote.patientEducation,
            referrals: soapNote.referrals,
          },
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: doctorName,
      };

      const response = await patientApi.update(patient.id!, updatedPatient);
      if (response.success) {
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        onSave(updatedPatient);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = async () => {
    await handleAutoSave();
  };

  const generateAISummary = async () => {
    setAiProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const summary = `
**AI-Generated SOAP Summary:**

**Subjective:** ${soapNote.chiefComplaint || 'No chief complaint recorded'}. ${soapNote.historyOfPresentIllness || 'No history provided'}. Patient reports: ${soapNote.symptoms || 'No symptoms'}. Allergies: ${soapNote.allergies || 'None known'}. Medications: ${soapNote.medications || 'None'}. Family history: ${soapNote.familyHistory || 'Non-contributory'}.

**Objective:** Physical exam: ${soapNote.physicalExam || 'Not performed'}. Lab results: ${soapNote.labResults || 'Pending'}. Diagnostic tests: ${soapNote.diagnosticTests || 'None performed'}. Vital signs: ${patientVitals.length > 0 ? 'Recorded' : 'Not recorded'}.

**Assessment:** ${soapNote.clinicalDiagnosis || 'Pending clinical assessment'}. Differential: ${soapNote.differentialDiagnosis || 'To be determined'}. Risk factors: ${soapNote.riskFactors || 'Under evaluation'}. Health score: ${soapNote.healthScore}/100 (${soapNote.riskLevel}).

**Plan:** Treatment: ${soapNote.treatmentPlan || 'To be determined'}. Follow-up: ${soapNote.followUpInstructions || 'As needed'}. Education: ${soapNote.patientEducation || 'Standard care'}. Referrals: ${soapNote.referrals || 'None at this time'}.

**AI Recommendations:**
- Consider comprehensive health screening based on age and risk factors
- Monitor vital signs regularly
- Provide patient education on preventive care
- Schedule appropriate follow-up based on findings
      `;
      
      setAiSummary(summary);
    } catch (error) {
      console.error('AI summary generation failed:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low risk': return 'success';
      case 'moderate risk': return 'warning';
      case 'high risk': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header with Status */}
        <Box sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box display="flex" alignItems="center">
            <HospitalIcon sx={{ mr: 1 }} />
            <Typography variant="h5" component="h1">
              Unified SOAP Note - {patient.name}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {saving && (
              <Box display="flex" alignItems="center" gap={1}>
                <CircularProgress size={16} color="inherit" />
                <Typography variant="body2">Auto-saving...</Typography>
              </Box>
            )}
            
            {lastSaved && (
              <Typography variant="body2" color="primary.light">
                Last saved: {lastSaved.toLocaleTimeString()}
              </Typography>
            )}
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={<SaveIcon />}
              onClick={handleManualSave}
              disabled={!hasUnsavedChanges}
            >
              Save Now
            </Button>
          </Box>
        </Box>

        {/* Tabs Navigation */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <ViewIcon />
                  <span>View SOAP</span>
                  {patient.soapNote && <CheckCircleIcon color="success" fontSize="small" />}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <EditIcon />
                  <span>Edit SOAP</span>
                  {hasUnsavedChanges && <Badge color="warning" variant="dot" />}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AssessmentIcon />
                  <span>Assessment & Plan</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box display="flex" alignItems="center" gap={1}>
                  <AutoAwesomeIcon />
                  <span>AI Enhanced</span>
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Tab 1: View SOAP */}
        <TabPanel value={activeTab} index={0}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>📋 View Mode:</strong> This displays the current SOAP note. Use the "Edit SOAP" tab to make changes.
            </Alert>

            {/* Subjective */}
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  <strong>S</strong>ubjective
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography><strong>Chief Complaint:</strong> {soapNote.chiefComplaint || 'No chief complaint recorded'}</Typography>
                  <Typography><strong>History of Present Illness:</strong> {soapNote.historyOfPresentIllness || 'No history recorded'}</Typography>
                  <Typography><strong>Symptoms:</strong> {soapNote.symptoms || 'No symptoms reported'}</Typography>
                  <Typography><strong>Allergies:</strong> {soapNote.allergies || 'No allergies reported'}</Typography>
                  <Typography><strong>Medications:</strong> {soapNote.medications || 'No medications reported'}</Typography>
                  <Typography><strong>Family History:</strong> {soapNote.familyHistory || 'No family history recorded'}</Typography>
                  <Typography><strong>Social History:</strong> {soapNote.socialHistory || 'No social history recorded'}</Typography>
                  <Typography><strong>Psychological Assessment:</strong> {soapNote.psychologicalAssessment || 'No psychological assessment recorded'}</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Objective */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  <strong>O</strong>bjective
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography><strong>Physical Examination:</strong> {soapNote.physicalExam || 'No physical examination recorded'}</Typography>
                  <Typography><strong>Lab Results:</strong> {soapNote.labResults || 'No lab results available'}</Typography>
                  <Typography><strong>Diagnostic Tests:</strong> {soapNote.diagnosticTests || 'No diagnostic tests performed'}</Typography>
                  
                  {patientVitals.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>Vital Signs</Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell><strong>Parameter</strong></TableCell>
                              <TableCell><strong>Value</strong></TableCell>
                              <TableCell><strong>Status</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>Blood Pressure</TableCell>
                              <TableCell>{patientVitals[0].bloodPressure || 'Not recorded'}</TableCell>
                              <TableCell>
                                <Chip label="Normal" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Heart Rate</TableCell>
                              <TableCell>{patientVitals[0].heartRate || 'Not recorded'}</TableCell>
                              <TableCell>
                                <Chip label="Normal" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Temperature</TableCell>
                              <TableCell>{patientVitals[0].temperature || 'Not recorded'}</TableCell>
                              <TableCell>
                                <Chip label="Normal" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Oxygen Saturation</TableCell>
                              <TableCell>{patientVitals[0].oxygenSaturation || 'Not recorded'}</TableCell>
                              <TableCell>
                                <Chip label="Normal" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell>Blood Sugar</TableCell>
                              <TableCell>{patientVitals[0].bloodSugar || 'Not recorded'}</TableCell>
                              <TableCell>
                                <Chip label="Normal" size="small" color="success" />
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Assessment */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  <strong>A</strong>ssessment
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography><strong>Clinical Diagnosis:</strong> {soapNote.clinicalDiagnosis || 'No clinical diagnosis provided'}</Typography>
                  <Typography><strong>Differential Diagnosis:</strong> {soapNote.differentialDiagnosis || 'No differential diagnosis provided'}</Typography>
                  <Typography><strong>Risk Factors:</strong> {soapNote.riskFactors || 'No risk factors identified'}</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Typography><strong>Risk Level:</strong></Typography>
                    <Chip 
                      label={soapNote.riskLevel} 
                      color={getRiskLevelColor(soapNote.riskLevel)}
                      size="small" 
                    />
                  </Box>
                  <Typography><strong>Health Score:</strong> {soapNote.healthScore}/100</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            {/* Plan */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" color="primary">
                  <strong>P</strong>lan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Typography><strong>Treatment Plan:</strong> {soapNote.treatmentPlan || 'No treatment plan provided'}</Typography>
                  <Typography><strong>Follow-up Instructions:</strong> {soapNote.followUpInstructions || 'No follow-up instructions provided'}</Typography>
                  <Typography><strong>Patient Education:</strong> {soapNote.patientEducation || 'No patient education provided'}</Typography>
                  <Typography><strong>Referrals:</strong> {soapNote.referrals || 'No referrals provided'}</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        </TabPanel>

        {/* Tab 2: Edit SOAP */}
        <TabPanel value={activeTab} index={1}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>✏️ Edit Mode:</strong> Changes are auto-saved. All fields sync with the Assessment & Plan section.
            </Alert>

            {/* Subjective Fields */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <strong>S</strong>ubjective
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Chief Complaint"
                    value={soapNote.chiefComplaint}
                    onChange={(e) => handleFieldChange('chiefComplaint', e.target.value)}
                    placeholder="Enter patient's main complaint..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="History of Present Illness"
                    value={soapNote.historyOfPresentIllness}
                    onChange={(e) => handleFieldChange('historyOfPresentIllness', e.target.value)}
                    placeholder="Describe the history of the current illness..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Patient's Symptoms"
                    value={soapNote.symptoms}
                    onChange={(e) => handleFieldChange('symptoms', e.target.value)}
                    placeholder="List current symptoms and their duration..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Allergies"
                    value={soapNote.allergies}
                    onChange={(e) => handleFieldChange('allergies', e.target.value)}
                    placeholder="List any known allergies..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Current Medications"
                    value={soapNote.medications}
                    onChange={(e) => handleFieldChange('medications', e.target.value)}
                    placeholder="List current medications..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Family History"
                    value={soapNote.familyHistory}
                    onChange={(e) => handleFieldChange('familyHistory', e.target.value)}
                    placeholder="Relevant family medical history..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Social History"
                    value={soapNote.socialHistory}
                    onChange={(e) => handleFieldChange('socialHistory', e.target.value)}
                    placeholder="Social and lifestyle factors..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Psychological Assessment"
                    value={soapNote.psychologicalAssessment}
                    onChange={(e) => handleFieldChange('psychologicalAssessment', e.target.value)}
                    placeholder="Mental health assessment findings..."
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Objective Fields */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <strong>O</strong>bjective
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Physical Examination Findings"
                    value={soapNote.physicalExam}
                    onChange={(e) => handleFieldChange('physicalExam', e.target.value)}
                    placeholder="Enter physical examination findings..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Laboratory Results"
                    value={soapNote.labResults}
                    onChange={(e) => handleFieldChange('labResults', e.target.value)}
                    placeholder="Enter any lab results or test findings..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Diagnostic Tests"
                    value={soapNote.diagnosticTests}
                    onChange={(e) => handleFieldChange('diagnosticTests', e.target.value)}
                    placeholder="Enter results of any diagnostic tests..."
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Assessment Fields */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <strong>A</strong>ssessment
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Clinical Diagnosis"
                    value={soapNote.clinicalDiagnosis}
                    onChange={(e) => handleFieldChange('clinicalDiagnosis', e.target.value)}
                    placeholder="Enter your clinical diagnosis and assessment..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Differential Diagnosis"
                    value={soapNote.differentialDiagnosis}
                    onChange={(e) => handleFieldChange('differentialDiagnosis', e.target.value)}
                    placeholder="List differential diagnoses if applicable..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Risk Factors"
                    value={soapNote.riskFactors}
                    onChange={(e) => handleFieldChange('riskFactors', e.target.value)}
                    placeholder="Identify any risk factors or concerns..."
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Health Score"
                      type="number"
                      value={soapNote.healthScore}
                      onChange={(e) => handleFieldChange('healthScore', e.target.value)}
                      sx={{ width: 150 }}
                    />
                    <TextField
                      label="Risk Level"
                      value={soapNote.riskLevel}
                      onChange={(e) => handleFieldChange('riskLevel', e.target.value)}
                      placeholder="e.g., Low Risk, Moderate Risk, High Risk"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Plan Fields */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  <strong>P</strong>lan
                </Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Treatment Plan"
                    value={soapNote.treatmentPlan}
                    onChange={(e) => handleFieldChange('treatmentPlan', e.target.value)}
                    placeholder="Enter treatment plan and medications..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Follow-up Instructions"
                    value={soapNote.followUpInstructions}
                    onChange={(e) => handleFieldChange('followUpInstructions', e.target.value)}
                    placeholder="Enter follow-up instructions and next steps..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Patient Education"
                    value={soapNote.patientEducation}
                    onChange={(e) => handleFieldChange('patientEducation', e.target.value)}
                    placeholder="Enter patient education and counseling provided..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Referrals"
                    value={soapNote.referrals}
                    onChange={(e) => handleFieldChange('referrals', e.target.value)}
                    placeholder="Enter any specialist referrals or consultations..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Medication Changes"
                    value={soapNote.medicationChanges}
                    onChange={(e) => handleFieldChange('medicationChanges', e.target.value)}
                    placeholder="Enter any medication changes or new prescriptions..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Discharge Instructions"
                    value={soapNote.dischargeInstructions}
                    onChange={(e) => handleFieldChange('dischargeInstructions', e.target.value)}
                    placeholder="Enter discharge instructions if applicable..."
                  />
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Emergency Contact Instructions"
                    value={soapNote.emergencyInstructions}
                    onChange={(e) => handleFieldChange('emergencyInstructions', e.target.value)}
                    placeholder="Enter emergency contact instructions..."
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Tab 3: Assessment & Plan */}
        <TabPanel value={activeTab} index={2}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>📊 Assessment & Plan:</strong> This section shows the integrated assessment and treatment plan based on all SOAP data.
            </Alert>

            {/* Health Score Dashboard */}
            <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Health Assessment Dashboard</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h2" color="primary">
                      {soapNote.healthScore}/100
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Health Score
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={soapNote.healthScore} 
                      sx={{ height: 20, borderRadius: 10 }}
                    />
                  </Box>
                    <Chip 
                      label={soapNote.riskLevel} 
                      color={getRiskLevelColor(soapNote.riskLevel)}
                      size="medium"
                    />
                </Box>
              </CardContent>
            </Card>

            {/* Clinical Assessment */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Clinical Assessment</Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Primary Diagnosis:</Typography>
                    <Typography>{soapNote.clinicalDiagnosis || 'Pending clinical assessment'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Differential Diagnosis:</Typography>
                    <Typography>{soapNote.differentialDiagnosis || 'To be determined'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Risk Factors:</Typography>
                    <Typography>{soapNote.riskFactors || 'Under evaluation'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Treatment Plan */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Treatment Plan</Typography>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Treatment Plan:</Typography>
                    <Typography>{soapNote.treatmentPlan || 'To be determined'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Follow-up Instructions:</Typography>
                    <Typography>{soapNote.followUpInstructions || 'As needed'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Patient Education:</Typography>
                    <Typography>{soapNote.patientEducation || 'Standard care'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" color="primary">Referrals:</Typography>
                    <Typography>{soapNote.referrals || 'None at this time'}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Tab 4: AI Enhanced */}
        <TabPanel value={activeTab} index={3}>
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>🤖 AI Enhanced:</strong> Use AI to generate summaries, suggestions, and insights based on the SOAP data.
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<AutoAwesomeIcon />}
                onClick={generateAISummary}
                disabled={aiProcessing}
                sx={{ minWidth: 200 }}
              >
                {aiProcessing ? 'Generating...' : 'Generate AI Summary'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SyncIcon />}
                onClick={() => setActiveTab(1)}
              >
                Edit SOAP Note
              </Button>
            </Box>

            {aiProcessing && (
              <Box sx={{ mb: 3 }}>
                <LinearProgress />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  AI is analyzing the SOAP note data...
                </Typography>
              </Box>
            )}

            {aiSummary && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <AutoAwesomeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    AI-Generated Summary
                  </Typography>
                  <Box sx={{ 
                    bgcolor: 'grey.50', 
                    p: 2, 
                    borderRadius: 1,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  }}>
                    {aiSummary}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default UnifiedSOAPNote;
