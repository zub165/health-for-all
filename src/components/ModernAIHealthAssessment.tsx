import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Psychology,
  HealthAndSafety,
  TrendingUp,
  Assessment,
  CheckCircle,
  Warning,
} from '@mui/icons-material';

const ModernAIHealthAssessment: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleStartAssessment = async () => {
    setProcessing(true);
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    setProcessing(false);
    setCompleted(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          🤖 Modern AI Health Assessment
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Next-generation AI-powered health analysis with real-time insights
        </Typography>

        {processing && (
          <Card sx={{ mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Psychology sx={{ mr: 2 }} />
                <Typography variant="h6">AI Processing...</Typography>
              </Box>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography variant="body2">
                Advanced AI algorithms are analyzing health data...
              </Typography>
            </CardContent>
          </Card>
        )}

        {completed && (
          <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircle sx={{ mr: 2 }} />
                <Typography variant="h6">Assessment Complete!</Typography>
              </Box>
              <Typography variant="body2">
                AI analysis completed successfully. Health insights generated.
              </Typography>
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <HealthAndSafety color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Health Score</Typography>
              </Box>
              <Typography variant="h3" color="primary" gutterBottom>
                85/100
              </Typography>
              <Chip label="Excellent" color="success" size="small" />
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUp color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Risk Level</Typography>
              </Box>
              <Typography variant="h3" color="success.main" gutterBottom>
                Low
              </Typography>
              <Chip label="Minimal Risk" color="success" size="small" />
            </CardContent>
          </Card>

          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Assessment color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Recommendations</Typography>
              </Box>
              <Typography variant="h3" color="info.main" gutterBottom>
                5
              </Typography>
              <Chip label="Generated" color="info" size="small" />
            </CardContent>
          </Card>
        </Box>

        <Box textAlign="center" mt={4}>
          <Button
            variant="contained"
            size="large"
            onClick={handleStartAssessment}
            disabled={processing}
            sx={{
              background: 'linear-gradient(45deg, #FF6B35, #F7931E)',
              '&:hover': {
                background: 'linear-gradient(45deg, #E55A2B, #E8821A)',
              }
            }}
          >
            {processing ? 'Processing...' : 'Start Modern AI Assessment'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ModernAIHealthAssessment;