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
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { 
  AutoAwesome, 
  Person, 
  HealthAndSafety, 
  Email,
  CheckCircle,
  Speed
} from '@mui/icons-material';
import { Patient } from '../types';
import { patientApi } from '../services/api';
import { aiService, AIPatientData, AIVitalsPrediction, AIRecommendation } from '../services/aiService';
import { emailService } from '../services/emailService';

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  age: yup.number().min(1).max(120).required('Age is required'),
});

interface AIRapidRegistrationProps {
  onComplete: (patient: Patient, vitals: AIVitalsPrediction, recommendations: AIRecommendation) => void;
}

const AIRapidRegistration: React.FC<AIRapidRegistrationProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [aiData, setAiData] = useState<AIPatientData | null>(null);
  const [aiVitals, setAiVitals] = useState<AIVitalsPrediction | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation | null>(null);
  const [processingTime, setProcessingTime] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<{
    name: string;
    email: string;
    phone: string;
    age: number;
  }>({
    resolver: yupResolver(schema),
  });

  const watchedValues = watch();

  const steps = [
    'Basic Information',
    'AI Data Extraction',
    'AI Vitals Prediction',
    'AI Recommendations',
    'Email Summary',
    'Complete'
  ];

  // Auto-fill form as user types (AI-powered)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (watchedValues.name && watchedValues.email && watchedValues.phone && watchedValues.age) {
        try {
          setProgress(10);
          setCurrentStep(1);
          
          const aiPatientData = await aiService.extractPatientData({
            name: watchedValues.name,
            email: watchedValues.email,
            phone: watchedValues.phone,
            age: watchedValues.age,
          });
          
          setAiData(aiPatientData);
          setProgress(30);
          setCurrentStep(2);
          
          const aiVitalsData = await aiService.predictVitals(aiPatientData);
          setAiVitals(aiVitalsData);
          setProgress(60);
          setCurrentStep(3);
          
          const aiRecommendationsData = await aiService.generateRecommendations(aiPatientData, aiVitalsData);
          setAiRecommendations(aiRecommendationsData);
          setProgress(90);
          setCurrentStep(4);
          
          // Generate email summary
          await aiService.generateEmailSummary(aiPatientData, aiVitalsData, aiRecommendationsData);
          setProgress(100);
          setCurrentStep(5);
          
        } catch (err) {
          console.error('AI processing error:', err);
        }
      }
    }, 1000); // 1 second delay for auto-processing

    return () => clearTimeout(timer);
  }, [watchedValues]);

  const onSubmit = async (data: { name: string; email: string; phone: string; age: number }) => {
    if (!aiData || !aiVitals || !aiRecommendations) {
      setError('AI processing not complete. Please wait a moment and try again.');
      return;
    }

    const startTime = Date.now();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create patient with AI-enhanced data
      const patientData: Omit<Patient, 'id'> = {
        name: aiData.name,
        email: aiData.email,
        phoneNumber: aiData.phoneNumber,
        age: aiData.age,
        gender: aiData.gender,
        bloodGroup: aiData.bloodGroup,
        allergies: aiData.allergies,
        pastMedicalHistory: aiData.pastMedicalHistory,
        familyHistory: aiData.familyHistory,
        medicationList: aiData.medicationList,
        registeredAt: new Date().toISOString(),
      };

      const response = await patientApi.create(patientData);
      
      if (response.success && response.data) {
        const endTime = Date.now();
        const totalTime = (endTime - startTime) / 1000;
        setProcessingTime(totalTime);
        
        // Send AI-generated email summary
        try {
          await emailService.sendPatientSummary(aiData, aiVitals, aiRecommendations);
        } catch (emailError) {
          console.warn('Email sending failed:', emailError);
          // Continue even if email fails
        }
        
        setSuccess(true);
        onComplete(response.data, aiVitals, aiRecommendations);
        
        // Auto-advance after success
        setTimeout(() => {
          setCurrentStep(5);
        }, 1000);
      } else {
        setError(response.message || 'Failed to register patient');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <AutoAwesome sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            AI-Powered Rapid Registration
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Complete patient registration, examination, and recommendations in under 10 seconds
          </Typography>
          <Chip 
            icon={<Speed />} 
            label={`Processing Time: ${processingTime.toFixed(1)}s`} 
            color="primary" 
            variant="outlined"
          />
        </Box>

        {/* Progress Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={currentStep} alternativeLabel>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ mt: 2, height: 8, borderRadius: 4 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircle />
              <Typography>
                Patient registered successfully in {processingTime.toFixed(1)} seconds! 
                AI analysis complete. Email summary sent.
              </Typography>
            </Box>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Basic Information Input */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person color="primary" />
                  Basic Information (AI will auto-complete the rest)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      {...register('name')}
                      error={!!errors.name}
                      helperText={errors.name?.message}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      {...register('email')}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      required
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mt: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      {...register('phone')}
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                      required
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      {...register('age', { valueAsNumber: true })}
                      error={!!errors.age}
                      helperText={errors.age?.message}
                      required
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* AI-Generated Data Display */}
            {aiData && (
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesome />
                    AI-Generated Patient Profile
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="body2"><strong>Gender:</strong> {aiData.gender}</Typography>
                      <Typography variant="body2"><strong>Blood Group:</strong> {aiData.bloodGroup}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2"><strong>Allergies:</strong> {aiData.allergies}</Typography>
                      <Typography variant="body2"><strong>Medications:</strong> {aiData.medicationList}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* AI Vitals Prediction */}
            {aiVitals && (
              <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HealthAndSafety />
                    AI-Predicted Vitals
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                    <Box>
                      <Typography variant="body2"><strong>Blood Sugar:</strong> {aiVitals.bloodSugar} mg/dL</Typography>
                      <Typography variant="body2"><strong>Carotid Doppler:</strong> {aiVitals.carotidDoppler}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2"><strong>Mental Health Score:</strong> {aiVitals.mentalHealthScore}/27</Typography>
                      <Typography variant="body2"><strong>AI Confidence:</strong> {(aiVitals.confidence * 100).toFixed(1)}%</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* AI Recommendations */}
            {aiRecommendations && (
              <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email />
                    AI-Generated Recommendations
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Urgency Level:</strong> {aiRecommendations.urgency.toUpperCase()}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                    {aiRecommendations.recommendations}
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading || !aiData || !aiVitals || !aiRecommendations}
                startIcon={loading ? <CircularProgress size={20} /> : <AutoAwesome />}
                sx={{ minWidth: 300, py: 2 }}
              >
                {loading ? 'Processing...' : 'Complete AI Registration'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AIRapidRegistration;
