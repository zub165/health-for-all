import 'package:flutter/material.dart';

import '../models/patient.dart';
import '../services/hybrid_data_service.dart';
import '../widgets/mental_health_screening.dart';

/// Full Health Fair assessment — mirrors React `VitalsTracking`:
/// vitals, HbA1c, lipid panel, carotid Doppler, mental health scores.
class AssessmentsScreen extends StatefulWidget {
  const AssessmentsScreen({super.key});

  @override
  State<AssessmentsScreen> createState() => _AssessmentsScreenState();
}

class _AssessmentsScreenState extends State<AssessmentsScreen> {
  final _formKey = GlobalKey<FormState>();

  // Core vitals
  final _systolicController = TextEditingController();
  final _diastolicController = TextEditingController();
  final _heartRateController = TextEditingController();
  final _temperatureController = TextEditingController();
  final _spo2Controller = TextEditingController();
  final _weightController = TextEditingController();
  final _heightController = TextEditingController();
  final _glucoseController = TextEditingController();
  final _bmiController = TextEditingController();

  // Labs
  final _hba1cController = TextEditingController();
  final _totalCholController = TextEditingController();
  final _ldlController = TextEditingController();
  final _hdlController = TextEditingController();
  final _trigController = TextEditingController();

  final _notesController = TextEditingController();
  final _mentalHealthKey = GlobalKey<MentalHealthScreeningFormState>();
  MentalHealthScreeningResult? _mentalHealth;

  static const _carotidOptions = <String>[
    'Normal',
    'Mild stenosis (< 50%)',
    'Moderate stenosis (50-69%)',
    'Severe stenosis (70-99%)',
    'Occlusion (100%)',
  ];

  String? _carotidDoppler;

  List<Patient> _patients = const [];
  String? _selectedPatientId;
  bool _loadingPatients = true;
  bool _submitting = false;

