import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Science as ScienceIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { labApi, LabTest, LabTestOrder, LabTestResult } from '../services/labApi';
import { icd10Api, ICD10Code } from '../services/icd10Api';
import ExportActions from './ExportActions';

interface LabManagementProps {
  patientId?: string;
  patientName?: string;
}

const LabManagement: React.FC<LabManagementProps> = ({ patientId, patientName }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [orders, setOrders] = useState<LabTestOrder[]>([]);
  const [results, setResults] = useState<LabTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LabTestOrder | null>(null);
  
  // Form states
  const [orderForm, setOrderForm] = useState({
    test_id: '',
    ordered_by: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    notes: ''
  });
  
  const [resultForm, setResultForm] = useState({
    result_value: '',
    result_unit: '',
    reference_range: '',
    status: 'normal' as 'normal' | 'abnormal' | 'critical',
    notes: ''
  });

  // ICD-10 states
  const [icd10Codes, setIcd10Codes] = useState<ICD10Code[]>([]);
  const [showIcd10Dialog, setShowIcd10Dialog] = useState(false);
  const [icd10SearchQuery, setIcd10SearchQuery] = useState('');

  useEffect(() => {
    loadTests();
    if (patientId) {
      loadPatientOrders();
    }
  }, [patientId]);

  const loadTests = async () => {
    setLoading(true);
    try {
      const response = await labApi.getTests();
      if (response.success && response.data) {
        setTests(response.data);
      } else {
        setError(response.error || 'Failed to load tests');
      }
    } catch (err) {
      setError('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientOrders = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const response = await labApi.getPatientTestOrders(patientId);
      if (response.success && response.data) {
        setOrders(response.data);
      } else {
        setError(response.error || 'Failed to load orders');
      }
    } catch (err) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!patientId || !selectedTest) return;
    
    setLoading(true);
    try {
      const orderData = {
        patient_id: patientId,
        test_id: selectedTest.id,
        test_name: selectedTest.test_name,
        test_code: selectedTest.test_code,
        ordered_by: orderForm.ordered_by,
        order_date: new Date().toISOString(),
        status: 'pending' as const,
        priority: orderForm.priority,
        notes: orderForm.notes
      };

      const response = await labApi.createTestOrder(orderData);
      if (response.success) {
        setShowOrderDialog(false);
        setOrderForm({ test_id: '', ordered_by: '', priority: 'routine', notes: '' });
        loadPatientOrders();
      } else {
        setError(response.error || 'Failed to create order');
      }
    } catch (err) {
      setError('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchICD10 = async () => {
    if (!icd10SearchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await icd10Api.searchCodes(icd10SearchQuery);
      if (response.success && response.data) {
        setIcd10Codes(response.data);
      } else {
        setError(response.error || 'Failed to search ICD-10 codes');
      }
    } catch (err) {
      setError('Failed to search ICD-10 codes');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'stat': return 'error';
      case 'urgent': return 'warning';
      case 'routine': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <ExportActions
        contentRef={contentRef}
        fileName="Lab_Management"
        downloadLabel="📥 Save Lab PDF"
        printLabel="🖨️ Print Lab"
      />
      <Box ref={contentRef}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <ScienceIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Lab Management
        </Typography>
      </Box>

      {patientName && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Managing lab orders for: <strong>{patientName}</strong>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowOrderDialog(true)}
          disabled={!patientId}
        >
          Order Lab Test
        </Button>
        <Button
          variant="outlined"
          startIcon={<SearchIcon />}
          onClick={() => setShowIcd10Dialog(true)}
        >
          Search ICD-10 Codes
        </Button>
        <Button
          variant="outlined"
          startIcon={<AssignmentIcon />}
          onClick={loadTests}
        >
          Refresh Tests
        </Button>
      </Box>

      {/* Available Tests */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Available Lab Tests
          </Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Test Code</TableCell>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Turnaround</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell>{test.test_code}</TableCell>
                    <TableCell>{test.test_name}</TableCell>
                    <TableCell>{test.category_name}</TableCell>
                    <TableCell>${test.price}</TableCell>
                    <TableCell>{test.turnaround_time}h</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedTest(test);
                          setOrderForm(prev => ({ ...prev, test_id: test.id }));
                          setShowOrderDialog(true);
                        }}
                        disabled={!patientId}
                      >
                        Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Patient Orders */}
      {patientId && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient Lab Orders
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Order Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>{order.test_name}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.priority}
                          color={getPriorityColor(order.priority) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.order_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Results">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowResultDialog(true);
                            }}
                          >
                            <AssignmentIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      </Box>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onClose={() => setShowOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Order Lab Test</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Test"
              value={selectedTest?.test_name || ''}
              disabled
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <TextField
                fullWidth
                label="Ordered By"
                value={orderForm.ordered_by}
                onChange={(e) => setOrderForm(prev => ({ ...prev, ordered_by: e.target.value }))}
                required
                sx={{ flex: '1 1 300px' }}
              />
              <FormControl fullWidth sx={{ flex: '1 1 300px' }}>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={orderForm.priority}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, priority: e.target.value as any }))}
                >
                  <MenuItem value="routine">Routine</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="stat">STAT</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={3}
              value={orderForm.notes}
              onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateOrder} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ICD-10 Search Dialog */}
      <Dialog open={showIcd10Dialog} onClose={() => setShowIcd10Dialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Search ICD-10 Codes</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 2 }}>
            <TextField
              fullWidth
              label="Search ICD-10 Codes"
              value={icd10SearchQuery}
              onChange={(e) => setIcd10SearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchICD10()}
            />
            <Button
              variant="contained"
              onClick={handleSearchICD10}
              sx={{ mt: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          </Box>
          
          {icd10Codes.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {icd10Codes.map((code, index) => (
                    <TableRow key={index}>
                      <TableCell>{code.code}</TableCell>
                      <TableCell>{code.description}</TableCell>
                      <TableCell>{code.category || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowIcd10Dialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabManagement;
