import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  Email as EmailIcon,
  Person as PersonIcon,
  HealthAndSafety as HealthIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { Patient } from '../types';

interface EmailPreviewProps {
  open: boolean;
  onClose: () => void;
  onSend: () => void;
  patient: Patient | null;
  healthScore: number;
  riskFactors: string[];
  recommendations: string[];
  loading?: boolean;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  open,
  onClose,
  onSend,
  patient,
  healthScore,
  riskFactors,
  recommendations,
  loading = false,
}) => {
  if (!patient) return null;

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <EmailIcon sx={{ mr: 1 }} />
          Email Preview - {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          📧 This email will be sent to: <strong>{patient.email}</strong>
        </Alert>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📋 Patient Information
            </Typography>
            <Box display="flex" flexDirection="column" gap={1}>
              <Typography variant="body2">
                <strong>Name:</strong> {patient.name || patient.full_name || `${patient.first_name || ''} ${patient.last_name || ''}`.trim()}
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> {patient.email}
              </Typography>
              <Typography variant="body2">
                <strong>Phone:</strong> {patient.phoneNumber || patient.phone || 'Not provided'}
              </Typography>
              <Typography variant="body2">
                <strong>Age:</strong> {patient.age || 'Not specified'}
              </Typography>
              <Typography variant="body2">
                <strong>Blood Group:</strong> {patient.bloodGroup || 'Not specified'}
              </Typography>
              {patient.allergies && (
                <Typography variant="body2">
                  <strong>Allergies:</strong> {patient.allergies}
                </Typography>
              )}
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              AI Health Assessment Results
            </Typography>
            
            <Box display="flex" alignItems="center" mb={2}>
              <Typography variant="h3" color={`${getHealthScoreColor(healthScore)}.main`} sx={{ mr: 2 }}>
                {healthScore}/100
              </Typography>
              <Box>
                <Typography variant="h6">{getHealthScoreLabel(healthScore)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Overall Health Score
                </Typography>
              </Box>
            </Box>

            {riskFactors.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle1" gutterBottom>Risk Factors Identified:</Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {riskFactors.map((factor, index) => (
                    <Chip key={index} label={factor} color="warning" size="small" />
                  ))}
                </Box>
              </Box>
            )}

            <Box>
              <Typography variant="subtitle1" gutterBottom>AI Recommendations:</Typography>
              <List dense>
                {recommendations.map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemText primary={`• ${rec}`} />
                  </ListItem>
                ))}
              </List>
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              📧 Email Content Preview
            </Typography>
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" component="div">
                <strong>Subject:</strong> Health Assessment Report - {patient.name || patient.full_name}<br/><br/>
                
                <strong>Dear {patient.name || patient.full_name},</strong><br/><br/>
                
                We have completed your comprehensive health assessment using our AI-powered analysis system. 
                Here are your results:<br/><br/>
                
                <strong>Health Score:</strong> {healthScore}/100 ({getHealthScoreLabel(healthScore)})<br/><br/>
                
                {riskFactors.length > 0 && (
                  <>
                    <strong>Risk Factors Identified:</strong><br/>
                    {riskFactors.map((factor, index) => `• ${factor}`).join('\n')}<br/><br/>
                  </>
                )}
                
                <strong>Recommendations:</strong><br/>
                {recommendations.map((rec, index) => `• ${rec}`).join('\n')}<br/><br/>
                
                Please consult with your healthcare provider to discuss these findings and recommendations.<br/><br/>
                
                <strong>Best regards,</strong><br/>
                Health for All Fair Team<br/>
                <em>This report was generated on {new Date().toLocaleDateString()}</em>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={onSend}
          variant="contained"
          startIcon={<EmailIcon />}
          disabled={loading}
          color="primary"
        >
          {loading ? 'Sending...' : 'Send Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EmailPreview;
