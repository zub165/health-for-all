import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import {
  Science as ScienceIcon,
  Add as AddIcon,
  LocalHospital as ImagingIcon,
} from '@mui/icons-material';
import { labApi, LabTest } from '../services/labApi';
import { patientLabService, PatientLabOrder } from '../services/patientLabService';
import { useAppData } from '../context/AppDataContext';
import { PatientData } from '../services/hybridPatientService';
import { GODADDY_BACKENDS, LAB_IMAGING_CODES } from '../config/godaddyBackends';
import ExportActions from './ExportActions';

type CatalogTab = 'lab' | 'radiology';

function isImagingTest(test: LabTest): boolean {
  const code = (test.test_code || '').toUpperCase();
  if ((LAB_IMAGING_CODES as readonly string[]).includes(code)) return true;
  return (test.category_name || '').toLowerCase().includes('imaging');
}

const LabManagement: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { patients, loading: patientsLoading } = useAppData();

  const [tests, setTests] = useState<LabTest[]>([]);
  const [orders, setOrders] = useState<PatientLabOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('lab');
  const [selectedPatient, setSelectedPatient] = useState<PatientData | null>(null);
  const [search, setSearch] = useState('');

  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [orderForm, setOrderForm] = useState({
    ordered_by: '',
    priority: 'routine' as 'routine' | 'urgent' | 'stat',
    notes: '',
  });

  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PatientLabOrder | null>(null);
  const [resultForm, setResultForm] = useState({
    result_value: '',
    result_unit: '',
    reference_range: '',
    status: 'normal' as 'normal' | 'abnormal' | 'critical' | 'report',
    notes: '',
  });

  useEffect(() => {
    void loadTests();
  }, []);

  useEffect(() => {
    if (selectedPatient?.id) {
      void loadOrders(selectedPatient.id, selectedPatient.full_name || '');
    } else {
      setOrders([]);
    }
  }, [selectedPatient?.id]);

  const loadTests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await labApi.getTests();
      if (response.success && response.data) {
        setTests(response.data.filter((t) => t.is_active !== false));
      } else {
        setError(response.error || 'Failed to load tests from GoDaddy /lab/tests/');
      }
    } catch {
      setError('Failed to load tests from GoDaddy /lab/tests/');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (patientId: string, patientName: string) => {
    setLoading(true);
    try {
      const list = await patientLabService.getOrdersForPatient(patientId, patientName);
      setOrders(list);
    } catch {
      setError('Failed to load patient lab/radiology orders');
    } finally {
      setLoading(false);
    }
  };

  const labTests = useMemo(
    () =>
      tests.filter((t) => !isImagingTest(t)).filter((t) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          t.test_name.toLowerCase().includes(q) ||
          t.test_code.toLowerCase().includes(q) ||
          (t.category_name || '').toLowerCase().includes(q)
        );
      }),
    [tests, search]
  );

  const radiologyTests = useMemo(
    () =>
      tests.filter((t) => isImagingTest(t)).filter((t) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          t.test_name.toLowerCase().includes(q) ||
          t.test_code.toLowerCase().includes(q)
        );
      }),
    [tests, search]
  );

  const visibleTests = catalogTab === 'lab' ? labTests : radiologyTests;
  const patientOrders = orders.filter((o) =>
    catalogTab === 'radiology' ? o.kind === 'radiology' : o.kind === 'lab'
  );

  const openOrder = (test: LabTest) => {
    if (!selectedPatient) {
      setError('Select a patient first — orders attach to the patient profile.');
      return;
    }
    setSelectedTest(test);
    setShowOrderDialog(true);
  };

  const handleCreateOrder = async () => {
    if (!selectedPatient || !selectedTest) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const kind = isImagingTest(selectedTest) ? 'radiology' : 'lab';
      const result = await patientLabService.createOrder({
        patientId: selectedPatient.id,
        patientName: selectedPatient.full_name || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim(),
        test: selectedTest,
        orderedBy: orderForm.ordered_by || 'Health For ALL staff',
        priority: orderForm.priority,
        notes: orderForm.notes,
        kind,
      });
      if (!result.success || !result.order) {
        setError(result.error || 'Failed to create order');
        return;
      }
      setShowOrderDialog(false);
      setOrderForm({ ordered_by: '', priority: 'routine', notes: '' });
      setSelectedTest(null);
      setSuccess(
        result.backendSynced
          ? `${kind === 'radiology' ? 'Radiology' : 'Lab'} order saved locally and to GoDaddy /api/lab-results/`
          : `${kind === 'radiology' ? 'Radiology' : 'Lab'} order saved locally (backend sync pending)`
      );
      await loadOrders(selectedPatient.id, selectedPatient.full_name || '');
    } catch {
      setError('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const openResult = (order: PatientLabOrder) => {
    setSelectedOrder(order);
    setResultForm({
      result_value: order.resultValue || '',
      result_unit: order.resultUnit || '',
      reference_range: order.referenceRange || '',
      status: order.resultStatus || (order.kind === 'radiology' ? 'report' : 'normal'),
      notes: order.notes || '',
    });
    setShowResultDialog(true);
  };

  const handleSaveResult = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const res = await patientLabService.updateResult(selectedOrder.id, {
        resultValue: resultForm.result_value,
        resultUnit: resultForm.result_unit,
        referenceRange: resultForm.reference_range,
        resultStatus: resultForm.status,
        notes: resultForm.notes,
      });
      if (!res.success) {
        setError(res.error || 'Failed to save result');
        return;
      }
      setShowResultDialog(false);
      setSuccess('Result saved on patient profile (hybrid local)');
      if (selectedPatient) {
        await loadOrders(selectedPatient.id, selectedPatient.full_name || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const patientLabel = (p: PatientData) =>
    p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || p.id;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <ExportActions
        contentRef={contentRef}
        fileName={
          selectedPatient
            ? `HFA_${patientLabel(selectedPatient).replace(/\s+/g, '_')}_Lab_Radiology`
            : 'Lab_Radiology_Catalog'
        }
        downloadLabel="📥 Save Lab/Radiology PDF"
        printLabel="🖨️ Print Lab/Radiology"
      />

      <Box ref={contentRef}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
          <ScienceIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            Lab &amp; Radiology
          </Typography>
          <Chip size="small" label="GoDaddy hybrid" color="primary" variant="outlined" />
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            GoDaddy backends (this screen)
          </Typography>
          <Typography variant="body2" component="div">
            <strong>Catalog:</strong> {GODADDY_BACKENDS.labManagement.tests}
            <br />
            → nginx → <code>django_hospitalfinder</code> :3015 (<code>lab_management</code>)
            <br />
            <strong>Radiology:</strong> same API, Imaging category (XRAY / CT / MRI / US) — there is no{' '}
            <code>/radiology/</code> URL
            <br />
            <strong>Patient profile:</strong> {GODADDY_BACKENDS.hospitalFinder.labResults}
            <br />
            → same VPS :3015 (<code>/api/lab-results/</code>) + localStorage hybrid
          </Typography>
        </Alert>

        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              1. Select patient (required to order)
            </Typography>
            <Autocomplete
              options={patients}
              loading={patientsLoading}
              value={selectedPatient}
              onChange={(_, value) => setSelectedPatient(value)}
              getOptionLabel={patientLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search patients"
                  placeholder="Name, email…"
                  helperText={`${patients.length} patients from hybrid AppData (GoDaddy /api/patients/)`}
                />
              )}
            />
            {selectedPatient && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Ordering for <strong>{patientLabel(selectedPatient)}</strong> (id:{' '}
                <code>{selectedPatient.id}</code>)
              </Alert>
            )}
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Tabs
          value={catalogTab}
          onChange={(_, v: CatalogTab) => setCatalogTab(v)}
          sx={{ mb: 2 }}
        >
          <Tab icon={<ScienceIcon />} iconPosition="start" label={`Lab (${labTests.length})`} value="lab" />
          <Tab
            icon={<ImagingIcon />}
            iconPosition="start"
            label={`Radiology (${radiologyTests.length})`}
            value="radiology"
          />
        </Tabs>

        <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            label="Filter catalog"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />
          <Button variant="outlined" onClick={() => void loadTests()} disabled={loading}>
            Refresh catalog
          </Button>
          {loading && <CircularProgress size={22} />}
        </Box>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {catalogTab === 'lab' ? 'Available lab tests' : 'Radiology / imaging studies'} (from{' '}
              <code>/lab/tests/</code>)
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 360 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleTests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>{test.test_code}</TableCell>
                      <TableCell>{test.test_name}</TableCell>
                      <TableCell>{test.category_name}</TableCell>
                      <TableCell>${test.price}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<AddIcon />}
                          onClick={() => openOrder(test)}
                          disabled={!selectedPatient}
                        >
                          Order
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleTests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        {loading ? 'Loading…' : 'No tests in this catalog filter.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Patient {catalogTab === 'lab' ? 'lab' : 'radiology'} orders
              {selectedPatient ? ` — ${patientLabel(selectedPatient)}` : ''}
            </Typography>
            {!selectedPatient && (
              <Typography color="text.secondary">Select a patient to see orders on their profile.</Typography>
            )}
            {selectedPatient && (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Test</TableCell>
                      <TableCell>Kind</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Result</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {patientOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.testCode} — {order.testName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={order.kind}
                            color={order.kind === 'radiology' ? 'secondary' : 'primary'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip size="small" label={order.status} />
                        </TableCell>
                        <TableCell>{order.resultValue || '—'}</TableCell>
                        <TableCell>
                          {new Date(order.orderDate).toLocaleString()}
                        </TableCell>
                        <TableCell>{order.source}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => openResult(order)}>
                            Add / edit result
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {patientOrders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7}>No orders yet for this patient.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>

      <Dialog open={showOrderDialog} onClose={() => setShowOrderDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Order {selectedTest && isImagingTest(selectedTest) ? 'radiology' : 'lab'} test
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Patient" value={selectedPatient ? patientLabel(selectedPatient) : ''} disabled fullWidth />
            <TextField label="Test" value={selectedTest?.test_name || ''} disabled fullWidth />
            <TextField
              label="Ordered by"
              value={orderForm.ordered_by}
              onChange={(e) => setOrderForm((p) => ({ ...p, ordered_by: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                label="Priority"
                value={orderForm.priority}
                onChange={(e) =>
                  setOrderForm((p) => ({
                    ...p,
                    priority: e.target.value as 'routine' | 'urgent' | 'stat',
                  }))
                }
              >
                <MenuItem value="routine">Routine</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="stat">STAT</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Clinical notes"
              multiline
              rows={3}
              value={orderForm.notes}
              onChange={(e) => setOrderForm((p) => ({ ...p, notes: e.target.value }))}
              fullWidth
            />
            <Alert severity="info">
              Saves to browser localStorage and POSTs to GoDaddy{' '}
              <code>/api/lab-results/</code> on patient <code>{selectedPatient?.id}</code>.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowOrderDialog(false)}>Cancel</Button>
          <Button onClick={() => void handleCreateOrder()} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Create order'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showResultDialog} onClose={() => setShowResultDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enter result / report</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Result / findings"
              value={resultForm.result_value}
              onChange={(e) => setResultForm((p) => ({ ...p, result_value: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              required
            />
            <TextField
              label="Unit"
              value={resultForm.result_unit}
              onChange={(e) => setResultForm((p) => ({ ...p, result_unit: e.target.value }))}
              fullWidth
            />
            <TextField
              label="Reference range"
              value={resultForm.reference_range}
              onChange={(e) => setResultForm((p) => ({ ...p, reference_range: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Result status</InputLabel>
              <Select
                label="Result status"
                value={resultForm.status}
                onChange={(e) =>
                  setResultForm((p) => ({
                    ...p,
                    status: e.target.value as typeof resultForm.status,
                  }))
                }
              >
                <MenuItem value="normal">Normal</MenuItem>
                <MenuItem value="abnormal">Abnormal</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="report">Report (radiology)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              value={resultForm.notes}
              onChange={(e) => setResultForm((p) => ({ ...p, notes: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResultDialog(false)}>Cancel</Button>
          <Button
            onClick={() => void handleSaveResult()}
            variant="contained"
            disabled={loading || !resultForm.result_value.trim()}
          >
            Save result
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LabManagement;
