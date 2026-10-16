import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Autocomplete
} from '@mui/material';
import {
  MedicalServices as MedicalIcon,
  Search as SearchIcon,
  AutoFixHigh as AutoFixIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { icd10Api, ICD10Code } from '../services/icd10Api';
import ExportActions from './ExportActions';

interface ICD10DiagnosisProps {
  patientId?: string;
  patientName?: string;
  onDiagnosisSelect?: (diagnosis: ICD10Code) => void;
}

const ICD10Diagnosis: React.FC<ICD10DiagnosisProps> = ({ 
  patientId, 
  patientName, 
  onDiagnosisSelect 
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ICD10Code[]>([]);
  const [commonCodes, setCommonCodes] = useState<ICD10Code[]>([]);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState<ICD10Code | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Auto-coding states
  const [clinicalText, setClinicalText] = useState('');
  const [autoCodedResults, setAutoCodedResults] = useState<ICD10Code[]>([]);
  const [showAutoCodeDialog, setShowAutoCodeDialog] = useState(false);

  useEffect(() => {
    loadCommonCodes();
  }, []);

  const loadCommonCodes = async () => {
    setLoading(true);
    try {
      const response = await icd10Api.getCommonHealthFairCodes();
      if (response.success && response.data) {
        setCommonCodes(response.data);
      } else {
        setError(response.error || 'Failed to load common codes');
      }
    } catch (err) {
      setError('Failed to load common codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await icd10Api.searchCodes(searchQuery);
      if (response.success && response.data) {
        setSearchResults(response.data);
      } else {
        setError(response.error || 'Failed to search ICD-10 codes');
      }
    } catch (err) {
      setError('Failed to search ICD-10 codes');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoCode = async () => {
    if (!clinicalText.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await icd10Api.autoCodeClinicalText(clinicalText);
      if (response.success && response.data) {
        setAutoCodedResults(response.data);
        setShowAutoCodeDialog(true);
      } else {
        setError(response.error || 'Failed to auto-code clinical text');
      }
    } catch (err) {
      setError('Failed to auto-code clinical text');
    } finally {
      setLoading(false);
    }
  };

  const handleDiagnosisSelect = (diagnosis: ICD10Code) => {
    setSelectedDiagnosis(diagnosis);
    if (onDiagnosisSelect) {
      onDiagnosisSelect(diagnosis);
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return 'default';
    
    if (category.includes('Factors influencing health')) return 'info';
    if (category.includes('Diseases of the circulatory')) return 'error';
    if (category.includes('Endocrine')) return 'warning';
    if (category.includes('Mental')) return 'secondary';
    return 'default';
  };

  return (
    <Box sx={{ p: 3 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="ICD10_Diagnosis"
        downloadLabel="📥 Save ICD-10 PDF"
        printLabel="🖨️ Print ICD-10"
      />
      <Box ref={contentRef}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <MedicalIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          ICD-10 Diagnosis Coding
        </Typography>
      </Box>

      {patientName && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Coding diagnoses for: <strong>{patientName}</strong>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Search ICD-10 Codes
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Search ICD-10 Codes"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter symptoms, conditions, or ICD-10 code..."
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading || !searchQuery.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
            >
              Search
            </Button>
          </Box>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((code, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {code.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={code.category || 'N/A'}
                          color={getCategoryColor(code.category) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleDiagnosisSelect(code)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Auto-Coding Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Auto-Code Clinical Text
          </Typography>
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Clinical Notes"
              value={clinicalText}
              onChange={(e) => setClinicalText(e.target.value)}
              placeholder="Enter clinical notes, symptoms, or assessment findings..."
            />
          </Box>
          <Button
            variant="outlined"
            onClick={handleAutoCode}
            disabled={loading || !clinicalText.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <AutoFixIcon />}
          >
            Auto-Code
          </Button>
        </CardContent>
      </Card>

      {/* Common Health Fair Codes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Common Health Fair Codes
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {commonCodes.map((code, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {code.code}
                      </Typography>
                    </TableCell>
                    <TableCell>{code.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={code.category || 'N/A'}
                        color={getCategoryColor(code.category) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleDiagnosisSelect(code)}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Selected Diagnosis */}
      {selectedDiagnosis && (
        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Selected Diagnosis
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="body2" fontWeight="bold">
                  Code: {selectedDiagnosis.code}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  Category: {selectedDiagnosis.category || 'N/A'}
                </Typography>
              </Box>
              <Typography variant="body1">
                {selectedDiagnosis.description}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      </Box>

      {/* Auto-Code Results Dialog */}
      <Dialog 
        open={showAutoCodeDialog} 
        onClose={() => setShowAutoCodeDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Auto-Coded Results</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              The following ICD-10 codes were automatically identified from your clinical text:
            </Typography>
          </Alert>
          
          {autoCodedResults.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {autoCodedResults.map((code, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {code.code}
                        </Typography>
                      </TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => {
                            handleDiagnosisSelect(code);
                            setShowAutoCodeDialog(false);
                          }}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="warning">
              No ICD-10 codes were automatically identified from the clinical text.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAutoCodeDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ICD10Diagnosis;
