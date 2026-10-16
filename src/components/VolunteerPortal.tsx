import React, { useMemo } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Typography,
} from '@mui/material';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { scopeVolunteersForSession } from '../utils/appAuth';

const VolunteerPortal: React.FC = () => {
  const { session, logout } = useAuth();
  const { volunteers, loading, refreshing } = useAppData();

  const mine = useMemo(
    () => scopeVolunteersForSession(volunteers, session),
    [volunteers, session]
  );
  const me = mine[0];

  if (!session || session.role !== 'volunteer') {
    return (
      <Alert severity="warning">
        Volunteer sign-in required. Register as a volunteer to open your private portal.
      </Alert>
    );
  }

  return (
    <Box>
      {(loading || refreshing) && <LinearProgress sx={{ mb: 2, minHeight: 3 }} />}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My volunteer profile</Typography>
        <Button variant="outlined" color="inherit" onClick={logout}>
          Sign out
        </Button>
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Signed in as <strong>{session.email}</strong> (volunteer). You only see your own profile —
        not other volunteers or any patient records.
      </Alert>

      {!me && !loading && (
        <Alert severity="warning">
          No volunteer record found for {session.email}. Complete registration to create your profile.
        </Alert>
      )}

      {me && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {me.full_name}
            </Typography>
            <Chip size="small" label={me.source || 'volunteer'} sx={{ mb: 2 }} />
            <Typography variant="body2">Email: {me.email}</Typography>
            <Typography variant="body2">Phone: {me.phone || '—'}</Typography>
            <Typography variant="body2">Organization: {me.organization || '—'}</Typography>
            <Typography variant="body2">Role: {me.role || '—'}</Typography>
            <Typography variant="body2">Availability: {me.availability || '—'}</Typography>
            {me.skills && (
              <Typography variant="body2">
                Skills: {Array.isArray(me.skills) ? me.skills.join(', ') : me.skills}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default VolunteerPortal;
