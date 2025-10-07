import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { Person, Lock } from '@mui/icons-material';

const schema = yup.object({
  name: yup.string().required('Doctor name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
});

interface DoctorLoginProps {
  onLogin: (name: string) => void;
}

const DoctorLogin: React.FC<DoctorLoginProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if doctor is already logged in
  useEffect(() => {
    const savedDoctorData = localStorage.getItem('doctorData');
    if (savedDoctorData) {
      try {
        const doctorData = JSON.parse(savedDoctorData);
        // Auto-login if doctor data exists
        onLogin(doctorData.name);
      } catch (err) {
        // Clear invalid data
        localStorage.removeItem('doctorData');
      }
    }
  }, [onLogin]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ name: string; email: string }>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: { name: string; email: string }) => {
    setLoading(true);
    setError(null);

    try {
      // Simulate doctor authentication
      // In a real application, this would validate against a database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save doctor data to localStorage for persistence
      const doctorData = {
        name: data.name,
        email: data.email,
        loginTime: new Date().toISOString(),
        id: `doctor_${Date.now()}`
      };
      
      localStorage.setItem('doctorData', JSON.stringify(doctorData));
      
      // For demo purposes, accept any valid email format
      onLogin(data.name);
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
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
                label="Doctor Name"
                {...register('name')}
                error={!!errors.name}
                helperText={errors.name?.message as string}
                required
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
              <Box display="flex" justifyContent="center" mt={2}>
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
    </Container>
  );
};

export default DoctorLogin;
