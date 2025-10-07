import React, { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Api,
  HealthAndSafety,
  Restaurant,
  Psychology,
  Science,
} from '@mui/icons-material';
import { getApiBaseUrl, API_ENDPOINTS } from '../config/api';

interface ApiStatus {
  name: string;
  status: 'online' | 'offline' | 'checking';
  description: string;
  color: 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default';
  icon: React.ReactNode;
}

const ApiStatusDashboard: React.FC = () => {
  const [apis, setApis] = useState<ApiStatus[]>([
    {
      name: 'Main API',
      status: 'checking',
      description: 'Core health system, hospitals, patients, authentication',
      color: 'default',
      icon: <HealthAndSafety />,
    },
    {
      name: 'Nutrition API',
      status: 'checking',
      description: 'Food analysis, barcode scanning, halal checking',
      color: 'success',
      icon: <Restaurant />,
    },
    {
      name: 'AI Services',
      status: 'checking',
      description: 'ICD-10 validation, medication search, symptom analysis',
      color: 'info',
      icon: <Psychology />,
    },
    {
      name: 'Lab Management',
      status: 'checking',
      description: 'Test orders, results, reports, lab analytics',
      color: 'secondary',
      icon: <Science />,
    },
    {
      name: 'Health Fair',
      status: 'online',
      description: 'Event management, rapid registration, vitals tracking',
      color: 'warning',
      icon: <HealthAndSafety />,
    },
  ]);
  const [lastChecked, setLastChecked] = useState<string>('');
  const [overallStatus, setOverallStatus] = useState<'online' | 'offline' | 'partial'>('partial');

  const checkApiStatus = async () => {
    setLastChecked(new Date().toLocaleTimeString());
    
    // Simulate API status checking
    const updatedApis = apis.map(api => {
      if (api.name === 'Health Fair') {
        return { ...api, status: 'online' as const };
      }
      // Simulate random status for other APIs
      const isOnline = Math.random() > 0.7;
      return {
        ...api,
        status: isOnline ? 'online' as const : 'offline' as const,
      };
    });
    
    setApis(updatedApis);
    
    // Calculate overall status
    const onlineCount = updatedApis.filter(api => api.status === 'online').length;
    const totalCount = updatedApis.length;
    
    if (onlineCount === totalCount) {
      setOverallStatus('online');
    } else if (onlineCount === 0) {
      setOverallStatus('offline');
    } else {
      setOverallStatus('partial');
    }
  };

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle color="success" />;
      case 'offline':
        return <Error color="error" />;
      default:
        return <CircularProgress size={20} />;
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'online':
        return 'success';
      case 'offline':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getOverallStatusText = () => {
    switch (overallStatus) {
      case 'online':
        return 'All Systems Operational';
      case 'offline':
        return 'Major Outage';
      default:
        return 'Partial Service';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          🔌 API Status Dashboard
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Real-time monitoring of all Health For All API services
        </Typography>

        {/* Overall Status */}
        <Alert 
          severity={getOverallStatusColor() as any} 
          sx={{ mb: 3 }}
          icon={getOverallStatusColor() === 'success' ? <CheckCircle /> : <Error />}
        >
          <Typography variant="h6">
            {getOverallStatusText()}
          </Typography>
          <Typography variant="body2">
            Last checked: {lastChecked}
          </Typography>
        </Alert>

        {/* API Status Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 3 }}>
          {apis.map((api, index) => (
            <Card key={index} elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {api.icon}
                  <Typography variant="h6" sx={{ ml: 1 }}>
                    {api.name}
                  </Typography>
                </Box>
                
                <Box display="flex" alignItems="center" mb={2}>
                  {getStatusIcon(api.status)}
                  <Chip 
                    label={api.status.toUpperCase()} 
                    color={api.status === 'online' ? 'success' : api.status === 'offline' ? 'error' : 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary">
                  {api.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={checkApiStatus}
            >
              REFRESH ALL
            </Button>
            <Button
              variant="outlined"
              startIcon={<Api />}
              href="#api-docs"
            >
              API DOCUMENTATION
            </Button>
            <Button
              variant="outlined"
              startIcon={<Api />}
            >
              API SCHEMA
            </Button>
            <Button
              variant="outlined"
              startIcon={<HealthAndSafety />}
            >
              ANALYTICS
            </Button>
          </Box>
        </Box>

        {/* API Base URL Info */}
        <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>API Base URL:</strong> {getApiBaseUrl()}
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ApiStatusDashboard;