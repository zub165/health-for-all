import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Gavel as GavelIcon,
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const LegalDisclaimers: React.FC = () => {
  const [showDisclaimerDialog, setShowDisclaimerDialog] = useState(false);
  const [acceptedDisclaimers, setAcceptedDisclaimers] = useState({
    medicalDisclaimer: false,
    hipaaCompliance: false,
    dataProtection: false,
    liabilityLimitation: false,
    professionalUse: false,
  });

  const handleAcceptAll = () => {
    setAcceptedDisclaimers({
      medicalDisclaimer: true,
      hipaaCompliance: true,
      dataProtection: true,
      liabilityLimitation: true,
      professionalUse: true,
    });
    setShowDisclaimerDialog(false);
  };

  const allAccepted = Object.values(acceptedDisclaimers).every(Boolean);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <GavelIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" color="primary">
            Legal Disclaimers & HIPAA Compliance
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Health For All Volunteer Organization - Legal and Compliance Information
        </Typography>

        {/* Critical Legal Notice */}
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ IMPORTANT LEGAL NOTICE
          </Typography>
          <Typography variant="body2">
            This application is designed for volunteer health organizations and educational purposes only. 
            All users must read and accept the legal disclaimers before accessing patient data.
          </Typography>
        </Alert>

        {/* Medical Disclaimer */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              🏥 Medical Disclaimer
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Alert severity="error" sx={{ mb: 2 }}>
                <strong>CRITICAL MEDICAL DISCLAIMER</strong>
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>1. NOT A SUBSTITUTE FOR PROFESSIONAL MEDICAL CARE</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This application and its health assessments are for educational and screening purposes only. 
                They are NOT intended to replace professional medical diagnosis, treatment, or advice from 
                qualified healthcare providers.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>2. EMERGENCY SITUATIONS</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                In case of medical emergency, call 911 or your local emergency services immediately. 
                Do not rely on this application for emergency medical decisions.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>3. ACCURACY OF INFORMATION</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                While we strive for accuracy, health information and assessments provided by this 
                application may not be complete, accurate, or up-to-date. Always consult with 
                qualified healthcare professionals for medical decisions.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>4. LIMITATIONS OF HEALTH SCREENING</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Health screenings and assessments are not diagnostic tools and should not be used 
                to diagnose, treat, cure, or prevent any disease or medical condition.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>5. USER RESPONSIBILITY</strong>
              </Typography>
              <Typography variant="body2">
                Users are responsible for their own health decisions and should always seek 
                professional medical advice for any health concerns.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* HIPAA Compliance */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              🔐 HIPAA Compliance Statement
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>HIPAA COMPLIANCE FOR VOLUNTEER ORGANIZATIONS</strong>
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>1. DATA PROTECTION MEASURES</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="✅ All patient data is encrypted in transit and at rest" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="✅ Access controls limit data to authorized medical staff only" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="✅ Complete audit logging of all data access" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="✅ No patient data stored in browser localStorage" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="✅ HTTPS encryption for all data transmission" />
                </ListItem>
              </List>

              <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
                <strong>2. PATIENT RIGHTS</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                Patients have the right to:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Access their medical records" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Request corrections to their data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Request deletion of their data" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Restrict how their data is used" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Receive a copy of their data" />
                </ListItem>
              </List>

              <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
                <strong>3. DATA RETENTION POLICY</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Patient data is retained for 7 years as required by law, then securely deleted. 
                All data handling complies with HIPAA regulations for volunteer health organizations.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
                <strong>4. BREACH NOTIFICATION</strong>
              </Typography>
              <Typography variant="body2">
                In the event of a data breach, affected patients will be notified within 60 days 
                as required by HIPAA regulations.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Data Protection */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              🛡️ Data Protection & Privacy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>1. INFORMATION COLLECTION</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                We collect only the minimum necessary health information required for health 
                assessments and screenings. All data collection is done with explicit patient consent.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>2. DATA USAGE</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Patient data is used solely for:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• Health assessments and screenings" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Medical recommendations" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Follow-up care coordination" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Educational health programs" />
                </ListItem>
              </List>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>3. DATA SHARING</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                We do not sell, trade, or share patient information with third parties without 
                explicit written consent, except as required by law or for emergency medical care.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>4. SECURITY MEASURES</strong>
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="• End-to-end encryption for all data transmission" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Secure server infrastructure with regular security updates" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Multi-factor authentication for authorized users" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="• Regular security audits and penetration testing" />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Liability Limitation */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              ⚖️ Liability Limitation
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <strong>LIMITATION OF LIABILITY</strong>
              </Alert>
              
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>1. NO MEDICAL LIABILITY</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Health For All Volunteer Organization, its staff, volunteers, and technology providers 
                are not liable for any medical decisions, diagnoses, treatments, or health outcomes 
                based on information from this application.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>2. EDUCATIONAL USE ONLY</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This application is designed for educational and screening purposes. Users assume 
                full responsibility for their health decisions and should always consult qualified 
                healthcare professionals.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>3. TECHNOLOGY LIMITATIONS</strong>
              </Typography>
              <Typography variant="body2">
                While we strive for accuracy, technology limitations may affect the reliability 
                of health assessments. Users acknowledge these limitations and agree to use the 
                application at their own risk.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Professional Use Agreement */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              👨‍⚕️ Professional Use Agreement
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>1. AUTHORIZED USERS ONLY</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                This application is intended for use by authorized medical professionals, 
                healthcare volunteers, and qualified health workers only. Unauthorized access 
                is strictly prohibited.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>2. PROFESSIONAL STANDARDS</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Users must maintain professional standards of care and follow all applicable 
                medical ethics guidelines and regulations.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>3. CONTINUING EDUCATION</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Users are responsible for staying current with medical knowledge and best 
                practices. This application does not replace ongoing medical education.
              </Typography>

              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>4. REPORTING REQUIREMENTS</strong>
              </Typography>
              <Typography variant="body2">
                Users must report any suspected data breaches, security incidents, or 
                inappropriate use of the application immediately to the system administrators.
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Contact Information */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary.contrastText">
            📞 Contact Information
          </Typography>
          <Typography variant="body2" color="primary.contrastText" sx={{ mb: 1 }}>
            For questions about legal disclaimers, HIPAA compliance, or data protection:
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            Email: legal@healthforall.org
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            Phone: (555) 123-4567
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            Address: Health For All Volunteer Organization, 123 Medical Plaza, Health City, HC 12345
          </Typography>
        </Box>

        {/* Acceptance Button */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            onClick={() => setShowDisclaimerDialog(true)}
            startIcon={<CheckCircleIcon />}
            sx={{ minWidth: 200 }}
          >
            Accept Legal Disclaimers
          </Button>
        </Box>
      </Paper>

      {/* Disclaimer Acceptance Dialog */}
      <Dialog
        open={showDisclaimerDialog}
        onClose={() => setShowDisclaimerDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
            Legal Disclaimer Acceptance
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>⚠️ IMPORTANT:</strong> You must accept all legal disclaimers to use this application.
          </Alert>
          
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please check each box to indicate your understanding and acceptance:
          </Typography>

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedDisclaimers.medicalDisclaimer}
                onChange={(e) => setAcceptedDisclaimers(prev => ({ 
                  ...prev, 
                  medicalDisclaimer: e.target.checked 
                }))}
              />
            }
            label="I understand this application is for educational purposes only and not a substitute for professional medical care."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedDisclaimers.hipaaCompliance}
                onChange={(e) => setAcceptedDisclaimers(prev => ({ 
                  ...prev, 
                  hipaaCompliance: e.target.checked 
                }))}
              />
            }
            label="I agree to comply with HIPAA regulations and protect patient data confidentiality."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedDisclaimers.dataProtection}
                onChange={(e) => setAcceptedDisclaimers(prev => ({ 
                  ...prev, 
                  dataProtection: e.target.checked 
                }))}
              />
            }
            label="I understand the data protection measures and patient privacy rights."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedDisclaimers.liabilityLimitation}
                onChange={(e) => setAcceptedDisclaimers(prev => ({ 
                  ...prev, 
                  liabilityLimitation: e.target.checked 
                }))}
              />
            }
            label="I accept the limitation of liability and understand the educational nature of this application."
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedDisclaimers.professionalUse}
                onChange={(e) => setAcceptedDisclaimers(prev => ({ 
                  ...prev, 
                  professionalUse: e.target.checked 
                }))}
              />
            }
            label="I agree to use this application professionally and report any security incidents."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDisclaimerDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAcceptAll}
            disabled={!allAccepted}
            startIcon={<CheckCircleIcon />}
          >
            Accept All Disclaimers
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LegalDisclaimers;
