import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Collapse,
  Typography,
  Link,
} from '@mui/material';
import {
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Gavel as GavelIcon,
} from '@mui/icons-material';

const LegalDisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity="warning" 
        sx={{ 
          borderRadius: 2,
          '& .MuiAlert-message': {
            width: '100%'
          }
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
          <Box display="flex" alignItems="center" flex={1}>
            <WarningIcon sx={{ mr: 1 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
              <strong>⚠️ LEGAL DISCLAIMER:</strong> This is a volunteer health screening service for educational purposes only. 
              Not a substitute for professional medical care. 
              <Link 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  setExpanded(!expanded);
                }}
                sx={{ ml: 1, textDecoration: 'underline' }}
              >
                {expanded ? 'Show Less' : 'Read Full Disclaimer'}
              </Link>
            </Typography>
          </Box>
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            startIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{ ml: 2, minWidth: 'auto' }}
          >
            {expanded ? 'Less' : 'More'}
          </Button>
        </Box>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>🏥 VOLUNTEER HEALTH SERVICE DISCLAIMER</strong>
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Educational Purpose Only:</strong> This health screening is provided by Health For All Volunteer Organization for educational and community health purposes only.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Not Professional Medical Care:</strong> This screening is NOT a substitute for professional medical diagnosis, treatment, or care from qualified healthcare providers.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Emergency Situations:</strong> In case of medical emergency, call 911 immediately. Do not rely on this screening for emergency medical decisions.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Volunteer Service:</strong> All services are provided by trained volunteers and are intended for community health education and screening purposes.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Limitation of Liability:</strong> Health For All Volunteer Organization, its volunteers, and staff are not liable for any medical decisions, health outcomes, or consequences based on information from this screening.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 1 }}>
              • <strong>Data Protection:</strong> All health information is collected, stored, and used in compliance with HIPAA regulations and applicable privacy laws.
            </Typography>
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              • <strong>User Responsibility:</strong> Participants assume full responsibility for their health decisions and should always consult qualified healthcare providers for medical concerns.
            </Typography>

            <Box display="flex" alignItems="center" gap={2} sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <GavelIcon sx={{ color: 'primary.main' }} />
              <Typography variant="body2" color="primary">
                <strong>Legal Protection:</strong> This disclaimer protects the volunteer organization and its volunteers from liability while providing valuable community health education services in good faith.
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </Alert>
    </Box>
  );
};

export default LegalDisclaimerBanner;
