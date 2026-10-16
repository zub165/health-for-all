import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Divider,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { HealthAndSafety, Psychology, Assessment, Assignment as AssignmentIcon } from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import PatientConsentForm from './PatientConsentForm';
import ExportActions from './ExportActions';
import { getActiveOrganizations } from '../config/volunteerOrganizations';
import { calculateComprehensiveHealthScore } from '../services/medicalStandards';

  const schema = yup.object({
    firstName: yup.string().required('First name is required'),
    lastName: yup.string().required('Last name is required'),
    email: yup.string().email('Invalid email').required('Email is required'),
    phoneNumber: yup.string().required('Phone number is required'),
    age: yup.number().min(1).max(120).required('Age is required'),
    gender: yup.string().required('Gender is required'),
    bloodGroup: yup.string().required('Blood group is required'),
    address: yup.string().required('Address is required'),
    pastMedicalHistory: yup.string().default(''),
    allergies: yup.string().default(''),
    familyHistory: yup.string().default(''),
    medicationList: yup.string().default(''),
    emergencyContact: yup.string().default(''),
    // Volunteer-specific fields
    volunteerName: yup.string().default(''),
    volunteerOrganization: yup.string().default(''),
    volunteerRole: yup.string().default('Health Fair Volunteer'),
    volunteerContact: yup.string().default(''),
    // Privacy options
    useUniqueId: yup.boolean().default(false),
    disclosePersonalInfo: yup.boolean().default(true),
  });

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];
const volunteerRoles = [
  'Health Fair Volunteer',
  'Community Health Worker',
  'Medical Student',
  'Nursing Student',
  'Healthcare Professional',
  'Community Organizer',
  'Event Coordinator',
  'Other'
];

interface SimplePatientRegistrationProps {
  onSuccess?: (patient: Patient) => void;
}

