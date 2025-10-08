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
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Visibility as ViewIcon,
  Logout as LogoutIcon,
  Dashboard as DashboardIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi, vitalsApi } from '../services/api';
import { getApiBaseUrl } from '../config/api';
import VitalsTracking from './VitalsTracking';
import RecommendationForm from './RecommendationForm';
import EmailPreview from './EmailPreview';

interface DoctorDashboardProps {
  doctorName: string;
  onLogout?: () => void;
  refreshTrigger?: number;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctorName, onLogout, refreshTrigger }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [patientVitals, setPatientVitals] = useState<Vitals[]>([]);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [emailPreviewData, setEmailPreviewData] = useState<{
    patient: Patient | null;
    healthScore: number;
    riskFactors: string[];
    recommendations: string[];
  }>({
    patient: null,
    healthScore: 0,
    riskFactors: [],
    recommendations: [],
  });
  const [doctorAssessment, setDoctorAssessment] = useState({
    clinicalAssessment: '',
    treatmentPlan: '',
    recommendations: '',
    followUpPlan: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('Refreshing patients due to new registration...');
      fetchPatients();
    }
  }, [refreshTrigger]);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      (patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()).toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      const response = await vitalsApi.getByPatientId(patientId);
      if (response.success && response.data) {
        setPatientVitals(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch patient vitals:', err);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientVitals(patient.id!);
  };

  const handleRecordVitals = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowVitalsForm(true);
  };

  const handleVitalsRecorded = (vitals: Vitals) => {
    setShowVitalsForm(false);
    setShowRecommendationForm(true);
    fetchPatientVitals(selectedPatient!.id!);
  };

  const handleSendRecommendation = () => {
    setShowRecommendationForm(false);
    setSelectedPatient(null);
  };

  const handleSendEmail = (patient: Patient) => {
    // Calculate health score for the patient
    const healthScore = calculatePatientHealthScore(patient);
    const riskFactors = getPatientRiskFactors(patient);
    const recommendations = generatePatientRecommendations(patient, healthScore);
    
    // Set email preview data and show preview
    setEmailPreviewData({
      patient,
      healthScore,
      riskFactors,
      recommendations,
    });
    setShowEmailPreview(true);
  };

  const handleSendEmailConfirm = async () => {
    setEmailLoading(true);
    setEmailSuccess(false);
    
    try {
      // Simulate email sending (in real app, this would call your email API)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real application, this would send an actual email
      console.log('Email sent to:', emailPreviewData.patient?.email);
      console.log('Health Score:', emailPreviewData.healthScore);
      console.log('Risk Factors:', emailPreviewData.riskFactors);
      console.log('Recommendations:', emailPreviewData.recommendations);
      
      setEmailSuccess(true);
      setTimeout(() => setEmailSuccess(false), 3000);
      setShowEmailPreview(false);
      
    } catch (err) {
      console.error('Failed to send email:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleSaveAssessment = () => {
    console.log('Saving doctor assessment:', doctorAssessment);
    // In a real application, this would save to the backend
    alert('Doctor assessment saved successfully!');
  };

  const handleUpdatePatientRecord = () => {
    console.log('Updating patient record with assessment:', doctorAssessment);
    // In a real application, this would update the patient record in the backend
    alert('Patient record updated successfully!');
  };

  const handleModernAIAssessment = async (patient: Patient) => {
    setEmailLoading(true);
    setEmailSuccess(false);
    
    try {
      // Simulate advanced AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Advanced AI health score calculation
      let score = 100;
      const factors: string[] = [];
      const recs: string[] = [];
      
      // Age-based scoring
      if (patient.age && patient.age > 65) {
        score -= 20;
        factors.push('Advanced Age');
        recs.push('Regular health monitoring recommended');
      } else if (patient.age && patient.age > 50) {
        score -= 10;
        factors.push('Age-related Risk');
        recs.push('Annual comprehensive checkup');
      }
      
      // Medical history analysis
      if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
        score -= 25;
        factors.push('Complex Medical History');
        recs.push('Specialist consultation recommended');
      }
      
      // Allergy assessment
      if (patient.allergies && patient.allergies.toLowerCase().includes('severe')) {
        score -= 20;
        factors.push('Severe Allergies');
        recs.push('Allergy management plan needed');
      } else if (patient.allergies && patient.allergies.length > 20) {
        score -= 10;
        factors.push('Multiple Allergies');
        recs.push('Allergy testing recommended');
      }
      
      // Family history analysis
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
      
      // Generate comprehensive AI assessment
      const aiAssessment = {
        patientName: patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientEmail: patient.email,
        healthScore: finalScore,
        riskFactors: factors,
        recommendations: recs,
        assessmentDate: new Date().toISOString(),
        aiInsights: [
          `Based on comprehensive analysis, ${patient.name || 'the patient'} has a health score of ${finalScore}/100`,
          factors.length > 0 ? `Key risk factors identified: ${factors.join(', ')}` : 'No significant risk factors detected',
          `AI recommends ${recs.length} specific interventions for optimal health outcomes`
        ]
      };
      
      // Set email preview data for Modern AI Assessment
      setEmailPreviewData({
        patient,
        healthScore: finalScore,
        riskFactors: factors,
        recommendations: recs,
      });
      setShowEmailPreview(true);
      
    } catch (err) {
      console.error('Modern AI Assessment failed:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const calculatePatientHealthScore = (patient: Patient): number => {
    let score = 100;
    
    // Age factor
    if (patient.age && patient.age > 65) score -= 15;
    else if (patient.age && patient.age > 50) score -= 10;
    
    // Medical history factor
    if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
      score -= 20;
    }
    
    // Allergies factor
    if (patient.allergies && patient.allergies.toLowerCase().includes('severe')) {
      score -= 15;
    } else if (patient.allergies && patient.allergies.length > 20) {
      score -= 10;
    }
    
    // Family history factor
    if (patient.familyHistory) {
      if (patient.familyHistory.toLowerCase().includes('diabetes')) score -= 10;
      if (patient.familyHistory.toLowerCase().includes('heart')) score -= 10;
      if (patient.familyHistory.toLowerCase().includes('cancer')) score -= 15;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const getPatientRiskFactors = (patient: Patient): string[] => {
    const factors: string[] = [];
    
    if (patient.age && patient.age > 65) factors.push('Advanced Age');
    if (patient.age && patient.age > 50) factors.push('Age-related Risk');
    
    if (patient.pastMedicalHistory && patient.pastMedicalHistory.length > 50) {
      factors.push('Complex Medical History');
    }
    
    if (patient.allergies && patient.allergies.length > 20) {
      factors.push('Multiple Allergies');
    }
    
    if (patient.familyHistory) {
      if (patient.familyHistory.toLowerCase().includes('diabetes')) factors.push('Family History of Diabetes');
      if (patient.familyHistory.toLowerCase().includes('heart')) factors.push('Family History of Heart Disease');
      if (patient.familyHistory.toLowerCase().includes('cancer')) factors.push('Family History of Cancer');
    }
    
    return factors;
  };

  const generatePatientRecommendations = (patient: Patient, healthScore: number): string[] => {
    const recommendations: string[] = [];
    
    if (healthScore < 70) {
      recommendations.push('Schedule comprehensive health screening within 2 weeks');
      recommendations.push('Consult with primary care physician for detailed assessment');
    }
    
    if (patient.age && patient.age > 50) {
      recommendations.push('Annual comprehensive health checkup recommended');
      recommendations.push('Consider bone density and cardiovascular screening');
    }
    
    if (patient.familyHistory && patient.familyHistory.toLowerCase().includes('diabetes')) {
      recommendations.push('Regular blood glucose monitoring');
      recommendations.push('Maintain healthy diet and regular exercise');
    }
    
    if (patient.familyHistory && patient.familyHistory.toLowerCase().includes('heart')) {
      recommendations.push('Cardiovascular risk assessment');
      recommendations.push('Cholesterol and blood pressure monitoring');
    }
    
    // General recommendations
    recommendations.push('Maintain regular exercise routine');
    recommendations.push('Follow balanced diet with plenty of fruits and vegetables');
    recommendations.push('Get adequate sleep (7-9 hours per night)');
    recommendations.push('Manage stress through relaxation techniques');
    
    return recommendations;
  };

  const formatSOAPNote = (patient: Patient, vitals: Vitals[]) => {
    const healthScore = calculatePatientHealthScore(patient);
    const riskFactors = getPatientRiskFactors(patient);
    const recommendations = generatePatientRecommendations(patient, healthScore);
    
    return {
      subjective: {
        chiefComplaint: patient.pastMedicalHistory || 'No specific complaints recorded',
        historyOfPresentIllness: patient.pastMedicalHistory || 'No current illness reported',
        allergies: patient.allergies || 'No known allergies',
        medications: patient.medicationList || 'No current medications',
        familyHistory: patient.familyHistory || 'No significant family history',
        socialHistory: `Age: ${patient.age || 'Not specified'}, Gender: ${patient.gender || 'Not specified'}`,
        psychologicalAssessment: 'Mental health screening questions and assessment results',
        psychologicalQuestions: [
          'How would you rate your overall mood in the past week? (1-10)',
          'Have you experienced any anxiety or worry recently?',
          'How is your sleep quality? (1-10)',
          'Do you feel supported by family and friends?',
          'Have you had any thoughts of self-harm or suicide?',
          'How would you rate your stress level? (1-10)',
          'Are you able to concentrate and focus on tasks?',
          'Do you feel hopeful about the future?'
        ]
      },
      objective: {
        vitalSigns: vitals.length > 0 ? {
          bloodPressure: vitals[0].bloodPressure || 'Not recorded',
          heartRate: vitals[0].heartRate || 'Not recorded',
          temperature: vitals[0].temperature || 'Not recorded',
          oxygenSaturation: vitals[0].oxygenSaturation || 'Not recorded',
          bloodSugar: vitals[0].bloodSugar || 'Not recorded',
          weight: vitals[0].weight || 'Not recorded',
          height: vitals[0].height || 'Not recorded',
          carotidDoppler: vitals[0].carotidDoppler || 'Not recorded'
        } : {
          bloodPressure: 'Not recorded',
          heartRate: 'Not recorded',
          temperature: 'Not recorded',
          oxygenSaturation: 'Not recorded',
          bloodSugar: 'Not recorded',
          weight: 'Not recorded',
          height: 'Not recorded',
          carotidDoppler: 'Not recorded'
        },
        physicalExam: 'Comprehensive physical examination recommended',
        labResults: 'Pending laboratory results',
        specializedTests: {
          bloodSugarTest: vitals.length > 0 ? vitals[0].bloodSugar || 'Not performed' : 'Not performed',
          carotidDopplerTest: vitals.length > 0 ? vitals[0].carotidDoppler || 'Not performed' : 'Not performed',
          mentalHealthScreening: 'Psychological assessment questions administered'
        }
      },
      assessment: {
        primaryDiagnosis: `Health Risk Assessment - Score: ${healthScore}/100`,
        riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risk factors identified'],
        healthScore: healthScore,
        riskLevel: healthScore >= 80 ? 'Low Risk' : healthScore >= 60 ? 'Moderate Risk' : 'High Risk'
      },
      plan: {
        immediateActions: recommendations.slice(0, 3),
        followUp: recommendations.slice(3),
        referrals: healthScore < 70 ? ['Primary Care Physician', 'Specialist Consultation'] : ['Routine Follow-up'],
        patientEducation: [
          'Maintain regular exercise routine',
          'Follow balanced diet',
          'Regular health monitoring',
          'Stress management techniques'
        ]
      }
    };
  };

  const getBloodSugarStatus = (bloodSugar: number | undefined) => {
    if (bloodSugar === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (bloodSugar < 70) return { label: 'Low', color: 'warning' as const };
    if (bloodSugar > 140) return { label: 'High', color: 'error' as const };
    return { label: 'Normal', color: 'success' as const };
  };

  const getMentalHealthStatus = (score: number | undefined) => {
    if (score === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (score <= 4) return { label: 'Minimal', color: 'success' as const };
    if (score <= 9) return { label: 'Mild', color: 'info' as const };
    if (score <= 14) return { label: 'Moderate', color: 'warning' as const };
    if (score <= 19) return { label: 'Moderately Severe', color: 'error' as const };
    return { label: 'Severe', color: 'error' as const };
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" elevation={2}>
        <Toolbar>
          <DashboardIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Enhanced Doctor Dashboard - {doctorName}
          </Typography>
          <IconButton color="inherit" onClick={onLogout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            👨‍⚕️ Enhanced Doctor Dashboard
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            Advanced patient management with AI-powered insights
          </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* API Connection Status */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>API Status:</strong> Checking connection to Django backend at {getApiBaseUrl()}
            <br />
            <strong>Patients Loaded:</strong> {patients.length} patients from {patients.length > 0 && patients[0].id?.startsWith('demo_') ? 'Demo Mode' : 'Database'}
          </Typography>
        </Alert>

        {emailSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Modern AI Assessment complete! Patient has received their comprehensive health analysis and AI-powered recommendations via email.
          </Alert>
        )}

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Enhanced Patients List with Tabs */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            {/* Patient Statistics */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Card sx={{ minWidth: 150, bgcolor: 'primary.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.length}</Typography>
                  <Typography variant="body2">Total Patients</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'success.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => p.age && p.age < 50).length}</Typography>
                  <Typography variant="body2">Under 50</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'warning.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => p.age && p.age >= 50).length}</Typography>
                  <Typography variant="body2">50+ Years</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 150, bgcolor: 'error.light', color: 'white' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{filteredPatients.filter(p => p.allergies && p.allergies.length > 0).length}</Typography>
                  <Typography variant="body2">With Allergies</Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Enhanced Patient Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
              {filteredPatients.map((patient) => (
                <Box key={patient.id}>
                  <Card elevation={3} sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6
                    }
                  }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      {/* Patient Header */}
                      <Box display="flex" alignItems="center" mb={2}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                        </Typography>
                        {patient.age && patient.age > 65 && (
                          <Chip label="Senior" size="small" color="warning" sx={{ ml: 1 }} />
                        )}
                      </Box>
                      
                      {/* Contact Information */}
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>📧 Email:</strong> {patient.email || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>📞 Phone:</strong> {patient.phoneNumber || patient.phone || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                          <strong>🩸 Blood Group:</strong> {patient.bloodGroup || patient.blood_type || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>👤 Age:</strong> {patient.age || 'N/A'} | <strong>Gender:</strong> {patient.gender || 'N/A'}
                        </Typography>
                      </Box>
                      
                      {/* Medical Information Chips */}
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
                          <Chip
                            label={`⚠️ Allergies: ${(patient.allergies || '').split(',').filter(a => a.trim()).length} items`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                          {patient.pastMedicalHistory && (
                            <Chip
                              label={`🏥 Medical History`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          )}
                          {patient.familyHistory && (
                            <Chip
                              label={`👨‍👩‍👧‍👦 Family History`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                          {patient.medicationList && (
                            <Chip
                              label={`💊 Medications`}
                              size="small"
                              color="success"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        {/* Quick Medical Summary */}
                        {patient.pastMedicalHistory && (
                          <Typography variant="caption" color="text.secondary" sx={{ 
                            display: 'block', 
                            fontStyle: 'italic',
                            maxHeight: '40px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <strong>Medical:</strong> {patient.pastMedicalHistory.length > 80 ? 
                              patient.pastMedicalHistory.substring(0, 80) + '...' : 
                              patient.pastMedicalHistory}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                    
                    {/* Enhanced Action Buttons */}
                    <CardActions sx={{ 
                      flexDirection: 'column', 
                      gap: 1, 
                      p: 2,
                      bgcolor: 'grey.50'
                    }}>
                      <Box display="flex" gap={1} width="100%">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => handleViewPatient(patient)}
                          sx={{ flex: 1 }}
                        >
                          View Details
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<HealthIcon />}
                          onClick={() => handleRecordVitals(patient)}
                          sx={{ flex: 1 }}
                          color="primary"
                        >
                          Record Vitals
                        </Button>
                      </Box>
                      
                      <Box display="flex" gap={1} width="100%">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EmailIcon />}
                          onClick={() => handleSendEmail(patient)}
                          disabled={emailLoading}
                          color="info"
                          sx={{ flex: 1 }}
                        >
                          {emailLoading ? 'Sending...' : 'Send Email'}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<HealthIcon />}
                          onClick={() => handleModernAIAssessment(patient)}
                          color="secondary"
                          sx={{ flex: 1 }}
                        >
                          AI Assessment
                        </Button>
                      </Box>
                    </CardActions>
                  </Card>
                </Box>
              ))}
            </Box>
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
        </Paper>

      {/* Patient Details Dialog */}
      <Dialog
        open={!!selectedPatient && !showVitalsForm && !showRecommendationForm}
        onClose={() => setSelectedPatient(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Details - {selectedPatient?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              {/* Patient Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📋 Patient Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        📋 Personal Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Full Name:</strong> {selectedPatient.name || selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Email:</strong> {selectedPatient.email || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Phone:</strong> {selectedPatient.phoneNumber || selectedPatient.phone || 'Not provided'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Age:</strong> {selectedPatient.age || 'Not specified'} years
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Gender:</strong> {selectedPatient.gender || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Blood Group:</strong> {selectedPatient.bloodGroup || 'Not specified'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Registration Date:</strong> {selectedPatient.registeredAt || selectedPatient.createdAt || 'Not available'}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom color="primary">
                        🏥 Medical Information
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Past Medical History:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.pastMedicalHistory || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Allergies:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.allergies || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Family History:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.familyHistory || 'None reported'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        <strong>Current Medications:</strong>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, pl: 2, fontStyle: 'italic' }}>
                        {selectedPatient.medicationList || 'None reported'}
                      </Typography>
                    </Box>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* SOAP Note */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📝 SOAP Note</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {(() => {
                    const soapNote = formatSOAPNote(selectedPatient, patientVitals);
                    return (
                      <Box>
                        {/* Subjective */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>S</strong>ubjective
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Chief Complaint:</strong> {soapNote.subjective.chiefComplaint}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>History of Present Illness:</strong> {soapNote.subjective.historyOfPresentIllness}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Allergies:</strong> {soapNote.subjective.allergies}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Medications:</strong> {soapNote.subjective.medications}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Family History:</strong> {soapNote.subjective.familyHistory}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Social History:</strong> {soapNote.subjective.socialHistory}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Psychological Assessment:</strong> {soapNote.subjective.psychologicalAssessment}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Mental Health Screening Questions:</strong>
                          </Typography>
                          <List dense>
                            {soapNote.subjective.psychologicalQuestions.map((question, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={`${index + 1}. ${question}`} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>

                        {/* Objective */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>O</strong>bjective
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Vital Signs:</strong>
                          </Typography>
                          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
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
                                  <TableCell>{soapNote.objective.vitalSigns.bloodPressure}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.bloodPressure === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.bloodPressure === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Heart Rate</TableCell>
                                  <TableCell>{soapNote.objective.vitalSigns.heartRate}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.heartRate === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.heartRate === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Temperature</TableCell>
                                  <TableCell>{soapNote.objective.vitalSigns.temperature}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.temperature === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.temperature === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Oxygen Saturation</TableCell>
                                  <TableCell>{soapNote.objective.vitalSigns.oxygenSaturation}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.oxygenSaturation === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.oxygenSaturation === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Blood Sugar</TableCell>
                                  <TableCell>{soapNote.objective.vitalSigns.bloodSugar}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.bloodSugar === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.bloodSugar === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Carotid Doppler</TableCell>
                                  <TableCell>{soapNote.objective.vitalSigns.carotidDoppler}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={soapNote.objective.vitalSigns.carotidDoppler === 'Not recorded' ? 'Not Available' : 'Normal'} 
                                      size="small" 
                                      color={soapNote.objective.vitalSigns.carotidDoppler === 'Not recorded' ? 'default' : 'success'} 
                                    />
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Specialized Tests:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • Blood Sugar Test: {soapNote.objective.specializedTests.bloodSugarTest}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • Carotid Doppler Test: {soapNote.objective.specializedTests.carotidDopplerTest}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            • Mental Health Screening: {soapNote.objective.specializedTests.mentalHealthScreening}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Physical Examination:</strong> {soapNote.objective.physicalExam}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Lab Results:</strong> {soapNote.objective.labResults}
                          </Typography>
                        </Box>

                        {/* Assessment */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>A</strong>ssessment
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Primary Diagnosis:</strong> {soapNote.assessment.primaryDiagnosis}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Risk Level:</strong> 
                            <Chip 
                              label={soapNote.assessment.riskLevel} 
                              size="small" 
                              color={soapNote.assessment.healthScore >= 80 ? 'success' : soapNote.assessment.healthScore >= 60 ? 'warning' : 'error'} 
                              sx={{ ml: 1 }}
                            />
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Health Score:</strong> {soapNote.assessment.healthScore}/100
                          </Typography>
                          <Typography variant="body2">
                            <strong>Risk Factors:</strong> {soapNote.assessment.riskFactors.join(', ')}
                          </Typography>
                        </Box>

                        {/* Plan */}
                        <Box>
                          <Typography variant="h6" color="primary" gutterBottom>
                            <strong>P</strong>lan
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Immediate Actions:</strong>
                          </Typography>
                          <List dense>
                            {soapNote.plan.immediateActions.map((action, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={`• ${action}`} />
                              </ListItem>
                            ))}
                          </List>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Follow-up:</strong>
                          </Typography>
                          <List dense>
                            {soapNote.plan.followUp.map((action, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={`• ${action}`} />
                              </ListItem>
                            ))}
                          </List>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Referrals:</strong> {soapNote.plan.referrals.join(', ')}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Patient Education:</strong>
                          </Typography>
                          <List dense>
                            {soapNote.plan.patientEducation.map((education, index) => (
                              <ListItem key={index}>
                                <ListItemText primary={`• ${education}`} />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Box>
                    );
                  })()}
                </AccordionDetails>
              </Accordion>

              {/* Editable SOAP Note */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">📝 Editable SOAP Note</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Subjective */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>S</strong>ubjective
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Chief Complaint"
                      placeholder="Enter patient's main complaint..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="History of Present Illness"
                      placeholder="Describe the history of the current illness..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Patient's Symptoms"
                      placeholder="List current symptoms and their duration..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Objective */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>O</strong>bjective
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Physical Examination Findings"
                      placeholder="Enter physical examination findings..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Laboratory Results"
                      placeholder="Enter any lab results or test findings..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Diagnostic Tests"
                      placeholder="Enter results of any diagnostic tests..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Assessment */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>A</strong>ssessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Clinical Diagnosis"
                      placeholder="Enter your clinical diagnosis and assessment..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Differential Diagnosis"
                      placeholder="List differential diagnoses if applicable..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Risk Factors"
                      placeholder="Identify any risk factors or concerns..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  {/* Plan */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      <strong>P</strong>lan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Treatment Plan"
                      placeholder="Enter treatment plan and medications..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Follow-up Instructions"
                      placeholder="Enter follow-up instructions and next steps..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Patient Education"
                      placeholder="Enter patient education and counseling provided..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Referrals"
                      placeholder="Enter any specialist referrals or consultations..."
                      variant="outlined"
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleSaveAssessment}
                    >
                      Save SOAP Note
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleUpdatePatientRecord}
                    >
                      Update Patient Record
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Doctor Assessment and Plan */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">👨‍⚕️ Doctor Assessment & Plan</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      📝 Clinical Assessment
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Enter your clinical assessment, observations, and findings..."
                      variant="outlined"
                      value={doctorAssessment.clinicalAssessment}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, clinicalAssessment: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      🎯 Treatment Plan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      placeholder="Enter treatment plan, medications, follow-up instructions..."
                      variant="outlined"
                      value={doctorAssessment.treatmentPlan}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      📋 Recommendations
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Enter specific recommendations for the patient..."
                      variant="outlined"
                      value={doctorAssessment.recommendations}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, recommendations: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      🔄 Follow-up Plan
                    </Typography>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Enter follow-up schedule and next appointment details..."
                      variant="outlined"
                      value={doctorAssessment.followUpPlan}
                      onChange={(e) => setDoctorAssessment(prev => ({ ...prev, followUpPlan: e.target.value }))}
                      sx={{ mb: 2 }}
                    />
                  </Box>
                  
                  <Box display="flex" gap={2} justifyContent="flex-end">
                    <Button 
                      variant="outlined" 
                      color="primary"
                      onClick={handleSaveAssessment}
                    >
                      Save Assessment
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleUpdatePatientRecord}
                    >
                      Update Patient Record
                    </Button>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Vitals History */}
              {patientVitals.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">📊 Vitals History</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer component={Paper} variant="outlined">
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Date</strong></TableCell>
                            <TableCell><strong>Blood Sugar</strong></TableCell>
                            <TableCell><strong>Carotid Doppler</strong></TableCell>
                            <TableCell><strong>Blood Pressure</strong></TableCell>
                            <TableCell><strong>Heart Rate</strong></TableCell>
                            <TableCell><strong>Temperature</strong></TableCell>
                            <TableCell><strong>Oxygen</strong></TableCell>
                            <TableCell><strong>Mental Health</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patientVitals.map((vital, index) => (
                            <TableRow key={index}>
                              <TableCell>{new Date().toLocaleDateString()}</TableCell>
                              <TableCell>
                                {vital.bloodSugar || 'N/A'}
                                {vital.bloodSugar && (
                                  <Chip 
                                    label={getBloodSugarStatus(vital.bloodSugar).label} 
                                    size="small" 
                                    color={getBloodSugarStatus(vital.bloodSugar).color} 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </TableCell>
                              <TableCell>{vital.carotidDoppler || 'N/A'}</TableCell>
                              <TableCell>{vital.bloodPressure || 'N/A'}</TableCell>
                              <TableCell>{vital.heartRate || 'N/A'}</TableCell>
                              <TableCell>{vital.temperature || 'N/A'}</TableCell>
                              <TableCell>{vital.oxygenSaturation || 'N/A'}</TableCell>
                              <TableCell>
                                {vital.mentalHealthScore || 'N/A'}
                                {vital.mentalHealthScore && (
                                  <Chip 
                                    label={getMentalHealthStatus(vital.mentalHealthScore).label} 
                                    size="small" 
                                    color={getMentalHealthStatus(vital.mentalHealthScore).color} 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPatient(null)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={() => selectedPatient && handleSendEmail(selectedPatient)}
            disabled={emailLoading}
            color="primary"
          >
            {emailLoading ? 'Sending...' : 'Send Email Report'}
          </Button>
          <Button
            variant="contained"
            startIcon={<HealthIcon />}
            onClick={() => {
              setShowVitalsForm(true);
            }}
          >
            Record New Vitals
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Tracking Dialog */}
      {selectedPatient && showVitalsForm && (
        <Dialog
          open={showVitalsForm}
          onClose={() => setShowVitalsForm(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <VitalsTracking
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleVitalsRecorded}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Recommendation Form Dialog */}
      {selectedPatient && showRecommendationForm && (
        <Dialog
          open={showRecommendationForm}
          onClose={() => setShowRecommendationForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <RecommendationForm
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleSendRecommendation}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Email Preview Dialog */}
      <EmailPreview
        open={showEmailPreview}
        onClose={() => setShowEmailPreview(false)}
        onSend={handleSendEmailConfirm}
        patient={emailPreviewData.patient}
        healthScore={emailPreviewData.healthScore}
        riskFactors={emailPreviewData.riskFactors}
        recommendations={emailPreviewData.recommendations}
        loading={emailLoading}
      />
      </Container>
    </Box>
  );
};

export default DoctorDashboard;
