import React, { useState, useEffect } from 'react';
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
  Chip,
  LinearProgress,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import { aiService } from '../services/aiService';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  age: yup.number().min(1).max(120).required('Age is required'),
  gender: yup.string().required('Gender is required'),
  bloodGroup: yup.string().required('Blood group is required'),
  pastMedicalHistory: yup.string(),
  allergies: yup.string(),
  familyHistory: yup.string(),
  medicationList: yup.string(),
});

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

interface EnhancedPatientRegistrationProps {
  onSuccess?: (patient: Patient) => void;
}

const EnhancedPatientRegistration: React.FC<EnhancedPatientRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<{
    medicalHistory: string[];
    allergies: string[];
    familyHistory: string[];
    medications: string[];
  }>({
    medicalHistory: [],
    allergies: [],
    familyHistory: [],
    medications: [],
  });
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
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

  // AI-powered suggestions based on age and gender
  useEffect(() => {
    const generateAISuggestions = async () => {
      if (watchedValues.age > 0 && watchedValues.gender) {
        setAiAnalyzing(true);
        try {
          // Simulate AI analysis based on age and gender
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const suggestions = {
            medicalHistory: getMedicalHistorySuggestions(watchedValues.age, watchedValues.gender),
            allergies: getCommonAllergies(),
            familyHistory: getFamilyHistorySuggestions(),
            medications: getMedicationSuggestions(watchedValues.age),
          };
          
          setAiSuggestions(suggestions);
        } catch (err) {
          console.warn('AI suggestions failed:', err);
        } finally {
          setAiAnalyzing(false);
        }
      }
    };

    const timeoutId = setTimeout(generateAISuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [watchedValues.age, watchedValues.gender]);

  const getMedicalHistorySuggestions = (age: number, gender: string): string[] => {
    const suggestions = ['None'];
    
    if (age > 50) {
      suggestions.push('Hypertension', 'High Cholesterol', 'Diabetes');
    }
    if (age > 65) {
      suggestions.push('Heart Disease', 'Arthritis');
    }
    if (gender === 'Female' && age > 40) {
      suggestions.push('Thyroid Disorder');
    }
    
    return suggestions;
  };

  const getCommonAllergies = (): string[] => {
    return ['None', 'Penicillin', 'Sulfa', 'Aspirin', 'Latex', 'Shellfish', 'Peanuts'];
  };

  const getFamilyHistorySuggestions = (): string[] => {
    return ['None', 'Diabetes', 'Heart Disease', 'Cancer', 'High Blood Pressure', 'Stroke'];
  };

  const getMedicationSuggestions = (age: number): string[] => {
    const suggestions = ['None'];
    
    if (age > 50) {
      suggestions.push('Metformin', 'Lisinopril', 'Atorvastatin');
    }
    if (age > 40) {
      suggestions.push('Omeprazole', 'Levothyroxine');
    }
    
    return suggestions;
  };

  const applyAISuggestion = (field: keyof Omit<Patient, 'id'>, suggestion: string) => {
    setValue(field, suggestion);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await patientApi.create(data);
      if (response.success && response.data) {
        setSuccess(true);
        reset();
        onSuccess?.(response.data);
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

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          🤖 AI-Enhanced Patient Registration
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          AI provides smart suggestions to help you fill the form faster
        </Typography>

        {aiAnalyzing && (
          <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">
                  🤖 AI is analyzing your information to provide smart suggestions...
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          {/* Basic Information */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            📋 Basic Information
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="Full Name"
              {...register('name')}
              error={!!errors.name}
              helperText={errors.name?.message as string}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message as string}
            />
            <TextField
              fullWidth
              label="Phone Number"
              {...register('phoneNumber')}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber?.message as string}
            />
            <TextField
              fullWidth
              label="Age"
              type="number"
              {...register('age')}
              error={!!errors.age}
              helperText={errors.age?.message as string}
            />
            <FormControl fullWidth error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select {...register('gender')} label="Gender">
                {genders.map((gender) => (
                  <MenuItem key={gender} value={gender}>
                    {gender}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth error={!!errors.bloodGroup}>
              <InputLabel>Blood Group</InputLabel>
              <Select {...register('bloodGroup')} label="Blood Group">
                {bloodGroups.map((group) => (
                  <MenuItem key={group} value={group}>
                    {group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Medical Information with AI Suggestions */}
          <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2 }}>
            🏥 Medical Information
          </Typography>

          {/* Past Medical History with AI Suggestions */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Past Medical History"
              {...register('pastMedicalHistory')}
              error={!!errors.pastMedicalHistory}
              helperText={errors.pastMedicalHistory?.message as string}
            />
            {aiSuggestions.medicalHistory.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🤖 AI Suggestions based on age and gender:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {aiSuggestions.medicalHistory.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      clickable
                      onClick={() => applyAISuggestion('pastMedicalHistory', suggestion)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Allergies with AI Suggestions */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Allergies"
              {...register('allergies')}
              error={!!errors.allergies}
              helperText={errors.allergies?.message as string}
            />
            {aiSuggestions.allergies.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🤖 Common allergies:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {aiSuggestions.allergies.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      clickable
                      onClick={() => applyAISuggestion('allergies', suggestion)}
                      color="secondary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Family History with AI Suggestions */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Family History"
              {...register('familyHistory')}
              error={!!errors.familyHistory}
              helperText={errors.familyHistory?.message as string}
            />
            {aiSuggestions.familyHistory.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🤖 Common family history conditions:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {aiSuggestions.familyHistory.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      clickable
                      onClick={() => applyAISuggestion('familyHistory', suggestion)}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Current Medications with AI Suggestions */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Current Medications"
              {...register('medicationList')}
              error={!!errors.medicationList}
              helperText={errors.medicationList?.message as string}
            />
            {aiSuggestions.medications.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  🤖 Common medications for your age group:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {aiSuggestions.medications.map((suggestion, index) => (
                    <Chip
                      key={index}
                      label={suggestion}
                      size="small"
                      clickable
                      onClick={() => applyAISuggestion('medicationList', suggestion)}
                      color="info"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Submit Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: 200 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Registering...
                </Box>
              ) : (
                'Register Patient'
              )}
            </Button>
          </Box>

          {/* Status Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Patient registered successfully! Data saved to Django backend.
            </Alert>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default EnhancedPatientRegistration;
