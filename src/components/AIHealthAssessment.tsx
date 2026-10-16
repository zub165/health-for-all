import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Patient } from '../types';
import { PatientData } from '../services/hybridPatientService';
import { useAppData } from '../context/AppDataContext';
import EmailPreview from './EmailPreview';
import HealthScoreRecommendationPrint from './HealthScoreRecommendationPrint';
import ExportActions from './ExportActions';

interface AIHealthAssessmentProps {
  onAssessmentComplete?: (patient: Patient, healthScore: number, riskFactors: string[], recommendations: string[]) => void;
  refreshTrigger?: number;
}

function hybridToPatient(patient: PatientData): Patient {
  return {
    id: patient.id,
    name: patient.full_name,
    full_name: patient.full_name,
    first_name: patient.first_name,
    last_name: patient.last_name,
    email: patient.email,
    phoneNumber: patient.phone,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    address: patient.address,
    bloodGroup: patient.blood_type,
    blood_type: patient.blood_type,
    pastMedicalHistory: patient.past_medical_history,
    past_medical_history: patient.past_medical_history,
    familyHistory: patient.family_history,
    family_history: patient.family_history,
    allergies: patient.allergies,
    medicationList: patient.current_medications?.join(', '),
    current_medications: patient.current_medications,
    emergencyContact: patient.emergency_contact,
    emergency_contact: patient.emergency_contact,
    health_risk_score: patient.health_score,
    registeredAt: patient.last_updated,
    createdAt: patient.last_updated,
    updatedAt: patient.last_updated,
  };
}

