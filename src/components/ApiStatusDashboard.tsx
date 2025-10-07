// API Status Dashboard Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  ExpandMore,
  Api,
  LocalHospital,
  Restaurant,
  Psychology,
  Science,
  Event,
  CloudDone,
  CloudOff,
  Info,
  Speed,
  Security,
  Analytics,
} from '@mui/icons-material';
import { completeApiService, checkApiStatus } from '../services/completeApiService';

interface ApiStatus {
  main: boolean;
  nutrition: boolean;
  ai: boolean;
  lab: boolean;
  healthFair: boolean;
}

interface EndpointInfo {
  name: string;
  description: string;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

const ApiStatusDashboard: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    main: false,
    nutrition: false,
    ai: false,
    lab: false,
    healthFair: false,
  });
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [showDetails, setShowDetails] = useState(false);

  const apiServices: Record<keyof ApiStatus, EndpointInfo> = {
    main: {
      name: 'Main API',
      description: 'Core health system, hospitals, patients, authentication',
      icon: <LocalHospital />,
      color: 'primary',
    },
    nutrition: {
      name: 'Nutrition API',
      description: 'Food analysis, barcode scanning, halal checking',
      icon: <Restaurant />,
      color: 'success',
    },
    ai: {
      name: 'AI Services',
      description: 'ICD-10 validation, medication search, symptom analysis',
      icon: <Psychology />,
      color: 'info',
    },
    lab: {
      name: 'Lab Management',
      description: 'Test orders, results, reports, lab analytics',
      icon: <Science />,
      color: 'secondary',
    },
    healthFair: {
      name: 'Health Fair',
      description: 'Event management, rapid registration, vitals tracking',
      icon: <Event />,
      color: 'warning',
    },
  };

  const checkStatus = async () => {
    setLoading(true);
    try {
      const status = await checkApiStatus();
      setApiStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Error checking API status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <CheckCircle color="success" />
    ) : (
      <Error color="error" />
    );
  };

  const getStatusChip = (isOnline: boolean) => {
    return (
      <Chip
        icon={isOnline ? <CloudDone /> : <CloudOff />}
        label={isOnline ? 'Online' : 'Offline'}
        color={isOnline ? 'success' : 'error'}
        variant={isOnline ? 'filled' : 'outlined'}
        size="small"
      />
    );
  };

  const getOverallStatus = () => {
    const onlineCount = Object.values(apiStatus).filter(Boolean).length;
    const totalCount = Object.keys(apiStatus).length;
    const percentage = (onlineCount / totalCount) * 100;

    if (percentage === 100) return { status: 'All Systems Operational', color: 'success' };
    if (percentage >= 80) return { status: 'Mostly Operational', color: 'warning' };
    if (percentage >= 50) return { status: 'Partial Outage', color: 'warning' };
    return { status: 'Major Outage', color: 'error' };
  };

  const overallStatus = getOverallStatus();

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
          🔌 API Status Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Real-time monitoring of all Health For All API services
        </Typography>
      </Box>

      {/* Overall Status */}
      <Card sx={{ mb: 4, bgcolor: overallStatus.color === 'success' ? 'success.light' : 
                 overallStatus.color === 'warning' ? 'warning.light' : 'error.light' }}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={2}>
              <Api fontSize="large" />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {overallStatus.status}
                </Typography>
                <Typography variant="body2">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={checkStatus}
                disabled={loading}
              >
                Refresh
              </Button>
              <Button
                variant="outlined"
                startIcon={<Info />}
                onClick={() => setShowDetails(true)}
              >
                Details
              </Button>
            </Box>
          </Box>
          {loading && <LinearProgress sx={{ mt: 2 }} />}
        </CardContent>
      </Card>

      {/* API Services Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
        {Object.entries(apiServices).map(([key, service]) => (
          <Card key={key} sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  {service.icon}
                  <Typography variant="h6" fontWeight="bold">
                    {service.name}
                  </Typography>
                </Box>
                {getStatusIcon(apiStatus[key as keyof ApiStatus])}
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {service.description}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                {getStatusChip(apiStatus[key as keyof ApiStatus])}
                <Chip
                  label={service.color}
                  color={service.color}
                  size="small"
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Quick Actions */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Speed />}
              onClick={() => window.open('/api/docs/', '_blank')}
            >
              API Documentation
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Security />}
              onClick={() => window.open('/api/schema/', '_blank')}
            >
              API Schema
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Analytics />}
              onClick={() => window.open('/api/analytics/', '_blank')}
            >
              Analytics
            </Button>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkStatus}
              disabled={loading}
            >
              Refresh All
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onClose={() => setShowDetails(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Api />
            API Services Details
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Base URL</TableCell>
                  <TableCell>Endpoints</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(apiServices).map(([key, service]) => (
                  <TableRow key={key}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {service.icon}
                        {service.name}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {getStatusChip(apiStatus[key as keyof ApiStatus])}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {key === 'main' && '/api/'}
                        {key === 'nutrition' && '/api/nutrition/'}
                        {key === 'ai' && '/ai/'}
                        {key === 'lab' && '/lab/'}
                        {key === 'healthFair' && '/health-fair/'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {key === 'main' && '50+ endpoints'}
                        {key === 'nutrition' && '6 endpoints'}
                        {key === 'ai' && '5 endpoints'}
                        {key === 'lab' && '40+ endpoints'}
                        {key === 'healthFair' && '8 endpoints'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetails(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApiStatusDashboard;
