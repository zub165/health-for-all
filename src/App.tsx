import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { HealthAndSafety, Person, Dashboard, Api, Description } from '@mui/icons-material';
import SimplePatientRegistration from './components/SimplePatientRegistration';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorLogin from './components/DoctorLogin';
import HealthFair from './components/HealthFair';
import ApiStatusDashboard from './components/ApiStatusDashboard';
import ApiDocumentation from './components/ApiDocumentation';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'patient' | 'doctor' | 'health-fair' | 'api-status' | 'api-docs'>('home');
  const [doctorName, setDoctorName] = useState<string>('');

  const handleDoctorLogin = (name: string) => {
    setDoctorName(name);
    setCurrentView('doctor');
  };

  const handleDoctorLogout = () => {
    setDoctorName('');
    setCurrentView('home');
  };

  const handlePatientRegistration = () => {
    setCurrentView('patient');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setDoctorName('');
  };


  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router basename={window.location.hostname.includes('github.io') ? '/health-for-all' : ''}>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" elevation={2}>
            <Toolbar>
              <HealthAndSafety sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Health for All Fair
              </Typography>
              {currentView !== 'home' && (
                <Button 
                  color="inherit" 
                  onClick={handleBackToHome}
                  aria-label="Return to home page"
                >
                  Home
                </Button>
              )}
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 4 }}>
            {currentView === 'home' && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h2" component="h1" gutterBottom color="primary">
                  Health for All Fair
                </Typography>
                <Typography variant="h5" color="text.secondary" sx={{ mb: 6 }}>
                  Comprehensive Health Screening and Care
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Person />}
                    onClick={handlePatientRegistration}
                    sx={{ minWidth: 200, py: 2 }}
                  >
                    🤖 AI-Enhanced Patient Registration
                  </Button>
                  
                  
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Dashboard />}
                    onClick={() => setCurrentView('doctor')}
                    sx={{ minWidth: 200, py: 2 }}
                  >
                    👨‍⚕️ Doctor Dashboard
                  </Button>
                  
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<HealthAndSafety />}
                    onClick={() => setCurrentView('health-fair')}
                    sx={{ 
                      minWidth: 200, 
                      py: 2,
                      background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #E55A2B, #E8821A)',
                      }
                    }}
                  >
                    🏥 Health Fair 2025
                  </Button>
                </Box>

                {/* API Management Section */}
                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Api />}
                    onClick={() => setCurrentView('api-status')}
                    sx={{ minWidth: 200, py: 2 }}
                  >
                    🔌 API Status
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Description />}
                    onClick={() => setCurrentView('api-docs')}
                    sx={{ minWidth: 200, py: 2 }}
                  >
                    📚 API Docs
                  </Button>
                </Box>

                <Box sx={{ mt: 8, p: 4, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    What We Offer
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="body1">• Patient Registration & Medical History</Typography>
                    <Typography variant="body1">• Comprehensive Vitals Tracking</Typography>
                    <Typography variant="body1">• Blood Sugar Monitoring</Typography>
                    <Typography variant="body1">• Carotid Doppler Screening</Typography>
                    <Typography variant="body1">• Mental Health Assessment</Typography>
                    <Typography variant="body1">• Email Recommendations</Typography>
                    <Typography variant="body1" sx={{ color: 'primary.main', fontWeight: 'bold' }}>• 🤖 AI-Powered Rapid Processing (Under 10s)</Typography>
                  </Box>
                </Box>
              </Box>
            )}

            {currentView === 'patient' && (
              <SimplePatientRegistration
                onSuccess={(patient) => {
                  alert(`AI-Enhanced Registration successful! Patient ID: ${patient.id}. Data saved to Django backend.`);
                  setCurrentView('home');
                }}
              />
            )}


            {currentView === 'doctor' && !doctorName && (
              <DoctorLogin onLogin={handleDoctorLogin} />
            )}

            {currentView === 'doctor' && doctorName && (
              <DoctorDashboard doctorName={doctorName} onLogout={handleDoctorLogout} />
            )}

            {currentView === 'health-fair' && (
              <HealthFair />
            )}

            {currentView === 'api-status' && (
              <ApiStatusDashboard />
            )}

            {currentView === 'api-docs' && (
              <ApiDocumentation />
            )}
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