const AIHealthAssessment: React.FC<AIHealthAssessmentProps> = ({ onAssessmentComplete, refreshTrigger }) => {
  const {
    patients: hybridPatients,
    loading: contextLoading,
    refreshing: contextRefreshing,
    error: contextError,
    refreshPatients,
  } = useAppData();
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'django' | 'local'>('all');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const djangoPatients = useMemo(
    () =>
      hybridPatients
        .filter((p) => p.source === 'main_api' || p.source === 'health_fair_api' || p.source === 'cached')
        .map(hybridToPatient),
    [hybridPatients]
  );
  const localPatients = useMemo(
    () => hybridPatients.filter((p) => p.source === 'local_storage').map(hybridToPatient),
    [hybridPatients]
  );
  const patients = useMemo(() => hybridPatients.map(hybridToPatient), [hybridPatients]);
  /** Full-page spinner only on first empty load — never blank the list on refresh (stops flicker). */
  const showInitialSpinner = contextLoading && patients.length === 0;
  const showRefreshBar = contextRefreshing || (contextLoading && patients.length > 0);

  useEffect(() => {
    if (contextError) setError(contextError);
  }, [contextError]);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      void refreshPatients();
    }
  }, [refreshTrigger, refreshPatients]);

  useEffect(() => {
    let sourcePatients: Patient[] = [];
    switch (activeTab) {
      case 'django':
        sourcePatients = djangoPatients;
        break;
      case 'local':
        sourcePatients = localPatients;
        break;
      default:
        sourcePatients = patients;
    }

    const filtered = sourcePatients.filter((patient) => {
      const name =
        patient.name ||
        patient.full_name ||
        `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
      const email = patient.email || '';
      const phone = patient.phoneNumber || patient.phone || '';
      const q = searchTerm.toLowerCase();
      return (
        name.toLowerCase().includes(q) ||
        email.toLowerCase().includes(q) ||
        phone.includes(searchTerm)
      );
    });

    setFilteredPatients(filtered);
  }, [djangoPatients, localPatients, patients, searchTerm, activeTab]);

  const performAIAssessment = async (patient: Patient) => {
    console.log('Starting AI assessment for patient:', patient);
    setSelectedPatient(patient);
    setProcessing(true);
    setHealthScore(null);
    setRiskFactors([]);
    setRecommendations([]);
    setCompleted(false);
    setError(null);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // AI health score calculation
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];

      // Age factor
      if (patient.age && patient.age > 65) {
        score -= 20;
        factors.push('Advanced Age');
        recs.push('Regular health monitoring recommended');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Age-related Risk');
        recs.push('Annual comprehensive checkup');
      }

      // Medical history factor
      if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
        score -= 25;
        factors.push('Complex Medical History');
        recs.push('Specialist consultation recommended');
      }

      // Allergies factor
      if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.toLowerCase().includes('severe')) {
        score -= 20;
        factors.push('Severe Allergies');
        recs.push('Allergy management plan needed');
      } else if (patient.allergies && typeof patient.allergies === 'string' && patient.allergies.length > 20) {
        score -= 10;
        factors.push('Multiple Allergies');
        recs.push('Allergy testing recommended');
      }

      // Family history factor
      if (patient.familyHistory) {
        if (patient.familyHistory.toLowerCase().includes('diabetes')) {
          score -= 15;
          factors.push('Family History of Diabetes');
          recs.push('Regular blood glucose monitoring');
        }
        if (patient.familyHistory.toLowerCase().includes('heart')) {
          score -= 15;
          factors.push('Family History of Heart Disease');
          recs.push('Cardiovascular risk assessment');
        }
        if (patient.familyHistory.toLowerCase().includes('cancer')) {
          score -= 20;
          factors.push('Family History of Cancer');
          recs.push('Cancer screening protocols');
        }
      }

      // Mental health assessment
      if (patient.age && patient.age > 18) {
        recs.push('Mental health screening recommended');
        recs.push('Stress management techniques');
      }

      const finalScore = Math.max(0, Math.min(100, score));

      setHealthScore(finalScore);
      setRiskFactors(factors);
      setRecommendations(recs);
      setCompleted(true);

      // Call the completion handler
      onAssessmentComplete?.(patient, finalScore, factors, recs);
      
    } catch (err) {
      console.error('AI assessment failed:', err);
      setError(`AI assessment failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="AI_Health_Assessment"
        downloadLabel="📥 Save Assessment PDF"
        printLabel="🖨️ Print Assessment"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
        🧠 AI Health Assessment
      </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Advanced AI-powered health analysis and risk assessment
              </Typography>
              
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Data Source Tabs */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Data Sources
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              variant={activeTab === 'all' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('all')}
              size="small"
            >
              All Patients ({djangoPatients.length + localPatients.length})
            </Button>
            <Button
              variant={activeTab === 'django' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('django')}
              size="small"
              color="primary"
            >
              Django Backend ({djangoPatients.length})
            </Button>
            <Button
              variant={activeTab === 'local' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('local')}
              size="small"
              color="secondary"
            >
              Local Storage ({localPatients.length})
            </Button>
          </Box>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4, display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                fullWidth
            variant="outlined"
            placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
              />
              {searchTerm && (
                <Button 
                  variant="outlined" 
                  onClick={() => setSearchTerm('')}
                  size="small"
                >
                  Clear
                </Button>
              )}
        </Box>

        {showRefreshBar && <LinearProgress sx={{ mb: 2, minHeight: 3 }} />}

        {/* Loading State — only when we have nothing to show yet */}
        {showInitialSpinner && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
            <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading patients...
            </Typography>
          </Box>
        )}

        {/* Patient List — stays mounted during background refresh (no flicker) */}
        {!showInitialSpinner && !selectedPatient && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredPatients.map((patient) => {
              // Determine data source
              const isDjangoPatient = djangoPatients.some(p => p.id === patient.id);
              const isLocalPatient = localPatients.some(p => p.id === patient.id);
              const dataSource = isDjangoPatient ? 'Django' : isLocalPatient ? 'Local' : 'Unknown';
              
              return (
                <Card key={patient.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box display="flex" alignItems="center">
                        <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="h6">
                              {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'}
                </Typography>
                            <Chip 
                              label={dataSource} 
                              size="small" 
                              color={isDjangoPatient ? 'primary' : 'secondary'}
                              variant="outlined"
                            />
                  </Box>
                          <Typography variant="body2" color="text.secondary">
                            📧 {patient.email || 'No email'} | 📞 {patient.phoneNumber || patient.phone || 'No phone'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Age: {patient.age || 'Not specified'} | Blood Group: {patient.bloodGroup || 'Not specified'}
                          </Typography>
                  </Box>
                </Box>
                  <Button
                    variant="contained"
                        startIcon={<HealthIcon />}
                        onClick={() => performAIAssessment(patient)}
                        disabled={processing}
                      >
                        {processing ? 'Processing...' : 'Assess Health'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
              );
            })}
                </Box>
        )}

        {/* AI Processing */}
        {processing && selectedPatient && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
              <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <PsychologyIcon sx={{ mr: 2 }} />
                <Typography variant="h6">AI Health Analysis in Progress...</Typography>
              </Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2">
                Analyzing {selectedPatient.name || selectedPatient.full_name}'s medical data, risk factors, and generating personalized recommendations...
                </Typography>
              </CardContent>
            </Card>
        )}

        {/* AI Assessment Results */}
        {completed && healthScore !== null && (
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Health Assessment Results for {selectedPatient?.name || selectedPatient?.full_name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h2" color={`${getHealthScoreColor(healthScore)}.main`} sx={{ mr: 3 }}>
                  {healthScore}/100
                </Typography>
                <Box>
                  <Typography variant="h5">{getHealthScoreLabel(healthScore)}</Typography>
                  <Typography variant="body1" color="text.secondary">
                    Overall Health Score
                  </Typography>
                </Box>
                </Box>

                {riskFactors.length > 0 && (
                <Box mb={3}>
                  <Typography variant="h6" gutterBottom>Risk Factors Identified:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                      {riskFactors.map((factor, index) => (
                      <Chip key={index} label={factor} color="warning" size="medium" />
                      ))}
                    </Box>
                  </Box>
                )}

                  <Box>
                <Typography variant="h6" gutterBottom>AI Recommendations:</Typography>
                    <List>
                  {recommendations.map((rec, index) => (
                        <ListItem key={index}>
                      <ListItemText 
                        primary={`• ${rec}`}
                        primaryTypographyProps={{ component: 'span' }}
                      />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedPatient(null);
                    setCompleted(false);
                    setHealthScore(null);
                    setRiskFactors([]);
                    setRecommendations([]);
                  }}
                >
                  Assess Another Patient
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PrintIcon />}
                  onClick={() => setShowPrintDialog(true)}
                >
                  Print Report
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EmailIcon />}
                  onClick={() => setShowEmailPreview(true)}
                >
                  Send Email Report
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {
                    setSelectedPatient(null);
                    setCompleted(false);
                    setHealthScore(null);
                    setRiskFactors([]);
                    setRecommendations([]);
                  }}
                >
                  Complete Assessment
                </Button>
              </Box>
              </CardContent>
            </Card>
        )}

        {/* Email Preview Dialog */}
        <EmailPreview
          open={showEmailPreview}
          onClose={() => setShowEmailPreview(false)}
          onSend={async () => {
            setEmailLoading(true);
            try {
              // Simulate email sending
              await new Promise(resolve => setTimeout(resolve, 2000));
              console.log('Email sent to:', selectedPatient?.email);
              setShowEmailPreview(false);
            } catch (err) {
              console.error('Failed to send email:', err);
            } finally {
              setEmailLoading(false);
            }
          }}
          patient={selectedPatient}
          healthScore={healthScore || 0}
          riskFactors={riskFactors}
          recommendations={recommendations}
          loading={emailLoading}
        />

        {/* Print Dialog */}
        <Dialog
          open={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              '@media print': {
                margin: 0,
                maxWidth: '100%',
                height: '100%',
              },
            },
          }}
        >
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Print Health Score & Recommendations</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => {
                  window.print();
                }}
                sx={{ '@media print': { display: 'none' } }}
              >
                Print
              </Button>
              <Button
                variant="outlined"
                onClick={() => setShowPrintDialog(false)}
                sx={{ '@media print': { display: 'none' } }}
              >
                Close
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ '@media print': { p: 0 } }}>
            <HealthScoreRecommendationPrint
              patient={selectedPatient || {} as Patient}
              healthScore={healthScore || undefined}
              recommendations={recommendations.length > 0 ? recommendations.map((rec, index) => `${index + 1}. ${rec}`).join('\n\n') : undefined}
              doctorName="AI Health Assessment"
              date={new Date().toLocaleDateString()}
            />
          </DialogContent>
          <DialogActions sx={{ '@media print': { display: 'none' } }}>
            <Button onClick={() => setShowPrintDialog(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<PrintIcon />}
              onClick={() => {
                window.print();
              }}
            >
              Print Now
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
      </Box>
    </Container>
  );
};

export default AIHealthAssessment;
