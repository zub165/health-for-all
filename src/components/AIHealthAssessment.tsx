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
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Person,
  Psychology,
  Assessment,
  Warning,
  CheckCircle,
  TrendingUp,
  LocalHospital,
} from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';

interface AIHealthAssessmentProps {
  onAssessmentComplete?: (patient: Patient, healthScore: number, riskFactors: string[], recommendations: string[]) => void;
}

const AIHealthAssessment: React.FC<AIHealthAssessmentProps> = ({ onAssessmentComplete }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiProcessing, setAiProcessing] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const filteredPatients = patients.filter(patient =>
    (patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim())
      .toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.phoneNumber || patient.phone || '').includes(searchTerm)
  );

  const performAIAssessment = async (patient: Patient) => {
    setAiProcessing(true);
    setHealthScore(null);
    setRiskFactors([]);
    setRecommendations([]);
    setAssessmentComplete(false);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Calculate AI health score based on patient data
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];

      // Age factor
      if (patient.age && patient.age > 65) {
        score -= 15;
        factors.push('Advanced Age');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Age-related Risk');
      }

      // Medical history analysis
      if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
        score -= 20;
        factors.push('Complex Medical History');
      }

      // Allergies analysis
      if (patient.allergies && patient.allergies.toLowerCase().includes('severe')) {
        score -= 15;
        factors.push('Severe Allergies');
      } else if (patient.allergies && patient.allergies.length > 20) {
        score -= 10;
        factors.push('Multiple Allergies');
      }

      // Family history analysis
      if (patient.familyHistory) {
        if (patient.familyHistory.toLowerCase().includes('diabetes')) {
          score -= 10;
          factors.push('Family History of Diabetes');
        }
        if (patient.familyHistory.toLowerCase().includes('heart')) {
          score -= 10;
          factors.push('Family History of Heart Disease');
        }
        if (patient.familyHistory.toLowerCase().includes('cancer')) {
          score -= 15;
          factors.push('Family History of Cancer');
        }
      }

      // Medication analysis
      if (patient.medicationList && patient.medicationList.length > 30) {
        score -= 10;
        factors.push('Multiple Medications');
      }

      // Generate recommendations based on score and factors
      if (score < 70) {
        recs.push('Schedule comprehensive health screening within 2 weeks');
        recs.push('Consult with primary care physician for detailed assessment');
      }

      if (factors.includes('Advanced Age') || factors.includes('Age-related Risk')) {
        recs.push('Annual comprehensive health checkup recommended');
        recs.push('Consider bone density and cardiovascular screening');
      }

      if (factors.includes('Family History of Diabetes')) {
        recs.push('Regular blood glucose monitoring');
        recs.push('Maintain healthy diet and regular exercise');
      }

      if (factors.includes('Family History of Heart Disease')) {
        recs.push('Cardiovascular risk assessment');
        recs.push('Cholesterol and blood pressure monitoring');
      }

      if (factors.includes('Multiple Allergies')) {
        recs.push('Carry emergency allergy medication');
        recs.push('Regular allergy testing and management');
      }

      // General recommendations
      recs.push('Maintain regular exercise routine');
      recs.push('Follow balanced diet with plenty of fruits and vegetables');
      recs.push('Get adequate sleep (7-9 hours per night)');
      recs.push('Manage stress through relaxation techniques');

      const finalScore = Math.max(0, Math.min(100, score));

      setHealthScore(finalScore);
      setRiskFactors(factors);
      setRecommendations(recs);
      setAssessmentComplete(true);

      // Call completion callback
      onAssessmentComplete?.(patient, finalScore, factors, recs);

    } catch (err) {
      setError('AI assessment failed. Please try again.');
    } finally {
      setAiProcessing(false);
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
          Advanced AI-powered health analysis and predictive insights
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {aiProcessing && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Psychology sx={{ mr: 2 }} />
                <Typography variant="h6">AI Health Analysis in Progress...</Typography>
              </Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2">
                Analyzing {selectedPatient?.name}'s medical data, risk factors, and generating personalized recommendations...
              </Typography>
            </CardContent>
          </Card>
        )}

        {assessmentComplete && healthScore !== null && (
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Health Assessment Results for {selectedPatient?.name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h2" color={`${getHealthScoreColor(healthScore)}.main`} sx={{ mr: 3 }}>
                  {healthScore}/100
                </Typography>
                <Box>
                  <Typography variant="h5">{getHealthScoreLabel(healthScore)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Health Score
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Risk Factors Identified
                  </Typography>
                  {riskFactors.length > 0 ? (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {riskFactors.map((factor, index) => (
                        <Chip key={index} label={factor} color="warning" size="small" />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="success.main">
                      <CheckCircle sx={{ mr: 1, verticalAlign: 'middle' }} />
                      No significant risk factors identified
                    </Typography>
                  )}
                </Box>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                    AI Recommendations
                  </Typography>
                  <List dense>
                    {recommendations.slice(0, 5).map((rec, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon>
                          <LocalHospital color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Patient for AI Assessment
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 3 }}
          />

          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {filteredPatients.map((patient) => (
                <Card key={patient.id} elevation={2}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Person sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">
                        {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Age:</strong> {patient.age || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Email:</strong> {patient.email || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Phone:</strong> {patient.phoneNumber || patient.phone || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Blood Group:</strong> {patient.bloodGroup || patient.blood_type || 'N/A'}
                    </Typography>
                  </CardContent>
                  
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Psychology />}
                      onClick={() => {
                        setSelectedPatient(patient);
                        performAIAssessment(patient);
                      }}
                      disabled={aiProcessing}
                      sx={{
                        background: 'linear-gradient(45deg, #9C27B0, #E91E63)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #7B1FA2, #C2185B)',
                        }
                      }}
                    >
                      AI Assessment
                    </Button>
                  </Box>
                </Card>
              ))}
            </Box>
          )}

          {filteredPatients.length === 0 && !loading && (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No patients found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchTerm ? 'Try adjusting your search terms' : 'No patients have registered yet'}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default AIHealthAssessment;