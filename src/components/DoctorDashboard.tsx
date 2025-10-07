import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Patient, Vitals } from '../types';
import { patientApi, vitalsApi } from '../services/api';
import VitalsTracking from './VitalsTracking';
import RecommendationForm from './RecommendationForm';

interface DoctorDashboardProps {
  doctorName: string;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctorName }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [showRecommendationForm, setShowRecommendationForm] = useState(false);
  const [patientVitals, setPatientVitals] = useState<Vitals[]>([]);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    const filtered = patients.filter(patient =>
      (patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (patient.phoneNumber || patient.phone || '').includes(searchTerm)
    );
    setFilteredPatients(filtered);
  }, [patients, searchTerm]);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientApi.getAll();
      if (response.success && response.data) {
        setPatients(response.data);
      } else {
        setError(response.message || 'Failed to fetch patients');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientVitals = async (patientId: string) => {
    try {
      const response = await vitalsApi.getByPatientId(patientId);
      if (response.success && response.data) {
        setPatientVitals(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch patient vitals:', err);
    }
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    fetchPatientVitals(patient.id!);
  };

  const handleRecordVitals = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowVitalsForm(true);
  };

  const handleVitalsRecorded = (vitals: Vitals) => {
    setShowVitalsForm(false);
    setShowRecommendationForm(true);
    fetchPatientVitals(selectedPatient!.id!);
  };

  const handleSendRecommendation = () => {
    setShowRecommendationForm(false);
    setSelectedPatient(null);
  };

  const getBloodSugarStatus = (bloodSugar: number | undefined) => {
    if (bloodSugar === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (bloodSugar < 70) return { label: 'Low', color: 'warning' as const };
    if (bloodSugar > 140) return { label: 'High', color: 'error' as const };
    return { label: 'Normal', color: 'success' as const };
  };

  const getMentalHealthStatus = (score: number | undefined) => {
    if (score === undefined) return { label: 'Not Recorded', color: 'default' as const };
    if (score <= 4) return { label: 'Minimal', color: 'success' as const };
    if (score <= 9) return { label: 'Mild', color: 'info' as const };
    if (score <= 14) return { label: 'Moderate', color: 'warning' as const };
    if (score <= 19) return { label: 'Moderately Severe', color: 'error' as const };
    return { label: 'Severe', color: 'error' as const };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Doctor Dashboard - {doctorName}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Manage patient records and health screenings
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>

        {/* Patients List */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {filteredPatients.map((patient) => (
              <Box key={patient.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">{patient.name}</Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Email:</strong> {patient.email}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Phone:</strong> {patient.phoneNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>Blood Group:</strong> {patient.bloodGroup}
                    </Typography>
                    
                    <Box mt={2}>
                      <Chip
                        label={`Allergies: ${(patient.allergies || '').split(',').filter(a => a.trim()).length} items`}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewPatient(patient)}
                    >
                      View Details
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<HealthIcon />}
                      onClick={() => handleRecordVitals(patient)}
                    >
                      Record Vitals
                    </Button>
                  </CardActions>
                </Card>
              </Box>
            ))}
          </Box>
        )}

        {filteredPatients.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="text.secondary">
              No patients found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search terms' : 'No patients have registered yet'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Patient Details Dialog */}
      <Dialog
        open={!!selectedPatient && !showVitalsForm && !showRecommendationForm}
        onClose={() => setSelectedPatient(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Patient Details - {selectedPatient?.name}
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>Personal Information</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Name" secondary={selectedPatient.name} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Email" secondary={selectedPatient.email} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Phone" secondary={selectedPatient.phoneNumber} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Blood Group" secondary={selectedPatient.bloodGroup} />
                  </ListItem>
                </List>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>Medical Information</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Past Medical History" 
                      secondary={selectedPatient.pastMedicalHistory} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Allergies" 
                      secondary={selectedPatient.allergies} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Family History" 
                      secondary={selectedPatient.familyHistory} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Current Medications" 
                      secondary={selectedPatient.medicationList} 
                    />
                  </ListItem>
                </List>
              </Box>

              {patientVitals.length > 0 && (
                <Box sx={{ width: '100%' }}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Vitals History</Typography>
                  {patientVitals.map((vitals, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Blood Sugar: {vitals.bloodSugar} mg/dL
                            </Typography>
                            <Chip
                              label={getBloodSugarStatus(vitals.bloodSugar).label}
                              color={getBloodSugarStatus(vitals.bloodSugar).color}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Carotid Doppler: {vitals.carotidDoppler}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Mental Health Score: {vitals.mentalHealthScore}/27
                            </Typography>
                            <Chip
                              label={getMentalHealthStatus(vitals.mentalHealthScore).label}
                              color={getMentalHealthStatus(vitals.mentalHealthScore).color}
                              size="small"
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Recorded: {new Date(vitals.recordedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedPatient(null)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<HealthIcon />}
            onClick={() => {
              setShowVitalsForm(true);
            }}
          >
            Record New Vitals
          </Button>
        </DialogActions>
      </Dialog>

      {/* Vitals Tracking Dialog */}
      {selectedPatient && showVitalsForm && (
        <Dialog
          open={showVitalsForm}
          onClose={() => setShowVitalsForm(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <VitalsTracking
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleVitalsRecorded}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Recommendation Form Dialog */}
      {selectedPatient && showRecommendationForm && (
        <Dialog
          open={showRecommendationForm}
          onClose={() => setShowRecommendationForm(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogContent sx={{ p: 0 }}>
            <RecommendationForm
              patient={selectedPatient}
              doctorName={doctorName}
              onSuccess={handleSendRecommendation}
            />
          </DialogContent>
        </Dialog>
      )}
    </Container>
  );
};

export default DoctorDashboard;
