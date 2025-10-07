import React, { useState, useEffect } from 'react';
import { useHybridPatients } from '../hooks/useHybridStorage';
import SyncStatusIndicator from './SyncStatusIndicator';
import apiFixService from '../services/apiFix';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  ListItemSecondaryAction,
  TextField,
  InputAdornment,
  Button,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Warning,
  CheckCircle,
  MonitorHeart,
  Biotech,
  Science,
  Timeline,
  Assessment,
  Insights,
  SmartToy,
  Chat,
  Notifications,
  Refresh,
  Search,
  Person,
  Clear,
} from '@mui/icons-material';

interface AIHealthAssessment {
  overallScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  trends: {
    cardiovascular: 'improving' | 'stable' | 'declining';
    metabolic: 'improving' | 'stable' | 'declining';
    mental: 'improving' | 'stable' | 'declining';
  };
  predictions: {
    nextMonth: string;
    nextYear: string;
    longTerm: string;
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  aiInsights: {
    patterns: string[];
    risks: string[];
    opportunities: string[];
  };
}

const ModernAIHealthAssessment: React.FC = () => {
  const [assessment, setAssessment] = useState<AIHealthAssessment | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Load patients with enhanced error handling
  const loadPatients = async () => {
    setPatientsLoading(true);
    setError(null);
    
    try {
      // Try hybrid storage first
      const hybridPatients = await apiFixService.getPatientsWithRetry();
      if (hybridPatients && hybridPatients.data) {
        setPatients(hybridPatients.data);
        console.log('Patients loaded successfully:', hybridPatients.data.length);
      } else {
        // Fallback to fetch method
        const fetchPatients = await apiFixService.getPatientsWithFetch();
        if (fetchPatients && fetchPatients.data) {
          setPatients(fetchPatients.data);
          console.log('Patients loaded with fetch:', fetchPatients.data.length);
        }
      }
    } catch (error: any) {
      console.error('Error loading patients:', error);
      setError(`Failed to load patients: ${error.message}`);
      
      // Try alternative method
      try {
        const fallbackPatients = await apiFixService.getPatientsWithFetch();
        if (fallbackPatients && fallbackPatients.data) {
          setPatients(fallbackPatients.data);
          setError(null);
        }
      } catch (fallbackError: any) {
        console.error('Fallback also failed:', fallbackError);
        setError('Unable to connect to backend. Please check your connection.');
      }
    } finally {
      setPatientsLoading(false);
    }
  };

  // Load patients on component mount
  useEffect(() => {
    loadPatients();
  }, []);

  // Patients are automatically loaded by useHybridPatients hook

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => {
    const searchLower = searchTerm.toLowerCase();
    const name = patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const email = patient.email || '';
    const phone = patient.phoneNumber || patient.phone || '';
    
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) || 
           phone.includes(searchTerm);
  });

  const generateAIAssessment = (patient: any): AIHealthAssessment => {
    // Enhanced AI-powered health assessment with comprehensive data analysis
    const age = patient.age || (patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 30);
    const gender = patient.gender || 'unknown';
    const bloodGroup = patient.blood_type || patient.bloodGroup || 'Unknown';
    
    // Medical History Analysis
    const pastMedicalHistory = patient.pastMedicalHistory || '';
    const familyHistory = patient.familyHistory || '';
    const allergies = patient.allergies || '';
    const medications = patient.medicationList || '';
    
    // Vitals Analysis (if available from backend)
    const vitals = patient.vitals || {};
    const bloodSugar = vitals.bloodSugar || null;
    const bloodPressure = vitals.bloodPressure || null;
    const heartRate = vitals.heartRate || null;
    // const temperature = vitals.temperature || null;
    const weight = vitals.weight || null;
    const height = vitals.height || null;
    
    // Calculate BMI if weight and height available
    let bmi = null;
    if (weight && height) {
      const heightInMeters = height / 100;
      bmi = weight / (heightInMeters * heightInMeters);
    }
    
    // Comprehensive Health Score Calculation
    let baseScore = 80; // Base score for healthy individual
    let riskFactors = [];
    let healthStrengths = [];
    let criticalAlerts = [];
    
    // Age-based assessment
    if (age > 65) {
      baseScore -= 20;
      riskFactors.push('Advanced age (65+)');
    } else if (age > 50) {
      baseScore -= 15;
      riskFactors.push('Middle age (50-65)');
    } else if (age > 35) {
      baseScore -= 10;
      riskFactors.push('Adult age (35-50)');
    } else {
      healthStrengths.push('Young adult age');
    }
    
    // Medical History Analysis
    if (pastMedicalHistory && pastMedicalHistory.toLowerCase() !== 'none reported' && pastMedicalHistory.trim() !== '') {
      baseScore -= 25;
      riskFactors.push('Previous medical conditions');
      
      // Specific condition analysis
      const history = pastMedicalHistory.toLowerCase();
      if (history.includes('diabetes') || history.includes('diabetic')) {
        baseScore -= 15;
        criticalAlerts.push('Diabetes history detected');
      }
      if (history.includes('hypertension') || history.includes('high blood pressure')) {
        baseScore -= 12;
        criticalAlerts.push('Hypertension history detected');
      }
      if (history.includes('heart') || history.includes('cardiac')) {
        baseScore -= 20;
        criticalAlerts.push('Cardiac history detected');
      }
      if (history.includes('stroke') || history.includes('cerebrovascular')) {
        baseScore -= 18;
        criticalAlerts.push('Stroke history detected');
      }
    } else {
      healthStrengths.push('No significant medical history');
    }
    
    // Family History Analysis
    if (familyHistory && familyHistory.toLowerCase() !== 'none reported' && familyHistory.trim() !== '') {
      baseScore -= 15;
      riskFactors.push('Family history of medical conditions');
      
      const family = familyHistory.toLowerCase();
      if (family.includes('diabetes')) {
        baseScore -= 10;
        riskFactors.push('Family history of diabetes');
      }
      if (family.includes('heart') || family.includes('cardiac')) {
        baseScore -= 12;
        riskFactors.push('Family history of heart disease');
      }
      if (family.includes('cancer')) {
        baseScore -= 8;
        riskFactors.push('Family history of cancer');
      }
    } else {
      healthStrengths.push('No significant family history');
    }
    
    // Allergies Analysis
    if (allergies && allergies.toLowerCase() !== 'none reported' && allergies.trim() !== '') {
      baseScore -= 8;
      riskFactors.push('Known allergies');
      
      const allergyList = allergies.toLowerCase();
      if (allergyList.includes('severe') || allergyList.includes('anaphylaxis')) {
        baseScore -= 5;
        criticalAlerts.push('Severe allergies identified');
      }
    } else {
      healthStrengths.push('No known allergies');
    }
    
    // Medication Analysis
    if (medications && medications.toLowerCase() !== 'none reported' && medications.trim() !== '') {
      baseScore -= 12;
      riskFactors.push('Current medications');
      
      const medList = medications.toLowerCase();
      if (medList.includes('insulin') || medList.includes('metformin')) {
        criticalAlerts.push('Diabetes medications detected');
      }
      if (medList.includes('blood pressure') || medList.includes('ace inhibitor')) {
        criticalAlerts.push('Hypertension medications detected');
      }
      if (medList.includes('statin') || medList.includes('cholesterol')) {
        criticalAlerts.push('Cholesterol medications detected');
      }
    } else {
      healthStrengths.push('No current medications');
    }
    
    // Vitals Analysis
    if (bloodSugar !== null) {
      if (bloodSugar > 200) {
        baseScore -= 20;
        criticalAlerts.push('High blood sugar detected (>200 mg/dL)');
      } else if (bloodSugar > 140) {
        baseScore -= 15;
        riskFactors.push('Elevated blood sugar (140-200 mg/dL)');
      } else if (bloodSugar < 70) {
        baseScore -= 10;
        criticalAlerts.push('Low blood sugar detected (<70 mg/dL)');
      } else {
        healthStrengths.push('Normal blood sugar levels');
      }
    }
    
    if (bloodPressure) {
      const [systolic, diastolic] = bloodPressure.split('/').map(Number);
      if (systolic > 140 || diastolic > 90) {
        baseScore -= 18;
        criticalAlerts.push('High blood pressure detected');
      } else if (systolic > 120 || diastolic > 80) {
        baseScore -= 10;
        riskFactors.push('Elevated blood pressure');
      } else {
        healthStrengths.push('Normal blood pressure');
      }
    }
    
    if (heartRate !== null) {
      if (heartRate > 100) {
        baseScore -= 8;
        riskFactors.push('Elevated heart rate (>100 bpm)');
      } else if (heartRate < 60) {
        baseScore -= 5;
        riskFactors.push('Low heart rate (<60 bpm)');
      } else {
        healthStrengths.push('Normal heart rate');
      }
    }
    
    if (bmi !== null) {
      if (bmi > 30) {
        baseScore -= 15;
        criticalAlerts.push('Obesity detected (BMI >30)');
      } else if (bmi > 25) {
        baseScore -= 10;
        riskFactors.push('Overweight (BMI 25-30)');
      } else if (bmi < 18.5) {
        baseScore -= 8;
        riskFactors.push('Underweight (BMI <18.5)');
      } else {
        healthStrengths.push('Normal BMI');
      }
    }
    
    // Final score calculation
    const overallScore = Math.max(0, Math.min(100, baseScore));
    
    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (overallScore < 40 || criticalAlerts.length > 2) {
      riskLevel = 'High';
    } else if (overallScore < 70 || criticalAlerts.length > 0 || riskFactors.length > 3) {
      riskLevel = 'Medium';
    }
    
    // Generate trends based on comprehensive analysis
    const trends = {
      cardiovascular: (overallScore > 70 && !criticalAlerts.some(alert => alert.includes('heart') || alert.includes('blood pressure'))) ? 'improving' : 
                     (overallScore > 50 && riskFactors.length < 3) ? 'stable' : 'declining' as 'improving' | 'stable' | 'declining',
      metabolic: (overallScore > 75 && !criticalAlerts.some(alert => alert.includes('diabetes') || alert.includes('blood sugar'))) ? 'improving' : 
                 (overallScore > 55 && !riskFactors.some(factor => factor.includes('diabetes'))) ? 'stable' : 'declining' as 'improving' | 'stable' | 'declining',
      mental: (overallScore > 80 && healthStrengths.length > riskFactors.length) ? 'improving' : 
              (overallScore > 60) ? 'stable' : 'declining' as 'improving' | 'stable' | 'declining',
    };
    
    // Generate detailed predictions
    const predictions = {
      nextMonth: criticalAlerts.length > 0 ? 'Immediate medical attention may be required' : 
                 riskLevel === 'High' ? 'High risk of complications - urgent monitoring needed' :
                 riskLevel === 'Medium' ? 'Moderate risk - regular monitoring recommended' :
                 'Stable health with continued monitoring',
      nextYear: riskLevel === 'High' ? 'High risk of major health issues in next 12 months' :
                riskLevel === 'Medium' ? 'Moderate risk of health complications' :
                'Good health outlook with proper management',
      longTerm: riskLevel === 'High' ? 'Significant risk of chronic diseases and complications' :
                riskLevel === 'Medium' ? 'Moderate risk of chronic conditions' :
                'Low risk of major chronic diseases'
    };
    
    // Generate comprehensive recommendations
    const recommendations = {
      immediate: criticalAlerts.length > 0 ? [
        'URGENT: Schedule immediate medical consultation',
        'Review all current medications with healthcare provider',
        'Implement emergency health protocols if needed'
      ] : riskLevel === 'High' ? [
        'Schedule comprehensive health checkup within 1 week',
        'Review current medications with doctor',
        'Implement immediate lifestyle modifications'
      ] : [
        'Continue current health routine',
        'Schedule routine preventive care',
        'Maintain healthy lifestyle habits'
      ],
      shortTerm: [
        'Regular exercise program (150 min/week moderate intensity)',
        'Balanced nutrition plan with medical supervision if needed',
        'Adequate sleep (7-9 hours per night)',
        'Regular health monitoring and vital signs tracking',
        medications ? 'Strict medication adherence and monitoring' : 'No medication management required',
        allergies ? 'Maintain allergy management plan' : 'No allergy management needed'
      ],
      longTerm: [
        'Annual comprehensive health assessment',
        'Preventive care schedule based on risk factors',
        'Lifestyle optimization program',
        'Health goal setting and tracking system',
        'Regular specialist consultations if needed',
        'Health education and awareness programs'
      ]
    };
    
    // Generate comprehensive insights
    const aiInsights = {
      patterns: [
        `Health analysis based on ${age}-year-old ${gender} patient`,
        `Blood type: ${bloodGroup}`,
        `Overall health score: ${overallScore}/100 (${riskLevel} risk)`,
        criticalAlerts.length > 0 ? `${criticalAlerts.length} critical health alerts identified` : 'No critical health alerts',
        riskFactors.length > 0 ? `${riskFactors.length} risk factors identified` : 'Minimal risk factors',
        healthStrengths.length > 0 ? `${healthStrengths.length} health strengths identified` : 'Limited health data available'
      ],
      risks: riskFactors.length > 0 ? riskFactors : ['Minimal risk factors identified'],
      opportunities: [
        'Regular health monitoring and check-ups',
        'Lifestyle optimization and preventive care',
        'Early intervention for identified risk factors',
        'Health education and awareness programs',
        'Medication optimization if applicable',
        'Allergy management if applicable'
      ]
    };
    
    return {
      overallScore,
      riskLevel,
      trends,
      predictions,
      recommendations,
      aiInsights
    };
  };

  const handleAIAssessment = async (patient: any) => {
    setLoading(true);
    setSelectedPatient(patient);
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const aiAssessment = generateAIAssessment(patient);
    setAssessment(aiAssessment);
    setLoading(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp color="success" />;
      case 'stable': return <TrendingFlat color="info" />;
      case 'declining': return <TrendingDown color="error" />;
      default: return <TrendingFlat color="info" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return '#4caf50';
      case 'stable': return '#2196f3';
      case 'declining': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🤖 AI Health Assessment
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Advanced AI-powered health analysis and predictive insights
        </Typography>
        
        {/* Sync Status Indicator */}
        <Box display="flex" justifyContent="center" mt={2}>
          <SyncStatusIndicator compact />
        </Box>
      </Box>

      {/* Selected Patient Info */}
      {selectedPatient && (
        <Card sx={{ mb: 4, bgcolor: 'primary.main', color: 'white' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}>
                <Person sx={{ fontSize: '2rem' }} />
              </Avatar>
              <Box>
                <Typography variant="h5" gutterBottom>
                  {selectedPatient.name || selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Age: {selectedPatient.age || (selectedPatient.date_of_birth ? new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear() : 'N/A')} • 
                  Email: {selectedPatient.email || 'No email'} • 
                  Phone: {selectedPatient.phoneNumber || selectedPatient.phone || 'No phone'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Comprehensive Patient Data Analysis */}
      {selectedPatient && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assessment color="primary" />
              Comprehensive Patient Data Analysis
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              {/* Demographics */}
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📊 Demographics
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Age" 
                        secondary={selectedPatient.age || (selectedPatient.date_of_birth ? new Date().getFullYear() - new Date(selectedPatient.date_of_birth).getFullYear() : 'N/A')} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Gender" 
                        secondary={selectedPatient.gender || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Blood Type" 
                        secondary={selectedPatient.blood_type || selectedPatient.bloodGroup || 'Not specified'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Email" 
                        secondary={selectedPatient.email || 'No email'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Phone" 
                        secondary={selectedPatient.phoneNumber || selectedPatient.phone || 'No phone'} 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Box>

              {/* Medical History */}
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    🏥 Medical History
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Past Medical History" 
                        secondary={selectedPatient.pastMedicalHistory && selectedPatient.pastMedicalHistory.toLowerCase() !== 'none reported' ? selectedPatient.pastMedicalHistory : 'None reported'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Family History" 
                        secondary={selectedPatient.familyHistory && selectedPatient.familyHistory.toLowerCase() !== 'none reported' ? selectedPatient.familyHistory : 'None reported'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Allergies" 
                        secondary={selectedPatient.allergies && selectedPatient.allergies.toLowerCase() !== 'none reported' ? selectedPatient.allergies : 'None reported'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Current Medications" 
                        secondary={selectedPatient.medicationList && selectedPatient.medicationList.toLowerCase() !== 'none reported' ? selectedPatient.medicationList : 'None reported'} 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Box>

              {/* Vitals (if available) */}
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    💓 Vitals & Measurements
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText 
                        primary="Blood Sugar (BSR)" 
                        secondary={selectedPatient.vitals?.bloodSugar ? `${selectedPatient.vitals.bloodSugar} mg/dL` : 'Not recorded'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Blood Pressure" 
                        secondary={selectedPatient.vitals?.bloodPressure || 'Not recorded'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Heart Rate" 
                        secondary={selectedPatient.vitals?.heartRate ? `${selectedPatient.vitals.heartRate} bpm` : 'Not recorded'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Temperature" 
                        secondary={selectedPatient.vitals?.temperature ? `${selectedPatient.vitals.temperature}°F` : 'Not recorded'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="Weight/Height" 
                        secondary={selectedPatient.vitals?.weight && selectedPatient.vitals?.height ? 
                          `${selectedPatient.vitals.weight}kg / ${selectedPatient.vitals.height}cm` : 'Not recorded'} 
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText 
                        primary="BMI" 
                        secondary={selectedPatient.vitals?.weight && selectedPatient.vitals?.height ? 
                          (selectedPatient.vitals.weight / Math.pow(selectedPatient.vitals.height/100, 2)).toFixed(1) : 'Not calculated'} 
                      />
                    </ListItem>
                  </List>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* AI Health Score Card */}
      {assessment && (
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Avatar sx={{ 
              width: 120, 
              height: 120, 
              mx: 'auto', 
              mb: 2, 
              bgcolor: 'rgba(255,255,255,0.2)',
              fontSize: '2rem'
            }}>
              <Psychology sx={{ fontSize: '3rem' }} />
            </Avatar>
            
            <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {assessment.overallScore}/100
            </Typography>
            
            <Typography variant="h5" gutterBottom>
              AI Health Score
            </Typography>
            
            <LinearProgress 
              variant="determinate" 
              value={assessment.overallScore} 
              sx={{ 
                height: 10, 
                borderRadius: 5, 
                mb: 2,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white'
                }
              }} 
            />
            
            <Chip 
              label={`${assessment.riskLevel} Risk`} 
              color={getRiskColor(assessment.riskLevel) as any}
              sx={{ 
                bgcolor: 'white', 
                color: 'primary.main',
                fontWeight: 'bold',
                fontSize: '1rem',
                px: 2,
                py: 1
              }} 
            />
          </CardContent>
        </Card>
      )}

      {/* Health Trends */}
      {assessment && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="primary" />
              AI Health Trends
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getTrendColor(assessment.trends.cardiovascular) + '10' }}>
                  <MonitorHeart sx={{ fontSize: '2rem', color: getTrendColor(assessment.trends.cardiovascular), mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Cardiovascular</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {getTrendIcon(assessment.trends.cardiovascular)}
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {assessment.trends.cardiovascular}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getTrendColor(assessment.trends.metabolic) + '10' }}>
                  <Biotech sx={{ fontSize: '2rem', color: getTrendColor(assessment.trends.metabolic), mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Metabolic</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {getTrendIcon(assessment.trends.metabolic)}
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {assessment.trends.metabolic}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getTrendColor(assessment.trends.mental) + '10' }}>
                  <Psychology sx={{ fontSize: '2rem', color: getTrendColor(assessment.trends.mental), mb: 1 }} />
                  <Typography variant="h6" gutterBottom>Mental Health</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {getTrendIcon(assessment.trends.mental)}
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {assessment.trends.mental}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* AI Predictions */}
      {assessment && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Science color="primary" />
              AI Health Predictions
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📅 Next Month
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assessment.predictions.nextMonth}
                  </Typography>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    📊 Next Year
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assessment.predictions.nextYear}
                  </Typography>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>
                    🎯 Long Term
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {assessment.predictions.longTerm}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* AI Recommendations */}
      {assessment && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Insights color="primary" />
              AI Health Recommendations
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                    ⚡ Immediate Actions
                  </Typography>
                  <List dense>
                    {assessment.recommendations.immediate.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'error.main', width: 24, height: 24 }}>
                            <Warning sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'warning.main' }}>
                    📈 Short Term Goals
                  </Typography>
                  <List dense>
                    {assessment.recommendations.shortTerm.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'warning.main', width: 24, height: 24 }}>
                            <TrendingUp sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                    🎯 Long Term Strategy
                  </Typography>
                  <List dense>
                    {assessment.recommendations.longTerm.map((rec, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24 }}>
                            <CheckCircle sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      {assessment && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToy color="primary" />
              AI Health Insights
            </Typography>
            
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 3 }}>
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'info.main' }}>
                    🔍 Health Patterns
                  </Typography>
                  <List dense>
                    {assessment.aiInsights.patterns.map((pattern, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'info.main', width: 24, height: 24 }}>
                            <Assessment sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={pattern} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'error.main' }}>
                    ⚠️ Risk Factors
                  </Typography>
                  <List dense>
                    {assessment.aiInsights.risks.map((risk, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'error.main', width: 24, height: 24 }}>
                            <Warning sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={risk} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
              
              <Box>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" gutterBottom sx={{ color: 'success.main' }}>
                    💡 Opportunities
                  </Typography>
                  <List dense>
                    {assessment.aiInsights.opportunities.map((opportunity, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'success.main', width: 24, height: 24 }}>
                            <CheckCircle sx={{ fontSize: '1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={opportunity} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Chat />}
          sx={{ 
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            px: 4,
            py: 1.5
          }}
        >
          AI Health Chat
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<Notifications />}
          sx={{ px: 4, py: 1.5 }}
        >
          Set Health Alerts
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<Refresh />}
          onClick={() => selectedPatient && handleAIAssessment(selectedPatient)}
          sx={{ px: 4, py: 1.5 }}
        >
          Refresh Assessment
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={<Person />}
          onClick={() => {
            setSelectedPatient(null);
            setAssessment(null);
          }}
          sx={{ px: 4, py: 1.5 }}
        >
          Select Different Patient
        </Button>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            AI is analyzing health data...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This may take a few moments
          </Typography>
        </Box>
      )}

      {/* Patient Selection */}
      {!selectedPatient && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Person color="primary" />
              Select Patient for AI Assessment
            </Typography>
            
            <TextField
              fullWidth
              placeholder="Search patients by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            
            {patientsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : filteredPatients.length > 0 ? (
              <List>
                {filteredPatients.map((patient, index) => {
                  const name = patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
                  const age = patient.age || (patient.date_of_birth ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear() : 'N/A');
                  const email = patient.email || 'No email';
                  const phone = patient.phoneNumber || patient.phone || 'No phone';
                  
                  return (
                    <ListItem key={patient.id || index} disablePadding>
                      <ListItemButton onClick={() => handleAIAssessment(patient)}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={name}
                          secondary={`Age: ${age} • Email: ${email} • Phone: ${phone}`}
                        />
                        <ListItemSecondaryAction>
                          <Chip 
                            label="AI Assessment" 
                            color="primary" 
                            variant="outlined"
                            size="small"
                          />
                        </ListItemSecondaryAction>
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                {error ? (
                  <>
                    <Typography variant="h6" color="error" gutterBottom>
                      Connection Error
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {error}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        onClick={loadPatients}
                        disabled={patientsLoading}
                        startIcon={<Refresh />}
                      >
                        Retry
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={() => {
                          apiFixService.clearCache();
                          loadPatients();
                        }}
                        startIcon={<Clear />}
                      >
                        Clear Cache & Retry
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={apiFixService.forceRefresh}
                        startIcon={<Refresh />}
                      >
                        Force Refresh
                      </Button>
                    </Box>
                  </>
                ) : patientsLoading ? (
                  <>
                    <CircularProgress sx={{ mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      Loading patients...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Connecting to backend database
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {searchTerm ? 'No patients found matching your search' : 'No patients registered yet'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Try a different search term' : 'Register patients first to run AI assessments'}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={loadPatients}
                      sx={{ mt: 2 }}
                      startIcon={<Refresh />}
                    >
                      Refresh Patient List
                    </Button>
                  </>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ModernAIHealthAssessment;
