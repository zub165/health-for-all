import React, { useEffect, useMemo, useState } from 'react';
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
  Chip,
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
  Psychology,
  Event,
  Badge as BadgeIcon,
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
import PatientPortal from './components/PatientPortal';
import VolunteerPortal from './components/VolunteerPortal';
import StaffGate from './components/StaffGate';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppRole, STAFF_ONLY_VIEWS, isStaffRole } from './utils/appAuth';

type AppView =
  | 'home'
  | 'patient'
  | 'patient-portal'
  | 'doctor'
  | 'doctor-register'
  | 'ai-assessment'
  | 'health-fair-dashboard'
  | 'health-fair-assessment'
  | 'api-status'
  | 'api-docs'
  | 'lab-management'
  | 'icd10-diagnosis'
  | 'volunteer-register'
  | 'volunteer-portal';

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

type NavItem = {
  label: string;
  short: string;
  view: AppView;
  icon: React.ReactElement;
  /** Roles that may see this nav item. Empty = everyone including guest. */
  roles?: AppRole[];
};

const ALL_NAV: NavItem[] = [
  { label: 'Home', short: 'Home', view: 'home', icon: <HomeIcon /> },
  {
    label: 'Patient Registration',
    short: 'Patients',
    view: 'patient',
    icon: <Person />,
    roles: ['guest', 'admin', 'doctor'],
  },
  {
    label: 'My health record',
    short: 'My record',
    view: 'patient-portal',
    icon: <BadgeIcon />,
    roles: ['patient'],
  },
  {
    label: 'AI Health Assessment',
    short: 'AI',
    view: 'ai-assessment',
    icon: <Psychology />,
    roles: ['admin', 'doctor'],
  },
  {
    label: 'Doctor Dashboard',
    short: 'Doctor',
    view: 'doctor',
    icon: <Dashboard />,
    roles: ['guest', 'admin', 'doctor'],
  },
  {
    label: 'Volunteer Register',
    short: 'Volunteer',
    view: 'volunteer-register',
    icon: <VolunteerActivism />,
    roles: ['guest', 'admin', 'doctor'],
  },
  {
    label: 'My volunteer profile',
    short: 'My profile',
    view: 'volunteer-portal',
    icon: <VolunteerActivism />,
    roles: ['volunteer'],
  },
  {
    label: 'Health Fair Desk',
    short: 'Fair',
    view: 'health-fair-dashboard',
    icon: <Event />,
    roles: ['admin', 'doctor'],
  },
  {
    label: 'Lab Management',
    short: 'Lab',
    view: 'lab-management',
    icon: <Science />,
    roles: ['admin', 'doctor'],
  },
  {
    label: 'ICD-10 Diagnosis',
    short: 'ICD-10',
    view: 'icd10-diagnosis',
    icon: <MedicalServices />,
    roles: ['admin', 'doctor'],
  },
  {
    label: 'API Status',
    short: 'API',
    view: 'api-status',
    icon: <Api />,
    roles: ['admin', 'doctor', 'guest'],
  },
  {
    label: 'API Docs',
    short: 'Docs',
    view: 'api-docs',
    icon: <Description />,
    roles: ['admin', 'doctor', 'guest'],
  },
];

function navForRole(role: AppRole): NavItem[] {
  return ALL_NAV.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(role);
  });
}

