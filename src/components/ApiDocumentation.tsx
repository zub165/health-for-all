// API Documentation Component
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore,
  Api,
  LocalHospital,
  Restaurant,
  Psychology,
  Science,
  Event,
  GetApp,
  PostAdd,
  Edit,
  Delete,
  Search,
  Code,
  CopyAll,
  OpenInNew,
} from '@mui/icons-material';

interface EndpointInfo {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: string[];
  example?: string;
}

interface ApiSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  endpoints: EndpointInfo[];
}

const ApiDocumentation: React.FC = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'GET': return <GetApp color="success" />;
      case 'POST': return <PostAdd color="primary" />;
      case 'PUT': return <Edit color="warning" />;
      case 'DELETE': return <Delete color="error" />;
      default: return <Search />;
    }
  };

  const getMethodChip = (method: string) => {
    const colors = {
      GET: 'success' as const,
      POST: 'primary' as const,
      PUT: 'warning' as const,
      DELETE: 'error' as const,
    };
    
    return (
      <Chip
        label={method}
        color={colors[method as keyof typeof colors] || 'default'}
        size="small"
        icon={getMethodIcon(method)}
      />
    );
  };

  const apiSections: ApiSection[] = [
    {
      title: 'Main API (/api/)',
      description: 'Core health system endpoints for hospitals, patients, authentication, and more',
      icon: <LocalHospital />,
      color: 'primary',
      endpoints: [
        { method: 'GET', path: '/api/health/', description: 'API health check' },
        { method: 'GET', path: '/api/hospitals/', description: 'List all hospitals' },
        { method: 'GET', path: '/api/hospitals/<uuid:hospital_id>/', description: 'Hospital details' },
        { method: 'POST', path: '/api/hospitals/add/', description: 'Add new hospital' },
        { method: 'GET', path: '/api/patients/', description: 'List patients' },
        { method: 'POST', path: '/api/patients/', description: 'Create patient' },
        { method: 'GET', path: '/api/patients/<uuid:patient_id>/', description: 'Patient details' },
        { method: 'POST', path: '/api/auth/login/', description: 'User login' },
        { method: 'POST', path: '/api/auth/register/', description: 'User registration' },
        { method: 'GET', path: '/api/feedback/', description: 'List feedback' },
        { method: 'POST', path: '/api/feedback/submit/', description: 'Submit feedback' },
        { method: 'POST', path: '/api/analyze/', description: 'AI analysis' },
        { method: 'GET', path: '/api/dashboard/', description: 'Dashboard data' },
      ],
    },
    {
      title: 'Nutrition API (/api/nutrition/)',
      description: 'Food analysis, barcode scanning, and nutrition tracking',
      icon: <Restaurant />,
      color: 'success',
      endpoints: [
        { method: 'GET', path: '/api/nutrition/health/', description: 'Nutrition service health' },
        { method: 'POST', path: '/api/nutrition/analyze/', description: 'Analyze food' },
        { method: 'POST', path: '/api/nutrition/barcode/analyze/', description: 'Analyze barcode' },
        { method: 'GET', path: '/api/nutrition/nutrition/lookup/', description: 'Nutrition lookup' },
        { method: 'GET', path: '/api/nutrition/halal/check/', description: 'Halal check' },
      ],
    },
    {
      title: 'AI Services (/ai/)',
      description: 'AI-powered medical analysis and validation services',
      icon: <Psychology />,
      color: 'info',
      endpoints: [
        { method: 'GET', path: '/ai/health/', description: 'AI services health check' },
        { method: 'POST', path: '/ai/icd10/validate/', description: 'ICD-10 validation' },
        { method: 'GET', path: '/ai/icd10/search/', description: 'ICD-10 search' },
        { method: 'GET', path: '/ai/medication/search/', description: 'Medication search' },
        { method: 'POST', path: '/ai/symptoms/analyze/', description: 'Symptom analysis' },
      ],
    },
    {
      title: 'Lab Management (/lab/)',
      description: 'Laboratory test management, results, and reporting',
      icon: <Science />,
      color: 'secondary',
      endpoints: [
        { method: 'GET', path: '/lab/health/', description: 'Lab system health' },
        { method: 'POST', path: '/lab/auth/token/', description: 'JWT token obtain' },
        { method: 'GET', path: '/lab/patients/', description: 'Lab patients list' },
        { method: 'POST', path: '/lab/patients/', description: 'Create lab patient' },
        { method: 'GET', path: '/lab/tests/', description: 'Lab tests list' },
        { method: 'POST', path: '/lab/test-orders/', description: 'Create test order' },
        { method: 'GET', path: '/lab/test-results/', description: 'Test results list' },
        { method: 'GET', path: '/lab/export/patients/csv/', description: 'Export patients CSV' },
      ],
    },
    {
      title: 'Health Fair (/health-fair/)',
      description: 'Health fair event management and rapid patient registration',
      icon: <Event />,
      color: 'warning',
      endpoints: [
        { method: 'POST', path: '/health-fair/patients/ai-register/', description: 'AI rapid registration' },
        { method: 'GET', path: '/health-fair/patients/', description: 'Health fair patients' },
        { method: 'POST', path: '/health-fair/vitals/store/', description: 'Store patient vitals' },
        { method: 'POST', path: '/health-fair/email/send/', description: 'Send patient email' },
        { method: 'GET', path: '/health-fair/doctors/<int:doctor_id>/dashboard/', description: 'Doctor dashboard' },
        { method: 'GET', path: '/health-fair/dashboard/', description: 'Health fair dashboard' },
      ],
    },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom sx={{ 
          background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          📚 API Documentation
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Complete reference for all Health For All API endpoints
        </Typography>
      </Box>

      {/* Quick Links */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Links
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={() => window.open('/api/docs/', '_blank')}
            >
              Swagger UI
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Code />}
              onClick={() => window.open('/api/schema/', '_blank')}
            >
              API Schema
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<OpenInNew />}
              onClick={() => window.open('/api/redoc/', '_blank')}
            >
              ReDoc
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Api />}
              onClick={() => window.open('/api/health/', '_blank')}
            >
              Health Check
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* API Sections */}
      {apiSections.map((section, index) => (
        <Accordion key={index} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              {section.icon}
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {section.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {section.description}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          
          <AccordionDetails>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell>Endpoint</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {section.endpoints.map((endpoint, endpointIndex) => (
                    <TableRow key={endpointIndex}>
                      <TableCell>
                        {getMethodChip(endpoint.method)}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {endpoint.path}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {endpoint.description}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Copy endpoint">
                          <IconButton
                            size="small"
                            onClick={() => copyToClipboard(endpoint.path, `${section.title}-${endpointIndex}`)}
                          >
                            <CopyAll />
                          </IconButton>
                        </Tooltip>
                        {copiedEndpoint === `${section.title}-${endpointIndex}` && (
                          <Chip label="Copied!" color="success" size="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Usage Examples */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Usage Examples
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                JavaScript/TypeScript
              </Typography>
              <Typography variant="body2" fontFamily="monospace" component="pre" sx={{ fontSize: '0.8rem' }}>
{`// Get all patients
const response = await fetch('/api/patients/');
const patients = await response.json();

// Create new patient
const newPatient = await fetch('/api/patients/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(patientData)
});`}
              </Typography>
            </Paper>
            
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle2" gutterBottom>
                Python
              </Typography>
              <Typography variant="body2" fontFamily="monospace" component="pre" sx={{ fontSize: '0.8rem' }}>
{`import requests

# Get all patients
response = requests.get('/api/patients/')
patients = response.json()

# Create new patient
new_patient = requests.post('/api/patients/', 
  json=patient_data,
  headers={'Content-Type': 'application/json'}
)`}
              </Typography>
            </Paper>
          </Box>
        </CardContent>
      </Card>

      {/* Authentication Info */}
      <Alert severity="info" sx={{ mt: 4 }}>
        <Typography variant="subtitle2" gutterBottom>
          Authentication
        </Typography>
        <Typography variant="body2">
          Most endpoints require authentication. Use the login endpoint to obtain a session token, 
          or use JWT tokens for the lab management API. Include the token in the Authorization header 
          or as a session cookie for subsequent requests.
        </Typography>
      </Alert>
    </Box>
  );
};

export default ApiDocumentation;
