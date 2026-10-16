import React, { useEffect, useRef, useState } from 'react';
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
} from '@mui/material';
import { Person, Lock, Security as SecurityIcon, Gavel as GavelIcon } from '@mui/icons-material';
import { initializeHIPAACompliance } from '../services/hipaaCompliance';
import LegalDisclaimers from './LegalDisclaimers';
import ExportActions from './ExportActions';
import { readStaffSession, writeStaffSession } from '../utils/appAuth';

const schema = yup.object({
  name: yup.string().optional(), // Optional - will be retrieved from backend or local storage
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  hipaaConsent: yup.boolean().required('You must agree to HIPAA compliance requirements').oneOf([true], 'You must agree to HIPAA compliance requirements'),
});

interface DoctorLoginProps {
  onLogin: (name: string) => void;
  onRegister?: () => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({ onLogin, onRegister }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hipaaCompliance] = useState(() => initializeHIPAACompliance());

  // Check if doctor/admin is already logged in (once)
  useEffect(() => {
    const existing = readStaffSession();
    if (existing?.name) {
      onLogin(existing.name);
    }
    // intentionally only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      hipaaConsent: false,
    },
  });

  // Auto-fill name from localStorage if available
  useEffect(() => {
    const savedDoctorData = localStorage.getItem('doctorData');
    if (savedDoctorData) {
      try {
        const doctorData = JSON.parse(savedDoctorData);
        if (doctorData.name) {
          setValue('name', doctorData.name);
        }
        if (doctorData.email) {
          setValue('email', doctorData.email);
        }
      } catch (err) {
        // Ignore parse errors
      }
    }
  }, [setValue]);

  const onSubmit = async (data: { name?: string; email: string; password: string; hipaaConsent: boolean }) => {
    setLoading(true);
    setError(null);

    try {
      if (!data.hipaaConsent) {
        setError('You must agree to HIPAA compliance requirements to access patient data.');
        setLoading(false);
        return;
      }

      // Check if doctor is registered (check localStorage for registered doctors)
      let isAuthorized = false;
      let registeredDoctor: any = null;

      // Method 1: Check hardcoded authorized users (existing system)
      const isHardcodedAuthorized = hipaaCompliance.isAuthorizedUser(data.email, data.password);
      
      // Method 2: Check registered doctors from localStorage
      try {
        const registeredDoctorsStr = localStorage.getItem('registeredDoctors');
        if (registeredDoctorsStr) {
          const registeredDoctors = JSON.parse(registeredDoctorsStr);
          registeredDoctor = registeredDoctors.find((doc: any) => 
            doc.email.toLowerCase() === data.email.toLowerCase() && 
            doc.password === data.password
          );
          if (registeredDoctor) {
            isAuthorized = true;
            console.log('✅ Found registered doctor:', registeredDoctor.email);
          }
        }
      } catch (err) {
        console.warn('Error checking registered doctors:', err);
      }

      // Method 3: Check doctor credentials stored during registration
      try {
        const doctorCredentialsStr = localStorage.getItem('doctorCredentials');
        if (doctorCredentialsStr) {
          const doctorCredentials = JSON.parse(doctorCredentialsStr);
          if (Array.isArray(doctorCredentials)) {
            const foundCredential = doctorCredentials.find((cred: any) => 
              cred.email.toLowerCase() === data.email.toLowerCase() && 
              cred.password === data.password
            );
            if (foundCredential) {
              isAuthorized = true;
              registeredDoctor = foundCredential;
              console.log('✅ Found doctor credentials:', foundCredential.email);
            }
          } else if (doctorCredentials.email?.toLowerCase() === data.email.toLowerCase() && 
                     doctorCredentials.password === data.password) {
            isAuthorized = true;
            registeredDoctor = doctorCredentials;
            console.log('✅ Found doctor credentials (single):', doctorCredentials.email);
          }
        }
      } catch (err) {
        console.warn('Error checking doctor credentials:', err);
      }

      // Combine both checks
      isAuthorized = isAuthorized || isHardcodedAuthorized;

      if (!isAuthorized) {
        // Try to check backend API for doctor authentication
        try {
          // ✅ FIXED: Use Nginx HTTPS (port 443) for production
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const healthFairUrl = isLocalhost
            ? 'http://api.mywaitime.com:3015/health-fair/doctors/login/'
            : 'https://api.mywaitime.com/health-fair/doctors/login/';
          const response = await fetch(healthFairUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              email: data.email,
              password: data.password,
            }),
          });

          if (response.ok) {
            const backendData = await response.json();
            if (backendData.status === 'success' && backendData.data) {
              isAuthorized = true;
              registeredDoctor = {
                name: backendData.data.full_name || `${backendData.data.first_name} ${backendData.data.last_name}`,
                email: backendData.data.email,
                id: backendData.data.user_id || backendData.data.dashboard_id,
                token: backendData.data.token,
                ...backendData.data
              };
              console.log('✅ Backend authentication successful');
              
              // Save token and doctor info
              if (backendData.data.token) {
                localStorage.setItem('doctorToken', backendData.data.token);
                localStorage.setItem('doctorId', String(backendData.data.user_id));
                localStorage.setItem('dashboardId', backendData.data.dashboard_id);
                localStorage.setItem('doctorName', registeredDoctor.name);
              }
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn('Backend login failed:', errorData.message || response.statusText);
          }
        } catch (backendError) {
          console.warn('Backend authentication failed, using local check:', backendError);
        }

        if (!isAuthorized) {
          console.log('⚠️ Doctor not found in local storage or backend. Please register first.');
          setError('Unauthorized access. Please make sure you have registered first. Click "Register New Doctor" to create an account.');
          setLoading(false);
          return;
        }
      }

      // Simulate doctor authentication
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // HIPAA Compliance: Log access
      hipaaCompliance.logAccess('DOCTOR_LOGIN', data.email, { 
        name: registeredDoctor?.name || data.name || 'Doctor',
        timestamp: new Date().toISOString(),
        authorized: true
      });
      
      const session = writeStaffSession({
        name: registeredDoctor?.name || data.name || data.email.split('@')[0],
        email: data.email,
        id: registeredDoctor?.id ? String(registeredDoctor.id) : `doctor_${Date.now()}`,
      });

      onLogin(session.name);
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Doctor_Login_Screen"
        downloadLabel="📥 Save Login PDF"
        printLabel="🖨️ Print Login"
      />
      <Box ref={contentRef}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Doctor Login
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Access the doctor dashboard to manage patient records and health screenings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <TextField
                fullWidth
                label="Doctor Name (Optional)"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message as string || "Optional - will be retrieved from your account"}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                {...register('email')}
                error={!!errors.email}
                helperText={errors.email?.message as string}
                required
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

            <Box>
              <TextField
                fullWidth
                label="Password"
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message as string}
                required
                InputProps={{
                  startAdornment: <SecurityIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Box>

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

            <Box>
              <Box display="flex" justifyContent="center" mt={2} gap={2} flexWrap="wrap">
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                {onRegister && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={onRegister}
                    sx={{ minWidth: 200 }}
                  >
                    Register New Doctor
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Doctor Dashboard Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • View all registered patients<br/>
            • Record patient vitals and health screenings<br/>
            • Conduct mental health assessments<br/>
            • Generate and send health recommendations<br/>
            • Track patient health history
          </Typography>
        </Box>
      </Paper>
      </Box>
    </Container>
  );
};

export default DoctorLogin;
