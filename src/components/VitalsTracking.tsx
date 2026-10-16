import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  MenuItem,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import { Vitals, Patient, MentalHealthScreeningData } from '../types';
import { vitalsApi, patientApi } from '../services/api';
import { calculateComprehensiveHealthScore } from '../services/medicalStandards';
import EnhancedMentalHealthScreening from './EnhancedMentalHealthScreening';

const schema = yup.object({
  bloodPressure: yup.string().optional(),
  heartRate: yup.number().min(30).max(200).optional(),
  temperature: yup.number().min(95).max(110).optional(),
  oxygenSaturation: yup.number().min(70).max(100).optional(),
  weight: yup.number().min(20).max(500).optional(),
  height: yup.number().min(30).max(300).optional(),
  bloodSugar: yup.number().min(50).max(500).optional(),
  carotidDoppler: yup.string().optional(),
  hba1c: yup.number().min(4).max(15).optional(),
  totalCholesterol: yup.number().min(50).max(500).optional(),
  ldlCholesterol: yup.number().min(0).max(300).optional(),
  hdlCholesterol: yup.number().min(0).max(150).optional(),
  triglycerides: yup.number().min(0).max(1000).optional(),
});

const carotidDopplerOptions = [
  'Normal',
  'Mild stenosis (< 50%)',
  'Moderate stenosis (50-69%)',
  'Severe stenosis (70-99%)',
  'Occlusion (100%)',
];

interface VitalsTrackingProps {
  patient: Patient;
  doctorName: string;
  onSuccess?: (vitals: Vitals) => void;
}

