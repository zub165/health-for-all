import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  Card,
  CardContent,
  Alert,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Chip,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

// PHQ-2 Questions (Initial Screening)
const PHQ2_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
];

// GAD-2 Questions (Initial Screening)
const GAD2_QUESTIONS = [
  "Feeling nervous, anxious, or on edge?",
  "Not being able to stop or control worrying?",
];

// PHQ-9 Questions (Full Assessment)
const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things?",
  "Feeling down, depressed, or hopeless?",
  "Trouble falling or staying asleep, or sleeping too much?",
  "Feeling tired or having little energy?",
  "Poor appetite or overeating?",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down?",
  "Trouble concentrating on things, such as reading the newspaper or watching television?",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?",
  "Thoughts that you would be better off dead, or of hurting yourself in some way?",
];

// GAD-7 Questions (Full Assessment)
const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge?",
  "Not being able to stop or control worrying?",
  "Worrying too much about different things?",
  "Trouble relaxing?",
  "Being so restless that it is hard to sit still?",
  "Becoming easily annoyed or irritable?",
  "Feeling afraid, as if something awful might happen?",
];

const RESPONSE_OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" },
];

const FUNCTIONAL_IMPAIRMENT_OPTIONS = [
  { value: 0, label: "Not difficult at all" },
  { value: 1, label: "Somewhat difficult" },
  { value: 2, label: "Very difficult" },
  { value: 3, label: "Extremely difficult" },
];

interface MentalHealthScreeningData {
  // Part 1: Initial Screening
  phq2: number[]; // [0, 0] for 2 questions
  gad2: number[]; // [0, 0] for 2 questions
  
  // Part 2: Clinical Action
  needsPHQ9: boolean;
  needsGAD7: boolean;
  
  // Part 3: Full Assessments (if triggered)
  phq9?: number[]; // 9 questions
  functionalImpairment?: number;
  gad7?: number[]; // 7 questions
  
  // Clinician Use
  followUpPlan?: string;
}

interface EnhancedMentalHealthScreeningProps {
  patientName?: string;
  date?: string;
  onComplete?: (data: MentalHealthScreeningData) => void;
  initialData?: Partial<MentalHealthScreeningData>;
}

