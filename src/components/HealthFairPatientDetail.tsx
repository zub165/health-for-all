import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  HealthAndSafety as HealthIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  LocalHospital as HospitalIcon,
  Medication as MedicationIcon,
  Group as FamilyIcon,
  Emergency as EmergencyIcon,
  VolunteerActivism as VolunteerIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import HealthScoreRecommendationPrint from './HealthScoreRecommendationPrint';

interface HealthFairPatientDetailProps {
  patient: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (patient: any) => void;
}

const HealthFairPatientDetail: React.FC<HealthFairPatientDetailProps> = ({
  patient,
  isOpen,
  onClose,
  onEdit
}) => {
  const [loading, setLoading] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const printContentRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !patient) {
    return null;
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Low Risk';
    if (score >= 60) return 'Medium Risk';
    return 'High Risk';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatArrayData = (data: any) => {
    if (Array.isArray(data)) {
      return data.length > 0 ? data.join(', ') : 'None';
    }
    return data || 'None';
  };

  const handleDownloadPDF = async () => {
    if (!printContentRef.current) return;

    setDownloadingPDF(true);
    try {
      // Create a canvas from the print content
      const canvas = await html2canvas(printContentRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Calculate PDF dimensions
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Generate filename
      const patientName = patient.full_name || patient.name || 'Patient';
      const date = new Date().toISOString().split('T')[0];
      const filename = `Health_Report_${patientName.replace(/\s+/g, '_')}_${date}.pdf`;
      
      // Download PDF
      pdf.save(filename);
      
      console.log('✅ PDF downloaded successfully:', filename);
    } catch (error) {
      console.error('❌ Error generating PDF:', error);
      alert('Failed to generate PDF. Please try using the Print button instead.');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" component="h2">
              {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Patient ID: {patient.id}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Edit Patient">
            <IconButton
              onClick={() => onEdit(patient)}
              color="primary"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading && <LinearProgress />}
        
        <Box sx={{ p: 3 }}>
          {/* Health Score Alert */}
          {patient.ai_health_score && (
            <Alert 
              severity={patient.ai_health_score >= 80 ? 'success' : patient.ai_health_score >= 60 ? 'warning' : 'error'}
              sx={{ mb: 3 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <HealthIcon />
                <Box>
                  <Typography variant="h6">
                    Health Score: {patient.ai_health_score}/100
                  </Typography>
                  <Typography variant="body2">
                    Risk Level: {getHealthScoreLabel(patient.ai_health_score)}
                  </Typography>
                </Box>
                <Chip
                  label={getHealthScoreLabel(patient.ai_health_score)}
                  color={getHealthScoreColor(patient.ai_health_score)}
                  size="medium"
                />
              </Box>
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Personal Information */}
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon sx={{ mr: 1 }} />
                    Personal Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Full Name
                      </Typography>
                      <Typography variant="body1">
                        {patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Email
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" />
                        {patient.email || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Phone
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        {patient.phone || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Age
                      </Typography>
                      <Typography variant="body1">
                        {patient.age || 'Not provided'} years old
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Gender
                      </Typography>
                      <Typography variant="body1">
                        {patient.gender || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Blood Group
                      </Typography>
                      <Typography variant="body1">
                        {patient.blood_group || patient.bloodGroup || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Address
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <HomeIcon fontSize="small" sx={{ mt: 0.5 }} />
                        {patient.address || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Emergency Contact */}
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmergencyIcon sx={{ mr: 1 }} />
                    Emergency Contact
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Emergency Contact Name
                      </Typography>
                      <Typography variant="body1">
                        {patient.emergency_contact_name || patient.emergencyContactName || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Emergency Contact Phone
                      </Typography>
                      <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" />
                        {patient.emergency_contact_phone || patient.emergencyContactPhone || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Medical Information */}
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <HospitalIcon sx={{ mr: 1 }} />
                    Medical Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Past Medical History
                      </Typography>
                      <Typography variant="body1">
                        {formatArrayData(patient.medical_history || patient.pastMedicalHistory)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Allergies
                      </Typography>
                      <Typography variant="body1">
                        {formatArrayData(patient.allergies)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Family History
                      </Typography>
                      <Typography variant="body1">
                        {patient.family_history || patient.familyHistory || 'None'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Current Medications
                      </Typography>
                      <Typography variant="body1">
                        {formatArrayData(patient.current_medications || patient.currentMedications)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Insurance Provider
                      </Typography>
                      <Typography variant="body1">
                        {patient.insurance_provider || patient.insuranceProvider || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Volunteer Information */}
            <Box sx={{ flex: '1 1 400px', minWidth: '400px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <VolunteerIcon sx={{ mr: 1 }} />
                    Volunteer Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Volunteer Name
                      </Typography>
                      <Typography variant="body1">
                        {patient.volunteer_info?.name || patient.volunteerName || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Organization
                      </Typography>
                      <Typography variant="body1">
                        {patient.volunteer_info?.organization || patient.volunteerOrganization || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Role
                      </Typography>
                      <Typography variant="body1">
                        {patient.volunteer_info?.role || patient.volunteerRole || 'Not provided'}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Contact
                      </Typography>
                      <Typography variant="body1">
                        {patient.volunteer_info?.contact || patient.volunteerContact || 'Not provided'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Registration Information */}
            <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Registration Information
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Registration Date
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(patient.registered_at || patient.created_at || new Date().toISOString())}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(patient.last_updated || patient.updated_at || new Date().toISOString())}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Follow-up Required
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {patient.requires_follow_up ? (
                            <>
                              <WarningIcon color="warning" fontSize="small" />
                              <Typography variant="body1" color="warning.main">
                                Yes
                              </Typography>
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon color="success" fontSize="small" />
                              <Typography variant="body1" color="success.main">
                                No
                              </Typography>
                            </>
                          )}
                        </Box>
                      </Box>
                    </Box>
                    
                    <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Active Recommendations
                        </Typography>
                        <Typography variant="body1">
                          {patient.active_recommendations_count || 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
        >
          Close
        </Button>
        <Button
          variant="outlined"
          startIcon={downloadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={() => setShowPrintDialog(true)}
          disabled={downloadingPDF}
        >
          {downloadingPDF ? 'Generating PDF...' : '📥 Download PDF'}
        </Button>
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={() => setShowPrintDialog(true)}
        >
          Print Report
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => onEdit(patient)}
        >
          Edit Patient
        </Button>
      </DialogActions>

      {/* Print Dialog */}
      <Dialog
        open={showPrintDialog}
        onClose={() => setShowPrintDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            '@media print': {
              margin: 0,
              maxWidth: '100%',
              height: '100%',
            },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Health Score & Recommendations Report</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={downloadingPDF ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              sx={{ '@media print': { display: 'none' } }}
            >
              {downloadingPDF ? 'Generating...' : 'Download PDF'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={() => {
                window.print();
              }}
              sx={{ '@media print': { display: 'none' } }}
            >
              Print
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPrintDialog(false)}
              sx={{ '@media print': { display: 'none' } }}
            >
              Close
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ '@media print': { p: 0 } }}>
          <div ref={printContentRef}>
            <HealthScoreRecommendationPrint
              patient={patient}
              healthScore={patient.ai_health_score || patient.health_risk_score || patient.healthScore}
              recommendations={patient.recommendations || patient.doctorRecommendations?.text || patient.ai_health_insights?.recommendations?.join('\n\n')}
              doctorName={patient.doctorRecommendations?.doctor || 'Health Fair'}
              date={patient.last_updated || patient.updated_at || patient.registered_at || new Date().toLocaleDateString()}
            />
          </div>
        </DialogContent>
        <DialogActions sx={{ '@media print': { display: 'none' } }}>
          <Button onClick={() => setShowPrintDialog(false)}>Close</Button>
          <Button
            variant="outlined"
            startIcon={downloadingPDF ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            color="primary"
          >
            {downloadingPDF ? 'Generating PDF...' : '📥 Download PDF'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              window.print();
            }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default HealthFairPatientDetail;