function AppShell() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(appTheme.breakpoints.down('md'));
  const { refreshAll, refreshVolunteers } = useAppData();
  const { role, isStaff, displayName, loginStaff, loginPatient, loginVolunteer, logout } =
    useAuth();

  const navigationItems = useMemo(() => navForRole(role), [role]);

  const navigate = (view: AppView) => {
    if (STAFF_ONLY_VIEWS.has(view) && !isStaff) {
      setCurrentView('doctor');
      setMobileOpen(false);
      return;
    }
    if (view === 'patient-portal' && role !== 'patient') {
      setCurrentView('patient');
      setMobileOpen(false);
      return;
    }
    if (view === 'volunteer-portal' && role !== 'volunteer') {
      setCurrentView('volunteer-register');
      setMobileOpen(false);
      return;
    }
    setCurrentView(view);
    setMobileOpen(false);
  };

  // Cross-tab navigation from clinical note (e.g. Lab & Radiology)
  useEffect(() => {
    const onNav = (ev: Event) => {
      const detail = (ev as CustomEvent<string>).detail as AppView | undefined;
      if (!detail) return;
      if (STAFF_ONLY_VIEWS.has(detail) && !isStaff) {
        setCurrentView('doctor');
        return;
      }
      setCurrentView(detail);
      setMobileOpen(false);
    };
    window.addEventListener('hfa-navigate', onNav as EventListener);
    return () => window.removeEventListener('hfa-navigate', onNav as EventListener);
  }, [isStaff]);

  const handleDoctorLogin = (name: string) => {
    try {
      const raw = localStorage.getItem('doctorData');
      if (raw) {
        const d = JSON.parse(raw);
        loginStaff({ name: d.name || name, email: d.email || '', id: d.id });
      } else {
        loginStaff({ name, email: '' });
      }
    } catch {
      loginStaff({ name, email: '' });
    }
    setCurrentView('doctor');
  };

  const handleLogout = () => {
    logout();
    setCurrentView('home');
  };

  const handlePatientRegistered = () => {
    setRefreshTrigger((prev) => prev + 1);
    void refreshAll();
  };

  // Keep current view valid when role changes
  React.useEffect(() => {
    const allowed = navForRole(role).some((i) => i.view === currentView);
    if (!allowed) {
      if (role === 'patient') setCurrentView('patient-portal');
      else if (role === 'volunteer') setCurrentView('volunteer-portal');
      else setCurrentView('home');
    }
  }, [role, currentView]);

  const tabValue = (() => {
    const idx = navigationItems.findIndex((item) => item.view === currentView);
    return idx >= 0 ? idx : false;
  })();

  const drawer = (
    <Box sx={{ width: 280 }} role="navigation" aria-label="Main navigation">
      <Box sx={{ p: 2 }}>
        <Typography variant="h6">Health for All</Typography>
        <Typography variant="body2" color="text.secondary">
          {role === 'guest' ? 'Public modules' : `Signed in as ${role}`}
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
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Health for All Fair
          </Typography>
          {displayName && (
            <Chip
              size="small"
              label={`${displayName} · ${role}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', mr: 1 }}
            />
          )}
          {role !== 'guest' && (
            <Button color="inherit" onClick={handleLogout}>
              Sign out
            </Button>
          )}
          {currentView !== 'home' && (
            <Button color="inherit" onClick={() => navigate('home')} startIcon={<HomeIcon />}>
              Home
            </Button>
          )}
        </Toolbar>

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
              label={item.short}
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
              sx={{ mb: 2, fontSize: { xs: '1.1rem', md: '1.4rem' } }}
            >
              Comprehensive Health Screening and Care
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {isStaffRole(role)
                ? 'Doctor/admin: you can view all patient and volunteer records.'
                : role === 'patient'
                  ? 'Patient: you only see your own health record.'
                  : role === 'volunteer'
                    ? 'Volunteer: you only see your own profile.'
                    : 'Register as patient or volunteer for your private portal, or sign in as doctor/admin for full access.'}
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
                    variant={
                      item.view === 'ai-assessment' || item.view === 'health-fair-dashboard'
                        ? 'contained'
                        : 'outlined'
                    }
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
              const name =
                patient.name ||
                patient.full_name ||
                `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
              loginPatient({
                name: name || 'Patient',
                email: patient.email || '',
                id: patient.id,
              });
              alert(`Registration successful! Opening your private health record.`);
              handlePatientRegistered();
              setCurrentView('patient-portal');
            }}
          />
        )}

        {currentView === 'patient-portal' && <PatientPortal />}

        {currentView === 'ai-assessment' && (
          <StaffGate title="AI Health Assessment" onRegisterDoctor={() => navigate('doctor-register')}>
            <AIHealthAssessment
              onAssessmentComplete={(patient, healthScore, riskFactors, recommendations) => {
                alert(
                  `AI Health Assessment Complete!\n\nPatient: ${patient.name}\nHealth Score: ${healthScore}/100\nRisk Factors: ${riskFactors.join(', ')}\nRecommendations: ${recommendations.length} generated`
                );
              }}
              refreshTrigger={refreshTrigger}
            />
          </StaffGate>
        )}

        {currentView === 'doctor' && !isStaff && (
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

        {currentView === 'doctor' && isStaff && (
          <DoctorDashboard
            doctorName={displayName}
            onLogout={handleLogout}
            refreshTrigger={refreshTrigger}
          />
        )}

        {currentView === 'volunteer-register' && (
          <VolunteerRegistration
            onSuccess={(volunteer) => {
              loginVolunteer({
                name: volunteer.full_name,
                email: volunteer.email,
                id: volunteer.id,
              });
              void refreshVolunteers();
              alert('Volunteer registered. Opening your private profile.');
              setCurrentView('volunteer-portal');
            }}
          />
        )}

        {currentView === 'volunteer-portal' && <VolunteerPortal />}

        {currentView === 'health-fair-dashboard' && (
          <StaffGate title="Health Fair Desk" onRegisterDoctor={() => navigate('doctor-register')}>
            <HealthFairDashboard />
          </StaffGate>
        )}

        {currentView === 'health-fair-assessment' && (
          <StaffGate
            title="Health Fair Assessment"
            onRegisterDoctor={() => navigate('doctor-register')}
          >
            <HealthFairAssessment
              onSuccess={(result) => {
                alert(`Health Fair Assessment Complete! Patient ID: ${result.patientId}`);
                navigate('health-fair-dashboard');
              }}
              onCancel={() => navigate('health-fair-dashboard')}
            />
          </StaffGate>
        )}

        {currentView === 'api-status' && <ApiStatusDashboard />}
        {currentView === 'api-docs' && <ApiDocumentation />}

        {currentView === 'lab-management' && (
          <StaffGate title="Lab & Radiology" onRegisterDoctor={() => navigate('doctor-register')}>
            <LabManagement />
          </StaffGate>
        )}

        {currentView === 'icd10-diagnosis' && (
          <StaffGate title="ICD-10 Diagnosis" onRegisterDoctor={() => navigate('doctor-register')}>
            <ICD10Diagnosis />
          </StaffGate>
        )}
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <AppDataProvider>
            <AppShell />
          </AppDataProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