const EnhancedMentalHealthScreening: React.FC<EnhancedMentalHealthScreeningProps> = ({
  patientName = '',
  date = new Date().toLocaleDateString(),
  onComplete,
  initialData,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [phq2, setPHQ2] = useState<number[]>(initialData?.phq2 || [0, 0]);
  const [gad2, setGAD2] = useState<number[]>(initialData?.gad2 || [0, 0]);
  const [phq9, setPHQ9] = useState<number[]>(initialData?.phq9 || Array(9).fill(0));
  const [functionalImpairment, setFunctionalImpairment] = useState<number>(initialData?.functionalImpairment || 0);
  const [gad7, setGAD7] = useState<number[]>(initialData?.gad7 || Array(7).fill(0));
  const [followUpPlan, setFollowUpPlan] = useState<string>(initialData?.followUpPlan || '');

  // Calculate scores
  const phq2Score = phq2.reduce((sum, val) => sum + val, 0);
  const gad2Score = gad2.reduce((sum, val) => sum + val, 0);
  const phq9Score = phq9.reduce((sum, val) => sum + val, 0);
  const gad7Score = gad7.reduce((sum, val) => sum + val, 0);

  // Clinical action logic
  const needsPHQ9 = phq2Score >= 3;
  const needsGAD7 = gad2Score >= 3;

  // Get severity labels
  const getPHQ9Severity = (score: number): { label: string; color: 'success' | 'warning' | 'error' } => {
    if (score <= 4) return { label: 'Minimal depression', color: 'success' };
    if (score <= 9) return { label: 'Mild depression', color: 'warning' };
    if (score <= 14) return { label: 'Moderate depression', color: 'warning' };
    if (score <= 19) return { label: 'Moderately severe depression', color: 'error' };
    return { label: 'Severe depression', color: 'error' };
  };

  const getGAD7Severity = (score: number): { label: string; color: 'success' | 'warning' | 'error' } => {
    if (score <= 4) return { label: 'Minimal anxiety', color: 'success' };
    if (score <= 9) return { label: 'Mild anxiety', color: 'warning' };
    if (score <= 14) return { label: 'Moderate anxiety', color: 'warning' };
    return { label: 'Severe anxiety', color: 'error' };
  };

  const handlePHQ2Change = (index: number, value: number) => {
    const updated = [...phq2];
    updated[index] = value;
    setPHQ2(updated);
  };

  const handleGAD2Change = (index: number, value: number) => {
    const updated = [...gad2];
    updated[index] = value;
    setGAD2(updated);
  };

  const handlePHQ9Change = (index: number, value: number) => {
    const updated = [...phq9];
    updated[index] = value;
    setPHQ9(updated);
  };

  const handleGAD7Change = (index: number, value: number) => {
    const updated = [...gad7];
    updated[index] = value;
    setGAD7(updated);
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // After Part 1, determine if we need Part 3
      if (needsPHQ9 || needsGAD7) {
        setActiveStep(2); // Skip to Part 3
      } else {
        setActiveStep(1); // Show clinical action summary
      }
    } else if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    if (activeStep === 2) {
      if (needsPHQ9 || needsGAD7) {
        setActiveStep(0); // Go back to Part 1
      } else {
        setActiveStep(1);
      }
    } else if (activeStep === 1) {
      setActiveStep(0);
    }
  };

  const handleComplete = () => {
    const data: MentalHealthScreeningData = {
      phq2,
      gad2,
      needsPHQ9,
      needsGAD7,
      phq9: needsPHQ9 ? phq9 : undefined,
      functionalImpairment: needsPHQ9 ? functionalImpairment : undefined,
      gad7: needsGAD7 ? gad7 : undefined,
      followUpPlan,
    };
    onComplete?.(data);
  };

  const steps = [
    'Part 1: Initial Screening',
    'Part 2: Clinical Action',
    'Part 3: Full Assessments',
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Mental Health Screening
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="Patient Name"
            value={patientName}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
          />
          <TextField
            label="Date"
            value={date}
            variant="outlined"
            size="small"
            sx={{ flex: 1 }}
          />
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Part 1: Initial Screening */}
      {activeStep === 0 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Part 1: Initial Screening
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Over the last 2 weeks, how often have you been bothered by:
          </Typography>

          {/* PHQ-2 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                A. PHQ-2 (Patient Health Questionnaire-2)
              </Typography>
              {PHQ2_QUESTIONS.map((question, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {index + 1}. {question}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={phq2[index]}
                      onChange={(e) => handlePHQ2Change(index, parseInt(e.target.value))}
                    >
                      {RESPONSE_OPTIONS.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio />}
                          label={`${option.label} (${option.value})`}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">
                  PHQ-2 Subtotal: {phq2Score} / 6
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* GAD-2 */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                B. GAD-2 (Generalized Anxiety Disorder-2)
              </Typography>
              {GAD2_QUESTIONS.map((question, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <FormControl component="fieldset" fullWidth>
                    <FormLabel component="legend" sx={{ mb: 1 }}>
                      {index + 1}. {question}
                    </FormLabel>
                    <RadioGroup
                      row
                      value={gad2[index]}
                      onChange={(e) => handleGAD2Change(index, parseInt(e.target.value))}
                    >
                      {RESPONSE_OPTIONS.map((option) => (
                        <FormControlLabel
                          key={option.value}
                          value={option.value}
                          control={<Radio />}
                          label={`${option.label} (${option.value})`}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                </Box>
              ))}
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">
                  GAD-2 Subtotal: {gad2Score} / 6
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button onClick={handleNext} variant="contained">
              Next: Clinical Action
            </Button>
          </Box>
        </Box>
      )}

      {/* Part 2: Clinical Action */}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Part 2: Clinical Action
          </Typography>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Clinical Decision Rules:</strong>
                </Typography>
                <Box component="ul" sx={{ pl: 3, mt: 1 }}>
                  <li>If PHQ-2 score ≥ 3, proceed to full PHQ-9</li>
                  <li>If GAD-2 score ≥ 3, proceed to full GAD-7</li>
                </Box>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Chip
                  icon={needsPHQ9 ? <WarningIcon /> : <CheckCircleIcon />}
                  label={`PHQ-2: ${phq2Score} / 6 ${needsPHQ9 ? '(Proceed to PHQ-9)' : '(No action needed)'}`}
                  color={needsPHQ9 ? 'warning' : 'success'}
                  sx={{ flex: 1 }}
                />
                <Chip
                  icon={needsGAD7 ? <WarningIcon /> : <CheckCircleIcon />}
                  label={`GAD-2: ${gad2Score} / 6 ${needsGAD7 ? '(Proceed to GAD-7)' : '(No action needed)'}`}
                  color={needsGAD7 ? 'warning' : 'success'}
                  sx={{ flex: 1 }}
                />
              </Box>

              {!needsPHQ9 && !needsGAD7 && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  <Typography>
                    Initial screening scores are below threshold. No further assessment required at this time.
                  </Typography>
                </Alert>
              )}

              {(needsPHQ9 || needsGAD7) && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography>
                    Initial screening indicates possible concerns. Proceeding to full assessment.
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button onClick={handleBack} variant="outlined">
              Back
            </Button>
            {(needsPHQ9 || needsGAD7) ? (
              <Button onClick={handleNext} variant="contained">
                Continue to Full Assessments
              </Button>
            ) : (
              <Button onClick={handleComplete} variant="contained" color="success">
                Complete Screening
              </Button>
            )}
          </Box>
        </Box>
      )}

      {/* Part 3: Full Assessments */}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h5" gutterBottom>
            Part 3: Full Assessments
          </Typography>

          {/* PHQ-9 */}
          {needsPHQ9 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  A. PHQ-9 (Complete if PHQ-2 ≥ 3)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Over the last 2 weeks, how often have you been bothered by:
                </Typography>
                {PHQ9_QUESTIONS.map((question, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel component="legend" sx={{ mb: 1 }}>
                        {index + 1}. {question}
                      </FormLabel>
                      <RadioGroup
                        row
                        value={phq9[index]}
                        onChange={(e) => handlePHQ9Change(index, parseInt(e.target.value))}
                      >
                        {RESPONSE_OPTIONS.map((option) => (
                          <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={<Radio />}
                            label={`${option.label} (${option.value})`}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>
                ))}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, mb: 2 }}>
                  <Typography variant="h6">
                    PHQ-9 Total Score: {phq9Score} / 27
                  </Typography>
                  <Chip
                    label={getPHQ9Severity(phq9Score).label}
                    color={getPHQ9Severity(phq9Score).color}
                    sx={{ mt: 1 }}
                  />
                </Box>

                {/* Functional Impairment */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="h6" gutterBottom>
                  Functional Impairment
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  If you checked off any problems on this questionnaire, how difficult have they made it for you to do your work, take care of things at home, or get along with other people?
                </Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    row
                    value={functionalImpairment}
                    onChange={(e) => setFunctionalImpairment(parseInt(e.target.value))}
                  >
                    {FUNCTIONAL_IMPAIRMENT_OPTIONS.map((option) => (
                      <FormControlLabel
                        key={option.value}
                        value={option.value}
                        control={<Radio />}
                        label={`${option.label} (${option.value})`}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              </CardContent>
            </Card>
          )}

          {/* GAD-7 */}
          {needsGAD7 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  B. GAD-7 (Complete if GAD-2 ≥ 3)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Over the last 2 weeks, how often have you been bothered by:
                </Typography>
                {GAD7_QUESTIONS.map((question, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel component="legend" sx={{ mb: 1 }}>
                        {index + 1}. {question}
                      </FormLabel>
                      <RadioGroup
                        row
                        value={gad7[index]}
                        onChange={(e) => handleGAD7Change(index, parseInt(e.target.value))}
                      >
                        {RESPONSE_OPTIONS.map((option) => (
                          <FormControlLabel
                            key={option.value}
                            value={option.value}
                            control={<Radio />}
                            label={`${option.label} (${option.value})`}
                          />
                        ))}
                      </RadioGroup>
                    </FormControl>
                  </Box>
                ))}
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="h6">
                    GAD-7 Total Score: {gad7Score} / 21
                  </Typography>
                  <Chip
                    label={getGAD7Severity(gad7Score).label}
                    color={getGAD7Severity(gad7Score).color}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          )}

          {/* Clinician Use Only */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Clinician Use Only
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Follow-up Plan"
                value={followUpPlan}
                onChange={(e) => setFollowUpPlan(e.target.value)}
                placeholder="Enter follow-up plan, recommendations, referrals, etc."
                sx={{ mt: 2 }}
              />
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button onClick={handleBack} variant="outlined">
              Back
            </Button>
            <Button onClick={handleComplete} variant="contained" color="primary">
              Complete Screening
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EnhancedMentalHealthScreening;
export type { MentalHealthScreeningData };

