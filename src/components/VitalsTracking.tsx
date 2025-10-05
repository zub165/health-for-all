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
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Vitals, Patient, MentalHealthAnswer } from '../types';
import { vitalsApi } from '../services/api';

const schema = yup.object({
  bloodSugar: yup.number().min(50).max(500).required('Blood sugar level is required'),
  carotidDoppler: yup.string().required('Carotid doppler result is required'),
});

const mentalHealthQuestions = [
  "Over the last 2 weeks, how often have you been bothered by little interest or pleasure in doing things?",
  "Over the last 2 weeks, how often have you been bothered by feeling down, depressed, or hopeless?",
  "Over the last 2 weeks, how often have you been bothered by trouble falling or staying asleep, or sleeping too much?",
  "Over the last 2 weeks, how often have you been bothered by feeling tired or having little energy?",
  "Over the last 2 weeks, how often have you been bothered by poor appetite or overeating?",
  "Over the last 2 weeks, how often have you been bothered by feeling bad about yourself or that you are a failure?",
  "Over the last 2 weeks, how often have you been bothered by trouble concentrating on things?",
  "Over the last 2 weeks, how often have you been bothered by moving or speaking so slowly that other people could have noticed?",
  "Over the last 2 weeks, how often have you been bothered by thoughts that you would be better off dead?",
];

const carotidDopplerOptions = [
  'Normal',
  'Mild stenosis (< 50%)',
  'Moderate stenosis (50-69%)',
  'Severe stenosis (70-99%)',
  'Occlusion (100%)',
];

interface VitalsTrackingProps {
  patient: Patient;
  doctorName: string;
  onSuccess?: (vitals: Vitals) => void;
}

const VitalsTracking: React.FC<VitalsTrackingProps> = ({ patient, doctorName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mentalHealthAnswers, setMentalHealthAnswers] = useState<MentalHealthAnswer[]>(
    mentalHealthQuestions.map(q => ({ question: q, answer: 0 }))
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<Pick<Vitals, 'bloodSugar' | 'carotidDoppler'>>({
    resolver: yupResolver(schema),
  });

  const handleMentalHealthChange = (questionIndex: number, answer: number) => {
    setMentalHealthAnswers(prev => 
      prev.map((item, index) => 
        index === questionIndex ? { ...item, answer } : item
      )
    );
  };

  const calculateMentalHealthScore = () => {
    return mentalHealthAnswers.reduce((sum, answer) => sum + answer.answer, 0);
  };

  const getMentalHealthSeverity = (score: number) => {
    if (score <= 4) return 'Minimal depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  };

  const onSubmit = async (data: Pick<Vitals, 'bloodSugar' | 'carotidDoppler'>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const mentalHealthScore = calculateMentalHealthScore();
      const vitalsData: Omit<Vitals, 'id'> = {
        patientId: patient.id!,
        bloodSugar: data.bloodSugar,
        carotidDoppler: data.carotidDoppler,
        mentalHealthScore,
        mentalHealthAnswers,
        recordedBy: doctorName,
        recordedAt: new Date().toISOString(),
      };

      const response = await vitalsApi.create(vitalsData);
      if (response.success && response.data) {
        setSuccess(true);
        reset();
        onSuccess?.(response.data);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to record vitals');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Vitals Recording - {patient.name}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Record patient vitals and conduct health screening
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Vitals recorded successfully! You can now send recommendations to the patient.
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Patient Information */}
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Patient Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Name:</strong> {patient.name}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Email:</strong> {patient.email}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Phone:</strong> {patient.phoneNumber}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Blood Group:</strong> {patient.bloodGroup}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Physical Vitals */}
            <Box>
              <Typography variant="h5" gutterBottom>Physical Vitals</Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Blood Sugar (mg/dL)"
                type="number"
                {...register('bloodSugar', { valueAsNumber: true })}
                error={!!errors.bloodSugar}
                helperText={errors.bloodSugar?.message}
                required
              />
            </Box>

            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                select
                label="Carotid Doppler Result"
                {...register('carotidDoppler')}
                error={!!errors.carotidDoppler}
                helperText={errors.carotidDoppler?.message}
                required
              >
                {carotidDopplerOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Mental Health Screening */}
            <Box>
              <Typography variant="h5" gutterBottom>Mental Health Screening (PHQ-9)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please answer the following questions based on the last 2 weeks
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>

            {mentalHealthQuestions.map((question, index) => (
              <Box key={index}>
                <FormControl component="fieldset" fullWidth>
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    {question}
                  </FormLabel>
                  <RadioGroup
                    row
                    value={mentalHealthAnswers[index].answer}
                    onChange={(e) => handleMentalHealthChange(index, parseInt(e.target.value))}
                  >
                    <FormControlLabel value={0} control={<Radio />} label="Not at all" />
                    <FormControlLabel value={1} control={<Radio />} label="Several days" />
                    <FormControlLabel value={2} control={<Radio />} label="More than half the days" />
                    <FormControlLabel value={3} control={<Radio />} label="Nearly every day" />
                  </RadioGroup>
                </FormControl>
              </Box>
            ))}

            {/* Mental Health Score Summary */}
            <Box>
              <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                <CardContent>
                  <Typography variant="h6">
                    Mental Health Score: {calculateMentalHealthScore()} / 27
                  </Typography>
                  <Typography variant="body1">
                    Severity: {getMentalHealthSeverity(calculateMentalHealthScore())}
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Recording...' : 'Record Vitals'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VitalsTracking;
