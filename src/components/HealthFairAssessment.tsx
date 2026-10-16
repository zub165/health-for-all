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
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Assessment as AssessmentIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { healthFairAPI } from '../services/healthFairApi';
import ExportActions from './ExportActions';

const schema = yup.object({
  // Patient Information
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().required('Phone number is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  address: yup.string(),
  emergencyContactName: yup.string(),
  emergencyContactPhone: yup.string(),
  insuranceProvider: yup.string(),
  
  // Vitals
  bloodPressureSystolic: yup.number().min(50).max(300).required('Systolic BP is required'),
  bloodPressureDiastolic: yup.number().min(30).max(200).required('Diastolic BP is required'),
  heartRate: yup.number().min(30).max(200).required('Heart rate is required'),
  temperature: yup.number().min(95).max(110).required('Temperature is required'),
  weight: yup.number().min(20).max(500).required('Weight is required'),
  height: yup.number().min(30).max(300).required('Height is required'),
  bloodSugar: yup.number().min(50).max(500).required('Blood sugar is required'),
  oxygenSaturation: yup.number().min(70).max(100).required('Oxygen saturation is required'),
  respiratoryRate: yup.number().min(8).max(40).required('Respiratory rate is required'),
  painLevel: yup.number().min(0).max(10).required('Pain level is required'),
  notes: yup.string(),
});

interface HealthFairAssessmentProps {
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
}

const HealthFairAssessment: React.FC<HealthFairAssessmentProps> = ({ onSuccess, onCancel }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<any>({
    resolver: yupResolver(schema),
  });

  const watchedValues = watch();

  const steps = [
    'Patient Information',
    'Medical History',
    'Vitals Assessment',
    'Review & Submit'
  ];

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    setProgress(0);

    try {
      console.log('Health Fair Assessment: Starting submission...', data);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await healthFairAPI.submitHealthAssessment(data);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (response.success) {
        setSuccess(true);
        setResult(response.data);
        reset();
        setTimeout(() => {
          setSuccess(false);
          onSuccess?.(response.data);
        }, 5000);
      } else {
        setError(response.error || 'Health assessment failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Patient Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="First Name *"
                {...register('firstName')}
                error={!!errors.firstName}
                helperText={errors.firstName?.message as string}
              />
              <TextField
                fullWidth
                label="Last Name *"
                {...register('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName?.message as string}
              />
              <TextField
                fullWidth
                label="Email *"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message as string}
              />
              <TextField
                fullWidth
                label="Phone *"
                {...register('phone')}
                error={!!errors.phone}
                helperText={errors.phone?.message as string}
              />
              <TextField
                fullWidth
                label="Date of Birth *"
                type="date"
                InputLabelProps={{ shrink: true }}
                {...register('dateOfBirth')}
                error={!!errors.dateOfBirth}
                helperText={errors.dateOfBirth?.message as string}
              />
              <FormControl fullWidth error={!!errors.gender}>
                <InputLabel>Gender *</InputLabel>
                <Select
                  {...register('gender')}
                  label="Gender *"
                >
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                  <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Address"
                  multiline
                  rows={2}
                  {...register('address')}
                />
              </Box>
              <TextField
                fullWidth
                label="Emergency Contact Name"
                {...register('emergencyContactName')}
              />
              <TextField
                fullWidth
                label="Emergency Contact Phone"
                {...register('emergencyContactPhone')}
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Insurance Provider"
                  {...register('insuranceProvider')}
                />
              </Box>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <HealthIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Medical History
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Autocomplete
                multiple
                freeSolo
                options={['Diabetes', 'Hypertension', 'Heart Disease', 'Cancer', 'Asthma', 'Depression', 'Anxiety']}
                value={watchedValues.medicalHistory || []}
                onChange={(event, newValue) => setValue('medicalHistory', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Medical History"
                    placeholder="Add medical conditions..."
                  />
                )}
              />
              <Autocomplete
                multiple
                freeSolo
                options={['Metformin', 'Lisinopril', 'Aspirin', 'Insulin', 'Atorvastatin']}
                value={watchedValues.currentMedications || []}
                onChange={(event, newValue) => setValue('currentMedications', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Current Medications"
                    placeholder="Add medications..."
                  />
                )}
              />
              <Autocomplete
                multiple
                freeSolo
                options={['Penicillin', 'Shellfish', 'Nuts', 'Latex', 'Dust']}
                value={watchedValues.allergies || []}
                onChange={(event, newValue) => setValue('allergies', newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Allergies"
                    placeholder="Add allergies..."
                  />
                )}
              />
            </Box>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Vitals Assessment
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
              <TextField
                fullWidth
                label="Systolic BP (mmHg) *"
                type="number"
                {...register('bloodPressureSystolic', { valueAsNumber: true })}
                error={!!errors.bloodPressureSystolic}
                helperText={errors.bloodPressureSystolic?.message as string}
              />
              <TextField
                fullWidth
                label="Diastolic BP (mmHg) *"
                type="number"
                {...register('bloodPressureDiastolic', { valueAsNumber: true })}
                error={!!errors.bloodPressureDiastolic}
                helperText={errors.bloodPressureDiastolic?.message as string}
              />
              <TextField
                fullWidth
                label="Heart Rate (BPM) *"
                type="number"
                {...register('heartRate', { valueAsNumber: true })}
                error={!!errors.heartRate}
                helperText={errors.heartRate?.message as string}
              />
              <TextField
                fullWidth
                label="Temperature (°F) *"
                type="number"
                {...register('temperature', { valueAsNumber: true })}
                error={!!errors.temperature}
                helperText={errors.temperature?.message as string}
              />
              <TextField
                fullWidth
                label="Weight (kg) *"
                type="number"
                {...register('weight', { valueAsNumber: true })}
                error={!!errors.weight}
                helperText={errors.weight?.message as string}
              />
              <TextField
                fullWidth
                label="Height (cm) *"
                type="number"
                {...register('height', { valueAsNumber: true })}
                error={!!errors.height}
                helperText={errors.height?.message as string}
              />
              <TextField
                fullWidth
                label="Blood Sugar (mg/dL) *"
                type="number"
                {...register('bloodSugar', { valueAsNumber: true })}
                error={!!errors.bloodSugar}
                helperText={errors.bloodSugar?.message as string}
              />
              <TextField
                fullWidth
                label="Oxygen Saturation (%) *"
                type="number"
                {...register('oxygenSaturation', { valueAsNumber: true })}
                error={!!errors.oxygenSaturation}
                helperText={errors.oxygenSaturation?.message as string}
              />
              <TextField
                fullWidth
                label="Respiratory Rate (breaths/min) *"
                type="number"
                {...register('respiratoryRate', { valueAsNumber: true })}
                error={!!errors.respiratoryRate}
                helperText={errors.respiratoryRate?.message as string}
              />
              <TextField
                fullWidth
                label="Pain Level (0-10) *"
                type="number"
                {...register('painLevel', { valueAsNumber: true })}
                error={!!errors.painLevel}
                helperText={errors.painLevel?.message as string}
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  multiline
                  rows={3}
                  {...register('notes')}
                />
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              <CheckCircleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Review & Submit
            </Typography>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Patient Information</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography><strong>Name:</strong> {watchedValues.firstName} {watchedValues.lastName}</Typography>
                  <Typography><strong>Email:</strong> {watchedValues.email}</Typography>
                  <Typography><strong>Phone:</strong> {watchedValues.phone}</Typography>
                  <Typography><strong>Date of Birth:</strong> {watchedValues.dateOfBirth}</Typography>
                  <Typography><strong>Gender:</strong> {watchedValues.gender}</Typography>
                  {watchedValues.address && <Typography><strong>Address:</strong> {watchedValues.address}</Typography>}
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Medical History</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography><strong>Medical History:</strong> {watchedValues.medicalHistory?.join(', ') || 'None'}</Typography>
                  <Typography><strong>Medications:</strong> {watchedValues.currentMedications?.join(', ') || 'None'}</Typography>
                  <Typography><strong>Allergies:</strong> {watchedValues.allergies?.join(', ') || 'None'}</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Vitals</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'grid', gap: 1 }}>
                  <Typography><strong>Blood Pressure:</strong> {watchedValues.bloodPressureSystolic}/{watchedValues.bloodPressureDiastolic} mmHg</Typography>
                  <Typography><strong>Heart Rate:</strong> {watchedValues.heartRate} BPM</Typography>
                  <Typography><strong>Temperature:</strong> {watchedValues.temperature}°F</Typography>
                  <Typography><strong>Weight:</strong> {watchedValues.weight} kg</Typography>
                  <Typography><strong>Height:</strong> {watchedValues.height} cm</Typography>
                  <Typography><strong>Blood Sugar:</strong> {watchedValues.bloodSugar} mg/dL</Typography>
                  <Typography><strong>Oxygen Saturation:</strong> {watchedValues.oxygenSaturation}%</Typography>
                  <Typography><strong>Respiratory Rate:</strong> {watchedValues.respiratoryRate} breaths/min</Typography>
                  <Typography><strong>Pain Level:</strong> {watchedValues.painLevel}/10</Typography>
                </Box>
              </AccordionDetails>
            </Accordion>

            {watchedValues.notes && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle1">Additional Notes</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography>{watchedValues.notes}</Typography>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Health_Fair_Assessment"
        downloadLabel="📥 Save Assessment PDF"
        printLabel="🖨️ Print Assessment"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Health Fair Assessment
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Complete health screening with AI-powered analysis
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <ErrorIcon sx={{ mr: 1 }} />
            {error}
          </Alert>
        )}

        {success && result && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            <Typography variant="h6" gutterBottom>
              Health Assessment Complete!
            </Typography>
            <Typography variant="body2">
              <strong>Patient ID:</strong> {result.patientId}
            </Typography>
            <Typography variant="body2">
              <strong>Vitals ID:</strong> {result.vitalsId}
            </Typography>
            {result.aiAnalysis && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Risk Level:</strong> {result.aiAnalysis.risk_level}
                </Typography>
                <Typography variant="body2">
                  <strong>Recommendations:</strong> {result.aiAnalysis.recommendations?.join(', ')}
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Processing health assessment... {progress}%
            </Typography>
          </Box>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
              {getStepContent(activeStep)}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            
            <Box>
              {activeStep === steps.length - 1 ? (
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  size="large"
                >
                  {loading ? 'Submitting...' : 'Submit Health Assessment'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Next
                </Button>
              )}
            </Box>
          </Box>

          {onCancel && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button onClick={onCancel} variant="text">
                Cancel Assessment
              </Button>
            </Box>
          )}
        </Box>
      </Paper>
      </Box>
    </Container>
  );
};

export default HealthFairAssessment;
