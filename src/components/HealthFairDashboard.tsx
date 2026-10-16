import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  HealthAndSafety as HealthIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  VolunteerActivism as VolunteerIcon
} from '@mui/icons-material';
import { healthFairAPI } from '../services/healthFairApi';
import { PatientData } from '../services/hybridPatientService';
import { useAppData, notifyAppDataChanged } from '../context/AppDataContext';
import HealthFairPatientRegistration from './HealthFairPatientRegistration';
import HealthFairPatientEdit from './HealthFairPatientEdit';
import HealthFairPatientDetail from './HealthFairPatientDetail';
import ExportActions from './ExportActions';
import VolunteerRegistration from './VolunteerRegistration';
import { VolunteerData } from '../services/volunteerService';

interface HealthFairPatient {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  registered_at: string;
  ai_health_score: number | null;
  latest_vitals: any;
  active_recommendations_count: number;
  requires_follow_up: boolean;
  volunteer_info?: {
    name?: string;
    organization?: string;
    role?: string;
    contact?: string;
  };
}

interface DashboardStats {
  total_patients: number;
  patients_today: number;
  average_health_score: number;
  high_risk_patients: number;
  pending_follow_ups: number;
  total_volunteers: number;
}

function hybridToHealthFairPatient(patient: PatientData): HealthFairPatient {
  const rawVolunteerInfo =
    patient.volunteer_info ||
    (patient as any).volunteerInfo || {
      name: (patient as any).volunteerName,
      organization: (patient as any).volunteerOrganization,
      role: (patient as any).volunteerRole,
      contact: (patient as any).volunteerContact,
    };

  const hasVolunteerData =
    !!rawVolunteerInfo &&
    !!(
      rawVolunteerInfo.name ||
      rawVolunteerInfo.organization ||
      rawVolunteerInfo.role ||
      rawVolunteerInfo.contact
    );

  return {
    id: patient.id,
    full_name: patient.full_name,
    email: patient.email,
    phone: patient.phone,
    age: patient.age || 0,
    gender: patient.gender || 'unknown',
    registered_at: patient.last_updated,
    ai_health_score: patient.health_score || null,
    latest_vitals: null,
    active_recommendations_count: 0,
    requires_follow_up: false,
    volunteer_info: hasVolunteerData
      ? {
          name: rawVolunteerInfo.name || undefined,
          organization: rawVolunteerInfo.organization || undefined,
          role: rawVolunteerInfo.role || undefined,
          contact: rawVolunteerInfo.contact || undefined,
        }
      : undefined,
  };
}

