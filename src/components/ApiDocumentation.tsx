import React, { useRef } from 'react';
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
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import { ExpandMore, Api, Http, Code, Description, CheckCircle, Cancel } from '@mui/icons-material';
import ExportActions from './ExportActions';

type EndpointDoc = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  status: 'live' | 'missing';
  parameters?: Record<string, string>;
  notes?: string;
};

const LIVE_BASE = 'https://api.mywaitime.com';

const endpointGroups: { title: string; endpoints: EndpointDoc[] }[] = [
  {
    title: 'Main API (`/api/`) — GoDaddy nginx → :3015',
    endpoints: [
      {
        method: 'GET',
        path: '/api/health/',
        description: 'Health check (database, cache)',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/api/patients/',
        description: 'List patients (supports page_size)',
        status: 'live',
        parameters: { page_size: 'number (optional)' },
      },
      {
        method: 'POST',
        path: '/api/patients/',
        description: 'Create patient',
        status: 'live',
        parameters: {
          first_name: 'string (required)',
          last_name: 'string (required)',
          email: 'string (required)',
          phone: 'string (required)',
          date_of_birth: 'YYYY-MM-DD (required)',
          gender: 'male|female|other (required)',
          address: 'string (required)',
          blood_type: 'string (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/patients/{id}/',
        description: 'Get patient by ID',
        status: 'live',
      },
      {
        method: 'PUT',
        path: '/api/patients/{id}/',
        description: 'Update patient',
        status: 'live',
      },
      {
        method: 'DELETE',
        path: '/api/patients/{id}/',
        description: 'Delete patient',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/api/vitals/',
        description: 'List vitals',
        status: 'live',
      },
      {
        method: 'POST',
        path: '/api/vitals/',
        description: 'Record vitals',
        status: 'live',
        parameters: {
          patient: 'uuid (required)',
          blood_pressure_systolic: 'number (optional)',
          blood_pressure_diastolic: 'number (optional)',
          blood_sugar: 'number (optional)',
          bmi: 'number (optional)',
          mental_health_score: 'number (optional)',
          notes: 'string (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/assessments/',
        description: 'List assessments',
        status: 'live',
      },
      {
        method: 'POST',
        path: '/api/assessments/',
        description: 'Create assessment',
        status: 'live',
        parameters: {
          patient: 'uuid (required)',
          doctor: 'uuid (required)',
          assessment_type: 'string (required)',
          score: 'number (required)',
          risk_level: 'string (required)',
        },
      },
      {
        method: 'GET',
        path: '/api/doctors/',
        description: 'List doctors',
        status: 'live',
      },
      {
        method: 'POST',
        path: '/api/doctors/',
        description: 'Register doctor',
        status: 'live',
        parameters: {
          first_name: 'string (required)',
          last_name: 'string (required)',
          email: 'string (required)',
          phone: 'string (required)',
          specialization: 'string (required)',
          license_number: 'string (required)',
          department: 'string (required)',
        },
      },
      {
        method: 'POST',
        path: '/api/auth/register/',
        description: 'Register app user',
        status: 'live',
        parameters: {
          username: 'string (required)',
          email: 'string (required)',
          password: 'string (required)',
        },
      },
      {
        method: 'GET',
        path: '/api/volunteers/',
        description: 'Volunteers (not deployed on GoDaddy yet)',
        status: 'missing',
        notes: 'Returns 404. App uses hybrid local storage for volunteers.',
      },
      {
        method: 'GET',
        path: '/api/nutrition/health/',
        description: 'Nutrition Track health check',
        status: 'live',
        notes: 'Bare /api/nutrition/ is 404 — use /health/, /lookup/, /analyze/, etc.',
      },
      {
        method: 'GET',
        path: '/api/ai/health/',
        description: 'AI services health (ICD-10, meds, symptoms)',
        status: 'live',
        notes: 'Bare /api/ai/ is 404 — use /health/, /icd10/search/, /symptoms/analyze/, etc.',
      },
    ],
  },
  {
    title: 'Health Fair (`/health-fair/`)',
    endpoints: [
      {
        method: 'GET',
        path: '/health-fair/dashboard/',
        description: 'Health fair dashboard HTML/API',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/health-fair/patients/',
        description: 'Health fair patients list',
        status: 'live',
      },
      {
        method: 'POST',
        path: '/health-fair/doctors/',
        description: 'Register / login doctor (health fair)',
        status: 'live',
        notes: 'Prefer /api/doctors/ for create with full required fields.',
      },
      {
        method: 'POST',
        path: '/health-fair/doctors/login/',
        description: 'Doctor login',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/health-fair/volunteers/',
        description: 'Volunteers',
        status: 'missing',
        notes: '404 on GoDaddy — local hybrid only.',
      },
    ],
  },
  {
    title: 'Lab (`/lab/`)',
    endpoints: [
      {
        method: 'GET',
        path: '/lab/tests/',
        description: 'Lab test catalog',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/lab/test-categories/',
        description: 'Lab categories',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/lab/test-orders/',
        description: 'Lab orders',
        status: 'live',
      },
      {
        method: 'GET',
        path: '/lab/test-results/',
        description: 'Lab results',
        status: 'live',
      },
    ],
  },
  {
    title: 'External ICD-10 (NIH Clinical Tables)',
    endpoints: [
      {
        method: 'GET',
        path: 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=HTN',
        description: 'Search ICD-10 codes (aliases like HTN → I10 handled in app)',
        status: 'live',
        notes: 'Not hosted on GoDaddy. Browser CORS allowed by NIH.',
      },
    ],
  },
];

const ApiDocumentation: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'success';
      case 'POST':
        return 'primary';
      case 'PUT':
      case 'PATCH':
        return 'warning';
      case 'DELETE':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="API_Documentation"
        downloadLabel="Save API Docs PDF"
        printLabel="Print API Docs"
      />
      <Box ref={contentRef}>
        <Paper elevation={3} sx={{ p: { xs: 2, md: 4 } }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            API Documentation
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Live GoDaddy endpoints used by Health For All (verified against api.mywaitime.com)
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Why some Status cards looked “OFFLINE”
            </Typography>
            <Typography variant="body2">
              Bare <code>/api/nutrition/</code> and <code>/api/ai/</code> return 404 (no index route).
              Use <code>/api/nutrition/health/</code> and <code>/api/ai/health/</code> — both are live on GoDaddy.
              Lab is at <code>/lab/tests/</code>; ICD-10 search uses NIH Clinical Tables.
            </Typography>
          </Alert>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Api sx={{ mr: 1, verticalAlign: 'middle' }} />
                Base URLs
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Environment</TableCell>
                    <TableCell>URL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Production (browser / GitHub Pages)</TableCell>
                    <TableCell>
                      <code>{LIVE_BASE}</code> (HTTPS port 443 → Django :3015)
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Localhost direct</TableCell>
                    <TableCell>
                      <code>http://api.mywaitime.com:3015</code> (HTTP only — do not use HTTPS:3015)
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Auth: optional <code>Authorization: Token &lt;token&gt;</code> for some routes. Many patient
                GET/POST calls work without a token.
              </Typography>
            </CardContent>
          </Card>

          <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
            <Http sx={{ mr: 1, verticalAlign: 'middle' }} />
            API Endpoints
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Expand each row for parameters. Green = live on GoDaddy / NIH. Red = missing (404).
          </Typography>

          {endpointGroups.map((group) => (
            <Box key={group.title} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {group.title}
              </Typography>
              {group.endpoints.map((endpoint) => (
                <Accordion key={`${endpoint.method}-${endpoint.path}`} defaultExpanded={false} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexWrap: 'wrap',
                        width: '100%',
                        pr: 1,
                      }}
                    >
                      <Chip
                        label={endpoint.method}
                        color={getMethodColor(endpoint.method) as 'success' | 'primary' | 'warning' | 'error' | 'default'}
                        size="small"
                      />
                      <Chip
                        icon={endpoint.status === 'live' ? <CheckCircle /> : <Cancel />}
                        label={endpoint.status === 'live' ? 'LIVE' : '404'}
                        color={endpoint.status === 'live' ? 'success' : 'error'}
                        size="small"
                        variant="outlined"
                      />
                      <Typography
                        variant="body2"
                        sx={{ fontFamily: 'monospace', fontWeight: 600, wordBreak: 'break-all' }}
                      >
                        {endpoint.path}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1, minWidth: 160 }}>
                        {endpoint.description}
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {endpoint.notes && (
                      <Alert severity={endpoint.status === 'live' ? 'info' : 'warning'} sx={{ mb: 2 }}>
                        {endpoint.notes}
                      </Alert>
                    )}
                    <Typography variant="subtitle2" gutterBottom>
                      Full URL example
                    </Typography>
                    <Box
                      component="pre"
                      sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, overflow: 'auto', fontSize: '0.8rem' }}
                    >
                      {endpoint.path.startsWith('http')
                        ? endpoint.path
                        : `${LIVE_BASE}${endpoint.path}`}
                    </Box>
                    {endpoint.parameters && Object.keys(endpoint.parameters).length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                          Body / query parameters
                        </Typography>
                        <Box
                          component="pre"
                          sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, overflow: 'auto', fontSize: '0.8rem' }}
                        >
                          {JSON.stringify(endpoint.parameters, null, 2)}
                        </Box>
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
              <Divider sx={{ my: 2 }} />
            </Box>
          ))}

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Code sx={{ mr: 1, verticalAlign: 'middle' }} />
                Error format
              </Typography>
              <Box
                component="pre"
                sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, overflow: 'auto', fontSize: '0.875rem' }}
              >
                {JSON.stringify(
                  {
                    status: 'error',
                    message: 'Invalid data',
                    errors: { field: ['This field is required.'] },
                  },
                  null,
                  2
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                <Chip label="200 OK" color="success" size="small" />
                <Chip label="201 Created" color="success" size="small" />
                <Chip label="400 Bad Request" color="warning" size="small" />
                <Chip label="404 Not Found" color="error" size="small" />
                <Chip label="405 Method Not Allowed" color="error" size="small" />
                <Chip label="500 Server Error" color="error" size="small" />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Description sx={{ mr: 1, verticalAlign: 'middle' }} />
                App ↔ API mapping
              </Typography>
              <Typography variant="body2" component="div">
                <ul>
                  <li>
                    <strong>Patients / Doctor / Vitals / Assessments</strong> → <code>/api/…</code>
                  </li>
                  <li>
                    <strong>Lab tab</strong> → <code>/lab/tests/</code> (live)
                  </li>
                  <li>
                    <strong>ICD-10 tab</strong> → NIH Clinical Tables + local aliases (HTN → I10)
                  </li>
                  <li>
                    <strong>Volunteers</strong> → local hybrid (GoDaddy volunteers route is 404)
                  </li>
                  <li>
                    <strong>Nutrition / AI</strong> → <code>/api/nutrition/health/</code> and <code>/api/ai/health/</code> (live)
                  </li>
                </ul>
              </Typography>
            </CardContent>
          </Card>
        </Paper>
      </Box>
    </Container>
  );
};

export default ApiDocumentation;
