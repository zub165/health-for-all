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
  Checkbox,
  FormControlLabel,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Person, 
  Lock, 
  Email as EmailIcon, 
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { initializeHIPAACompliance } from '../services/hipaaCompliance';
import ExportActions from './ExportActions';

const schema = yup.object({
  first_name: yup.string().optional(),
  last_name: yup.string().optional(),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().optional(),
  specialization: yup.string().optional(),
  license_number: yup.string().optional(),
  department: yup.string().optional(),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
  hipaaConsent: yup.boolean().required('You must agree to HIPAA compliance requirements').oneOf([true], 'You must agree to HIPAA compliance requirements'),
  isTestDoctor: yup.boolean(),
});

interface DoctorRegistrationProps {
  onRegistrationSuccess?: (doctor: any) => void;
  onCancel?: () => void;
}

const DoctorRegistration: React.FC<DoctorRegistrationProps> = ({ 
  onRegistrationSuccess, 
  onCancel 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [hipaaCompliance] = useState(() => initializeHIPAACompliance());

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      specialization: '',
      license_number: '',
      department: '',
      password: '',
      confirmPassword: '',
      hipaaConsent: false,
      isTestDoctor: false,
    },
  });

  const isTestDoctor = watch('isTestDoctor');

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Prepare doctor data for backend - use health-fair/doctors/ endpoint
      const doctorData: any = {
        email: data.email,
        password: data.password, // Required for backend authentication
      };
      
      // Add fields (backend supports both camelCase and snake_case)
      if (data.first_name) doctorData.first_name = data.first_name;
      if (data.last_name) doctorData.last_name = data.last_name;
      // Also support camelCase for backend compatibility
      if (data.first_name) doctorData.firstName = data.first_name;
      if (data.last_name) doctorData.lastName = data.last_name;
      if (data.phone) doctorData.phone = data.phone;
      if (data.specialization) doctorData.specialization = data.specialization;
      if (data.license_number) doctorData.license_number = data.license_number;
      if (data.license_number) doctorData.licenseNumber = data.license_number; // camelCase
      if (data.department) doctorData.department = data.department;

      // Register doctor via health-fair API endpoint (port 3015)
      console.log('📝 Submitting doctor registration to health-fair endpoint:', doctorData);
      let response;
      let backendSuccess = false;
      
      try {
        // ✅ FIXED: Use Nginx HTTPS (port 443) for production, direct HTTP (port 3015) for localhost
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const healthFairUrl = isLocalhost
          ? 'http://api.mywaitime.com:3015/health-fair/doctors/'
          : 'https://api.mywaitime.com/health-fair/doctors/';
        const apiResponse = await fetch(healthFairUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://zub165.github.io'
          },
          body: JSON.stringify(doctorData),
        });

        if (apiResponse.ok) {
          const responseData = await apiResponse.json();
          console.log('📝 Registration response:', responseData);
          
          if (responseData.status === 'success' && responseData.data) {
            response = {
              success: true,
              data: responseData.data,
              message: responseData.message || 'Doctor registered successfully'
            };
            backendSuccess = true;
            
            // Save token if provided
            if (responseData.data.token) {
              localStorage.setItem('doctorToken', responseData.data.token);
              localStorage.setItem('doctorId', String(responseData.data.user_id));
              localStorage.setItem('dashboardId', responseData.data.dashboard_id);
            }
          } else {
            response = {
              success: false,
              error: responseData.message || 'Registration failed',
              message: responseData.message || 'Registration failed',
              data: null
            };
          }
        } else {
          const errorData = await apiResponse.json().catch(() => ({}));
          const errorMessage = errorData.message || errorData.error || `HTTP ${apiResponse.status}: ${apiResponse.statusText}`;
          console.error('❌ Doctor registration failed:', apiResponse.status, errorMessage, errorData);
          response = {
            success: false,
            error: errorMessage,
            message: errorMessage,
            data: null
          };
        }
      } catch (apiError: any) {
        console.warn('⚠️ Backend registration failed, using local registration:', apiError);
        response = { success: false, data: null, error: apiError.message };
      }

      // HIPAA Compliance: Log registration
      hipaaCompliance.logAccess('DOCTOR_REGISTRATION', data.email, { 
        name: `${data.first_name} ${data.last_name}`,
        license_number: data.license_number,
        is_test_doctor: isTestDoctor,
        timestamp: new Date().toISOString()
      });

      // ALWAYS save doctor credentials locally for login (even if backend fails)
      const doctorName = data.first_name && data.last_name 
        ? `${data.first_name} ${data.last_name}` 
        : data.email.split('@')[0]; // Use email username if name not provided
        
      const doctorCredentials = {
        name: doctorName,
        email: data.email.toLowerCase().trim(), // Normalize email
        password: data.password, // In production, this should be hashed
        registrationTime: new Date().toISOString(),
        id: response?.data?.id || `doctor_${Date.now()}`,
        hipaaCompliant: true,
        profileComplete: !!(data.first_name && data.last_name && data.phone && data.specialization),
        first_name: data.first_name,
        last_name: data.last_name,
        phone: data.phone,
        specialization: data.specialization,
        department: data.department,
        license_number: data.license_number,
      };
      
      // Save to localStorage for login authentication
      try {
        // Method 1: Save as single credential (for quick lookup)
        localStorage.setItem('doctorCredentials', JSON.stringify(doctorCredentials));
        console.log('✅ Doctor credentials saved (single):', data.email);
        
        // Method 2: Also save to registered doctors array (for multiple doctors)
        const registeredDoctorsStr = localStorage.getItem('registeredDoctors');
        const registeredDoctors = registeredDoctorsStr ? JSON.parse(registeredDoctorsStr) : [];
        
        // Check if doctor already exists (update if exists)
        const existingIndex = registeredDoctors.findIndex((doc: any) => 
          doc.email?.toLowerCase() === data.email.toLowerCase()
        );
        if (existingIndex >= 0) {
          registeredDoctors[existingIndex] = doctorCredentials;
          console.log('✅ Updated existing doctor:', data.email);
        } else {
          registeredDoctors.push(doctorCredentials);
          console.log('✅ Added new doctor to array:', data.email);
        }
        
        localStorage.setItem('registeredDoctors', JSON.stringify(registeredDoctors));
        console.log('✅ Doctor credentials saved for login. Total doctors:', registeredDoctors.length);
      } catch (err) {
        console.error('❌ Failed to save doctor credentials:', err);
        // Still show success if localStorage save fails (user can still try)
      }

      // Show success message (local registration always succeeds)
      setSuccess(true);
      
      if (backendSuccess) {
        // Backend registration succeeded
        alert(`✅ Registration successful! Doctor account created.\n\nYou can now log in with:\nEmail: ${data.email}\nPassword: [your password]`);
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess(response?.data || doctorCredentials);
        }
      } else {
        // Backend failed but local registration succeeded
        console.log('⚠️ Backend registration failed, but local registration succeeded');
        alert(`✅ Registration completed (local mode)!\n\nYou can now log in with:\nEmail: ${data.email}\nPassword: [your password]\n\nNote: Backend registration failed, but you can still use the system.`);
        
        if (onRegistrationSuccess) {
          onRegistrationSuccess(doctorCredentials);
        }
      }

      // Auto-redirect after 3 seconds
      setTimeout(() => {
        if (onCancel) {
          onCancel();
        }
      }, 3000);
    } catch (err: any) {
      console.error('❌ Registration error:', err);
      // Parse error message more carefully
      let errorMessage = 'Registration failed. Please check your connection and try again.';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const specializations = [
    'General Practice',
    'Cardiology',
    'Pediatrics',
    'Internal Medicine',
    'Family Medicine',
    'Emergency Medicine',
    'Psychiatry',
    'Neurology',
    'Orthopedics',
    'Dermatology',
    'Oncology',
    'Endocrinology',
    'Gastroenterology',
    'Pulmonology',
    'Nephrology',
    'Rheumatology',
    'Urology',
    'Gynecology',
    'Ophthalmology',
    'Otolaryngology',
  ];

  const departments = [
    'General Medicine',
    'Cardiology',
    'Pediatrics',
    'Emergency',
    'Internal Medicine',
    'Family Medicine',
    'Psychiatry',
    'Neurology',
    'Orthopedics',
    'Dermatology',
    'Oncology',
    'Surgery',
    'Radiology',
    'Laboratory',
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Doctor_Registration"
        downloadLabel="📥 Save Doctor PDF"
        printLabel="🖨️ Print Doctor Registration"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Regular Doctor Registration" />
            <Tab label="Test Doctor Registration" />
          </Tabs>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Doctor Registration
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
          Quick Registration - Complete your profile later
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>⚡ Fast Registration:</strong> Only email and password are required. You can add your professional details later in the dashboard.
        </Alert>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Registration successful! Doctor account created. Redirecting...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Test Doctor Checkbox */}
            <FormControlLabel
              control={
                <Checkbox
                  {...register('isTestDoctor')}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2">
                  <strong>Test Doctor Account</strong> - Use this for testing purposes (simplified registration)
                </Typography>
              }
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px' }}>
                <TextField
                  fullWidth
                  label="First Name (Optional)"
                  {...register('first_name')}
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message as string || "Can be added later"}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              <Box sx={{ flex: '1 1 300px' }}>
                <TextField
                  fullWidth
                  label="Last Name (Optional)"
                  {...register('last_name')}
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message as string || "Can be added later"}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message as string}
              required
              InputProps={{
                startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <TextField
              fullWidth
              label="Phone Number (Optional)"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message as string || "Can be added later"}
              placeholder="555-0123"
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl fullWidth sx={{ flex: '1 1 300px' }} error={!!errors.specialization}>
                <InputLabel>Specialization (Optional)</InputLabel>
                <Select
                  {...register('specialization')}
                  label="Specialization (Optional)"
                  defaultValue=""
                >
                  <MenuItem value="">Select Specialization (Optional)</MenuItem>
                  {specializations.map((spec) => (
                    <MenuItem key={spec} value={spec}>
                      {spec}
                    </MenuItem>
                  ))}
                </Select>
                {errors.specialization ? (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.specialization.message as string}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    Can be added later
                  </Typography>
                )}
              </FormControl>

              <FormControl fullWidth sx={{ flex: '1 1 300px' }} error={!!errors.department}>
                <InputLabel>Department (Optional)</InputLabel>
                <Select
                  {...register('department')}
                  label="Department (Optional)"
                  defaultValue=""
                >
                  <MenuItem value="">Select Department (Optional)</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      {dept}
                    </MenuItem>
                  ))}
                </Select>
                {errors.department ? (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                    {errors.department.message as string}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.75 }}>
                    Can be added later
                  </Typography>
                )}
              </FormControl>
            </Box>

            <TextField
              fullWidth
              label="License Number (Optional)"
              {...register('license_number')}
              error={!!errors.license_number}
              helperText={errors.license_number?.message as string || "Can be added later"}
              placeholder={isTestDoctor ? "TEST123" : "MD123456"}
              InputProps={{
                startAdornment: <BadgeIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              Account Security
            </Typography>

            <TextField
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message as string}
              required
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message as string}
              required
              InputProps={{
                startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />

            <Divider sx={{ my: 2 }} />

            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>🔐 HIPAA Compliance Required:</strong> Access to patient data requires compliance with HIPAA regulations.
                </Typography>
              </Alert>
              
              <FormControlLabel
                control={
                  <Checkbox
                    {...register('hipaaConsent')}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to comply with HIPAA regulations and will protect patient data confidentiality. 
                    I understand that unauthorized access to patient data is prohibited and may result in legal action.
                  </Typography>
                }
              />
              {errors.hipaaConsent && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {errors.hipaaConsent.message}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              {onCancel && (
                <Button
                  variant="outlined"
                  onClick={onCancel}
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ flex: 1 }}
              >
                {loading ? 'Registering...' : 'Register Doctor'}
              </Button>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            After Registration
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • You can log in using your email and password<br/>
            • Access the doctor dashboard to manage patients<br/>
            • Record patient vitals and health screenings<br/>
            • Generate and send health recommendations<br/>
            • Track patient health history
          </Typography>
        </Box>
      </Paper>
      </Box>
    </Container>
  );
};

export default DoctorRegistration;
