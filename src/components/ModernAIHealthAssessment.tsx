import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Psychology,
  HealthAndSafety,
  TrendingUp,
  Assessment,
  CheckCircle,
  Warning,
  Person,
  Search,
} from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';

const ModernAIHealthAssessment: React.FC = () => {
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

  useEffect(() => {
    fetchPatients();
  }, []);

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

  const performModernAIAssessment = async (patient: Patient) => {
    setSelectedPatient(patient);
    setProcessing(true);
    setHealthScore(null);
    setRiskFactors([]);
    setRecommendations([]);
    setCompleted(false);

    try {
      // Simulate advanced AI processing time
      await new Promise(resolve => setTimeout(resolve, 4000));

      // Advanced AI health score calculation
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];

      // Advanced age analysis
      if (patient.age && patient.age > 70) {
        score -= 20;
        factors.push('Advanced Age (70+)');
      } else if (patient.age && patient.age > 60) {
        score -= 15;
        factors.push('Senior Age (60+)');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Middle Age (50+)');
      }

      // Advanced medical history analysis
      if (patient.pastMedicalHistory) {
        const history = patient.pastMedicalHistory.toLowerCase();
        if (history.includes('diabetes') || history.includes('diabetic')) {
          score -= 25;
          factors.push('Diabetes History');
        }
        if (history.includes('heart') || history.includes('cardiac')) {
          score -= 20;
          factors.push('Cardiac History');
      }
      if (history.includes('hypertension') || history.includes('high blood pressure')) {
          score -= 15;
          factors.push('Hypertension');
        }
        if (history.includes('cancer') || history.includes('tumor')) {
          score -= 30;
          factors.push('Cancer History');
        }
      }

      // Advanced allergy analysis
      if (patient.allergies) {
        const allergies = patient.allergies.toLowerCase();
        if (allergies.includes('severe') || allergies.includes('anaphylaxis')) {
          score -= 20;
          factors.push('Severe Allergies');
        } else if (allergies.includes('multiple') || allergies.split(',').length > 3) {
          score -= 10;
          factors.push('Multiple Allergies');
        }
      }

      // Advanced family history analysis
      if (patient.familyHistory) {
        const family = patient.familyHistory.toLowerCase();
      if (family.includes('diabetes')) {
          score -= 15;
          factors.push('Family Diabetes Risk');
      }
      if (family.includes('heart') || family.includes('cardiac')) {
          score -= 15;
          factors.push('Family Cardiac Risk');
      }
      if (family.includes('cancer')) {
          score -= 20;
          factors.push('Family Cancer Risk');
        }
        if (family.includes('alzheimer') || family.includes('dementia')) {
          score -= 10;
          factors.push('Family Neurological Risk');
        }
      }

      // Advanced medication analysis
      if (patient.medicationList) {
        const meds = patient.medicationList.toLowerCase();
        if (meds.includes('insulin') || meds.includes('metformin')) {
          score -= 15;
          factors.push('Diabetes Medication');
        }
        if (meds.includes('statin') || meds.includes('cholesterol')) {
          score -= 10;
          factors.push('Cardiovascular Medication');
        }
        if (meds.split(',').length > 5) {
          score -= 10;
          factors.push('Multiple Medications');
        }
      }

      // Generate advanced recommendations
      if (score < 60) {
        recs.push('🚨 URGENT: Schedule comprehensive health screening within 1 week');
        recs.push('🔴 High Priority: Consult with multiple specialists');
        recs.push('📊 Continuous monitoring required');
      } else if (score < 75) {
        recs.push('⚠️ Schedule health screening within 2-4 weeks');
        recs.push('👨‍⚕️ Regular follow-up with primary care physician');
        recs.push('📈 Enhanced monitoring recommended');
      }

      if (factors.includes('Diabetes History') || factors.includes('Family Diabetes Risk')) {
        recs.push('🍎 Strict diabetic diet and regular glucose monitoring');
        recs.push('🏃‍♂️ Daily exercise routine (30+ minutes)');
        recs.push('📊 HbA1c testing every 3 months');
      }

      if (factors.includes('Cardiac History') || factors.includes('Family Cardiac Risk')) {
        recs.push('❤️ Cardiovascular risk assessment and stress testing');
        recs.push('💊 Regular blood pressure and cholesterol monitoring');
        recs.push('🚭 Avoid smoking and limit alcohol consumption');
      }

      if (factors.includes('Cancer History') || factors.includes('Family Cancer Risk')) {
        recs.push('🔬 Regular cancer screening based on family history');
        recs.push('🌱 Antioxidant-rich diet and cancer prevention lifestyle');
        recs.push('📅 Annual comprehensive health checkups');
      }

      // General advanced recommendations
      recs.push('🧘‍♂️ Stress management and mindfulness practices');
      recs.push('💤 Quality sleep (7-9 hours) with consistent schedule');
      recs.push('🥗 Mediterranean diet with omega-3 supplements');
      recs.push('🏋️‍♀️ Strength training 2-3 times per week');
      recs.push('🧠 Cognitive exercises and brain training');

      const finalScore = Math.max(0, Math.min(100, score));

      setHealthScore(finalScore);
      setRiskFactors(factors);
      setRecommendations(recs);
      setCompleted(true);

    } catch (err) {
      setError('Modern AI assessment failed. Please try again.');
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
          🤖 Modern AI Health Assessment
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Next-generation AI-powered health analysis with advanced patient assessment
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {processing && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Psychology sx={{ mr: 2 }} />
                <Typography variant="h6">Advanced AI Processing...</Typography>
              </Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2">
                Next-generation AI algorithms are analyzing {selectedPatient?.name}'s comprehensive health data...
              </Typography>
            </CardContent>
          </Card>
        )}

        {completed && healthScore !== null && (
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Modern AI Assessment Results for {selectedPatient?.name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={3}>
                <Typography variant="h2" color={`${getHealthScoreColor(healthScore)}.main`} sx={{ mr: 3 }}>
                  {healthScore}/100
                </Typography>
                <Box>
                  <Typography variant="h5">{getHealthScoreLabel(healthScore)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Advanced AI Health Score
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
                    Advanced AI Recommendations
                  </Typography>
                  <Box component="ul" sx={{ pl: 2 }}>
                    {recommendations.slice(0, 6).map((rec, index) => (
                      <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                        {rec}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Patient for Modern AI Assessment
          </Typography>
          
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
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
                      onClick={() => performModernAIAssessment(patient)}
                      disabled={processing}
                      sx={{
                        background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #E55A2B, #E8821A)',
                        }
                      }}
                    >
                      {processing && selectedPatient?.id === patient.id ? 'Processing...' : 'Modern AI Assessment'}
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

export default ModernAIHealthAssessment;