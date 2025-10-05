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
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import { Patient, Recommendation } from '../types';
import { recommendationApi } from '../services/api';

const schema = yup.object({
  recommendations: yup.string().required('Recommendations are required'),
});

interface RecommendationFormProps {
  patient: Patient;
  doctorName: string;
  onSuccess?: () => void;
}

const RecommendationForm: React.FC<RecommendationFormProps> = ({ 
  patient, 
  doctorName, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Pick<Recommendation, 'recommendations'>>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: Pick<Recommendation, 'recommendations'>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const recommendationData: Omit<Recommendation, 'id'> = {
        patientId: patient.id!,
        doctorId: doctorName, // Using doctor name as ID for simplicity
        recommendations: data.recommendations,
      };

      const response = await recommendationApi.create(recommendationData);
      if (response.success && response.data) {
        // Send email with recommendations
        const emailResponse = await recommendationApi.sendEmail(response.data.id!);
        if (emailResponse.success) {
          setSuccess(true);
          reset();
          setTimeout(() => {
            setSuccess(false);
            onSuccess?.();
          }, 3000);
        } else {
          setError('Recommendations saved but failed to send email. Please try again.');
        }
      } else {
        setError(response.message || 'Failed to save recommendations');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = () => {
    const template = `
Based on your health screening results, here are my recommendations:

1. **Follow-up Care:**
   - Schedule a follow-up appointment with your primary care physician within 2-4 weeks
   - Consider consulting with specialists if any abnormal results were found

2. **Lifestyle Modifications:**
   - Maintain a balanced diet rich in fruits, vegetables, and whole grains
   - Engage in regular physical activity (at least 150 minutes of moderate exercise per week)
   - Ensure adequate sleep (7-9 hours per night)
   - Manage stress through relaxation techniques

3. **Monitoring:**
   - Continue monitoring your health parameters as discussed
   - Keep track of any symptoms or changes in your condition
   - Follow up on any recommended tests or screenings

4. **Medication Management:**
   - Continue taking prescribed medications as directed
   - Report any side effects or concerns to your healthcare provider
   - Keep an updated list of all medications

5. **Emergency Contacts:**
   - Contact your healthcare provider immediately if you experience any concerning symptoms
   - In case of emergency, call emergency services or visit the nearest emergency room

Please feel free to contact me if you have any questions about these recommendations.

Best regards,
Dr. ${doctorName}
Health for All Fair
    `.trim();

    return template;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Health Recommendations
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Create personalized health recommendations for {patient.name}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Recommendations have been saved and sent to {patient.email} successfully!
          </Alert>
        )}

        {/* Patient Summary */}
        <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Patient Summary</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2"><strong>Name:</strong> {patient.name}</Typography>
                <Typography variant="body2"><strong>Email:</strong> {patient.email}</Typography>
                <Typography variant="body2"><strong>Phone:</strong> {patient.phoneNumber}</Typography>
              </Box>
              <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                <Typography variant="body2"><strong>Blood Group:</strong> {patient.bloodGroup}</Typography>
                <Typography variant="body2"><strong>Allergies:</strong> {patient.allergies}</Typography>
                <Typography variant="body2"><strong>Current Medications:</strong> {patient.medicationList}</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Typography variant="h6" gutterBottom>
                Personalized Recommendations
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Provide detailed health recommendations based on the patient's screening results and medical history.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={15}
                label="Health Recommendations"
                placeholder="Enter detailed health recommendations..."
                {...register('recommendations')}
                error={!!errors.recommendations}
                helperText={errors.recommendations?.message}
                required
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Button
                  variant="outlined"
                  onClick={() => {
                    const template = generateRecommendations();
                    // Set the template in the form
                    const textarea = document.querySelector('textarea[name="recommendations"]') as HTMLTextAreaElement;
                    if (textarea) {
                      textarea.value = template;
                    }
                  }}
                >
                  Use Template
                </Button>
                
                <Box display="flex" gap={2}>
                  <Button
                    variant="outlined"
                    onClick={() => onSuccess?.()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{ minWidth: 200 }}
                  >
                    {loading ? 'Sending...' : 'Send Recommendations'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          Recommendations will be automatically sent to the patient's email address: <strong>{patient.email}</strong>
        </Typography>
      </Paper>
    </Container>
  );
};

export default RecommendationForm;
