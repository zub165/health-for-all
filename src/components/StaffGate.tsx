import React from 'react';
import { Alert, Box, Typography } from '@mui/material';
import DoctorLogin from './DoctorLogin';
import { useAuth } from '../context/AuthContext';

interface StaffGateProps {
  title: string;
  children: React.ReactNode;
  onRegisterDoctor?: () => void;
}

/** Blocks PHI screens until doctor or admin is signed in. */
const StaffGate: React.FC<StaffGateProps> = ({ title, children, onRegisterDoctor }) => {
  const { isStaff, displayName, role, loginStaff } = useAuth();

  if (!isStaff) {
    return (
      <Box>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {title} — doctor or admin only
          </Typography>
          Patients and volunteers cannot view other people’s records. Sign in as a doctor or admin
          to continue.
        </Alert>
        <DoctorLogin
          onLogin={(name) => {
            // DoctorLogin already writes doctorData; refresh AuthContext from storage
            try {
              const raw = localStorage.getItem('doctorData');
              if (raw) {
                const d = JSON.parse(raw);
                loginStaff({
                  name: d.name || name,
                  email: d.email || '',
                  id: d.id,
                });
              } else {
                loginStaff({ name, email: '' });
              }
            } catch {
              loginStaff({ name, email: '' });
            }
          }}
          onRegister={onRegisterDoctor}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Alert severity="success" sx={{ mb: 2 }}>
        Signed in as <strong>{displayName}</strong> ({role}) — full patient &amp; volunteer access.
      </Alert>
      {children}
    </Box>
  );
};

export default StaffGate;
