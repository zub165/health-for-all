import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import { Patient, Recommendation } from '../types';

interface HealthScoreRecommendationPrintProps {
  patient: Patient;
  healthScore?: number;
  recommendations?: string;
  doctorName?: string;
  date?: string;
}

const HealthScoreRecommendationPrint: React.FC<HealthScoreRecommendationPrintProps> = ({
  patient,
  healthScore,
  recommendations,
  doctorName,
  date
}) => {
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return '#4caf50'; // Green
    if (score >= 60) return '#ff9800'; // Orange
    return '#f44336'; // Red
  };

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Low Risk / Excellent';
    if (score >= 60) return 'Medium Risk / Good';
    if (score >= 40) return 'High Risk / Fair';
    return 'Very High Risk / Needs Attention';
  };

  const printDate = date || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Box
      sx={{
        '@media print': {
          '@page': {
            margin: '0.5in',
          },
          '&': {
            margin: 0,
            padding: 0,
          },
        },
        p: 3,
        maxWidth: '8.5in',
        margin: '0 auto',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          '@media print': {
            boxShadow: 'none',
            p: 2,
          },
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid #1976d2', pb: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: '#1976d2',
              mb: 1,
              '@media print': {
                fontSize: '24px',
              },
            }}
          >
            Health Assessment Report
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              '@media print': {
                fontSize: '12px',
              },
            }}
          >
            Health For All Fair
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              '@media print': {
                fontSize: '12px',
              },
            }}
          >
            Date: {printDate}
          </Typography>
        </Box>

        {/* Patient Information */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              mb: 2,
              borderBottom: '1px solid #e0e0e0',
              pb: 1,
              '@media print': {
                fontSize: '16px',
              },
            }}
          >
            Patient Information
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 2,
              '@media print': {
                gap: 1,
              },
            }}
          >
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Full Name
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {patient.name || patient.full_name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Date of Birth / Age
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString()
                  : patient.age
                  ? `${patient.age} years old`
                  : 'Not provided'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Email
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {patient.email || 'Not provided'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Phone
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {patient.phoneNumber || patient.phone || 'Not provided'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Blood Group
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {(patient as any).bloodGroup || (patient as any).blood_group || 'Not provided'}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Gender
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {patient.gender || 'Not provided'}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Health Score Section */}
        {healthScore !== undefined && healthScore !== null && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                borderBottom: '1px solid #e0e0e0',
                pb: 1,
                '@media print': {
                  fontSize: '16px',
                },
              }}
            >
              Health Assessment Score
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                p: 3,
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                '@media print': {
                  bgcolor: 'transparent',
                  border: '1px solid #e0e0e0',
                  p: 2,
                },
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  minWidth: '120px',
                  '@media print': {
                    minWidth: '100px',
                  },
                }}
              >
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 'bold',
                    color: getHealthScoreColor(healthScore),
                    '@media print': {
                      fontSize: '36px',
                    },
                  }}
                >
                  {healthScore}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ '@media print': { fontSize: '11px' } }}
                >
                  / 100
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    mb: 1,
                    color: getHealthScoreColor(healthScore),
                    '@media print': {
                      fontSize: '16px',
                    },
                  }}
                >
                  {getHealthScoreLabel(healthScore)}
                </Typography>
                <Box
                  sx={{
                    height: 20,
                    bgcolor: '#e0e0e0',
                    borderRadius: 10,
                    overflow: 'hidden',
                    '@media print': {
                      border: '1px solid #ccc',
                    },
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${healthScore}%`,
                      bgcolor: getHealthScoreColor(healthScore),
                      transition: 'width 0.3s',
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, '@media print': { fontSize: '11px' } }}
                >
                  Overall health assessment based on comprehensive medical evaluation
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {/* Recommendations Section */}
        {recommendations && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 'bold',
                mb: 2,
                borderBottom: '1px solid #e0e0e0',
                pb: 1,
                '@media print': {
                  fontSize: '16px',
                },
              }}
            >
              Health Recommendations
            </Typography>
            <Box
              sx={{
                p: 3,
                bgcolor: '#f9f9f9',
                borderRadius: 2,
                borderLeft: '4px solid #1976d2',
                '@media print': {
                  bgcolor: 'transparent',
                  borderLeft: '3px solid #1976d2',
                  p: 2,
                },
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.8,
                  '@media print': {
                    fontSize: '12px',
                    lineHeight: 1.6,
                  },
                }}
              >
                {recommendations}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Footer */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '2px solid #e0e0e0',
            '@media print': {
              pageBreakInside: 'avoid',
            },
          }}
        >
          {doctorName && (
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ '@media print': { fontSize: '11px' } }}
              >
                Prepared by:
              </Typography>
              <Typography
                variant="body1"
                sx={{ fontWeight: 'medium', '@media print': { fontSize: '12px' } }}
              >
                {doctorName}
              </Typography>
            </Box>
          )}
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{
              '@media print': {
                fontSize: '10px',
              },
            }}
          >
            This report is for informational purposes only and should not replace professional medical advice.
            <br />
            Please consult with your healthcare provider for personalized medical guidance.
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default HealthScoreRecommendationPrint;

