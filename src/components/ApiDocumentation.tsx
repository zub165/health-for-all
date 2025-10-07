import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import {
  ExpandMore,
  Api,
  Http,
  Code,
  Description,
} from '@mui/icons-material';

const ApiDocumentation: React.FC = () => {
  const endpoints = [
    {
      method: 'POST',
      path: '/api/patients/',
      description: 'Create a new patient',
      parameters: {
        first_name: 'string (required)',
        last_name: 'string (required)',
        email: 'string (required)',
        phone: 'string (required)',
        date_of_birth: 'string (required)',
        gender: 'string (required)',
        address: 'string (optional)',
        blood_type: 'string (optional)',
      },
    },
    {
      method: 'GET',
      path: '/api/patients/',
      description: 'Get all patients',
      parameters: {},
    },
    {
      method: 'GET',
      path: '/api/patients/{id}/',
      description: 'Get patient by ID',
      parameters: {
        id: 'string (required)',
      },
    },
    {
      method: 'POST',
      path: '/api/vitals/',
      description: 'Record patient vitals',
      parameters: {
        patient_id: 'string (required)',
        blood_sugar: 'number (optional)',
        carotid_doppler: 'string (optional)',
        mental_health_score: 'number (optional)',
        mental_health_answers: 'array (optional)',
        recorded_by: 'string (required)',
      },
    },
    {
      method: 'GET',
      path: '/api/vitals/patient/{patient_id}/',
      description: 'Get vitals for specific patient',
      parameters: {
        patient_id: 'string (required)',
      },
    },
    {
      method: 'POST',
      path: '/api/recommendations/',
      description: 'Create health recommendation',
      parameters: {
        patient_id: 'string (required)',
        doctor_id: 'string (required)',
        recommendations: 'string (required)',
      },
    },
    {
      method: 'POST',
      path: '/api/recommendations/{id}/send-email/',
      description: 'Send recommendation via email',
      parameters: {
        id: 'string (required)',
      },
    },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'primary';
      case 'PUT':
        return 'warning';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          📚 API Documentation
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Complete API reference for Health for All Fair application
        </Typography>

        {/* Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Api sx={{ mr: 1, verticalAlign: 'middle' }} />
              API Overview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The Health for All Fair API provides comprehensive endpoints for managing patient data, 
              health screenings, and medical recommendations. All endpoints return JSON responses and 
              follow RESTful conventions.
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Base URL
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Development: http://localhost:3015/api<br/>
                  Production: https://208.109.215.53/api
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Authentication
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Currently using demo mode<br/>
                  Future: JWT token authentication
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Typography variant="h5" gutterBottom>
          <Http sx={{ mr: 1, verticalAlign: 'middle' }} />
          API Endpoints
        </Typography>

        {endpoints.map((endpoint, index) => (
          <Accordion key={index} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" width="100%">
                <Chip
                  label={endpoint.method}
                  color={getMethodColor(endpoint.method) as any}
                  size="small"
                  sx={{ mr: 2 }}
                />
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {endpoint.path}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {endpoint.description}
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {endpoint.description}
                </Typography>

                {Object.keys(endpoint.parameters).length > 0 && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>
                      Parameters
                    </Typography>
                    <Box component="pre" sx={{ 
                      bgcolor: 'grey.100', 
                      p: 2, 
                      borderRadius: 1, 
                      overflow: 'auto',
                      fontSize: '0.875rem'
                    }}>
                      {JSON.stringify(endpoint.parameters, null, 2)}
                    </Box>
                  </>
                )}

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Example Response
                </Typography>
                <Box component="pre" sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1, 
                  overflow: 'auto',
                  fontSize: '0.875rem'
                }}>
                  {JSON.stringify({
                    success: true,
                    data: endpoint.method === 'GET' ? '[]' : '{}',
                    message: 'Operation completed successfully'
                  }, null, 2)}
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Error Handling */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
              Error Handling
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              All API endpoints return consistent error responses with appropriate HTTP status codes.
            </Typography>
            
            <Typography variant="subtitle2" gutterBottom>
              Error Response Format
            </Typography>
            <Box component="pre" sx={{ 
              bgcolor: 'grey.100', 
              p: 2, 
              borderRadius: 1, 
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify({
                success: false,
                error: 'Error message',
                message: 'Detailed error description'
              }, null, 2)}
            </Box>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Common HTTP Status Codes
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip label="200 - OK" color="success" size="small" />
              <Chip label="201 - Created" color="success" size="small" />
              <Chip label="400 - Bad Request" color="error" size="small" />
              <Chip label="404 - Not Found" color="error" size="small" />
              <Chip label="500 - Server Error" color="error" size="small" />
            </Box>
          </CardContent>
        </Card>

        {/* Rate Limiting */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
              Rate Limiting & Best Practices
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              To ensure optimal performance and fair usage, please follow these guidelines:
            </Typography>
            
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Maximum 100 requests per minute per IP address
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Use appropriate HTTP methods for each operation
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Include proper error handling in your applications
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                Cache responses when appropriate to reduce server load
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
};

export default ApiDocumentation;