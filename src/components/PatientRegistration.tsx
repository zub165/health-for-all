import React from 'react';
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
} from '@mui/material';
import { Patient } from '../types';
import { patientApi } from '../services/api';

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

interface PatientRegistrationProps {
  onSuccess?: (patient: Patient) => void;
}

const PatientRegistration: React.FC<PatientRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Health for All Fair - Patient Registration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Please fill out the form below to register for your health screening
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Patient registered successfully! You can now proceed to the doctor for vitals check.
          </Alert>
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
                required
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
                required
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
                required
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
                required
              />
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
                  {loading ? 'Registering...' : 'Register Patient'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PatientRegistration;
