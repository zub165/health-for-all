import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface PatientConsentFormProps {
  onConsentGiven: (consentData: ConsentData) => void;
  patientData?: any;
}

interface ConsentData {
  medicalScreening: boolean;
  dataCollection: boolean;
  volunteerService: boolean;
  emergencyContact: boolean;
  followUpCare: boolean;
  educationalUse: boolean;
  privacyRights: boolean;
  liabilityAcknowledgment: boolean;
  volunteerLimitations: boolean;
  emergencyProtocols: boolean;
}

const PatientConsentForm: React.FC<PatientConsentFormProps> = ({ onConsentGiven, patientData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [consentData, setConsentData] = useState<ConsentData>({
    medicalScreening: false,
    dataCollection: false,
    volunteerService: false,
    emergencyContact: false,
    followUpCare: false,
    educationalUse: false,
    privacyRights: false,
    liabilityAcknowledgment: false,
    volunteerLimitations: false,
    emergencyProtocols: false,
  });

  const [showDetailedConsent, setShowDetailedConsent] = useState(false);

  const handleConsentChange = (field: keyof ConsentData, value: boolean) => {
    setConsentData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onConsentGiven(consentData);
  };

  const allRequiredConsents = Object.values(consentData).every(Boolean);

  const steps = [
    'Medical Screening Consent',
    'Data Collection & Privacy',
    'Volunteer Service Agreement',
    'Emergency Protocols',
    'Final Acknowledgment'
  ];

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>🏥 Medical Screening Consent</strong>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              I understand that this is a <strong>volunteer health screening service</strong> provided by 
              Health For All Volunteer Organization for educational and community health purposes.
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>What this screening includes:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Basic health assessments and vitals measurement" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Health risk evaluation and recommendations" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Educational health information and resources" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Follow-up care coordination if needed" />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>⚠️ IMPORTANT:</strong> This screening is NOT a substitute for professional medical care. 
              Always consult qualified healthcare providers for medical decisions.
            </Alert>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.medicalScreening}
                  onChange={(e) => handleConsentChange('medicalScreening', e.target.checked)}
                />
              }
              label="I consent to participate in the volunteer health screening and understand its educational nature."
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>🔐 Data Collection & Privacy Rights</strong>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>What information we collect:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Basic demographic information (age, gender, contact)" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Health history and current medications" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Vital signs and health measurements" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Health assessment results and recommendations" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>How we protect your data:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• All data is encrypted and stored securely" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Only authorized medical volunteers can access your data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Complete audit logging of all data access" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Data is retained for 7 years as required by law" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Your privacy rights:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Right to access your health information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Right to request corrections to your data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Right to request deletion of your data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Right to restrict how your data is used" />
              </ListItem>
            </List>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.dataCollection}
                  onChange={(e) => handleConsentChange('dataCollection', e.target.checked)}
                />
              }
              label="I consent to the collection and use of my health information for screening purposes."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.privacyRights}
                  onChange={(e) => handleConsentChange('privacyRights', e.target.checked)}
                />
              }
              label="I understand my privacy rights and how my data will be protected."
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>🤝 Volunteer Service Agreement</strong>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Volunteer Health Service Limitations:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• This is a volunteer service, not professional medical care" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Screenings are for educational and community health purposes" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Results are not diagnostic and should not replace medical consultation" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Emergency situations require immediate professional medical attention" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>What volunteers can provide:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• Basic health screenings and measurements" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Health education and wellness information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Referrals to appropriate healthcare providers" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Community health resources and support" />
              </ListItem>
            </List>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>⚠️ VOLUNTEER SERVICE DISCLAIMER:</strong> This service is provided by trained volunteers 
              but is not a substitute for professional medical care. Always consult qualified healthcare 
              providers for medical decisions.
            </Alert>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.volunteerService}
                  onChange={(e) => handleConsentChange('volunteerService', e.target.checked)}
                />
              }
              label="I understand this is a volunteer service and not professional medical care."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.volunteerLimitations}
                  onChange={(e) => handleConsentChange('volunteerLimitations', e.target.checked)}
                />
              }
              label="I acknowledge the limitations of volunteer health services."
            />
          </Box>
        );

      case 3:
        return (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              <strong>🚨 Emergency Protocols & Safety</strong>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Emergency Situations:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• In case of medical emergency, call 911 immediately" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Do not rely on this screening for emergency medical decisions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Emergency contact information will be collected for safety" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Volunteers are trained in basic first aid and emergency response" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Safety Measures:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• All equipment is sanitized between uses" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Volunteers follow proper infection control protocols" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Privacy and confidentiality are maintained at all times" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Qualified medical supervision is available when needed" />
              </ListItem>
            </List>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.emergencyContact}
                  onChange={(e) => handleConsentChange('emergencyContact', e.target.checked)}
                />
              }
              label="I consent to providing emergency contact information for safety purposes."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.emergencyProtocols}
                  onChange={(e) => handleConsentChange('emergencyProtocols', e.target.checked)}
                />
              }
              label="I understand the emergency protocols and will call 911 for medical emergencies."
            />
          </Box>
        );

      case 4:
        return (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>✅ Final Acknowledgment</strong>
            </Alert>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Legal Protection for Volunteer Organization:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• This is a volunteer educational service, not professional medical care" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Health For All Volunteer Organization is protected from liability for educational services" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Participants assume responsibility for their own health decisions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• All services are provided in good faith for community health education" />
              </ListItem>
            </List>

            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Follow-up Care:</strong>
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="• We may contact you with health recommendations and resources" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• You may receive educational health materials" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Referrals to appropriate healthcare providers may be provided" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• You can opt out of follow-up communications at any time" />
              </ListItem>
            </List>

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.followUpCare}
                  onChange={(e) => handleConsentChange('followUpCare', e.target.checked)}
                />
              }
              label="I consent to follow-up care coordination and educational communications."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.educationalUse}
                  onChange={(e) => handleConsentChange('educationalUse', e.target.checked)}
                />
              }
              label="I understand this is for educational purposes and community health improvement."
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={consentData.liabilityAcknowledgment}
                  onChange={(e) => handleConsentChange('liabilityAcknowledgment', e.target.checked)}
                />
              }
              label="I acknowledge the volunteer nature of this service and release Health For All from liability for educational health screening."
            />
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <AssignmentIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" color="primary">
            Patient Consent Form
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Health For All Volunteer Organization - Comprehensive Consent Agreement
        </Typography>

        {/* Critical Legal Notice */}
        <Alert severity="warning" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            ⚠️ IMPORTANT LEGAL NOTICE
          </Typography>
          <Typography variant="body2">
            This is a <strong>volunteer health screening service</strong> for educational and community health purposes. 
            It is NOT a substitute for professional medical care. Please read and understand all terms before proceeding.
          </Typography>
        </Alert>

        {/* Stepper */}
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
                <StepContent>
                  <Box sx={{ mb: 2 }}>
                    {getStepContent(index)}
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(index + 1)}
                      sx={{ mt: 1, mr: 1 }}
                      disabled={index === 0 && !consentData.medicalScreening}
                    >
                      {index === steps.length - 1 ? 'Complete' : 'Continue'}
                    </Button>
                    <Button
                      disabled={index === 0}
                      onClick={() => setActiveStep(index - 1)}
                      sx={{ mt: 1, mr: 1 }}
                    >
                      Back
                    </Button>
                  </Box>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Box>

        {/* Summary */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            📋 Consent Summary
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {Object.entries(consentData).map(([key, value]) => (
              <Chip
                key={key}
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                color={value ? 'success' : 'default'}
                size="small"
              />
            ))}
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => setShowDetailedConsent(true)}
            startIcon={<InfoIcon />}
          >
            View Detailed Terms
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!allRequiredConsents}
            startIcon={<CheckCircleIcon />}
            size="large"
          >
            {allRequiredConsents ? 'Complete Consent Process' : 'Complete All Required Consents'}
          </Button>
        </Box>

        {/* Contact Information */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary.contrastText">
            📞 Questions About This Consent Form?
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            Contact: consent@healthforall.org | Phone: (555) 123-4567
          </Typography>
        </Box>
      </Paper>

      {/* Detailed Terms Dialog */}
      <Dialog
        open={showDetailedConsent}
        onClose={() => setShowDetailedConsent(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
            Detailed Legal Terms & Conditions
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>1. VOLUNTEER SERVICE NATURE</strong><br/>
            This health screening is provided by Health For All Volunteer Organization, a non-profit 
            volunteer organization. All services are provided by trained volunteers and are intended 
            for educational and community health purposes only.
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>2. NOT PROFESSIONAL MEDICAL CARE</strong><br/>
            This screening is NOT a substitute for professional medical diagnosis, treatment, or care. 
            All participants are strongly advised to consult qualified healthcare providers for any 
            medical concerns or decisions.
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>3. LIMITATION OF LIABILITY</strong><br/>
            Health For All Volunteer Organization, its volunteers, staff, and affiliates are not liable 
            for any medical decisions, health outcomes, or consequences based on information from this 
            screening. Participants assume full responsibility for their health decisions.
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>4. DATA PROTECTION & PRIVACY</strong><br/>
            All health information is collected, stored, and used in compliance with HIPAA regulations 
            and applicable privacy laws. Data is encrypted, access-controlled, and retained for 7 years 
            as required by law.
          </Typography>

          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>5. EMERGENCY PROTOCOLS</strong><br/>
            In case of medical emergency, participants must call 911 immediately. This screening does 
            not provide emergency medical services and should not be relied upon for emergency decisions.
          </Typography>

          <Typography variant="body2">
            <strong>6. VOLUNTEER PROTECTION</strong><br/>
            This consent form protects the volunteer organization and its volunteers from liability 
            while providing valuable community health education services in good faith.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailedConsent(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientConsentForm;
