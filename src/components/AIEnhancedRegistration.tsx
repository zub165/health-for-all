import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import { aiService } from '../services/aiService';

// Form data type without optional fields
type PatientFormData = {
  name: string;
  email: string;
  phoneNumber: string;
  age: number;
  gender: string;
  bloodGroup: string;
  pastMedicalHistory: string;
  allergies: string;
  familyHistory: string;
  medicationList: string;
};

interface AIEnhancedRegistrationProps {
  onSuccess?: (patient: Patient, healthScore: number, riskFactors: string[]) => void;
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  age: yup.number().min(0).max(120).required('Age is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  pastMedicalHistory: yup.string().default(''),
  allergies: yup.string().default(''),
  familyHistory: yup.string().default(''),
  medicationList: yup.string().default(''),
});

const AIEnhancedRegistration: React.FC<AIEnhancedRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [riskFactors, setRiskFactors] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PatientFormData>({
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

  // AI Analysis when form data changes
  useEffect(() => {
    const analyzeWithAI = async () => {
      if (watchedValues.name && watchedValues.email && watchedValues.age > 0) {
        setAiAnalyzing(true);
        try {
          const patientData = {
            name: watchedValues.name,
            email: watchedValues.email,
            phoneNumber: watchedValues.phoneNumber,
            age: watchedValues.age,
            gender: watchedValues.gender,
            bloodGroup: watchedValues.bloodGroup,
            pastMedicalHistory: watchedValues.pastMedicalHistory,
            allergies: watchedValues.allergies,
            familyHistory: watchedValues.familyHistory,
            medicationList: watchedValues.medicationList,
          };

          const aiAnalysis = await aiService.autoFillFormFromPatientData(patientData);
          
          setHealthScore(aiAnalysis.healthScore);
          setRiskFactors(aiAnalysis.riskFactors);
          setSuggestions(aiAnalysis.suggestions);
          setRecommendations(aiAnalysis.recommendations);
        } catch (err) {
          console.warn('AI analysis failed:', err);
        } finally {
          setAiAnalyzing(false);
        }
      }
    };

    const timeoutId = setTimeout(analyzeWithAI, 1000); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedValues]);

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await patientApi.create(data);
      if (response.success && response.data) {
        setSuccess(true);
        reset();
        onSuccess?.(response.data, healthScore || 0, riskFactors);
        setTimeout(() => setSuccess(false), 3000);
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
    if (score >= 40) return 'Moderate';
    return 'Poor';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        🤖 AI-Enhanced Patient Registration
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        AI analyzes your data in real-time to provide health insights and recommendations
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Box>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📋 Basic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Full Name"
                      {...register('name')}
                      error={!!errors.name}
                      helperText={errors.name?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      {...register('email')}
                      error={!!errors.email}
                      helperText={errors.email?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      {...register('phoneNumber')}
                      error={!!errors.phoneNumber}
                      helperText={errors.phoneNumber?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      {...register('age')}
                      error={!!errors.age}
                      helperText={errors.age?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select {...register('gender')} label="Gender">
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ gridColumn: { xs: "span 12", sm: "span 6" } }}>
                    <FormControl fullWidth>
                      <InputLabel>Blood Group</InputLabel>
                      <Select {...register('bloodGroup')} label="Blood Group">
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Medical Information */}
          <Box sx={{ gridColumn: "span 12" }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🏥 Medical Information
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Past Medical History"
                      {...register('pastMedicalHistory')}
                      error={!!errors.pastMedicalHistory}
                      helperText={errors.pastMedicalHistory?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <TextField
                      fullWidth
                      label="Allergies"
                      {...register('allergies')}
                      error={!!errors.allergies}
                      helperText={errors.allergies?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Family History"
                      {...register('familyHistory')}
                      error={!!errors.familyHistory}
                      helperText={errors.familyHistory?.message as string}
                    />
                  </Box>
                  <Box sx={{ gridColumn: "span 12" }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Current Medications"
                      {...register('medicationList')}
                      error={!!errors.medicationList}
                      helperText={errors.medicationList?.message as string}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* AI Health Analysis */}
          {aiAnalyzing && (
            <Box sx={{ gridColumn: "span 12" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🤖 AI Health Analysis
                  </Typography>
                  <LinearProgress />
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Analyzing your health data...
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Health Score Display */}
          {healthScore !== null && !aiAnalyzing && (
            <Box sx={{ gridColumn: "span 12" }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    📊 AI Health Score
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h3" color={`${getHealthScoreColor(healthScore)}.main`}>
                      {healthScore}/100
                    </Typography>
                    <Chip
                      label={getHealthScoreLabel(healthScore)}
                      color={getHealthScoreColor(healthScore) as any}
                      size="medium"
                    />
                  </Box>
                  
                  {riskFactors.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ⚠️ Risk Factors Identified:
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {riskFactors.map((factor, index) => (
                          <Chip key={index} label={factor} color="warning" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {suggestions.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        💡 AI Suggestions:
                      </Typography>
                      <ul>
                        {suggestions.map((suggestion, index) => (
                          <li key={index}>
                            <Typography variant="body2">{suggestion}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}

                  {recommendations.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        🎯 AI Recommendations:
                      </Typography>
                      <ul>
                        {recommendations.map((recommendation, index) => (
                          <li key={index}>
                            <Typography variant="body2">{recommendation}</Typography>
                          </li>
                        ))}
                      </ul>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Submit Button */}
          <Box sx={{ gridColumn: "span 12" }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                size="medium"
                disabled={loading}
                sx={{ minWidth: 200 }}
              >
                {loading ? 'Registering...' : 'Register Patient'}
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Patient registered successfully! Health score: {healthScore}/100
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default AIEnhancedRegistration;
