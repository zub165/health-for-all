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
} from '@mui/material';
import {
  Security as SecurityIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { initializeHIPAACompliance } from '../services/hipaaCompliance';

const HIPAACompliance: React.FC = () => {
  const [hipaaCompliance] = useState(() => initializeHIPAACompliance());
  const [complianceReport, setComplianceReport] = useState<string>('');

  const generateComplianceReport = () => {
    const report = hipaaCompliance.exportComplianceReport();
    setComplianceReport(report);
  };

  const checklist = hipaaCompliance.getComplianceChecklist();
  const privacyPolicy = hipaaCompliance.generatePrivacyPolicy();
  const consentForm = hipaaCompliance.generateConsentForm();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <SecurityIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" color="primary">
            HIPAA Compliance Dashboard
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Health For All Volunteer Organization - HIPAA Compliance Status
        </Typography>

        {/* Compliance Status */}
        <Alert severity="info" sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            🔐 HIPAA Compliance Status
          </Typography>
          <Typography variant="body2">
            This dashboard shows our current HIPAA compliance status. 
            All patient data is protected according to HIPAA regulations.
          </Typography>
        </Alert>

        {/* Compliance Checklist */}
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📋 Compliance Checklist
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              {checklist.map((item, index) => (
                <Box key={index} display="flex" alignItems="center" mb={2}>
                  {item.completed ? (
                    <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                  ) : (
                    <WarningIcon color="warning" sx={{ mr: 2 }} />
                  )}
                  <Box flex={1}>
                    <Typography variant="body1">
                      {item.item}
                    </Typography>
                    <Chip 
                      label={item.priority} 
                      size="small" 
                      color={item.priority === 'HIGH' ? 'error' : item.priority === 'MEDIUM' ? 'warning' : 'default'}
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Privacy Policy */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📄 Privacy Policy
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1
              }}>
                {privacyPolicy}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigator.clipboard.writeText(privacyPolicy)}
                sx={{ mt: 2 }}
              >
                Copy Privacy Policy
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Patient Consent Form */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📝 Patient Consent Form
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="body2" component="pre" sx={{ 
                whiteSpace: 'pre-wrap', 
                fontFamily: 'monospace',
                bgcolor: 'grey.50',
                p: 2,
                borderRadius: 1
              }}>
                {consentForm}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigator.clipboard.writeText(consentForm)}
                sx={{ mt: 2 }}
              >
                Copy Consent Form
              </Button>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Data Protection Measures */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              🛡️ Data Protection Measures
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography variant="h6" gutterBottom>
                Technical Safeguards
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="✅ HTTPS Encryption" 
                    secondary="All data transmission is encrypted using HTTPS/TLS"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ No Local Storage" 
                    secondary="Patient data is never stored in browser localStorage"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ Access Control" 
                    secondary="Only authorized medical staff can access patient data"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ Audit Logging" 
                    secondary="All access to patient data is logged and monitored"
                  />
                </ListItem>
              </List>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Administrative Safeguards
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="✅ Staff Training" 
                    secondary="All staff are trained on HIPAA compliance"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ Privacy Policy" 
                    secondary="Clear privacy policy available to all patients"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ Patient Consent" 
                    secondary="Explicit consent obtained before data collection"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="✅ Data Retention" 
                    secondary="Data retention policy ensures proper data disposal"
                  />
                </ListItem>
              </List>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Compliance Report */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">
              📊 Compliance Report
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Button 
                variant="contained" 
                onClick={generateComplianceReport}
                sx={{ mb: 2 }}
              >
                Generate Compliance Report
              </Button>
              
              {complianceReport && (
                <Box>
                  <Typography variant="body2" component="pre" sx={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'monospace',
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    maxHeight: 400,
                    overflow: 'auto'
                  }}>
                    {complianceReport}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigator.clipboard.writeText(complianceReport)}
                    sx={{ mt: 2 }}
                  >
                    Copy Report
                  </Button>
                </Box>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Contact Information */}
        <Box sx={{ mt: 4, p: 3, bgcolor: 'primary.light', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom color="primary.contrastText">
            📞 Contact Information
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            For questions about HIPAA compliance or patient data:
          </Typography>
          <Typography variant="body2" color="primary.contrastText" sx={{ mt: 1 }}>
            Email: privacy@healthforall.org
          </Typography>
          <Typography variant="body2" color="primary.contrastText">
            Phone: (555) 123-4567
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default HIPAACompliance;
