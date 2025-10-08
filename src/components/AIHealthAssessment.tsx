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
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Assessment as AssessmentIcon,
  Psychology as PsychologyIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import EmailPreview from './EmailPreview';

interface AIHealthAssessmentProps {
  onAssessmentComplete?: (patient: Patient, healthScore: number, riskFactors: string[], recommendations: string[]) => void;
  refreshTrigger?: number;
}

const AIHealthAssessment: React.FC<AIHealthAssessmentProps> = ({ onAssessmentComplete, refreshTrigger }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('Refreshing patients in AI Health Assessment due to new registration...');
      fetchPatients();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      (patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim())
        .toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber || patient.phone || '').includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getAll();
      if (response.success && response.data) {
        setPatients(response.data);
      } else {
        setError(response.message || 'Failed to fetch patients');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  const performAIAssessment = async (patient: Patient) => {
    setSelectedPatient(patient);
    setProcessing(true);
    setHealthScore(null);
    setRiskFactors([]);
    setRecommendations([]);
    setCompleted(false);

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
      if (patient.allergies && patient.allergies.toLowerCase().includes('severe')) {
        score -= 20;
        factors.push('Severe Allergies');
        recs.push('Allergy management plan needed');
      } else if (patient.allergies && patient.allergies.length > 20) {
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
      setError('AI assessment failed. Please try again.');
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

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
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
        </Box>

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                  <CircularProgress />
            <Typography variant="body1" sx={{ ml: 2 }}>
              Loading patients...
            </Typography>
                </Box>
        )}

        {/* Patient List */}
        {!loading && !selectedPatient && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filteredPatients.map((patient) => (
              <Card key={patient.id} sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center">
                      <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                      <Box>
                        <Typography variant="h6">
                          {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || 'Unknown Patient'}
                        </Typography>
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
            ))}
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
                      <ListItemText primary={`• ${rec}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>

              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" gap={2} justifyContent="center">
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
      </Paper>
    </Container>
  );
};

export default AIHealthAssessment;
