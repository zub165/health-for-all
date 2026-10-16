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
import { scopePatientsForSession } from '../utils/appAuth';
import { patientLabService } from '../services/patientLabService';

const PatientPortal: React.FC = () => {
  const { session, logout } = useAuth();
  const { patients, loading, refreshing } = useAppData();

  const mine = useMemo(
    () => scopePatientsForSession(patients, session),
    [patients, session]
  );
  const me = mine[0];

  const orders = useMemo(() => {
    if (!me?.id) return [];
    return patientLabService.getLocalOrders(me.id);
  }, [me?.id]);

  if (!session || session.role !== 'patient') {
    return (
      <Alert severity="warning">
        Patient sign-in required. Register as a patient to open your private portal.
      </Alert>
    );
  }

  return (
    <Box>
      {(loading || refreshing) && <LinearProgress sx={{ mb: 2, minHeight: 3 }} />}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">My health record</Typography>
        <Button variant="outlined" color="inherit" onClick={logout}>
          Sign out
        </Button>
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Signed in as <strong>{session.email}</strong> (patient). You only see your own information —
        not other patients or volunteers.
      </Alert>

      {!me && !loading && (
        <Alert severity="warning">
          No matching patient record found for {session.email}. Complete registration or ask staff to
          verify your email on file.
        </Alert>
      )}

      {me && (
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              {me.full_name}
            </Typography>
            <Chip size="small" label={me.source} sx={{ mb: 2 }} />
            <Typography variant="body2">Email: {me.email}</Typography>
            <Typography variant="body2">Phone: {me.phone || '—'}</Typography>
            <Typography variant="body2">Age: {me.age ?? '—'} · Gender: {me.gender || '—'}</Typography>
            <Typography variant="body2">Blood type: {me.blood_type || '—'}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Medical history: {me.past_medical_history || 'None on file'}
            </Typography>
            <Typography variant="body2">
              Allergies:{' '}
              {Array.isArray(me.allergies) ? me.allergies.join(', ') || 'None' : me.allergies || 'None'}
            </Typography>
            <Typography variant="h6" sx={{ mt: 3 }}>
              Lab / radiology (yours)
            </Typography>
            {orders.length === 0 ? (
              <Typography color="text.secondary">No orders on this device yet.</Typography>
            ) : (
              orders.map((o) => (
                <Typography key={o.id} variant="body2">
                  {o.testCode} — {o.testName}: {o.resultValue || o.status}
                </Typography>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PatientPortal;
