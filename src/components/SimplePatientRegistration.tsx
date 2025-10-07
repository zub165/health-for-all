import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
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
import { useHybridPatients } from '../hooks/useHybridStorage';
import SyncStatusIndicator from './SyncStatusIndicator';

const schema = yup.object({
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phoneNumber: yup.string().required('Phone number is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().oneOf(['male', 'female', 'other', 'prefer_not_to_say']).required('Gender is required'),
  address: yup.string().required('Address is required'),
  bloodGroup: yup.string().oneOf(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  pastMedicalHistory: yup.string().default(''),
  allergies: yup.string().default(''),
  familyHistory: yup.string().default(''),
  medicationList: yup.string().default(''),
});

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer not to say', value: 'prefer_not_to_say' }
];

interface SimplePatientRegistrationProps {
  onSuccess?: (patient: Patient) => void;
}

const SimplePatientRegistration: React.FC<SimplePatientRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Use hybrid storage for patient management
  const { createPatient, syncStatus } = useHybridPatients();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: 'male',
      address: '',
      bloodGroup: '',
      pastMedicalHistory: '',
      allergies: '',
      familyHistory: '',
      medicationList: '',
    },
  });

  // Watch form values to ensure controlled components
  const genderValue = useWatch({ control, name: 'gender' });
  const bloodGroupValue = useWatch({ control, name: 'bloodGroup' });

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Use hybrid storage - works offline and online
      const newPatient = await createPatient(data);
      setSuccess(true);
      reset();
      onSuccess?.(newPatient);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register patient');
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
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 2 }}>
          AI provides smart suggestions to help you fill the form faster
        </Typography>
        
        {/* Sync Status Indicator */}
        <Box display="flex" justifyContent="center" mb={3}>
          <SyncStatusIndicator compact />
        </Box>

        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              label="First Name *"
              {...register('firstName')}
              error={!!errors.firstName}
              helperText={errors.firstName?.message as string}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Last Name *"
              {...register('lastName')}
              error={!!errors.lastName}
              helperText={errors.lastName?.message as string}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email *"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message as string}
              sx={{ mb: 2 }}
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
              label="Date of Birth"
              type="date"
              InputLabelProps={{ shrink: true }}
              {...register('dateOfBirth')}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth?.message as string}
            />
            <TextField
              fullWidth
              select
              label="Gender"
              {...register('gender')}
              error={!!errors.gender}
              helperText={errors.gender?.message as string}
              value={genderValue || 'male'}
            >
              {genders.map((gender) => (
                <MenuItem key={gender.value} value={gender.value}>
                  {gender.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label="Address"
              {...register('address')}
              error={!!errors.address}
              helperText={errors.address?.message as string}
            />
            <TextField
              fullWidth
              select
              label="Blood Group (Optional)"
              {...register('bloodGroup')}
              error={!!errors.bloodGroup}
              helperText={errors.bloodGroup?.message as string}
              value={bloodGroupValue || ''}
            >
              <MenuItem value="">
                <em>Select Blood Group</em>
              </MenuItem>
              {bloodGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Past Medical History"
              {...register('pastMedicalHistory')}
              error={!!errors.pastMedicalHistory}
              helperText={errors.pastMedicalHistory?.message as string}
            />
            <TextField
              fullWidth
              label="Allergies"
              {...register('allergies')}
              error={!!errors.allergies}
              helperText={errors.allergies?.message as string}
            />
            <TextField
              fullWidth
              multiline
              rows={2}
              label="Family History"
              {...register('familyHistory')}
              error={!!errors.familyHistory}
              helperText={errors.familyHistory?.message as string}
            />
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

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ minWidth: '200px' }}
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

export default SimplePatientRegistration;
