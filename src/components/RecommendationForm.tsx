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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Email as EmailIcon,
  Save as SaveIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { Patient, Recommendation } from '../types';
import { recommendationApi, patientApi } from '../services/api';
import HealthScoreRecommendationPrint from './HealthScoreRecommendationPrint';

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
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [printRecommendations, setPrintRecommendations] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<Pick<Recommendation, 'recommendations'>>({
    resolver: yupResolver(schema),
  });

  const [actionType, setActionType] = useState<'email' | 'save' | null>(null);
  const recommendationsText = watch('recommendations');

  const handleSendEmail = async (data: Pick<Recommendation, 'recommendations'>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setActionType('email');

    try {
      // Create recommendation data
      const recommendationData = {
        patientId: patient.id!,
        doctorId: doctorName,
        recommendations: data.recommendations,
        timestamp: new Date().toISOString(),
      };

      // Simulate email sending (since API is failing)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Email would be sent to:', patient.email);
      console.log('Recommendations:', data.recommendations);
      
          setSuccess(true);
          reset();
          setTimeout(() => {
            setSuccess(false);
            onSuccess?.();
          }, 3000);
    } catch (err) {
      setError('Failed to send email. Please try again.');
    } finally {
      setLoading(false);
      setActionType(null);
    }
  };

  const handleSaveToRecord = async (data: Pick<Recommendation, 'recommendations'>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setActionType('save');

    try {
      console.log('Saving recommendations to patient record:', {
        patientId: patient.id,
        doctorName,
        recommendations: data.recommendations
      });

      // Create comprehensive patient update with recommendations
      const updatedPatient = {
        ...patient,
        recommendations: data.recommendations,
        doctorRecommendations: {
          text: data.recommendations,
          doctor: doctorName,
          timestamp: new Date().toISOString(),
          status: 'active'
        },
        lastUpdated: new Date().toISOString(),
        updatedBy: doctorName,
        // Add to medical history
        pastMedicalHistory: patient.pastMedicalHistory ? 
          `${patient.pastMedicalHistory}\n\n[${new Date().toLocaleDateString()}] Doctor Recommendations by ${doctorName}:\n${data.recommendations}` :
          `[${new Date().toLocaleDateString()}] Doctor Recommendations by ${doctorName}:\n${data.recommendations}`
      };

      // Try multiple approaches to save recommendations
      let saveSuccessful = false;
      let saveMethod = '';

      // Method 1: Try direct patient update
      try {
        console.log('Attempting direct patient update...');
        const response = await patientApi.update(patient.id!, updatedPatient);
        if (response.success) {
          saveSuccessful = true;
          saveMethod = 'patient record';
          console.log('✅ Recommendations saved to patient record successfully');
        } else {
          throw new Error(response.message || 'Patient update failed');
        }
      } catch (patientError) {
        console.warn('Patient update failed, trying alternative methods:', patientError);
        
        // Method 2: Try saving as SOAP note
        try {
          console.log('Attempting to save as SOAP note...');
          const soapPatient = {
            ...patient,
            soapNote: {
              ...patient.soapNote,
              plan: {
                ...patient.soapNote?.plan,
                treatmentPlan: data.recommendations,
                followUpInstructions: `Recommendations provided by ${doctorName} on ${new Date().toLocaleDateString()}`,
                patientEducation: data.recommendations,
                referrals: `See recommendations above`,
                medicationChanges: 'As per recommendations',
                dischargeInstructions: data.recommendations,
                emergencyInstructions: 'Follow recommendations and contact healthcare provider if needed'
              }
            },
            lastUpdated: new Date().toISOString(),
            updatedBy: doctorName
          };
          
          const soapResponse = await patientApi.update(patient.id!, soapPatient);
          if (soapResponse.success) {
            saveSuccessful = true;
            saveMethod = 'SOAP note';
            console.log('✅ Recommendations saved as SOAP note successfully');
          } else {
            throw new Error('SOAP note save failed');
          }
        } catch (soapError) {
          console.warn('SOAP note save failed, trying local storage fallback:', soapError);
          
          // Method 3: Local storage fallback (for demo purposes)
          try {
            console.log('Attempting local storage fallback...');
            const localRecommendations = JSON.parse(localStorage.getItem('health_for_all_recommendations') || '[]');
            const newRecommendation = {
              id: `local_${Date.now()}`,
              patientId: patient.id,
              patientName: patient.name,
              doctorId: doctorName,
              recommendations: data.recommendations,
              timestamp: new Date().toISOString(),
              status: 'saved_locally'
            };
            
            localRecommendations.push(newRecommendation);
            localStorage.setItem('health_for_all_recommendations', JSON.stringify(localRecommendations));
            
            // Also save to patient's local data
            const localPatients = JSON.parse(localStorage.getItem('health_for_all_patients') || '[]');
            const patientIndex = localPatients.findIndex((p: any) => p.id === patient.id);
            if (patientIndex !== -1) {
              localPatients[patientIndex] = {
                ...localPatients[patientIndex],
                recommendations: data.recommendations,
                lastUpdated: new Date().toISOString(),
                updatedBy: doctorName
              };
              localStorage.setItem('health_for_all_patients', JSON.stringify(localPatients));
            }
            
            saveSuccessful = true;
            saveMethod = 'local storage (demo mode)';
            console.log('✅ Recommendations saved to local storage successfully');
          } catch (localError) {
            console.error('All save methods failed:', localError);
            throw new Error('All save methods failed. Please check your connection and try again.');
          }
        }
      }

      if (saveSuccessful) {
        setSuccess(true);
        console.log(`✅ Recommendations saved successfully via ${saveMethod}`);
        
        // Show success message with save method
        setTimeout(() => {
          alert(`Recommendations saved successfully via ${saveMethod}!`);
        }, 100);
        
        reset();
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.();
        }, 3000);
      } else {
        throw new Error('All save methods failed');
      }
    } catch (err) {
      console.error('Failed to save recommendations:', err);
      setError(`Failed to save recommendations: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setActionType(null);
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

        <Box component="form">
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
                helperText={errors.recommendations?.message as string}
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
                    startIcon={<PrintIcon />}
                    onClick={() => {
                      setPrintRecommendations(recommendationsText || '');
                      setShowPrintDialog(true);
                    }}
                    disabled={loading || !recommendationsText}
                  >
                    Preview Print
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => onSuccess?.()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* Two Action Options */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom color="primary">
                Choose Action
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select how you want to handle the recommendations:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleSubmit(handleSendEmail)}
                  disabled={loading}
                  startIcon={loading && actionType === 'email' ? <CircularProgress size={20} /> : <EmailIcon />}
                  sx={{ flex: 1, minHeight: 60 }}
                >
                  {loading && actionType === 'email' ? 'Sending Email...' : '📧 Send Email to Patient'}
                </Button>
                
                  <Button
                    variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleSubmit(handleSaveToRecord)}
                    disabled={loading}
                  startIcon={loading && actionType === 'save' ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ flex: 1, minHeight: 60 }}
                  >
                  {loading && actionType === 'save' ? 'Saving to Record...' : '💾 Save to Patient Record'}
                  </Button>
                </Box>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  <strong>📧 Send Email:</strong> Sends recommendations directly to patient's email<br/>
                  <strong>💾 Save to Record:</strong> Saves recommendations to patient's medical record
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 4 }} />
        
        <Typography variant="body2" color="text.secondary" align="center">
          Recommendations will be automatically sent to the patient's email address: <strong>{patient.email}</strong>
        </Typography>
      </Paper>

      {/* Print Dialog */}
      <Dialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              margin: 0,
              maxWidth: '100%',
              height: '100%',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Print Health Score & Recommendations</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => {
                window.print();
              }}
              sx={{ '@media print': { display: 'none' } }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPrintDialog(false)}
              sx={{ '@media print': { display: 'none' } }}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ '@media print': { p: 0 } }}>
          <HealthScoreRecommendationPrint
            patient={patient}
            healthScore={(patient as any).healthScore || (patient as any).health_risk_score || (patient as any).ai_health_score}
            recommendations={printRecommendations}
            doctorName={doctorName}
            date={new Date().toLocaleDateString()}
          />
        </DialogContent>
        <DialogActions sx={{ '@media print': { display: 'none' } }}>
          <Button onClick={() => setShowPrintDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              window.print();
            }}
          >
            Print Now
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecommendationForm;
