import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import { HealthAndSafety, Person, Dashboard } from '@mui/icons-material';
import PatientRegistration from './components/PatientRegistration';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorLogin from './components/DoctorLogin';
import AIRapidRegistration from './components/AIRapidRegistration';

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
  const [currentView, setCurrentView] = useState<'home' | 'patient' | 'doctor' | 'ai-rapid'>('home');
  const [doctorName, setDoctorName] = useState<string>('');

  const handleDoctorLogin = (name: string) => {
    setDoctorName(name);
    setCurrentView('doctor');
  };

  const handlePatientRegistration = () => {
    setCurrentView('patient');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setDoctorName('');
  };

  const handleAIRapidComplete = (patient: any, vitals: any, recommendations: any) => {
    alert(`AI Registration Complete!\n\nPatient: ${patient.name}\nProcessing Time: Under 10 seconds\nEmail Summary: Sent to ${patient.email}\nUrgency Level: ${recommendations.urgency.toUpperCase()}`);
    setCurrentView('home');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" elevation={2}>
            <Toolbar>
              <HealthAndSafety sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Health for All Fair
              </Typography>
              {currentView !== 'home' && (
                <Button color="inherit" onClick={handleBackToHome}>
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
                    Patient Registration
                  </Button>
                  
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<Person />}
                    onClick={() => setCurrentView('ai-rapid')}
                    sx={{ 
                      minWidth: 200, 
                      py: 2,
                      background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #FF5252, #26C6DA)',
                      }
                    }}
                  >
                    🤖 AI Rapid Registration
                  </Button>
                  
                  <Button
                    variant="outlined"
                    size="large"
                    startIcon={<Dashboard />}
                    onClick={() => setCurrentView('doctor')}
                    sx={{ minWidth: 200, py: 2 }}
                  >
                    Doctor Login
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
              <PatientRegistration
                onSuccess={(patient) => {
                  alert(`Registration successful! Patient ID: ${patient.id}. You can now proceed to the doctor for vitals check.`);
                  setCurrentView('home');
                }}
              />
            )}

            {currentView === 'doctor' && !doctorName && (
              <DoctorLogin onLogin={handleDoctorLogin} />
            )}

            {currentView === 'ai-rapid' && (
              <AIRapidRegistration onComplete={handleAIRapidComplete} />
            )}

            {currentView === 'doctor' && doctorName && (
              <DoctorDashboard doctorName={doctorName} />
            )}
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
