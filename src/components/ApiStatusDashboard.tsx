import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Refresh,
  Api,
  HealthAndSafety,
  Restaurant,
  Psychology,
  Science,
  LocalHospital,
  VolunteerActivism,
} from '@mui/icons-material';
import { getApiBaseUrl } from '../config/api';
import ExportActions from './ExportActions';

interface ApiStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'checking' | 'not_deployed';
  description: string;
  endpoint: string;
  icon: React.ReactNode;
}

async function ping(url: string, timeoutMs = 8000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    // 200–499 means host answered (405/401 still = endpoint exists)
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

const ApiStatusDashboard: React.FC = () => {
  const contentRef = useRef<HTMLElement>(null);
  const base = getApiBaseUrl(); // https://api.mywaitime.com in production

  const [apis, setApis] = useState<ApiStatus[]>([
    {
      id: 'main',
      name: 'Main API',
      status: 'checking',
      description: 'Patients, doctors, vitals, assessments, auth',
      endpoint: `${base}/api/health/`,
      icon: <HealthAndSafety />,
    },
    {
      id: 'health-fair',
      name: 'Health Fair',
      status: 'checking',
      description: 'Fair dashboard, doctors login, fair patients',
      endpoint: `${base}/health-fair/dashboard/`,
      icon: <LocalHospital />,
    },
    {
      id: 'lab',
      name: 'Lab Management',
      status: 'checking',
      description: 'Test catalog, orders, results at /lab/',
      endpoint: `${base}/lab/tests/?page_size=1`,
      icon: <Science />,
    },
    {
      id: 'icd10',
      name: 'ICD-10 (NIH)',
      status: 'checking',
      description: 'Clinical Tables ICD-10 search (external)',
      endpoint:
        'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=I10',
      icon: <Psychology />,
    },
    {
      id: 'nutrition',
      name: 'Nutrition API',
      status: 'checking',
      description: 'GoDaddy nutrition_track — use /api/nutrition/health/',
      endpoint: `${base}/api/nutrition/health/`,
      icon: <Restaurant />,
    },
    {
      id: 'ai',
      name: 'AI Services (/api/ai)',
      status: 'checking',
      description: 'GoDaddy ai_services — ICD-10/meds/symptoms + /health/',
      endpoint: `${base}/api/ai/health/`,
      icon: <Psychology />,
    },
    {
      id: 'volunteers',
      name: 'Volunteers',
      status: 'checking',
      description: 'Health Fair volunteers GET/POST',
      endpoint: `${base}/health-fair/volunteers/`,
      icon: <VolunteerActivism />,
    },
  ]);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'online' | 'offline' | 'partial'>('partial');
  const [checking, setChecking] = useState(false);

  const checkApiStatus = useCallback(async () => {
    setChecking(true);
    setLastChecked(new Date().toLocaleTimeString());
    setApis((prev) => prev.map((api) => ({ ...api, status: 'checking' as const })));

    // AI: prefer /api/ai/health/ (ai_services), then known subpaths; not_deployed only if all fail
    const aiCandidates = [
      `${base}/api/ai/health/`,
      `${base}/api/ai/icd10/search/?q=I10`,
      `${base}/api/ai/assessment/`,
    ];
    let aiOk = false;
    let aiUrl = aiCandidates[0];
    for (const url of aiCandidates) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await ping(url);
      if (ok) {
        aiOk = true;
        aiUrl = url;
        break;
      }
    }

    const results = await Promise.all(
      [
        { id: 'main', url: `${base}/api/health/`, required: true },
        { id: 'health-fair', url: `${base}/health-fair/dashboard/`, required: true },
        { id: 'lab', url: `${base}/lab/tests/?page_size=1`, required: true },
        {
          id: 'icd10',
          url: 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search?sf=code,name&terms=I10',
          required: true,
        },
        { id: 'nutrition', url: `${base}/api/nutrition/health/`, required: false },
        { id: 'volunteers', url: `${base}/health-fair/volunteers/`, required: false },
      ].map(async (item) => {
        const ok = await ping(item.url);
        return { ...item, ok };
      })
    );

    results.push({ id: 'ai', url: aiUrl, required: false, ok: aiOk });

    setApis((prev) =>
      prev.map((api) => {
        const hit = results.find((r) => r.id === api.id);
        if (!hit) return api;
        if (!hit.required) {
          return {
            ...api,
            status: hit.ok ? ('online' as const) : ('not_deployed' as const),
            endpoint: hit.url,
          };
        }
        return {
          ...api,
          status: hit.ok ? ('online' as const) : ('offline' as const),
          endpoint: hit.url,
        };
      })
    );

    const required = results.filter((r) => r.required);
    const onlineRequired = required.filter((r) => r.ok).length;
    if (onlineRequired === required.length) setOverallStatus('online');
    else if (onlineRequired === 0) setOverallStatus('offline');
    else setOverallStatus('partial');

    setChecking(false);
  }, [base]);

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 60000);
    return () => clearInterval(interval);
  }, [checkApiStatus]);

  const statusChip = (status: ApiStatus['status']) => {
    switch (status) {
      case 'online':
        return <Chip label="ONLINE" color="success" size="small" icon={<CheckCircle />} />;
      case 'offline':
        return <Chip label="OFFLINE" color="error" size="small" icon={<Error />} />;
      case 'not_deployed':
        return <Chip label="NOT DEPLOYED" color="warning" size="small" />;
      default:
        return <CircularProgress size={18} />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="API_Status"
        downloadLabel="Save API Status PDF"
        printLabel="Print API Status"
      />
      <Box ref={contentRef}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
            API Status Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Live checks against GoDaddy <code>api.mywaitime.com</code> (not random)
          </Typography>

          <Alert
            severity={
              overallStatus === 'online' ? 'success' : overallStatus === 'offline' ? 'error' : 'warning'
            }
            sx={{ mb: 3 }}
          >
            <Typography variant="h6">
              {overallStatus === 'online'
                ? 'Core systems operational'
                : overallStatus === 'offline'
                  ? 'Core APIs unreachable'
                  : 'Partial service'}
            </Typography>
            <Typography variant="body2">Last checked: {lastChecked}</Typography>
          </Alert>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 2 }}>
            {apis.map((api) => (
              <Card key={api.id} elevation={2}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={1}>
                    {api.icon}
                    <Typography variant="h6" sx={{ ml: 1 }}>
                      {api.name}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" mb={1} gap={1}>
                    {statusChip(api.status)}
                  </Box>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {api.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                  >
                    {api.endpoint}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={checking ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
              onClick={checkApiStatus}
              disabled={checking}
            >
              Refresh all
            </Button>
            <Button variant="outlined" startIcon={<Api />} href="#/">
              Back to modules (use top tabs)
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>API Base URL:</strong> {base}
              <br />
              Production browsers must use HTTPS without <code>:3015</code>. Lab is under{' '}
              <code>/lab/</code>, not <code>/api/lab/</code>.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ApiStatusDashboard;
