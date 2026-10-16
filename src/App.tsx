import React, { useState } from 'react';
import { HashRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  HealthAndSafety,
  Person,
  Dashboard,
  Api,
  Description,
  Menu as MenuIcon,
  Science,
  MedicalServices,
  Home as HomeIcon,
  VolunteerActivism,
} from '@mui/icons-material';
import SimplePatientRegistration from './components/SimplePatientRegistration';
import AIHealthAssessment from './components/AIHealthAssessment';
import DoctorDashboard from './components/DoctorDashboard';
import DoctorLogin from './components/DoctorLogin';
import HealthFairDashboard from './components/HealthFairDashboard';
import HealthFairAssessment from './components/HealthFairAssessment';
import ApiStatusDashboard from './components/ApiStatusDashboard';
import ApiDocumentation from './components/ApiDocumentation';
import LegalDisclaimerBanner from './components/LegalDisclaimerBanner';
import LabManagement from './components/LabManagement';
import ICD10Diagnosis from './components/ICD10Diagnosis';
import DoctorRegistration from './components/DoctorRegistration';
import VolunteerRegistration from './components/VolunteerRegistration';
import { AppDataProvider, useAppData } from './context/AppDataContext';

type AppView =
  | 'home'
  | 'patient'
  | 'doctor'
  | 'doctor-register'
  | 'ai-assessment'
  | 'health-fair-dashboard'
  | 'health-fair-assessment'
  | 'api-status'
  | 'api-docs'
  | 'lab-management'
  | 'icd10-diagnosis'
  | 'volunteer-register';

const appTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
    background: { default: '#f5f5f5' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const navigationItems: { label: string; short: string; view: AppView; icon: React.ReactElement }[] = [
  { label: 'Home', short: 'Home', view: 'home', icon: <HomeIcon /> },
  { label: 'Patient Registration', short: 'Patients', view: 'patient', icon: <Person /> },
  { label: 'AI Health Assessment', short: 'AI', view: 'ai-assessment', icon: <HealthAndSafety /> },
  { label: 'Doctor Dashboard', short: 'Doctor', view: 'doctor', icon: <Dashboard /> },
  { label: 'Volunteer Register', short: 'Volunteer', view: 'volunteer-register', icon: <VolunteerActivism /> },
  { label: 'Health Fair 2025', short: 'Fair', view: 'health-fair-dashboard', icon: <HealthAndSafety /> },
  { label: 'Lab Management', short: 'Lab', view: 'lab-management', icon: <Science /> },
  { label: 'ICD-10 Diagnosis', short: 'ICD-10', view: 'icd10-diagnosis', icon: <MedicalServices /> },
  { label: 'API Status', short: 'API', view: 'api-status', icon: <Api /> },
  { label: 'API Docs', short: 'Docs', view: 'api-docs', icon: <Description /> },
];

function AppShell() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [doctorName, setDoctorName] = useState<string>('');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(appTheme.breakpoints.down('md'));
  const { refreshAll, refreshVolunteers } = useAppData();

  const navigate = (view: AppView) => {
    setCurrentView(view);
    setMobileOpen(false);
  };

  const handleDoctorLogin = (name: string) => {
    setDoctorName(name);
    setCurrentView('doctor');
  };

  const handleDoctorLogout = () => {
    localStorage.removeItem('doctorData');
    localStorage.removeItem('hipaa_access_log');
    setDoctorName('');
    setCurrentView('home');
  };

  const handlePatientRegistered = () => {
    setRefreshTrigger((prev) => prev + 1);
    void refreshAll();
  };

  const tabValue = (() => {
    const idx = navigationItems.findIndex((item) => item.view === currentView);
    return idx >= 0 ? idx : false;
  })();

  const drawer = (
    <Box sx={{ width: 280 }} role="navigation" aria-label="Main navigation">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Health for All</Typography>
        <Typography variant="body2" color="text.secondary">
          Jump to any module
        </Typography>
      </Box>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItemButton
            key={item.view}
            selected={currentView === item.view}
            onClick={() => navigate(item.view)}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={2} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="Open navigation menu"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <HealthAndSafety sx={{ mr: 1 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Health for All Fair
          </Typography>
          {currentView !== 'home' && (
            <Button color="inherit" onClick={() => navigate('home')} startIcon={<HomeIcon />}>
              Home
            </Button>
          )}
        </Toolbar>

        {/* Always-visible tab bar (phone + desktop) so you can switch modules anytime */}
        <Tabs
          value={tabValue}
          onChange={(_, index: number) => navigate(navigationItems[index].view)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          textColor="inherit"
          indicatorColor="secondary"
          sx={{
            px: 0.5,
            minHeight: 48,
            bgcolor: 'primary.dark',
            '& .MuiTab-root': {
              minHeight: 48,
              minWidth: isMobile ? 72 : 100,
              color: 'rgba(255,255,255,0.85)',
              textTransform: 'none',
              fontSize: isMobile ? '0.75rem' : '0.875rem',
            },
            '& .Mui-selected': { color: '#fff !important', fontWeight: 700 },
          }}
        >
          {navigationItems.map((item) => (
            <Tab
              key={item.view}
              icon={item.icon}
              iconPosition="start"
              label={isMobile ? item.short : item.short}
            />
          ))}
        </Tabs>
      </AppBar>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 } }}
      >
        {drawer}
      </Drawer>

      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <LegalDisclaimerBanner />

        {currentView === 'home' && (
          <Box sx={{ textAlign: 'center', py: { xs: 4, md: 6 }, px: { xs: 1, md: 0 } }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              color="primary"
              sx={{ fontSize: { xs: '2rem', sm: '3rem', md: '3.5rem' } }}
            >
              Health for All Fair
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4, fontSize: { xs: '1.1rem', md: '1.4rem' } }}
            >
              Comprehensive Health Screening and Care
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Use the top tabs or the menu (☰) to open any module anytime.
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' },
                gap: 2,
                maxWidth: 1100,
                mx: 'auto',
              }}
            >
              {navigationItems
                .filter((item) => item.view !== 'home')
                .map((item) => (
                  <Button
                    key={item.view}
                    variant={item.view === 'ai-assessment' || item.view === 'health-fair-dashboard' ? 'contained' : 'outlined'}
                    size="large"
                    startIcon={item.icon}
                    onClick={() => navigate(item.view)}
                    sx={{ py: 2, minHeight: 72, justifyContent: 'flex-start', px: 2 }}
                  >
                    {item.label}
                  </Button>
                ))}
            </Box>
          </Box>
        )}

        {currentView === 'patient' && (
          <SimplePatientRegistration
            onSuccess={(patient) => {
              alert(`Registration successful! Patient ID: ${patient.id}`);
              handlePatientRegistered();
              navigate('home');
            }}
          />
        )}

        {currentView === 'ai-assessment' && (
          <AIHealthAssessment
            onAssessmentComplete={(patient, healthScore, riskFactors, recommendations) => {
              alert(
                `AI Health Assessment Complete!\n\nPatient: ${patient.name}\nHealth Score: ${healthScore}/100\nRisk Factors: ${riskFactors.join(', ')}\nRecommendations: ${recommendations.length} generated`
              );
            }}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'doctor' && !doctorName && (
          <DoctorLogin
            onLogin={handleDoctorLogin}
            onRegister={() => navigate('doctor-register')}
          />
        )}

        {currentView === 'doctor-register' && (
          <DoctorRegistration
            onRegistrationSuccess={(doctor) => {
              alert(
                `✅ Doctor registered successfully!\n\nDoctor: ${doctor.full_name || doctor.first_name} ${doctor.last_name}\nEmail: ${doctor.email}\nID: ${doctor.id}\n\nYou can now log in with your email and password.`
              );
              navigate('doctor');
            }}
            onCancel={() => navigate('doctor')}
          />
        )}

        {currentView === 'doctor' && doctorName && (
          <DoctorDashboard
            doctorName={doctorName}
            onLogout={handleDoctorLogout}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'volunteer-register' && (
          <VolunteerRegistration
            onSuccess={() => {
              void refreshVolunteers();
              alert('Volunteer registered (saved locally if backend volunteers API is unavailable).');
            }}
          />
        )}

        {currentView === 'health-fair-dashboard' && <HealthFairDashboard />}

        {currentView === 'health-fair-assessment' && (
          <HealthFairAssessment
            onSuccess={(result) => {
              alert(`Health Fair Assessment Complete! Patient ID: ${result.patientId}`);
              navigate('health-fair-dashboard');
            }}
            onCancel={() => navigate('health-fair-dashboard')}
          />
        )}

        {currentView === 'api-status' && <ApiStatusDashboard />}
        {currentView === 'api-docs' && <ApiDocumentation />}
        {currentView === 'lab-management' && <LabManagement />}
        {currentView === 'icd10-diagnosis' && <ICD10Diagnosis />}
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Router>
        <AppDataProvider>
          <AppShell />
        </AppDataProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