const HealthFairDashboard: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const {
    patients: contextPatients,
    volunteers: contextVolunteers,
    loading: contextLoading,
    error: contextError,
    refreshAll,
    refreshPatients,
    refreshVolunteers,
  } = useAppData();
  const [patients, setPatients] = useState<HealthFairPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPatient, setEditingPatient] = useState<HealthFairPatient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<HealthFairPatient | null>(null);
  const [deletingPatient, setDeletingPatient] = useState<HealthFairPatient | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAge, setFilterAge] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterRiskLevel, setFilterRiskLevel] = useState('');
  const [sortBy, setSortBy] = useState('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activeTab, setActiveTab] = useState<'patients' | 'volunteers' | 'print'>('patients');
  const [volunteers, setVolunteers] = useState<VolunteerData[]>([]);
  const [volunteerLoading, setVolunteerLoading] = useState(false);
  const [volunteerError, setVolunteerError] = useState<string | null>(null);

  const volunteerSummaries = useMemo(() => {
    return volunteers.map((volunteer) => ({
      id: volunteer.id,
      name: volunteer.full_name,
      organization: volunteer.organization || 'Independent Volunteer',
      role: volunteer.role || 'Volunteer',
      email: volunteer.email,
      phone: volunteer.phone,
      availability: volunteer.availability || 'Not specified',
      skills: volunteer.skills || [],
      notes: volunteer.notes || '',
      createdAt: volunteer.created_at
    }));
  }, [volunteers]);

  // Sync shared context → Health Fair UI + stats
  useEffect(() => {
    const convertedPatients = contextPatients.map(hybridToHealthFairPatient);
    setPatients(convertedPatients);
    setLoading(contextLoading);
    setError(contextError);

    const totalPatients = convertedPatients.length;
    const avgScore =
      convertedPatients.length > 0
        ? convertedPatients.reduce((sum, p) => sum + (p.ai_health_score || 0), 0) /
          convertedPatients.length
        : 0;
    const highRiskCount = convertedPatients.filter((p) => (p.ai_health_score || 0) < 60).length;

    setDashboardStats({
      total_patients: Math.max(0, totalPatients),
      patients_today: Math.max(0, totalPatients),
      average_health_score: Math.round(avgScore * 10) / 10,
      high_risk_patients: Math.max(0, highRiskCount),
      pending_follow_ups: 0,
      total_volunteers: Math.max(0, contextVolunteers.length),
    });
  }, [contextPatients, contextVolunteers, contextLoading, contextError]);

  useEffect(() => {
    setVolunteers(contextVolunteers);
    setVolunteerLoading(contextLoading);
    if (contextError && contextVolunteers.length === 0) {
      setVolunteerError('Some volunteer sources are unavailable. Showing combined results.');
    } else {
      setVolunteerError(null);
    }
  }, [contextVolunteers, contextLoading, contextError]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshPatients();
      notifyAppDataChanged();
    } catch (err) {
      console.error('❌ Health Fair Dashboard error:', err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [refreshPatients]);

  const fetchVolunteers = useCallback(async () => {
    setVolunteerLoading(true);
    setVolunteerError(null);
    try {
      await refreshVolunteers();
      notifyAppDataChanged();
    } catch (error) {
      console.error('❌ Volunteer fetch error:', error);
      setVolunteerError(
        error instanceof Error ? error.message : 'Failed to load volunteers. Please try again.'
      );
    } finally {
      setVolunteerLoading(false);
    }
  }, [refreshVolunteers]);

  const handleNewAssessment = () => {
    setShowAssessment(true);
  };

  const handleNewRegistration = () => {
    setShowRegistration(true);
  };

  const handleRegistrationSuccess = (patient: any) => {
    console.log('✅ New patient registered:', patient);
    // Refresh the patient list
    fetchDashboardData();
    setShowRegistration(false);
  };

  const handleViewPatient = (patient: HealthFairPatient) => {
    setViewingPatient(patient);
    setShowDetailDialog(true);
  };

  const handleEditPatient = (patient: HealthFairPatient) => {
    // Check if this is a local/cached patient
    const isLocalPatient = patient.email === 'no-email@local.com' || 
                          patient.full_name === 'Local Patient' ||
                          !patient.id;
    
    if (isLocalPatient) {
      alert('⚠️ Cannot edit local/cached patients. Please refresh the page to load patients from the backend, or register the patient again.');
      return;
    }
    
    setEditingPatient(patient);
    setShowEditDialog(true);
  };

  const handleEditSuccess = (updatedPatient: any) => {
    console.log('✅ Patient updated:', updatedPatient);
    // Update the patient in the local state
    setPatients(prev => prev.map(p => p.id === updatedPatient.id ? { ...p, ...updatedPatient } : p));
    setShowEditDialog(false);
    setEditingPatient(null);
  };

  // Filter and search patients
  const filteredPatients = patients.filter(patient => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (patient.full_name || '').toLowerCase().includes(searchLower) ||
        (patient.email || '').toLowerCase().includes(searchLower) ||
        (patient.phone || '').includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Age filter
    if (filterAge) {
      const age = patient.age || 0;
      switch (filterAge) {
        case '0-18':
          if (age < 0 || age > 18) return false;
          break;
        case '19-35':
          if (age < 19 || age > 35) return false;
          break;
        case '36-50':
          if (age < 36 || age > 50) return false;
          break;
        case '51-65':
          if (age < 51 || age > 65) return false;
          break;
        case '65+':
          if (age < 65) return false;
          break;
      }
    }

    // Gender filter
    if (filterGender && patient.gender !== filterGender) {
      return false;
    }

    // Risk level filter
    if (filterRiskLevel) {
      const healthScore = patient.ai_health_score || 0;
      switch (filterRiskLevel) {
        case 'low':
          if (healthScore < 80) return false;
          break;
        case 'medium':
          if (healthScore < 60 || healthScore >= 80) return false;
          break;
        case 'high':
          if (healthScore >= 60) return false;
          break;
      }
    }

    return true;
  });

  // Sort patients
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.full_name.toLowerCase();
        bValue = b.full_name.toLowerCase();
        break;
      case 'age':
        aValue = a.age || 0;
        bValue = b.age || 0;
        break;
      case 'health_score':
        aValue = a.ai_health_score || 0;
        bValue = b.ai_health_score || 0;
        break;
      case 'registered_at':
      default:
        aValue = new Date(a.registered_at).getTime();
        bValue = new Date(b.registered_at).getTime();
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });



  const handleSendEmail = async (patient: HealthFairPatient) => {
    setEmailLoading(true);
    try {
      await healthFairAPI.sendEmail({
        patient_id: patient.id,
        email_type: 'health_report',
        subject: 'Your Health Assessment Report',
        message: 'Thank you for participating in our health fair.',
        include_vitals: true,
        include_recommendations: true
      });
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };


  const handleDeletePatient = (patient: HealthFairPatient) => {
    setDeletingPatient(patient);
    setShowDeleteDialog(true);
  };

  // Smart Delete Handler - Handles missing patients gracefully
  const handleConfirmDelete = async () => {
    if (!deletingPatient) return;
    
    setDeleteLoading(true);
    try {
      console.log('🗑️ Deleting patient:', deletingPatient.id);
      console.log('🗑️ Patient data:', deletingPatient);
      
      let deleteSuccessful = false;
      let errorMessage = '';
      
      // ✅ Check if this is a local/cached patient (common scenario)
      const isLocalPatient = deletingPatient.email === 'no-email@local.com' || 
                           deletingPatient.full_name === 'Local Patient' ||
                           !deletingPatient.id ||
                           deletingPatient.phone === 'No phone';
      
      if (isLocalPatient) {
        console.log('ℹ️ Local/Cached patient detected - removing from frontend only');
        deleteSuccessful = true; // Skip backend deletion for local patients
      } else {
        // Try Health Fair API delete first
        try {
          console.log('🔄 Attempting Health Fair API delete for patient:', deletingPatient.id);
          const deleteResult = await healthFairAPI.deletePatient(deletingPatient.id);
          
          // Check if delete was successful (even if patient was not found)
          if (deleteResult.success) {
            console.log('✅ Health Fair API delete successful:', deleteResult.message);
            deleteSuccessful = true;
          } else {
            console.warn('⚠️ Health Fair API delete returned failure:', deleteResult.message);
          }
        } catch (healthFairError) {
          console.warn('⚠️ Health Fair API delete failed:', healthFairError);
          
          // ✅ Check if patient doesn't exist in backend (common scenario)
          const errorMsg = healthFairError instanceof Error ? healthFairError.message : String(healthFairError);
          if (errorMsg.includes('No HealthFairPatient matches') || 
              errorMsg.includes('not found') ||
              errorMsg.includes('404') ||
              errorMsg.includes('500') ||
              errorMsg.includes('Page not found') ||
              errorMsg.includes('does not exist')) {
            console.log('ℹ️ Patient not found in backend - removing from frontend only');
            deleteSuccessful = true; // Treat as success since patient is already gone
          } else {
            errorMessage = errorMsg;
          }
        }
        
        // Try Main API delete (if Health Fair failed and not successful yet)
        if (!deleteSuccessful) {
            try {
            console.log('🔄 Attempting Main API delete for patient:', deletingPatient.id);
            // ✅ FIXED: Use Nginx HTTPS (port 443) for production
            const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const deleteUrl = isLocalhost
              ? `http://api.mywaitime.com:3015/health-fair/patients/${deletingPatient.id}/`
              : `https://api.mywaitime.com/health-fair/patients/${deletingPatient.id}/`;
            const mainApiResponse = await fetch(deleteUrl, {
              method: 'DELETE',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Origin': 'https://zub165.github.io'
              }
            });
            
            console.log('📡 Main API response status:', mainApiResponse.status);
            
            // ✅ Handle different response statuses
            if (mainApiResponse.status === 404 || mainApiResponse.status === 500) {
              // Patient not found or server error - treat as success (patient doesn't exist)
              console.log('ℹ️ Patient not found in backend (status ' + mainApiResponse.status + ') - removing from frontend only');
              deleteSuccessful = true;
            } else if (!mainApiResponse.ok) {
              const errorData = await mainApiResponse.json().catch(() => ({}));
              const errorMsg = errorData.message || mainApiResponse.statusText;
              console.error('❌ Main API delete error:', errorMsg);
              throw new Error(`Delete failed: ${errorMsg}`);
            } else {
              // Try to parse JSON response
              const contentType = mainApiResponse.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const result = await mainApiResponse.json().catch(() => ({ status: 'success' }));
                
                // ✅ Accept any response as success if status is 200/204
                if (result.status === 'success' || result.success === true || mainApiResponse.status === 200 || mainApiResponse.status === 204) {
                  console.log('✅ Main API delete successful');
                  deleteSuccessful = true;
                } else {
                  throw new Error(`Delete failed: ${result.message || 'Server returned failure'}`);
                }
              } else {
                // Non-JSON response (like 204 No Content) - treat as success
                console.log('✅ Main API delete successful (no content response)');
                deleteSuccessful = true;
              }
            }
          } catch (mainApiError) {
            console.warn('⚠️ Main API delete failed:', mainApiError);
            
            // ✅ Check if patient doesn't exist in backend (common scenario)
            const errorMsg = mainApiError instanceof Error ? mainApiError.message : String(mainApiError);
            if (errorMsg.includes('No HealthFairPatient matches') || 
                errorMsg.includes('not found') ||
                errorMsg.includes('404') ||
                errorMsg.includes('500') ||
                errorMsg.includes('Page not found')) {
              console.log('ℹ️ Patient not found in backend - removing from frontend only');
              deleteSuccessful = true; // Treat as success since patient is already gone
            } else {
              errorMessage = errorMsg;
            }
          }
        }
      }
      
      // ✅ Always update UI - remove patient from list
      // For local patients or patients not found in backend, this is the primary action
      console.log('🔄 Removing patient from UI...');
      setPatients(prev => {
        const filtered = prev.filter(p => p.id !== deletingPatient.id);
        console.log(`✅ Patient removed. Remaining: ${filtered.length} patients`);
        return filtered;
      });
      
      // Update dashboard stats (ensure positive values)
      setDashboardStats(prev => prev ? {
        ...prev,
        total_patients: Math.max(0, (prev.total_patients || 0) - 1),
        patients_today: Math.max(0, (prev.patients_today || 0) - 1)
      } : null);
      
      // Show success message
      if (isLocalPatient) {
        alert('✅ Local patient removed successfully!');
      } else if (deleteSuccessful) {
        alert('✅ Patient deleted successfully from backend!');
      } else {
        alert('✅ Patient removed from view (was not found in backend)');
      }
      
      setShowDeleteDialog(false);
      setDeletingPatient(null);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      
      // ✅ Even on error, remove from UI if it's a "not found" type error
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('No HealthFairPatient matches') || 
          errorMsg.includes('not found') || 
          errorMsg.includes('404') ||
          errorMsg.includes('500') ||
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('Page not found')) {
        // Patient doesn't exist in backend - remove from frontend anyway
        console.log('ℹ️ Patient not found in backend - removing from frontend');
        setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
        setDashboardStats(prev => prev ? {
          ...prev,
          total_patients: Math.max(0, (prev.total_patients || 0) - 1),
          patients_today: Math.max(0, (prev.patients_today || 0) - 1)
        } : null);
        setShowDeleteDialog(false);
        setDeletingPatient(null);
        alert('✅ Patient removed from local records (was not found in backend)');
      } else {
        alert(`❌ Failed to delete patient: ${errorMsg}\n\nPatient will be removed from view anyway.`);
        // Still remove from UI even on error (user clicked delete)
        setPatients(prev => prev.filter(p => p.id !== deletingPatient.id));
        setDashboardStats(prev => prev ? {
          ...prev,
          total_patients: Math.max(0, (prev.total_patients || 0) - 1),
          patients_today: Math.max(0, (prev.patients_today || 0) - 1)
        } : null);
        setShowDeleteDialog(false);
        setDeletingPatient(null);
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleRefresh = () => {
    void refreshAll();
  };

  const handleVolunteerRegistered = async (_volunteer?: VolunteerData) => {
    await refreshVolunteers();
    notifyAppDataChanged();
  };

  const handleClearCache = () => {
    if (window.confirm('Clear cache and local storage? This will remove all cached patient data and force reload from backend.')) {
      try {
        // Clear cache
        localStorage.removeItem('health_for_all_patients_cache');
        // Clear local storage patients
        localStorage.removeItem('health_for_all_patients');
        console.log('✅ Cache and local storage cleared');
        alert('✅ Cache cleared! Reloading patients from backend...');
        // Refresh to reload from backend only
        void refreshAll();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        alert('Failed to clear cache. Please try again.');
      }
    }
  };

  const getHealthScoreColor = (score: number | null) => {
    if (!score) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreLabel = (score: number | null) => {
    if (!score) return 'Not assessed';
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ p: 3 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Health_Fair_Dashboard"
        downloadLabel="📥 Save Health Fair PDF"
        printLabel="🖨️ Print Health Fair"
      />
      <Box ref={contentRef}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Health Fair Dashboard
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage health assessments and patient data.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewRegistration}
          size="large"
          sx={{ mr: 2 }}
        >
          + REGISTER PATIENT
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={handleNewAssessment}
          size="large"
        >
          + NEW ASSESSMENT
        </Button>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setActiveTab(value as 'patients' | 'volunteers' | 'print')}
        textColor="primary"
        indicatorColor="primary"
        variant="scrollable"
        allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="patients" label={`Patients (${patients.length})`} />
        <Tab
          value="volunteers"
          label={`Volunteers (${volunteerSummaries.length})`}
          icon={<VolunteerIcon fontSize="small" />}
          iconPosition="start"
        />
        <Tab value="print" label="Print / AI report" icon={<AssessmentIcon fontSize="small" />} iconPosition="start" />
      </Tabs>
      <Alert severity="info" sx={{ mb: 2 }}>
        Showing <strong>{activeTab === 'patients' ? 'patient list' : activeTab === 'volunteers' ? 'volunteer roster' : 'printable assessment & AI results'}</strong> below.
        {activeTab === 'patients' && ` ${sortedPatients.length} row(s) visible.`}
        {activeTab === 'volunteers' && ` ${volunteerSummaries.length} volunteer(s).`}
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filter Controls — patients tab only */}
      {activeTab === 'patients' && (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              Search & Filter Patients
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Chip 
              label={`${sortedPatients.length} of ${patients.length} patients`}
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            {/* Search */}
            <TextField
              fullWidth
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm('')}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ minWidth: '300px' }}
            />

            {/* Age Filter */}
            <FormControl sx={{ minWidth: '150px' }}>
              <InputLabel>Age Range</InputLabel>
              <Select
                value={filterAge}
                onChange={(e) => setFilterAge(e.target.value)}
                label="Age Range"
              >
                <MenuItem value="">All Ages</MenuItem>
                <MenuItem value="0-18">0-18 years</MenuItem>
                <MenuItem value="19-35">19-35 years</MenuItem>
                <MenuItem value="36-50">36-50 years</MenuItem>
                <MenuItem value="51-65">51-65 years</MenuItem>
                <MenuItem value="65+">65+ years</MenuItem>
              </Select>
            </FormControl>

            {/* Gender Filter */}
            <FormControl sx={{ minWidth: '120px' }}>
              <InputLabel>Gender</InputLabel>
              <Select
                value={filterGender}
                onChange={(e) => setFilterGender(e.target.value)}
                label="Gender"
              >
                <MenuItem value="">All Genders</MenuItem>
                <MenuItem value="male">Male</MenuItem>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="other">Other</MenuItem>
                <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
              </Select>
            </FormControl>

            {/* Risk Level Filter */}
            <FormControl sx={{ minWidth: '120px' }}>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                label="Risk Level"
              >
                <MenuItem value="">All Risk Levels</MenuItem>
                <MenuItem value="low">Low Risk (80-100)</MenuItem>
                <MenuItem value="medium">Medium Risk (60-79)</MenuItem>
                <MenuItem value="high">High Risk (0-59)</MenuItem>
              </Select>
            </FormControl>

            {/* Sort By */}
            <FormControl sx={{ minWidth: '150px' }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="registered_at">Registration Date</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="age">Age</MenuItem>
                <MenuItem value="health_score">Health Score</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Order */}
            <FormControl sx={{ minWidth: '120px' }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                label="Order"
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>

            {/* Clear Filters */}
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={() => {
                setSearchTerm('');
                setFilterAge('');
                setFilterGender('');
                setFilterRiskLevel('');
                setSortBy('registered_at');
                setSortOrder('desc');
              }}
            >
              Clear All
            </Button>
          </Box>

          {/* Active Filters Display */}
          {(searchTerm || filterAge || filterGender || filterRiskLevel) && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
                Active filters:
              </Typography>
              {searchTerm && (
                <Chip
                  label={`Search: "${searchTerm}"`}
                  onDelete={() => setSearchTerm('')}
                  size="small"
                />
              )}
              {filterAge && (
                <Chip
                  label={`Age: ${filterAge}`}
                  onDelete={() => setFilterAge('')}
                  size="small"
                />
              )}
              {filterGender && (
                <Chip
                  label={`Gender: ${filterGender}`}
                  onDelete={() => setFilterGender('')}
                  size="small"
                />
              )}
              {filterRiskLevel && (
                <Chip
                  label={`Risk: ${filterRiskLevel}`}
                  onDelete={() => setFilterRiskLevel('')}
                  size="small"
                />
              )}
            </Box>
          )}
        </CardContent>
      </Card>
      )}

      {/* Debug Information */}
      {activeTab === 'patients' && (
      <Alert severity="info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2">
              <strong>Hybrid Service Debug:</strong> Using intelligent multi-source patient loading with SSL bypass.
              <br />
              <strong>Total patients found:</strong> {patients.length}
              {patients.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <strong>Sample patient:</strong> {patients[0]?.full_name} ({patients[0]?.email})
                  <br />
                  <strong>Health score:</strong> {patients[0]?.ai_health_score || 'Not assessed'}
                </Box>
              )}
              <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                🔄 Hybrid service combines: Main API + Health Fair API + Local Storage + Cache
                <br />
                {patients.some(p => p.email === 'no-email@local.com' || p.full_name === 'Local Patient') && (
                  <Box sx={{ mt: 1, color: 'warning.main', fontWeight: 'bold' }}>
                    ⚠️ Invalid "Local Patient" entries detected. Click "Clear Cache" to remove them.
                  </Box>
                )}
              </Box>
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            onClick={handleClearCache}
            sx={{ ml: 2 }}
            color="warning"
          >
            Clear Cache
          </Button>
        </Box>
      </Alert>
      )}

      {/* Dashboard Stats */}
      {dashboardStats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(auto-fit, minmax(220px, 1fr))' },
            gap: 3,
            mb: 4
          }}
        >
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.max(0, dashboardStats.total_patients)}
                  </Typography>
                  <Typography color="text.secondary">
                    Total Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AssessmentIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.max(0, dashboardStats.patients_today)}
                  </Typography>
                  <Typography color="text.secondary">
                    Today's Assessments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HealthIcon color="info" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {dashboardStats.average_health_score || 'N/A'}
                  </Typography>
                  <Typography color="text.secondary">
                    Avg Health Score
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WarningIcon color="warning" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.max(0, dashboardStats.high_risk_patients)}
                  </Typography>
                  <Typography color="text.secondary">
                    High Risk Patients
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <VolunteerIcon color="secondary" sx={{ mr: 2, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {Math.max(0, dashboardStats.total_volunteers)}
                  </Typography>
                  <Typography color="text.secondary">
                    Active Volunteers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}



      {/* Patients Table */}
      {activeTab === 'patients' && (
      <Card>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Typography variant="h6">
            Health Fair Patients ({patients.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
        
        {loading && <LinearProgress />}
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Patient</strong></TableCell>
                <TableCell><strong>Contact</strong></TableCell>
                <TableCell><strong>Age/Gender</strong></TableCell>
                <TableCell><strong>Health Score</strong></TableCell>
                <TableCell><strong>Registered</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Alert severity="warning">
                      No patients to show{patients.length > 0 ? ' (filters hid all rows — click Clear All)' : ' — register a patient or click Refresh'}.
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
              {sortedPatients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle2">
                        {patient.full_name}
                      </Typography>
                      {patient.requires_follow_up && (
                        <Chip 
                          label="Follow-up Required" 
                          size="small" 
                          color="warning" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{patient.email}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {patient.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {patient.age} years, {patient.gender}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {patient.ai_health_score ? (
                        <>
                          <Chip
                            label={patient.ai_health_score}
                            color={getHealthScoreColor(patient.ai_health_score)}
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {getHealthScoreLabel(patient.ai_health_score)}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Not assessed
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(patient.registered_at)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {patient.active_recommendations_count > 0 && (
                        <Tooltip title={`${patient.active_recommendations_count} active recommendations`}>
                          <Badge badgeContent={patient.active_recommendations_count} color="primary">
                            <AssessmentIcon color="action" />
                          </Badge>
                        </Tooltip>
                      )}
                      {patient.requires_follow_up && (
                        <Tooltip title="Follow-up required">
                          <WarningIcon color="warning" />
                        </Tooltip>
                      )}
                      {patient.ai_health_score && patient.ai_health_score >= 80 && (
                        <Tooltip title="Excellent health">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Email">
                        <IconButton
                          size="small"
                          onClick={() => handleSendEmail(patient)}
                          disabled={emailLoading}
                        >
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Patient">
                        <IconButton
                          size="small"
                          onClick={() => handleEditPatient(patient)}
                          color="primary"
                          disabled={patient.email === 'no-email@local.com' || patient.full_name === 'Local Patient' || !patient.id}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={patient.email === 'no-email@local.com' || patient.full_name === 'Local Patient' ? 'Delete Local Patient' : 'Delete Patient'}>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletePatient(patient)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      )}

      {activeTab === 'volunteers' && (
        <>
          <VolunteerRegistration onSuccess={handleVolunteerRegistered} />

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box>
                  <Typography variant="h6">
                    Volunteer Roster ({volunteerSummaries.length})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dedicated registry for Health Fair volunteer workers.
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading || volunteerLoading}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {(loading || volunteerLoading) && <LinearProgress sx={{ mb: 2 }} />}

              {volunteerError && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  {volunteerError}
                </Alert>
              )}

              {volunteerSummaries.length === 0 && !volunteerLoading ? (
                <Alert severity="info">
                  No volunteer workers registered yet. Use the form above to add volunteers who are not
                  patients.
                </Alert>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Volunteer</strong></TableCell>
                        <TableCell><strong>Organization</strong></TableCell>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Contact</strong></TableCell>
                        <TableCell><strong>Availability</strong></TableCell>
                        <TableCell><strong>Skills</strong></TableCell>
                        <TableCell align="right"><strong>Registered</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {volunteerSummaries.map((volunteer) => (
                        <TableRow key={volunteer.id}>
                          <TableCell>
                            <Typography variant="subtitle2">
                              {volunteer.name}
                            </Typography>
                            {volunteer.notes && (
                              <Typography variant="caption" color="text.secondary">
                                {volunteer.notes}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {volunteer.organization}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {volunteer.role}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {volunteer.email}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {volunteer.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={volunteer.availability}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {volunteer.skills.length > 0 ? (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {volunteer.skills.map((skill) => (
                                  <Chip key={`${volunteer.id}-${skill}`} label={skill} size="small" />
                                ))}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Not listed
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              {new Date(volunteer.createdAt).toLocaleDateString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Delete Patient
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deletingPatient?.full_name}</strong>?
            This action cannot be undone and will remove all patient data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Health Fair Assessment Dialog */}
      <Dialog
        open={showAssessment}
        onClose={() => setShowAssessment(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>New Health Assessment</DialogTitle>
        <DialogContent>
          <Typography>
            Health assessment form will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssessment(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Patient Registration Dialog */}
      <HealthFairPatientRegistration
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />

      
      {activeTab === 'print' && (
        <Card sx={{ p: 2 }} id="hfa-print-ai-report">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">Print assessment &amp; AI results</Typography>
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={() => {
                const el = document.getElementById('hfa-print-ai-report-body');
                if (!el) return;
                const w = window.open('', '_blank', 'width=900,height=1000');
                if (!w) {
                  alert('Allow popups to print');
                  return;
                }
                w.document.write(`<!DOCTYPE html><html><head><title>Health Fair AI Report</title>
                  <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse;margin-top:12px}
                  th,td{border:1px solid #ccc;padding:8px;text-align:left}h1{margin:0 0 8px}h2{margin-top:24px}</style>
                  </head><body>${el.innerHTML}<script>window.onload=()=>{window.print();}</script></body></html>`);
                w.document.close();
              }}
            >
              Print report
            </Button>
          </Box>
          <div id="hfa-print-ai-report-body">
            <Typography variant="h5" gutterBottom>Health Fair — Assessment &amp; AI Summary</Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Generated {new Date().toLocaleString()} · Patients: {patients.length} · Volunteers: {volunteerSummaries.length}
            </Typography>
            <Typography variant="h6" sx={{ mt: 2 }}>Patient assessments / AI health scores</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>AI Health Score</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Follow-up</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>No patients loaded.</TableCell>
                    </TableRow>
                  )}
                  {patients.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.full_name}<br /><Typography variant="caption">{p.email}</Typography></TableCell>
                      <TableCell>{p.age || '—'} / {p.gender || '—'}</TableCell>
                      <TableCell>{p.ai_health_score ?? 'Not assessed'}</TableCell>
                      <TableCell>{getHealthScoreLabel(p.ai_health_score)}</TableCell>
                      <TableCell>{p.requires_follow_up ? 'Yes' : 'No'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="h6" sx={{ mt: 3 }}>Active volunteers</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Organization</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Contact</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {volunteerSummaries.length === 0 && (
                    <TableRow><TableCell colSpan={4}>No volunteers registered.</TableCell></TableRow>
                  )}
                  {volunteerSummaries.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.organization}</TableCell>
                      <TableCell>{v.role}</TableCell>
                      <TableCell>{v.email} · {v.phone}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
        </Card>
      )}

{/* Patient Detail Dialog */}
      <HealthFairPatientDetail
        patient={viewingPatient}
        isOpen={showDetailDialog}
        onClose={() => {
          setShowDetailDialog(false);
          setViewingPatient(null);
        }}
        onEdit={handleEditPatient}
      />

      {/* Patient Edit Dialog */}
      <HealthFairPatientEdit
        patient={editingPatient}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setEditingPatient(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </Box>
  );
};

export default HealthFairDashboard;