const SimplePatientRegistration: React.FC<SimplePatientRegistrationProps> = ({ onSuccess }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [consentData, setConsentData] = useState<any>(null);
  const [formData, setFormData] = useState<any>(null);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      age: 0,
      gender: 'Male',
      bloodGroup: 'A+',
      address: '', // REQUIRED FIELD
      pastMedicalHistory: '',
      allergies: '',
      familyHistory: '',
      medicationList: '',
      emergencyContact: '', // NEW FIELD
      volunteerName: '',
      volunteerOrganization: 'Masjid Al-Rahma',
      volunteerRole: 'Health Fair Volunteer',
      volunteerContact: '(813) 381-3996',
      useUniqueId: false,
      disclosePersonalInfo: true,
    },
  });

  const calculateAIHealthScore = (data: any, vitals?: any): number => {
    let score = 100;
    const factors: string[] = [];
    const medicalReferences: string[] = [];
    
    console.log('🔍 Evidence-Based Health Score Calculation:', { data, vitals });
    
    // === AGE FACTORS (Based on WHO Global Health Observatory) ===
    // Reference: WHO. (2021). Global Health Observatory data repository
    if (data.age > 75) {
      score -= 20;
      factors.push('Advanced Age (75+) - High Risk Category');
      medicalReferences.push('WHO Global Health Observatory 2021');
    } else if (data.age > 65) {
      score -= 15;
      factors.push('Senior Age (65-74) - Moderate Risk Category');
      medicalReferences.push('WHO Global Health Observatory 2021');
    } else if (data.age > 50) {
      score -= 10;
      factors.push('Middle Age (50-64) - Increased Risk Category');
      medicalReferences.push('WHO Global Health Observatory 2021');
    } else if (data.age > 35) {
      score -= 5;
      factors.push('Adult Age (35-49) - Baseline Risk Category');
      medicalReferences.push('WHO Global Health Observatory 2021');
    } else if (data.age < 18) {
      score -= 5;
      factors.push('Pediatric Age - Specialized Care Required');
      medicalReferences.push('WHO Global Health Observatory 2021');
    }
    
    // === VITAL SIGNS ANALYSIS (Based on AHA/ACC Guidelines) ===
    if (vitals) {
      // Blood Pressure Analysis - AHA/ACC 2017 Guidelines
      // Reference: Whelton PK, et al. (2017). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults
      if (vitals.bloodPressure) {
        const bp = vitals.bloodPressure.split('/');
        const systolic = parseInt(bp[0]);
        const diastolic = parseInt(bp[1]);
        
        if (systolic >= 180 || diastolic >= 120) {
          score -= 25;
          factors.push('Hypertensive Crisis (Stage 3) - Immediate Medical Attention Required');
          medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
        } else if (systolic >= 160 || diastolic >= 100) {
          score -= 20;
          factors.push('Stage 2 Hypertension - High Cardiovascular Risk');
          medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
        } else if (systolic >= 140 || diastolic >= 90) {
          score -= 15;
          factors.push('Stage 1 Hypertension - Increased Cardiovascular Risk');
          medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
        } else if (systolic >= 130 || diastolic >= 80) {
          score -= 10;
          factors.push('Elevated Blood Pressure - Prehypertension');
          medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
        } else if (systolic < 90 || diastolic < 60) {
          score -= 5;
          factors.push('Hypotension - Requires Monitoring');
          medicalReferences.push('AHA/ACC 2017 Hypertension Guidelines');
        }
      }
      
      // Heart Rate Analysis - Based on AHA Guidelines
      // Reference: American Heart Association. (2021). Target Heart Rates Chart
      if (vitals.heartRate) {
        const hr = parseInt(vitals.heartRate);
        if (hr > 100) {
          score -= 10;
          factors.push('Tachycardia - Above Normal Range');
          medicalReferences.push('AHA Target Heart Rates Chart 2021');
        } else if (hr < 60) {
          score -= 5;
          factors.push('Bradycardia - Below Normal Range');
          medicalReferences.push('AHA Target Heart Rates Chart 2021');
        }
      }
      
      // Temperature Analysis - Based on CDC Guidelines
      // Reference: CDC. (2021). Fever and Temperature Guidelines
      if (vitals.temperature) {
        const temp = parseFloat(vitals.temperature);
        if (temp > 100.4) {
          score -= 15;
          factors.push('Fever - Potential Infection or Inflammatory Process');
          medicalReferences.push('CDC Fever Guidelines 2021');
        } else if (temp < 95) {
          score -= 10;
          factors.push('Hypothermia - Medical Emergency');
          medicalReferences.push('CDC Temperature Guidelines 2021');
        }
      }
      
      // Blood Sugar Analysis - Based on ADA Guidelines
      // Reference: American Diabetes Association. (2021). Diabetes Care Standards
      if (vitals.bloodSugar) {
        const bs = parseInt(vitals.bloodSugar);
        if (bs > 200) {
          score -= 25;
          factors.push('Severe Hyperglycemia - Diabetic Emergency');
          medicalReferences.push('ADA Diabetes Care Standards 2021');
        } else if (bs > 126) {
          score -= 20;
          factors.push('Hyperglycemia - Diabetes Risk');
          medicalReferences.push('ADA Diabetes Care Standards 2021');
        } else if (bs < 70) {
          score -= 15;
          factors.push('Hypoglycemia - Immediate Treatment Required');
          medicalReferences.push('ADA Diabetes Care Standards 2021');
        }
      }
      
      // BMI Analysis - Based on WHO Classification
      // Reference: WHO. (2000). Obesity: preventing and managing the global epidemic
      if (vitals.weight && vitals.height) {
        const weight = parseFloat(vitals.weight);
        const height = parseFloat(vitals.height) / 100; // Convert cm to meters
        const bmi = weight / (height * height);
        
        if (bmi >= 40) {
          score -= 20;
          factors.push('Morbid Obesity (Class III) - High Health Risk');
          medicalReferences.push('WHO Obesity Classification 2000');
        } else if (bmi >= 35) {
          score -= 15;
          factors.push('Severe Obesity (Class II) - Increased Health Risk');
          medicalReferences.push('WHO Obesity Classification 2000');
        } else if (bmi >= 30) {
          score -= 10;
          factors.push('Obesity (Class I) - Moderate Health Risk');
          medicalReferences.push('WHO Obesity Classification 2000');
        } else if (bmi >= 25) {
          score -= 5;
          factors.push('Overweight - Slight Health Risk');
          medicalReferences.push('WHO Obesity Classification 2000');
        } else if (bmi < 18.5) {
          score -= 5;
          factors.push('Underweight - Nutritional Risk');
          medicalReferences.push('WHO Obesity Classification 2000');
        }
      }
      
      // Oxygen Saturation Analysis - Based on ATS Guidelines
      // Reference: American Thoracic Society. (2021). Oxygen Therapy Guidelines
      if (vitals.oxygenSaturation) {
        const spo2 = parseInt(vitals.oxygenSaturation);
        if (spo2 < 90) {
          score -= 20;
          factors.push('Hypoxemia - Severe Oxygen Deficiency');
          medicalReferences.push('ATS Oxygen Therapy Guidelines 2021');
        } else if (spo2 < 95) {
          score -= 10;
          factors.push('Low Oxygen Saturation - Mild Hypoxemia');
          medicalReferences.push('ATS Oxygen Therapy Guidelines 2021');
        }
      }
    }
    
    // === MEDICAL HISTORY ANALYSIS ===
    if (data.pastMedicalHistory) {
      const history = data.pastMedicalHistory.toLowerCase();
      
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
    if (data.allergies) {
      const allergies = data.allergies.toLowerCase();
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
    if (data.familyHistory) {
      const family = data.familyHistory.toLowerCase();
      
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
    if (data.medicationList) {
      const medications = data.medicationList.toLowerCase();
      
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
    
    // === LIFESTYLE FACTORS ===
    if (data.socialHistory) {
      const social = data.socialHistory.toLowerCase();
      if (social.includes('smoking') || social.includes('tobacco')) {
        score -= 15;
        factors.push('Tobacco Use');
      }
      if (social.includes('alcohol') || social.includes('drinking')) {
        score -= 8;
        factors.push('Alcohol Use');
      }
      if (social.includes('drug') || social.includes('substance')) {
        score -= 12;
        factors.push('Substance Use');
      }
    }
    
    // === EMERGENCY CONTACT ANALYSIS ===
    if (data.emergencyContact && data.emergencyContact.length > 0) {
      score += 5; // Positive factor for having emergency contact
      factors.push('Emergency Contact Available');
    }
    
    // === VOLUNTEER SUPPORT ===
    if (data.volunteerName && data.volunteerName.length > 0) {
      score += 3; // Positive factor for volunteer support
      factors.push('Volunteer Support Available');
    }
    
    const finalScore = Math.max(0, Math.min(100, score));
    
    console.log('📊 Evidence-Based Health Score Calculation Complete:', {
      finalScore,
      factors,
      deductions: 100 - finalScore,
      vitalsIncluded: !!vitals,
      medicalReferences: Array.from(new Set(medicalReferences)) // Remove duplicates
    });
    
    // Log medical references for transparency
    console.log('📚 Medical Literature References:', Array.from(new Set(medicalReferences)));
    
    return finalScore;
  };

  const generateRiskFactors = (data: any): string[] => {
    const factors: string[] = [];
    
    if (data.age > 65) factors.push('Advanced Age');
    if (data.age > 50) factors.push('Age-related Risk');
    
    if (data.pastMedicalHistory && data.pastMedicalHistory.length > 50) {
      factors.push('Complex Medical History');
    }
    
    if (data.allergies && data.allergies.length > 20) {
      factors.push('Multiple Allergies');
    }
    
    if (data.familyHistory) {
      if (data.familyHistory.toLowerCase().includes('diabetes')) factors.push('Family History of Diabetes');
      if (data.familyHistory.toLowerCase().includes('heart')) factors.push('Family History of Heart Disease');
      if (data.familyHistory.toLowerCase().includes('cancer')) factors.push('Family History of Cancer');
    }
    
    if (data.medicationList && data.medicationList.length > 30) {
      factors.push('Multiple Medications');
    }
    
    return factors;
  };

  const generateRecommendations = (data: any, score: number, factors: string[]): string[] => {
    const recs: string[] = [];
    
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
    
    if (factors.includes('Complex Medical History')) {
      recs.push('Coordinate care with multiple specialists');
      recs.push('Maintain detailed medical records');
    }
    
    // General recommendations
    recs.push('Maintain regular exercise routine');
    recs.push('Follow balanced diet with plenty of fruits and vegetables');
    recs.push('Get adequate sleep (7-9 hours per night)');
    recs.push('Manage stress through relaxation techniques');
    
    return recs;
  };

  const onSubmit = async (data: any) => {
    // Store form data and show consent form
    setFormData(data);
    setShowConsentForm(true);
  };

  const handleConsentGiven = (consent: any) => {
    setConsentData(consent);
    setShowConsentForm(false);
    // Now proceed with registration
    proceedWithRegistration();
  };

  const proceedWithRegistration = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setAiProcessing(false);

    try {
      const currentFormData = formData;
      // Generate unique patient ID if requested
      const uniqueId = currentFormData.useUniqueId ? 
        `HF-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}` : 
        null;
      
      console.log('Unique ID Generation:', {
        useUniqueId: currentFormData.useUniqueId,
        uniqueId: uniqueId,
        formData: currentFormData
      });

      // Transform form data to match Patient interface
      const patientData: Patient = {
        name: currentFormData.useUniqueId ? 
          `Patient ${uniqueId}` : 
          `${currentFormData.firstName} ${currentFormData.lastName}`,
        firstName: currentFormData.useUniqueId ? 'Anonymous' : currentFormData.firstName,
        lastName: currentFormData.useUniqueId ? 'Patient' : currentFormData.lastName,
        email: currentFormData.useUniqueId ? 
          `patient.${uniqueId}@healthfair.local` : 
          currentFormData.email,
        phoneNumber: currentFormData.useUniqueId ? 
          '000-000-0000' : 
          currentFormData.phoneNumber,
        age: currentFormData.age,
        gender: currentFormData.gender,
        bloodGroup: currentFormData.bloodGroup,
        address: currentFormData.useUniqueId ? 
          'Privacy Protected' : 
          currentFormData.address,
        pastMedicalHistory: currentFormData.pastMedicalHistory,
        allergies: currentFormData.allergies,
        familyHistory: currentFormData.familyHistory,
        medicationList: currentFormData.medicationList,
        emergencyContact: currentFormData.emergencyContact,
        consentData: consentData,
        // Volunteer information
        volunteerInfo: {
          name: currentFormData.volunteerName,
          organization: currentFormData.volunteerOrganization,
          role: currentFormData.volunteerRole,
          contact: currentFormData.volunteerContact,
        },
        // Privacy settings
        useUniqueId: currentFormData.useUniqueId,
        disclosePersonalInfo: currentFormData.disclosePersonalInfo,
        uniquePatientId: uniqueId || undefined,
      };

      // First, register the patient
      const response = await patientApi.create(patientData);
      if (response.success && response.data) {
        setSuccess(true);
        
        // Log successful registration with unique ID
        console.log('Patient Registration Successful:', {
          patientId: response.data.id,
          uniqueId: uniqueId,
          useUniqueId: currentFormData.useUniqueId,
          patientData: response.data
        });
        
        // Start AI processing
        setAiProcessing(true);
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calculate AI health score and recommendations
        const score = calculateAIHealthScore(currentFormData);
        const factors = generateRiskFactors(currentFormData);
        const recs = generateRecommendations(currentFormData, score, factors);
        
        setHealthScore(score);
        setRiskFactors(factors);
        setRecommendations(recs);
        
        setAiProcessing(false);
        onSuccess?.(response.data);
      } else {
        setError(response.message || 'Failed to register patient');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running.');
    } finally {
      setLoading(false);
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
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 }, px: { xs: 1, md: 0 } }}>
      <ExportActions
        contentRef={contentRef}
        fileName="AI_Enhanced_Patient_Registration"
        downloadLabel="📥 Save Registration PDF"
        printLabel="🖨️ Print Registration"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          align="center" 
          color="primary"
          sx={{ fontSize: { xs: '1.8rem', md: '2.125rem' } }}
        >
          🤖 AI-Enhanced Patient Registration
        </Typography>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          align="center" 
          sx={{ mb: 4, fontSize: { xs: '0.9rem', md: '1rem' } }}
        >
          Register and get instant AI-powered health assessment
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Patient registered successfully! 
            {formData?.useUniqueId && formData?.uniquePatientId && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  🆔 Unique Patient ID: {formData.uniquePatientId}
                </Typography>
              </Box>
            )}
            AI analysis in progress...
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
                Analyzing medical history, risk factors, and generating personalized recommendations...
              </Typography>
            </CardContent>
          </Card>
        )}

        {healthScore !== null && (
          <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Health Assessment Results
              </Typography>
              
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h3" color={`${getHealthScoreColor(healthScore)}.main`} sx={{ mr: 2 }}>
                  {healthScore}/100
                </Typography>
                <Box>
                  <Typography variant="h6">{getHealthScoreLabel(healthScore)}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Health Score
                  </Typography>
                </Box>
        </Box>

              {riskFactors.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle1" gutterBottom>Risk Factors Identified:</Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {riskFactors.map((factor, index) => (
                      <Chip key={index} label={factor} color="warning" size="small" />
                    ))}
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" gutterBottom>AI Recommendations:</Typography>
                <Box component="ul" sx={{ pl: 2 }}>
                  {recommendations.map((rec, index) => (
                    <Typography key={index} component="li" variant="body2" sx={{ mb: 0.5 }}>
                      {rec}
                    </Typography>
                  ))}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
              gap: 3 
            }}>
              <TextField
                fullWidth
                label="First Name *"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message as string}
                required
              />

              <TextField
                fullWidth
                label="Last Name *"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message as string}
                required
              />

              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message as string}
                required
              />

              <TextField
                fullWidth
                label="Phone Number"
                {...register('phoneNumber')}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message as string}
                required
              />

              <TextField
                fullWidth
                label="Age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                error={!!errors.age}
                helperText={errors.age?.message as string}
                required
              />
              <TextField
                fullWidth
                select
                label="Gender"
                {...register('gender')}
                error={!!errors.gender}
                helperText={errors.gender?.message as string}
                defaultValue="Male"
                required
              >
                {genders.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                select
                label="Blood Group"
                {...register('bloodGroup')}
                error={!!errors.bloodGroup}
                helperText={errors.bloodGroup?.message as string}
                defaultValue="A+"
                required
              >
                {bloodGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

          {/* Address Field - REQUIRED */}
          <TextField
            fullWidth
            label="Address *"
            {...register('address')}
            error={!!errors.address}
            helperText={errors.address?.message as string}
            required
            placeholder="Enter your complete address"
            multiline
            rows={2}
          />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Past Medical History"
              placeholder="Describe any previous medical conditions, surgeries, or treatments..."
              {...register('pastMedicalHistory')}
              error={!!errors.pastMedicalHistory}
              helperText={errors.pastMedicalHistory?.message as string}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Allergies"
              placeholder="List any known allergies (medications, food, environmental, etc.)..."
              {...register('allergies')}
              error={!!errors.allergies}
              helperText={errors.allergies?.message as string}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Family History"
              placeholder="Describe any hereditary conditions or family medical history..."
              {...register('familyHistory')}
              error={!!errors.familyHistory}
              helperText={errors.familyHistory?.message as string}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Current Medication List"
              placeholder="List all current medications, dosages, and frequency..."
              {...register('medicationList')}
              error={!!errors.medicationList}
              helperText={errors.medicationList?.message as string}
            />

          {/* Emergency Contact Field */}
          <TextField
            fullWidth
            label="Emergency Contact"
            placeholder="Emergency contact name and phone number"
            {...register('emergencyContact')}
            error={!!errors.emergencyContact}
            helperText={errors.emergencyContact?.message as string}
          />

          {/* Volunteer Information Section */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="h6" color="primary">
              👥 Volunteer Information (Optional)
            </Typography>
          </Divider>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 3 
          }}>
            <TextField
              fullWidth
              label="Volunteer Name"
              placeholder="Name of volunteer assisting"
              {...register('volunteerName')}
              error={!!errors.volunteerName}
              helperText={errors.volunteerName?.message as string}
            />
            <FormControl fullWidth>
              <InputLabel>Volunteer Organization</InputLabel>
              <Select
                {...register('volunteerOrganization')}
                defaultValue="Masjid Al-Rahma"
                error={!!errors.volunteerOrganization}
              >
                {getActiveOrganizations().map((org) => (
                  <MenuItem key={org.id} value={org.name}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {org.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {org.address} • {org.phone}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {errors.volunteerOrganization && (
                <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                  {errors.volunteerOrganization.message as string}
                </Typography>
              )}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Volunteer Role</InputLabel>
              <Select
                {...register('volunteerRole')}
                label="Volunteer Role"
                error={!!errors.volunteerRole}
                defaultValue="Health Fair Volunteer"
              >
                {volunteerRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Volunteer Contact"
              placeholder="Volunteer phone or email"
              {...register('volunteerContact')}
              error={!!errors.volunteerContact}
              helperText={errors.volunteerContact?.message as string}
            />
          </Box>

          {/* Privacy Options Section */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="h6" color="primary">
              🔒 Privacy & ID Options
            </Typography>
          </Divider>

          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  {...register('useUniqueId')}
                  color="primary"
                />
              }
              label="Use Unique Patient ID (for privacy - no personal info required)"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
              If checked, a unique ID will be assigned instead of using personal information
            </Typography>

            <FormControlLabel
              control={
                <Checkbox
                  {...register('disclosePersonalInfo')}
                  color="primary"
                  defaultChecked
                />
              }
              label="I consent to disclose personal information for medical screening"
            />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 1 }}>
              Required for comprehensive health assessment and follow-up care
            </Typography>
          </Box>

            <Box sx={{ mt: 4 }}>
              <Box display="flex" justifyContent="center">
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || aiProcessing}
                  startIcon={loading ? <CircularProgress size={20} /> : <HealthAndSafety />}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 200 },
                    py: 2,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  {loading ? 'Registering...' : aiProcessing ? 'AI Processing...' : '🤖 Register & Analyze'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
      </Box>

      {/* Patient Consent Form Dialog */}
      <Dialog
        open={showConsentForm}
        onClose={() => setShowConsentForm(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
            Patient Consent Required
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>📋 Legal Protection:</strong> Before proceeding with health screening, 
            you must provide informed consent to protect both you and our volunteer organization.
          </Alert>
          <PatientConsentForm 
            onConsentGiven={handleConsentGiven}
            patientData={formData}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConsentForm(false)}>
            Cancel Registration
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SimplePatientRegistration;