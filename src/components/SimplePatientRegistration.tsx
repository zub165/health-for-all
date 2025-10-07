import React, { useState } from 'react';
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
} from '@mui/material';
import { Person, HealthAndSafety, Psychology, Assessment } from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  age: yup.number().min(1).max(120).required('Age is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  pastMedicalHistory: yup.string().default(''),
  allergies: yup.string().default(''),
  familyHistory: yup.string().default(''),
  medicationList: yup.string().default(''),
});

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

interface SimplePatientRegistrationProps {
  onSuccess?: (patient: Patient) => void;
}

const SimplePatientRegistration: React.FC<SimplePatientRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<any>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      age: 0,
      gender: 'Male',
      bloodGroup: 'A+',
      pastMedicalHistory: '',
      allergies: '',
      familyHistory: '',
      medicationList: '',
    },
  });

  const watchedValues = watch();

  const calculateAIHealthScore = (data: any): number => {
    let score = 100;
    
    // Age factor
    if (data.age > 65) score -= 15;
    else if (data.age > 50) score -= 10;
    else if (data.age > 35) score -= 5;
    
    // Medical history factor
    if (data.pastMedicalHistory && data.pastMedicalHistory.length > 50) {
      score -= 20;
    }
    
    // Allergies factor
    if (data.allergies && data.allergies.toLowerCase().includes('severe')) {
      score -= 15;
    } else if (data.allergies && data.allergies.length > 20) {
      score -= 10;
    }
    
    // Family history factor
    if (data.familyHistory && data.familyHistory.toLowerCase().includes('diabetes')) {
      score -= 10;
    }
    if (data.familyHistory && data.familyHistory.toLowerCase().includes('heart')) {
      score -= 10;
    }
    if (data.familyHistory && data.familyHistory.toLowerCase().includes('cancer')) {
      score -= 15;
    }
    
    // Medication factor
    if (data.medicationList && data.medicationList.length > 30) {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
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
    setLoading(true);
    setError(null);
    setSuccess(false);
    setAiProcessing(false);

    try {
      // First, register the patient
      const response = await patientApi.create(data);
      if (response.success && response.data) {
        setSuccess(true);
        
        // Start AI processing
        setAiProcessing(true);
        
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Calculate AI health score and recommendations
        const score = calculateAIHealthScore(data);
        const factors = generateRiskFactors(data);
        const recs = generateRecommendations(data, score, factors);
        
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          🤖 AI-Enhanced Patient Registration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Register and get instant AI-powered health assessment
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Patient registered successfully! AI analysis in progress...
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
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Full Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message as string}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message as string}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Phone Number"
                {...register('phoneNumber')}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber?.message as string}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                {...register('age', { valueAsNumber: true })}
                error={!!errors.age}
                helperText={errors.age?.message as string}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                select
                label="Gender"
                {...register('gender')}
                error={!!errors.gender}
                helperText={errors.gender?.message as string}
                required
              >
                {genders.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                select
                label="Blood Group"
                {...register('bloodGroup')}
                error={!!errors.bloodGroup}
                helperText={errors.bloodGroup?.message as string}
                required
              >
                {bloodGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box>
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
            </Box>

            <Box>
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
            </Box>

            <Box>
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
            </Box>

            <Box>
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
            </Box>

            <Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading || aiProcessing}
                  startIcon={loading ? <CircularProgress size={20} /> : <HealthAndSafety />}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Registering...' : aiProcessing ? 'AI Processing...' : '🤖 Register & Analyze'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SimplePatientRegistration;