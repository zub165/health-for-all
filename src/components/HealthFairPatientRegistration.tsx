import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  HealthAndSafety as HealthIcon,
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { healthFairAPI } from '../services/healthFairApi';

interface HealthFairPatientRegistrationProps {
  onSuccess?: (patient: any) => void;
  onClose?: () => void;
  isOpen?: boolean;
}

interface PatientFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  bloodGroup: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  pastMedicalHistory: string;
  allergies: string;
  familyHistory: string;
  currentMedications: string;
  insuranceProvider: string;
  volunteerName: string;
  volunteerOrganization: string;
  volunteerRole: string;
  volunteerContact: string;
}


const HealthFairPatientRegistration: React.FC<HealthFairPatientRegistrationProps> = ({
  onSuccess,
  onClose,
  isOpen = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
    watch
  } = useForm<PatientFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      age: 0,
      gender: '',
      bloodGroup: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      pastMedicalHistory: '',
      allergies: '',
      familyHistory: '',
      currentMedications: '',
      insuranceProvider: '',
      volunteerName: '',
      volunteerOrganization: 'Masjid Al-Rahma',
      volunteerRole: 'Health Fair Volunteer',
      volunteerContact: '(813) 381-3996'
    }
  });

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('🏥 Health Fair Registration: Submitting patient data...', data);

      // Prepare patient data for Health Fair API
      const patientData = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        date_of_birth: new Date(new Date().getFullYear() - data.age, 0, 1).toISOString().split('T')[0],
        gender: data.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say',
        address: data.address,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        medical_history: data.pastMedicalHistory ? [data.pastMedicalHistory] : [],
        allergies: data.allergies ? [data.allergies] : [],
        current_medications: data.currentMedications ? [data.currentMedications] : [],
        insurance_provider: data.insuranceProvider || ''
      };

      // Submit to Health Fair API
      const response = await healthFairAPI.registerPatient(patientData);

      if (response.success) {
        console.log('✅ Health Fair Registration: Patient registered successfully', response.data);
        setSuccess(true);
        reset();
        
        // Call success callback
        onSuccess?.(response.data);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 3000);
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (err) {
      console.error('❌ Health Fair Registration: Error registering patient', err);
      setError(err instanceof Error ? err.message : 'Failed to register patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError(null);
    setSuccess(false);
    onClose?.();
  };

  const formContent = (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <HealthIcon color="primary" sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" component="h2">
            Health Fair Patient Registration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register new patient for health assessment
          </Typography>
        </Box>
      </Box>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Patient registered successfully! Redirecting...
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          ❌ {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Registration Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        {/* Personal Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Personal Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="firstName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="First Name"
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="lastName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Last Name"
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Email"
                      type="email"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      error={!!errors.phone}
                      helperText={errors.phone?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Age"
                      type="number"
                      error={!!errors.age}
                      helperText={errors.age?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.gender}>
                      <InputLabel>Gender</InputLabel>
                      <Select {...field} label="Gender">
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                        <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Controller
                  name="bloodGroup"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.bloodGroup}>
                      <InputLabel>Blood Group</InputLabel>
                      <Select {...field} label="Blood Group">
                        <MenuItem value="A+">A+</MenuItem>
                        <MenuItem value="A-">A-</MenuItem>
                        <MenuItem value="B+">B+</MenuItem>
                        <MenuItem value="B-">B-</MenuItem>
                        <MenuItem value="AB+">AB+</MenuItem>
                        <MenuItem value="AB-">AB-</MenuItem>
                        <MenuItem value="O+">O+</MenuItem>
                        <MenuItem value="O-">O-</MenuItem>
                        <MenuItem value="unknown">Unknown</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Address"
                      multiline
                      rows={2}
                      error={!!errors.address}
                      helperText={errors.address?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <PhoneIcon sx={{ mr: 1 }} />
              Emergency Contact
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="emergencyContactName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Emergency Contact Name"
                      error={!!errors.emergencyContactName}
                      helperText={errors.emergencyContactName?.message}
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="emergencyContactPhone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Emergency Contact Phone"
                      error={!!errors.emergencyContactPhone}
                      helperText={errors.emergencyContactPhone?.message}
                    />
                  )}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Medical Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <HealthIcon sx={{ mr: 1 }} />
              Medical Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                <Controller
                  name="pastMedicalHistory"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Past Medical History"
                      multiline
                      rows={3}
                      placeholder="Previous illnesses, surgeries, chronic conditions..."
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Allergies"
                      multiline
                      rows={2}
                      placeholder="Food allergies, medication allergies, environmental allergies..."
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="familyHistory"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Family History"
                      multiline
                      rows={2}
                      placeholder="Family history of diseases, genetic conditions..."
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                <Controller
                  name="currentMedications"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Current Medications"
                      multiline
                      rows={2}
                      placeholder="Current medications, dosages, frequency..."
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                <Controller
                  name="insuranceProvider"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Insurance Provider"
                      placeholder="Insurance company name and policy number"
                    />
                  )}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Volunteer Information */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Volunteer Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="volunteerName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Volunteer Name"
                      placeholder="Name of assisting volunteer"
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="volunteerOrganization"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Volunteer Organization"
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="volunteerRole"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Volunteer Role"
                    />
                  )}
                />
              </Box>
              <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                <Controller
                  name="volunteerContact"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Volunteer Contact"
                    />
                  )}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            startIcon={<CancelIcon />}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Patient'}
          </Button>
        </Box>
      </Box>
    </Box>
  );

  // If used as a dialog
  if (isOpen) {
    return (
      <Dialog
        open={isOpen}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
        fullScreen
      >
        <DialogTitle>Health Fair Patient Registration</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {formContent}
        </DialogContent>
      </Dialog>
    );
  }

  // If used as a standalone component
  return formContent;
};

export default HealthFairPatientRegistration;
