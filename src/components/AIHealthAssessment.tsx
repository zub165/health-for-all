import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  HealthAndSafety,
  Warning,
  CheckCircle,
  Assessment,
  TrendingUp,
  TrendingDown,
  Remove,
} from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import { aiService } from '../services/aiService';

interface AIHealthAssessmentProps {
  onAssessmentComplete?: (patient: Patient, healthScore: number, riskFactors: string[], recommendations: string[]) => void;
}

const AIHealthAssessment: React.FC<AIHealthAssessmentProps> = ({ onAssessmentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  // Load all patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const response = await patientApi.getAll();
      if (response.success && response.data) {
        setPatients(response.data);
      } else {
        setError('Failed to load patients');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient => {
    const name = patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const email = patient.email || '';
    const phone = patient.phoneNumber || patient.phone || '';
    
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           phone.includes(searchTerm);
  });

  const analyzePatientHealth = async (patient: Patient) => {
    setAnalyzing(true);
    setError(null);
    setAssessmentComplete(false);
    
    try {
      // Convert Patient to AIPatientData format
      const patientData = {
        name: patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        email: patient.email || '',
        phoneNumber: patient.phoneNumber || patient.phone || '',
        age: patient.age || (patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 0),
        gender: patient.gender || 'Unknown',
        bloodGroup: patient.bloodGroup || patient.blood_type || 'Unknown',
        pastMedicalHistory: patient.pastMedicalHistory,
        allergies: patient.allergies,
        familyHistory: patient.familyHistory,
        medicationList: patient.medicationList,
      };

      // Use AI service to analyze existing patient data
      const aiAnalysis = await aiService.autoFillFormFromPatientData(patientData);
      
      setHealthScore(aiAnalysis.healthScore);
      setRiskFactors(aiAnalysis.riskFactors);
      setRecommendations(aiAnalysis.recommendations);
      setAssessmentComplete(true);
      
      onAssessmentComplete?.(patient, aiAnalysis.healthScore, aiAnalysis.riskFactors, aiAnalysis.recommendations);
      
    } catch (err) {
      setError('AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
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
    if (score >= 40) return 'Moderate';
    return 'Poor';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp color="success" />;
    if (score >= 60) return <Remove color="warning" />;
    return <TrendingDown color="error" />;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        🧠 AI Health Assessment
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Analyze existing patient data to assess health scores and provide recommendations
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 3 }}>
        {/* Patient Selection */}
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Select Patient
              </Typography>
              
              <TextField
                fullWidth
                label="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Search by name, email, or phone"
              />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {filteredPatients.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" align="center" sx={{ p: 2 }}>
                      {searchTerm ? 'No patients found matching your search.' : 'No patients registered yet.'}
                    </Typography>
                  ) : (
                    filteredPatients.map((patient) => (
                      <Paper
                        key={patient.id}
                        elevation={selectedPatient?.id === patient.id ? 3 : 1}
                        sx={{
                          p: 2,
                          mb: 1,
                          cursor: 'pointer',
                          bgcolor: selectedPatient?.id === patient.id ? 'primary.50' : 'background.paper',
                          border: selectedPatient?.id === patient.id ? '2px solid' : '1px solid',
                          borderColor: selectedPatient?.id === patient.id ? 'primary.main' : 'divider',
                        }}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <Typography variant="subtitle2" fontWeight="bold">
                          {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {patient.email || ''}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Age: {patient.age || (patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A')} | {patient.gender || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {patient.id}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Patient Details & Analysis */}
        <Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
          {selectedPatient ? (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  👤 Patient Details
                </Typography>
                
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2, mb: 3 }}>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <Typography variant="body2" color="text.secondary">Name</Typography>
                    <Typography variant="body1" fontWeight="bold">{selectedPatient.name || selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <Typography variant="body2" color="text.secondary">Age & Gender</Typography>
                    <Typography variant="body1">{selectedPatient.age || (selectedPatient.date_of_birth ? new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear() : 'N/A')} years, {selectedPatient.gender || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <Typography variant="body2" color="text.secondary">Blood Group</Typography>
                    <Typography variant="body1">{selectedPatient.bloodGroup || selectedPatient.blood_type || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedPatient.phoneNumber || selectedPatient.phone || 'N/A'}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  🏥 Medical Information
                </Typography>
                
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2, mb: 3 }}>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <Typography variant="body2" color="text.secondary">Past Medical History</Typography>
                    <Typography variant="body1">{selectedPatient.pastMedicalHistory || 'None reported'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <Typography variant="body2" color="text.secondary">Allergies</Typography>
                    <Typography variant="body1">{selectedPatient.allergies || 'None reported'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <Typography variant="body2" color="text.secondary">Family History</Typography>
                    <Typography variant="body1">{selectedPatient.familyHistory || 'None reported'}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <Typography variant="body2" color="text.secondary">Current Medications</Typography>
                    <Typography variant="body1">{selectedPatient.medicationList || 'None reported'}</Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant="contained"
                      size="medium"
                    onClick={() => analyzePatientHealth(selectedPatient)}
                    disabled={analyzing}
                    startIcon={<Assessment />}
                    sx={{ minWidth: 200 }}
                  >
                    {analyzing ? 'Analyzing...' : '🧠 Analyze Health Score'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <HealthAndSafety sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Select a patient to begin AI health assessment
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* AI Analysis Results */}
        {analyzing && (
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🤖 AI Health Analysis in Progress
                </Typography>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Analyzing patient data for health insights...
                </Typography>
              </CardContent>
            </Card>
          </Box>
        )}

        {assessmentComplete && healthScore !== null && (
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 AI Health Assessment Results
                </Typography>
                
                {/* Health Score Display */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  {getHealthScoreIcon(healthScore)}
                  <Typography variant="h3" color={`${getHealthScoreColor(healthScore)}.main`}>
                    {healthScore}/100
                  </Typography>
                  <Chip
                    label={getHealthScoreLabel(healthScore)}
                    color={getHealthScoreColor(healthScore) as any}
                  />
                </Box>

                {/* Risk Factors */}
                {riskFactors.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      ⚠️ Risk Factors Identified
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {riskFactors.map((factor, index) => (
                        <Chip
                          key={index}
                          label={factor}
                          color="warning"
                          icon={<Warning />}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      💡 AI Recommendations
                    </Typography>
                    <List>
                      {recommendations.map((recommendation, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <CheckCircle color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={recommendation} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Error Display */}
        {error && (
          <Box sx={{ gridColumn: "span 12" }}>
            <Alert severity="error">
              {error}
            </Alert>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default AIHealthAssessment;
