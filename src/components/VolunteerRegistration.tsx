import React, { useMemo, useState } from 'react';
import { Box, Button, Card, CardContent, Divider, MenuItem, TextField, Typography, Alert, LinearProgress, Chip } from '@mui/material';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { getActiveOrganizations } from '../config/volunteerOrganizations';
import volunteerService, { VolunteerData } from '../services/volunteerService';

interface VolunteerRegistrationProps {
  onSuccess?: (volunteer: VolunteerData) => void;
}

const validationSchema = yup
  .object({
    fullName: yup.string().trim().required('Full name is required'),
    email: yup.string().trim().email('Enter a valid email').required('Email is required'),
    phone: yup
      .string()
      .trim()
      .matches(/^[0-9()+\-\s]+$/, 'Enter a valid phone number')
      .required('Phone is required'),
    organization: yup.string().trim().ensure(),
    role: yup.string().trim().required('Volunteer role is required'),
    availability: yup.string().trim().required('Availability details are required'),
    skills: yup.string().trim().ensure(),
    notes: yup.string().trim().max(500, 'Max 500 characters').ensure()
  })
  .required();

type VolunteerFormValues = yup.InferType<typeof validationSchema>;

const defaultValues: VolunteerFormValues = {
  fullName: '',
  email: '',
  phone: '',
  organization: '',
  role: 'Health Fair Support',
  availability: '',
  skills: '',
  notes: ''
};

const VolunteerRegistration: React.FC<VolunteerRegistrationProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const organizations = useMemo(() => getActiveOrganizations(), []);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VolunteerFormValues>({
    defaultValues,
    resolver: yupResolver(validationSchema)
  });

  const onSubmit = async (values: VolunteerFormValues) => {
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const result = await volunteerService.registerVolunteer({
        full_name: values.fullName,
        email: values.email,
        phone: values.phone,
        organization: values.organization || undefined,
        role: values.role || undefined,
        availability: values.availability || undefined,
        skills: values.skills
          ? values.skills
              .split(',')
              .map((skill) => skill.trim())
              .filter(Boolean)
          : undefined,
        notes: values.notes || undefined
      });

      if (result.success) {
        setSuccessMessage(result.message || 'Volunteer registered successfully!');
        onSuccess?.(result.volunteer);
        reset(defaultValues);
      } else {
        setErrorMessage(result.error || 'Failed to register volunteer. Please try again.');
      }
    } catch (error) {
      console.error('Volunteer registration error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to register volunteer. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <VolunteerActivismIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h5">Volunteer Worker Registration</Typography>
            <Typography variant="body2" color="text.secondary">
              Register community volunteers to support the Health Fair. This registration is separate
              from patient intake.
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {successMessage && (
          <Alert
            icon={<CheckCircleIcon fontSize="inherit" />}
            severity="success"
            sx={{ mb: 2 }}
          >
            {successMessage}
          </Alert>
        )}

        {errorMessage && (
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            }}
          >
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Full Name"
                  fullWidth
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Phone"
                  fullWidth
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                />
              )}
            />

            <Controller
              name="organization"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Organization"
                  fullWidth
                  helperText={errors.organization?.message || 'Select or type to add'}
                >
                  <MenuItem value="">
                    <em>Independent Volunteer</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org.id} value={org.name}>
                      {org.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Volunteer Role"
                  fullWidth
                  error={!!errors.role}
                  helperText={errors.role?.message || 'e.g., Registration Desk, Nurse, EMT'}
                />
              )}
            />

            <Controller
              name="availability"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Availability"
                  fullWidth
                  error={!!errors.availability}
                  helperText={errors.availability?.message || 'e.g., Saturday 8am-2pm'}
                />
              )}
            />

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Controller
                name="skills"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Skills (comma separated)"
                    fullWidth
                    helperText={
                      errors.skills?.message ||
                      'Examples: CPR Certified, Spanish Speaking, Phlebotomy'
                    }
                  />
                )}
              />
            </Box>

            <Box sx={{ gridColumn: '1 / -1' }}>
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Additional Notes"
                    fullWidth
                    multiline
                    minRows={3}
                    error={!!errors.notes}
                    helperText={errors.notes?.message || 'Share any extra details or requests'}
                  />
                )}
              />
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              By registering, volunteers agree to follow Health For All policies and understand that
              this is an educational community health screening program operated by trained
              volunteers.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label="Hybrid Storage" color="primary" variant="outlined" />
              <Chip label="Email Notification" color="success" variant="outlined" />
              <Chip label="Backend Sync" color="secondary" variant="outlined" />
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              disabled={loading}
              onClick={() => reset(defaultValues)}
            >
              Clear
            </Button>
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              Register Volunteer
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VolunteerRegistration;

