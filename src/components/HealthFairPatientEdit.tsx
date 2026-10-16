import React, { useState, useEffect } from 'react';
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
  Divider,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  HealthAndSafety as HealthIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { healthFairAPI } from '../services/healthFairApi';

interface HealthFairPatientEditProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPatient: any) => void;
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

const HealthFairPatientEdit: React.FC<HealthFairPatientEditProps> = ({
  patient,
  isOpen,
  onClose,
  onSuccess
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

  // Populate form when patient data changes
  useEffect(() => {
    if (patient && isOpen) {
      console.log('📝 Health Fair Edit: Loading patient data', patient);
      
      // Calculate age from date of birth or use existing age
      let age = 0;
      if (patient.date_of_birth) {
        const birthDate = new Date(patient.date_of_birth);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
      } else if (patient.age) {
        age = patient.age;
      }

      reset({
        firstName: patient.first_name || patient.firstName || '',
        lastName: patient.last_name || patient.lastName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        age: age,
        gender: patient.gender || '',
        bloodGroup: patient.blood_group || patient.bloodGroup || '',
        address: patient.address || '',
        emergencyContactName: patient.emergency_contact_name || patient.emergencyContactName || '',
        emergencyContactPhone: patient.emergency_contact_phone || patient.emergencyContactPhone || '',
        pastMedicalHistory: Array.isArray(patient.medical_history) 
          ? patient.medical_history.join(', ') 
          : patient.medical_history || patient.pastMedicalHistory || '',
        allergies: Array.isArray(patient.allergies) 
          ? patient.allergies.join(', ') 
          : patient.allergies || '',
        familyHistory: patient.family_history || patient.familyHistory || '',
        currentMedications: Array.isArray(patient.current_medications) 
          ? patient.current_medications.join(', ') 
          : patient.current_medications || patient.currentMedications || '',
        insuranceProvider: patient.insurance_provider || patient.insuranceProvider || '',
        volunteerName: patient.volunteer_info?.name || patient.volunteerName || '',
        volunteerOrganization: patient.volunteer_info?.organization || patient.volunteerOrganization || 'Masjid Al-Rahma',
        volunteerRole: patient.volunteer_info?.role || patient.volunteerRole || 'Health Fair Volunteer',
        volunteerContact: patient.volunteer_info?.contact || patient.volunteerContact || '(813) 381-3996'
      });
    }
  }, [patient, isOpen, reset]);

  const onSubmit = async (data: PatientFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log('✏️ Health Fair Edit: Updating patient data...', { patientId: patient.id, data });

      // Prepare updated patient data for Health Fair API
      const updatedPatientData = {
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
        insurance_provider: data.insuranceProvider || '',
        volunteer_info: {
          name: data.volunteerName,
          organization: data.volunteerOrganization,
          role: data.volunteerRole,
          contact: data.volunteerContact
        }
      };

      // Update patient via Health Fair API
      const response = await healthFairAPI.updatePatient(patient.id, updatedPatientData);

      if (response.success) {
        console.log('✅ Health Fair Edit: Patient updated successfully', response.data);
        setSuccess(true);
        
        // Call success callback with updated patient
        onSuccess(response.data);
        
        // Auto-close after 2 seconds
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        throw new Error(response.error || 'Update failed');
      }
    } catch (err) {
      console.error('❌ Health Fair Edit: Error updating patient', err);
      setError(err instanceof Error ? err.message : 'Failed to update patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen || !patient) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <EditIcon color="primary" />
        <Box>
          <Typography variant="h5" component="h2">
            Edit Patient Information
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Update patient details for {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
          </Typography>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              ✅ Patient updated successfully! Closing in 2 seconds...
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

          {/* Edit Form */}
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
                {loading ? 'Updating...' : 'Update Patient'}
              </Button>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default HealthFairPatientEdit;