  double? _riskScore;
  String? _riskLevel;
  List<String> _recommendations = const [];
  DateTime? _lastRun;
  String? _submitMessage;

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients() async {
    setState(() => _loadingPatients = true);
    try {
      final patients = await HybridDataService.instance.fetchPatients();
      if (!mounted) return;
      setState(() {
        _patients = patients;
        _selectedPatientId = patients.isNotEmpty ? patients.first.id : null;
        _loadingPatients = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _loadingPatients = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Could not load patients: $error')),
      );
    }
  }

  @override
  void dispose() {
    for (final c in [
      _systolicController,
      _diastolicController,
      _heartRateController,
      _temperatureController,
      _spo2Controller,
      _weightController,
      _heightController,
      _glucoseController,
      _bmiController,
      _hba1cController,
      _totalCholController,
      _ldlController,
      _hdlController,
      _trigController,
      _notesController,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  double? _parseOptional(TextEditingController c) {
    final t = c.text.trim();
    if (t.isEmpty) return null;
    return double.tryParse(t);
  }

  void _maybeComputeBmi() {
    final w = _parseOptional(_weightController);
    final h = _parseOptional(_heightController);
    if (w == null || h == null || h <= 0) return;
    // weight lbs, height inches (same as React health fair)
    final bmi = (w / (h * h)) * 703;
    _bmiController.text = bmi.toStringAsFixed(1);
  }

  String _mentalHealthSeverity(double score) {
    if (score <= 4) return 'Minimal depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  }

  Future<void> _runAssessment() async {
    if (_formKey.currentState?.validate() != true) return;
    final selectedPatient = _patients.cast<Patient?>().firstWhere(
          (p) => p?.id == _selectedPatientId,
          orElse: () => null,
        );
    if (selectedPatient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a patient before running assessment')),
      );
      return;
    }

    final systolic = double.parse(_systolicController.text.trim());
    final diastolic = double.parse(_diastolicController.text.trim());
    final glucose = _parseOptional(_glucoseController) ?? 100;
    final bmi = _parseOptional(_bmiController) ?? 22;
    final mh = _mentalHealth ?? _mentalHealthKey.currentState?.result;
    final phq2 = mh?.phq2Score.toDouble();
    final gad2 = mh?.gad2Score.toDouble();
    final phq9 = (mh?.primaryDepressionScore ?? 0).toDouble();
    final gad7 = mh?.gad7Score?.toDouble();
    final hba1c = _parseOptional(_hba1cController);
    final totalChol = _parseOptional(_totalCholController);
    final ldl = _parseOptional(_ldlController);
    final hdl = _parseOptional(_hdlController);
    final trig = _parseOptional(_trigController);
    final hr = _parseOptional(_heartRateController);
    final temp = _parseOptional(_temperatureController);
    final spo2 = _parseOptional(_spo2Controller);
    final weight = _parseOptional(_weightController);
    final height = _parseOptional(_heightController);

    final bpScore = ((systolic - 120).abs() + (diastolic - 80).abs()) / 40;
    final glucoseScore = (glucose - 100).abs() / 40;
    final bmiScore = (bmi - 22).abs() / 6;
    final mentalHealthScore = phq9 / 10;
    final hba1cScore = hba1c == null ? 0.0 : ((hba1c - 5.4).abs() / 2).clamp(0, 2);
    final lipidScore = () {
      if (ldl == null && totalChol == null) return 0.0;
      final l = ldl ?? (totalChol! - 50);
      return ((l - 100).abs() / 50).clamp(0, 2);
    }();

    final parts = [bpScore, glucoseScore, bmiScore, mentalHealthScore, hba1cScore, lipidScore];
    final composite = parts.fold<double>(0, (sum, value) => sum + value);
    final normalized = (composite / parts.length).clamp(0, 1);
    final risk = (normalized * 100).clamp(0, 100);

    final level = () {
      if (risk >= 66) return 'High Risk';
      if (risk >= 33) return 'Medium Risk';
      return 'Low Risk';
    }();

    final recommendation = <String>[
      if (risk >= 66)
        'Immediate follow-up recommended: elevated vitals and/or screening scores indicate high risk.',
      if (bmi >= 30) 'Offer healthy lifestyle coaching; BMI suggests obesity.',
      if (glucose >= 140) 'Screen for diabetes or impaired glucose tolerance.',
      if (hba1c != null && hba1c >= 6.5) 'HbA1c suggests diabetes — confirm and refer.',
      if (hba1c != null && hba1c >= 5.7 && hba1c < 6.5)
        'HbA1c in prediabetes range — lifestyle counseling.',
      if (ldl != null && ldl >= 160) 'Elevated LDL — discuss lipid management.',
      if (totalChol != null && totalChol >= 240) 'High total cholesterol — follow lipid panel.',
      if (_carotidDoppler != null &&
          _carotidDoppler != 'Normal' &&
          _carotidDoppler!.isNotEmpty)
        'Abnormal carotid Doppler ($_carotidDoppler) — cardiology / vascular follow-up.',
      if (phq9 >= 10)
        'Provide mental health resources and consider counseling referral (${_mentalHealthSeverity(phq9)}).',
      if (gad7 != null && gad7 >= 10) 'Elevated GAD-7 — anxiety follow-up recommended.',
      if (risk < 33)
        'Encourage routine annual screening and wellness education.',
      if (_notesController.text.trim().isNotEmpty)
        'Volunteer note: ${_notesController.text.trim()}',
    ];

    setState(() {
      _riskScore = double.parse(risk.toStringAsFixed(1));
      _riskLevel = level;
      _recommendations = recommendation.isEmpty
          ? const ['No recommendations generated. Continue standard monitoring.']
          : recommendation;
      _lastRun = DateTime.now();
      _submitting = true;
      _submitMessage = null;
    });

    try {
      await HybridDataService.instance.submitVitalsAssessment(
        patientId: selectedPatient.id,
        systolic: systolic,
        diastolic: diastolic,
        heartRate: hr,
        temperature: temp,
        oxygenSaturation: spo2,
        weight: weight,
        height: height,
        glucose: glucose,
        bmi: bmi,
        hba1c: hba1c,
        totalCholesterol: totalChol,
        ldlCholesterol: ldl,
        hdlCholesterol: hdl,
        triglycerides: trig,
        carotidDoppler: _carotidDoppler,
        phq2: phq2,
        gad2: gad2,
        phq9: phq9,
        gad7: gad7,
        riskScore: _riskScore!,
        riskLevel: level,
        notes: _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _submitMessage =
            'Saved locally and posted vitals to api.mywaitime.com for ${selectedPatient.fullName}';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_submitMessage!)),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _submitting = false;
        _submitMessage = 'Saved locally only (API error: $error)';
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(_submitMessage!)),
      );
    }
  }

  void _resetForm() {
    _formKey.currentState?.reset();
    for (final c in [
      _systolicController,
      _diastolicController,
      _heartRateController,
      _temperatureController,
      _spo2Controller,
      _weightController,
      _heightController,
      _glucoseController,
      _bmiController,
      _hba1cController,
      _totalCholController,
      _ldlController,
      _hdlController,
      _trigController,
      _notesController,
    ]) {
      c.clear();
    }
    _mentalHealthKey.currentState?.reset();
    setState(() {
      _carotidDoppler = null;
      _mentalHealth = null;
      _riskScore = null;
      _riskLevel = null;
      _recommendations = const [];
      _lastRun = null;
      _submitMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_loadingPatients || _submitting)
          const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: Form(
            key: _formKey,
            child: LayoutBuilder(
              builder: (context, constraints) {
                final left = <Widget>[
                  _buildPatientPicker(context),
                  const SizedBox(height: 16),
                  _buildVitalsCard(context),
                  const SizedBox(height: 16),
                  _buildLabsCard(context),
                  const SizedBox(height: 16),
                  _buildCarotidCard(context),
                  const SizedBox(height: 16),
                  _buildMentalHealthCard(context),
                  const SizedBox(height: 16),
                  _buildNotesCard(context),
                  const SizedBox(height: 16),
                  _buildActions(context),
                ];
                final right = <Widget>[_buildResultsCard(context)];

                if (constraints.maxWidth > 900) {
                  return Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 5,
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(children: left),
                        ),
                      ),
                      Expanded(
                        flex: 4,
                        child: SingleChildScrollView(
                          padding: const EdgeInsets.all(16),
                          child: Column(children: right),
                        ),
                      ),
                    ],
                  );
                }
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [...left, const SizedBox(height: 16), ...right],
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPatientPicker(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Patient', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Same fields as web Doctor → Record Vitals: vitals, HbA1c, lipid panel, '
              'carotid Doppler, mental health scores. Saved to /api/vitals/.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            if (_patients.isEmpty)
              const Text('No patients loaded. Open Patients tab and sync first.')
            else
              DropdownButtonFormField<String>(
                // ignore: deprecated_member_use — controlled selection after async load
                value: _selectedPatientId,
                decoration: const InputDecoration(
                  labelText: 'Select patient',
                  border: OutlineInputBorder(),
                ),
                items: _patients
                    .map(
                      (p) => DropdownMenuItem(
                        value: p.id,
                        child: Text(p.fullName),
                      ),
                    )
                    .toList(),
                onChanged: (value) => setState(() => _selectedPatientId = value),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildVitalsCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Vitals', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Blood pressure required; other vitals optional (matches web).',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _numberField(
                  controller: _systolicController,
                  label: 'BP Systolic',
                  suffix: 'mmHg',
                  required: true,
                ),
                _numberField(
                  controller: _diastolicController,
                  label: 'BP Diastolic',
                  suffix: 'mmHg',
                  required: true,
                ),
                _numberField(
                  controller: _heartRateController,
                  label: 'Heart Rate',
                  suffix: 'bpm',
                ),
                _numberField(
                  controller: _temperatureController,
                  label: 'Temperature',
                  suffix: '°F',
                ),
                _numberField(
                  controller: _spo2Controller,
                  label: 'Oxygen Saturation',
                  suffix: '%',
                ),
                _numberField(
                  controller: _weightController,
                  label: 'Weight',
                  suffix: 'lbs',
                  onChanged: (_) => _maybeComputeBmi(),
                ),
                _numberField(
                  controller: _heightController,
                  label: 'Height',
                  suffix: 'in',
                  onChanged: (_) => _maybeComputeBmi(),
                ),
                _numberField(
                  controller: _glucoseController,
                  label: 'Blood Sugar / Glucose',
                  suffix: 'mg/dL',
                ),
                _numberField(
                  controller: _bmiController,
                  label: 'BMI',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLabsCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Labs — HbA1c & Lipid Panel', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Optional. Normal HbA1c <5.7%; lipid targets match web helpers.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                _numberField(
                  controller: _hba1cController,
                  label: 'HbA1c',
                  suffix: '%',
                  helper: 'Normal <5.7 · Prediabetes 5.7–6.4 · Diabetes ≥6.5',
                ),
                _numberField(
                  controller: _totalCholController,
                  label: 'Total Cholesterol',
                  suffix: 'mg/dL',
                  helper: 'Desirable <200',
                ),
                _numberField(
                  controller: _ldlController,
                  label: 'LDL Cholesterol',
                  suffix: 'mg/dL',
                  helper: 'Optimal <100',
                ),
                _numberField(
                  controller: _hdlController,
                  label: 'HDL Cholesterol',
                  suffix: 'mg/dL',
                  helper: 'Optimal ≥60',
                ),
                _numberField(
                  controller: _trigController,
                  label: 'Triglycerides',
                  suffix: 'mg/dL',
                  helper: 'Normal <150',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCarotidCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Carotid Doppler', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              // ignore: deprecated_member_use
              value: _carotidDoppler ?? '',
              decoration: const InputDecoration(
                labelText: 'Carotid Doppler Result (optional)',
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(value: '', child: Text('Not recorded')),
                ..._carotidOptions.map(
                  (o) => DropdownMenuItem(value: o, child: Text(o)),
                ),
              ],
              onChanged: (v) => setState(
                () => _carotidDoppler = (v == null || v.isEmpty) ? null : v,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMentalHealthCard(BuildContext context) {
    return MentalHealthScreeningForm(
      key: _mentalHealthKey,
      onChanged: (result) => setState(() => _mentalHealth = result),
    );
  }

  Widget _buildNotesCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Field Notes', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: FilledButton.icon(
            onPressed: _submitting ? null : _runAssessment,
            icon: const Icon(Icons.analytics),
            label: Text(_submitting ? 'Saving…' : 'Run & Save Assessment'),
          ),
        ),
        const SizedBox(width: 12),
        OutlinedButton.icon(
          onPressed: _resetForm,
          icon: const Icon(Icons.restart_alt),
          label: const Text('Reset'),
        ),
      ],
    );
  }

  Widget _buildResultsCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Assessment Summary',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const Spacer(),
                if (_lastRun != null)
                  Text(
                    _formatTimestamp(_lastRun!),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Theme.of(context).colorScheme.onSurfaceVariant,
                        ),
                  ),
              ],
            ),
            if (_submitMessage != null) ...[
              const SizedBox(height: 8),
              Text(
                _submitMessage!,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.green.shade700,
                    ),
              ),
            ],
            const SizedBox(height: 16),
            if (_riskScore == null)
              _buildEmptyResultPlaceholder(context)
            else ...[
              Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: _riskColor.withValues(alpha: 0.15),
                    child: Text(
                      _riskScore!.toStringAsFixed(0),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: _riskColor,
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _riskLevel!,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: _riskColor,
                            ),
                      ),
                      Text(
                        'Composite risk score ${_riskScore!.toStringAsFixed(1)} / 100',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Recommendations', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ..._recommendations.map(
                (item) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle_outline, size: 18),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyResultPlaceholder(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(12),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'No assessment run yet',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Enter vitals, HbA1c, lipid panel, carotid Doppler, and mental health '
            'scores, then press Run & Save Assessment.',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  Widget _numberField({
    required TextEditingController controller,
    required String label,
    String? suffix,
    String? helper,
    bool required = false,
    ValueChanged<String>? onChanged,
  }) {
    return SizedBox(
      width: 220,
      child: TextFormField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        onChanged: onChanged,
        decoration: InputDecoration(
          labelText: label,
          suffixText: suffix,
          helperText: helper,
          border: const OutlineInputBorder(),
        ),
        validator: (value) {
          final t = value?.trim() ?? '';
          if (t.isEmpty) {
            return required ? 'Required' : null;
          }
          if (double.tryParse(t) == null) {
            return 'Invalid number';
          }
          return null;
        },
      ),
    );
  }

  Color get _riskColor {
    switch (_riskLevel) {
      case 'High Risk':
        return Colors.red.shade600;
      case 'Medium Risk':
        return Colors.orange.shade700;
      default:
        return Colors.green.shade600;
    }
  }

  String _formatTimestamp(DateTime dateTime) {
    final date = dateTime.toLocal();
    final datePart = '${_monthString(date.month)} ${date.day}, ${date.year}';
    final hour = date.hour % 12 == 0 ? 12 : date.hour % 12;
    final minute = date.minute.toString().padLeft(2, '0');
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '$datePart • $hour:$minute $period';
  }

  String _monthString(int month) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    return months[month - 1];
  }
}