const VitalsTracking: React.FC<VitalsTrackingProps> = ({ patient, doctorName, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mentalHealthData, setMentalHealthData] = useState<MentalHealthScreeningData | null>(null);
  const [showMentalHealthScreening, setShowMentalHealthScreening] = useState(false);
  const [healthScoreResult, setHealthScoreResult] = useState<{
    score: number;
    riskLevel: string;
    factors: string[];
    recommendations: string[];
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<any>({
    resolver: yupResolver(schema),
  });

  const handleMentalHealthComplete = (data: MentalHealthScreeningData) => {
    setMentalHealthData(data);
    setShowMentalHealthScreening(false);
  };

  const calculateMentalHealthScore = () => {
    if (!mentalHealthData) return 0;
    // Use PHQ-9 score if available, otherwise PHQ-2 score
    if (mentalHealthData.phq9) {
      return mentalHealthData.phq9.reduce((sum, val) => sum + val, 0);
    }
    return mentalHealthData.phq2.reduce((sum, val) => sum + val, 0);
  };

  const getMentalHealthSeverity = (score: number) => {
    if (score <= 4) return 'Minimal depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const mentalHealthScore = mentalHealthData ? calculateMentalHealthScore() : undefined;
      const vitalsData: any = {
        patientId: patient.id!,
        bloodPressure: data.bloodPressure,
        heartRate: data.heartRate,
        temperature: data.temperature,
        oxygenSaturation: data.oxygenSaturation,
        weight: data.weight,
        height: data.height,
        bloodSugar: data.bloodSugar,
        carotidDoppler: data.carotidDoppler,
        hba1c: data.hba1c,
        totalCholesterol: data.totalCholesterol,
        ldlCholesterol: data.ldlCholesterol,
        hdlCholesterol: data.hdlCholesterol,
        triglycerides: data.triglycerides,
        mentalHealthScore,
        mentalHealthData: mentalHealthData ? {
          phq2: mentalHealthData.phq2,
          gad2: mentalHealthData.gad2,
          needsPHQ9: mentalHealthData.needsPHQ9,
          needsGAD7: mentalHealthData.needsGAD7,
          phq9: mentalHealthData.phq9,
          functionalImpairment: mentalHealthData.functionalImpairment,
          gad7: mentalHealthData.gad7,
          followUpPlan: mentalHealthData.followUpPlan,
        } : undefined,
        recordedBy: doctorName,
        recordedAt: new Date().toISOString(),
      };

      const response = await vitalsApi.create(vitalsData);
      if (response.success && response.data) {
        console.log('✅ Vitals saved successfully, calculating health score...');
        
        // ✅ Calculate comprehensive health score
        try {
          const healthAssessment = calculateComprehensiveHealthScore(patient, vitalsData);
          console.log('📊 Health Score Calculated:', {
            score: healthAssessment.score,
            riskLevel: healthAssessment.riskLevel,
            factors: healthAssessment.factors,
            recommendations: healthAssessment.recommendations
          });
          
          // Store health score result for display
          setHealthScoreResult({
            score: healthAssessment.score,
            riskLevel: healthAssessment.riskLevel,
            factors: healthAssessment.factors,
            recommendations: healthAssessment.recommendations
          });
          
          // ✅ Update patient record with health score
          try {
            const updateData: any = {
              health_risk_score: healthAssessment.score,
              ai_health_score: healthAssessment.score, // Also update AI health score field
              risk_factors: healthAssessment.factors.join(', '),
              recommendations: healthAssessment.recommendations.join('\n\n'),
              risk_level: healthAssessment.riskLevel
            };
            
            console.log('🔄 Updating patient with health score:', updateData);
            const updateResponse = await patientApi.update(patient.id!, updateData);
            
            if (updateResponse.success) {
              console.log('✅ Patient health score updated successfully');
            } else {
              console.warn('⚠️ Failed to update patient health score:', updateResponse.message);
              // Don't fail the whole operation if update fails
            }
          } catch (updateError) {
            console.warn('⚠️ Error updating patient health score:', updateError);
            // Don't fail the whole operation if update fails
          }
        } catch (scoreError) {
          console.warn('⚠️ Error calculating health score:', scoreError);
          // Don't fail the whole operation if score calculation fails
        }
        
        setSuccess(true);
        reset();
        onSuccess?.(response.data);
        setTimeout(() => setSuccess(false), 5000); // Show success message longer
      } else {
        setError(response.message || 'Failed to record vitals');
      }
    } catch (err) {
      setError('Network error. Please check if the Django server is running on port 3015.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          Vitals Recording - {patient.name}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Record patient vitals and conduct health screening
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Vitals recorded successfully! Health score calculated and patient record updated.
            {healthScoreResult && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Health Assessment Results
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={`Health Score: ${healthScoreResult.score}/100`}
                    color={
                      healthScoreResult.score >= 80 ? 'success' :
                      healthScoreResult.score >= 60 ? 'warning' : 'error'
                    }
                    sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                  />
                  <Chip
                    label={`Risk Level: ${healthScoreResult.riskLevel}`}
                    color={
                      healthScoreResult.riskLevel === 'Low Risk' ? 'success' :
                      healthScoreResult.riskLevel === 'Moderate Risk' ? 'warning' : 'error'
                    }
                    sx={{ fontSize: '1rem', fontWeight: 'bold' }}
                  />
                </Box>
                {healthScoreResult.factors.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>Risk Factors Identified:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {healthScoreResult.factors.map((factor, index) => (
                        <Chip key={index} label={factor} size="small" color="warning" />
                      ))}
                    </Box>
                  </Box>
                )}
                {healthScoreResult.recommendations.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      <strong>Recommendations:</strong>
                    </Typography>
                    <Box component="ul" sx={{ pl: 2, mt: 1 }}>
                      {healthScoreResult.recommendations.map((rec, index) => (
                        <li key={index}>
                          <Typography variant="body2">{rec}</Typography>
                        </li>
                      ))}
                    </Box>
                  </Box>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  💡 You can now view the patient details to print or email this report.
                </Typography>
              </Box>
            )}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Patient Information */}
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Patient Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Name:</strong> {patient.name}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Email:</strong> {patient.email}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Phone:</strong> {patient.phoneNumber}</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
                      <Typography><strong>Blood Group:</strong> {patient.bloodGroup}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>

            {/* Physical Vitals */}
            <Box>
              <Typography variant="h5" gutterBottom>Physical Vitals</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>💡 Note:</strong> All fields are optional. Enter only the vitals you have available.
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Enter all vital signs measurements
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Box>

            {/* Blood Pressure */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Blood Pressure (mmHg) - Optional"
                placeholder="e.g., 120/80"
                {...register('bloodPressure')}
                error={!!errors.bloodPressure}
                helperText={errors.bloodPressure?.message as string}
              />
            </Box>

            {/* Heart Rate */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Heart Rate (BPM) - Optional"
                type="number"
                {...register('heartRate', { valueAsNumber: true })}
                error={!!errors.heartRate}
                helperText={errors.heartRate?.message as string}
              />
            </Box>

            {/* Temperature */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Temperature (°F) - Optional"
                type="number"
                {...register('temperature', { valueAsNumber: true })}
                error={!!errors.temperature}
                helperText={errors.temperature?.message as string}
              />
            </Box>

            {/* Oxygen Saturation */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Oxygen Saturation (%) - Optional"
                type="number"
                {...register('oxygenSaturation', { valueAsNumber: true })}
                error={!!errors.oxygenSaturation}
                helperText={errors.oxygenSaturation?.message as string}
              />
            </Box>

            {/* Weight */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Weight (lbs) - Optional"
                type="number"
                {...register('weight', { valueAsNumber: true })}
                error={!!errors.weight}
                helperText={errors.weight?.message as string}
              />
            </Box>

            {/* Height */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Height (inches) - Optional"
                type="number"
                {...register('height', { valueAsNumber: true })}
                error={!!errors.height}
                helperText={errors.height?.message as string}
              />
            </Box>

            {/* Blood Sugar */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Blood Sugar (mg/dL) - Optional"
                type="number"
                {...register('bloodSugar', { valueAsNumber: true })}
                error={!!errors.bloodSugar}
                helperText={errors.bloodSugar?.message as string}
              />
            </Box>

            {/* Carotid Doppler */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                select
                label="Carotid Doppler Result - Optional"
                {...register('carotidDoppler')}
                error={!!errors.carotidDoppler}
                helperText={errors.carotidDoppler?.message as string}
                defaultValue="Normal"
              >
                {carotidDopplerOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            {/* Lab Results Section */}
            <Box>
              <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Lab Results</Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <strong>💡 Note:</strong> Enter lab test results if available.
              </Alert>
              <Divider sx={{ mb: 3 }} />
            </Box>

            {/* HbA1c */}
            <Box sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="HbA1c (%) - Optional"
                type="number"
                inputProps={{ step: 0.1, min: 4, max: 15 }}
                placeholder="e.g., 5.7"
                {...register('hba1c', { valueAsNumber: true })}
                error={!!errors.hba1c}
                helperText={errors.hba1c?.message as string || "Normal range: <5.7% (Prediabetes: 5.7-6.4%, Diabetes: ≥6.5%)"}
              />
            </Box>

            {/* Lipid Panel Full */}
            <Box>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 2 }}>
                Lipid Panel Full
              </Typography>
              
              {/* Total Cholesterol */}
              <Box sx={{ width: { xs: '100%', sm: '50%' }, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Total Cholesterol (mg/dL) - Optional"
                  type="number"
                  inputProps={{ min: 50, max: 500 }}
                  placeholder="e.g., 200"
                  {...register('totalCholesterol', { valueAsNumber: true })}
                  error={!!errors.totalCholesterol}
                  helperText={errors.totalCholesterol?.message as string || "Desirable: <200 mg/dL"}
                />
              </Box>

              {/* LDL Cholesterol */}
              <Box sx={{ width: { xs: '100%', sm: '50%' }, mb: 2 }}>
                <TextField
                  fullWidth
                  label="LDL Cholesterol (mg/dL) - Optional"
                  type="number"
                  inputProps={{ min: 0, max: 300 }}
                  placeholder="e.g., 100"
                  {...register('ldlCholesterol', { valueAsNumber: true })}
                  error={!!errors.ldlCholesterol}
                  helperText={errors.ldlCholesterol?.message as string || "Optimal: <100 mg/dL"}
                />
              </Box>

              {/* HDL Cholesterol */}
              <Box sx={{ width: { xs: '100%', sm: '50%' }, mb: 2 }}>
                <TextField
                  fullWidth
                  label="HDL Cholesterol (mg/dL) - Optional"
                  type="number"
                  inputProps={{ min: 0, max: 150 }}
                  placeholder="e.g., 60"
                  {...register('hdlCholesterol', { valueAsNumber: true })}
                  error={!!errors.hdlCholesterol}
                  helperText={errors.hdlCholesterol?.message as string || "Optimal: ≥60 mg/dL (Men: ≥40, Women: ≥50)"}
                />
              </Box>

              {/* Triglycerides */}
              <Box sx={{ width: { xs: '100%', sm: '50%' }, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Triglycerides (mg/dL) - Optional"
                  type="number"
                  inputProps={{ min: 0, max: 1000 }}
                  placeholder="e.g., 150"
                  {...register('triglycerides', { valueAsNumber: true })}
                  error={!!errors.triglycerides}
                  helperText={errors.triglycerides?.message as string || "Normal: <150 mg/dL"}
                />
              </Box>
            </Box>

            {/* Mental Health Screening */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Mental Health Screening</Typography>
                {!showMentalHealthScreening && (
                  <Button
                    variant="outlined"
                    onClick={() => setShowMentalHealthScreening(true)}
                    startIcon={<PsychologyIcon />}
                  >
                    {mentalHealthData ? 'Edit Screening' : 'Start Screening'}
                  </Button>
                )}
              </Box>
              
              {showMentalHealthScreening ? (
                <EnhancedMentalHealthScreening
                  patientName={patient.name || `${patient.firstName || ''} ${patient.lastName || ''}`.trim()}
                  date={new Date().toLocaleDateString()}
                  onComplete={handleMentalHealthComplete}
                  initialData={mentalHealthData || undefined}
                />
              ) : mentalHealthData ? (
                <Box>
                  <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', mb: 2 }}>
                <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Mental Health Screening Results
                  </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                        <Chip
                          label={`PHQ-2: ${mentalHealthData.phq2.reduce((a, b) => a + b, 0)} / 6`}
                          color={mentalHealthData.needsPHQ9 ? 'warning' : 'success'}
                        />
                        <Chip
                          label={`GAD-2: ${mentalHealthData.gad2.reduce((a, b) => a + b, 0)} / 6`}
                          color={mentalHealthData.needsGAD7 ? 'warning' : 'success'}
                        />
                        {mentalHealthData.phq9 && (
                          <Chip
                            label={`PHQ-9: ${calculateMentalHealthScore()} / 27`}
                            color="primary"
                          />
                        )}
                        {mentalHealthData.gad7 && (
                          <Chip
                            label={`GAD-7: ${mentalHealthData.gad7.reduce((a, b) => a + b, 0)} / 21`}
                            color="secondary"
                          />
                        )}
                      </Box>
                      {mentalHealthData.phq9 && (
                        <Typography variant="body1" sx={{ mt: 2 }}>
                    Severity: {getMentalHealthSeverity(calculateMentalHealthScore())}
                  </Typography>
                      )}
                      {mentalHealthData.followUpPlan && (
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>Follow-up Plan:</strong> {mentalHealthData.followUpPlan}
                          </Typography>
                        </Box>
                      )}
                </CardContent>
              </Card>
                </Box>
              ) : (
                <Alert severity="info">
                  Click "Start Screening" to begin the mental health assessment.
                </Alert>
              )}
            </Box>

            <Box>
              <Box display="flex" justifyContent="center" mt={2}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                  sx={{ minWidth: 200 }}
                >
                  {loading ? 'Recording...' : 'Record Vitals'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default VitalsTracking;
