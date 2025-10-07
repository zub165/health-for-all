import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
} from '@mui/material';
import {
  HealthAndSafety,
  People,
  Assessment,
  Email,
  Psychology,
  LocalHospital,
} from '@mui/icons-material';

const HealthFair: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          🏥 Health Fair 2025
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Comprehensive health screening and care for the community
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <People color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Patient Registration</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Register patients with comprehensive medical history collection
              </Typography>
              <Chip label="AI-Enhanced" color="primary" size="small" />
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Health Screening</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Comprehensive vitals tracking and health assessments
              </Typography>
              <Chip label="Real-time" color="success" size="small" />
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Psychology color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Mental Health</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                PHQ-9 mental health screening and assessment
              </Typography>
              <Chip label="Standardized" color="info" size="small" />
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Email color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recommendations</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Automated email delivery of health recommendations
              </Typography>
              <Chip label="Automated" color="warning" size="small" />
            </CardContent>
          </Card>
        </Box>

        <Box textAlign="center" mt={4}>
          <Typography variant="h6" gutterBottom>
            Health Fair Features
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Patient Registration" color="primary" />
            <Chip label="Vitals Tracking" color="success" />
            <Chip label="Blood Sugar Monitoring" color="info" />
            <Chip label="Carotid Doppler" color="warning" />
            <Chip label="Mental Health Screening" color="secondary" />
            <Chip label="Email Recommendations" color="default" />
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default HealthFair;