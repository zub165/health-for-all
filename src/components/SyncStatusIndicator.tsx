// Sync Status Indicator Component
import React from 'react';
import {
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Collapse,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material';
import {
  Sync,
  SyncProblem,
  CheckCircle,
  OfflineBolt,
  CloudOff,
  CloudDone,
  Refresh,
  Storage,
  Delete,
  Info
} from '@mui/icons-material';
import { useSyncStatus, useOnlineStatus } from '../hooks/useHybridStorage';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  showDetails = false, 
  compact = false 
}) => {
  const { syncStatus, isOffline, lastSync, storageStats, syncData, clearLocalData } = useSyncStatus();
  const isOnline = useOnlineStatus();
  const [showDetailsDialog, setShowDetailsDialog] = React.useState(false);

  // Get status color and icon
  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'synced':
        return { 
          color: 'success' as const, 
          icon: <CheckCircle />, 
          label: 'Synced',
          description: 'All data synchronized'
        };
      case 'syncing':
        return { 
          color: 'info' as const, 
          icon: <Sync className="animate-spin" />, 
          label: 'Syncing',
          description: 'Synchronizing data...'
        };
      case 'pending':
        return { 
          color: 'warning' as const, 
          icon: <SyncProblem />, 
          label: 'Pending',
          description: 'Changes waiting to sync'
        };
      case 'error':
        return { 
          color: 'error' as const, 
          icon: <SyncProblem />, 
          label: 'Error',
          description: 'Sync failed'
        };
      case 'offline':
        return { 
          color: 'default' as const, 
          icon: <OfflineBolt />, 
          label: 'Offline',
          description: 'Working offline'
        };
      default:
        return { 
          color: 'default' as const, 
          icon: <CloudOff />, 
          label: 'Unknown',
          description: 'Status unknown'
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Format last sync time
  const formatLastSync = (timestamp: number) => {
    if (timestamp === 0) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleSync = async () => {
    if (isOnline && !isOffline) {
      await syncData();
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all local data? This cannot be undone.')) {
      clearLocalData();
    }
  };

  if (compact) {
    return (
      <Tooltip title={`${statusConfig.description} (Last sync: ${formatLastSync(lastSync)})`}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          size="small"
          variant={isOffline ? "outlined" : "filled"}
          onClick={showDetails ? () => setShowDetailsDialog(true) : undefined}
        />
      </Tooltip>
    );
  }

  return (
    <Box>
      {/* Main Status Display */}
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Chip
          icon={statusConfig.icon}
          label={statusConfig.label}
          color={statusConfig.color}
          variant={isOffline ? "outlined" : "filled"}
        />
        
        <Typography variant="body2" color="text.secondary">
          {statusConfig.description}
        </Typography>

        {isOnline && !isOffline && (
          <Tooltip title="Sync now">
            <IconButton size="small" onClick={handleSync} disabled={syncStatus === 'syncing'}>
              <Refresh />
            </IconButton>
          </Tooltip>
        )}

        {showDetails && (
          <Tooltip title="View details">
            <IconButton size="small" onClick={() => setShowDetailsDialog(true)}>
              <Info />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Sync Progress */}
      {syncStatus === 'syncing' && (
        <LinearProgress sx={{ mb: 2 }} />
      )}

      {/* Offline Warning */}
      {isOffline && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CloudOff />
            <Typography variant="body2">
              You're working offline. Changes will sync when connection is restored.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Sync Error */}
      {syncStatus === 'error' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <SyncProblem />
            <Typography variant="body2">
              Sync failed. Check your connection and try again.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onClose={() => setShowDetailsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Storage />
            Storage & Sync Details
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                {isOnline ? <CloudDone color="success" /> : <CloudOff color="error" />}
              </ListItemIcon>
              <ListItemText
                primary="Connection Status"
                secondary={isOnline ? 'Online' : 'Offline'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                {statusConfig.icon}
              </ListItemIcon>
              <ListItemText
                primary="Sync Status"
                secondary={statusConfig.description}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Storage />
              </ListItemIcon>
              <ListItemText
                primary="Local Storage"
                secondary={`${storageStats.localPatients} patients stored locally`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Sync />
              </ListItemIcon>
              <ListItemText
                primary="Sync Queue"
                secondary={`${storageStats.syncQueue} items pending sync`}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText
                primary="Last Sync"
                secondary={formatLastSync(lastSync)}
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>
            Storage Management
          </Typography>

          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleSync}
              disabled={!isOnline || syncStatus === 'syncing'}
            >
              Sync Now
            </Button>
            
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={handleClearData}
            >
              Clear Local Data
            </Button>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SyncStatusIndicator;
