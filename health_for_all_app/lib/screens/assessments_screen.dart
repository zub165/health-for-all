import 'package:flutter/material.dart';

import '../models/patient.dart';
import '../services/hybrid_data_service.dart';

class AssessmentsScreen extends StatefulWidget {
  const AssessmentsScreen({super.key});

  @override
  State<AssessmentsScreen> createState() => _AssessmentsScreenState();
}

class _AssessmentsScreenState extends State<AssessmentsScreen> {
  final _formKey = GlobalKey<FormState>();

  final _systolicController = TextEditingController();
  final _diastolicController = TextEditingController();
  final _glucoseController = TextEditingController();
  final _bmiController = TextEditingController();
  final _phq9Controller = TextEditingController();
  final _notesController = TextEditingController();

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
    _systolicController.dispose();
    _diastolicController.dispose();
    _glucoseController.dispose();
    _bmiController.dispose();
    _phq9Controller.dispose();
    _notesController.dispose();
    super.dispose();
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
    final glucose = double.parse(_glucoseController.text.trim());
    final bmi = double.parse(_bmiController.text.trim());
    final phq9 = double.parse(_phq9Controller.text.trim());

    final bpScore = ((systolic - 120).abs() + (diastolic - 80).abs()) / 40;
    final glucoseScore = (glucose - 100).abs() / 40;
    final bmiScore = (bmi - 22).abs() / 6;
    final mentalHealthScore = phq9 / 10;

    final composite = [bpScore, glucoseScore, bmiScore, mentalHealthScore]
        .fold<double>(0, (sum, value) => sum + value);
    final normalized = (composite / 4).clamp(0, 1);
    final risk = (normalized * 100).clamp(0, 100);

    final level = () {
      if (risk >= 66) return 'High Risk';
      if (risk >= 33) return 'Medium Risk';
      return 'Low Risk';
    }();

    final recommendation = <String>[
      if (risk >= 66)
        'Immediate follow-up recommended: elevated vitals and/or PHQ-9 indicate high risk.',
      if (bmi >= 30) 'Offer healthy lifestyle coaching; BMI suggests obesity.',
      if (glucose >= 140) 'Screen for diabetes or impaired glucose tolerance.',
      if (phq9 >= 10)
        'Provide mental health resources and consider counseling referral.',
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
        glucose: glucose,
        bmi: bmi,
        phq9: phq9,
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
    _systolicController.clear();
    _diastolicController.clear();
    _glucoseController.clear();
    _bmiController.clear();
    _phq9Controller.clear();
    _notesController.clear();
    setState(() {
      _riskScore = null;
      _riskLevel = null;
      _recommendations = const [];
      _lastRun = null;
      _submitMessage = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final cards = <Widget>[
      _buildPatientPicker(context),
      const SizedBox(height: 16),
      _buildVitalsCard(context),
      const SizedBox(height: 16),
      _buildMentalHealthCard(context),
      const SizedBox(height: 16),
      _buildNotesCard(context),
      const SizedBox(height: 16),
      _buildResultsCard(context),
    ];

    return Column(
      children: [
        if (_loadingPatients || _submitting)
          const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: LayoutBuilder(
            builder: (context, constraints) {
              if (constraints.maxWidth > 900) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 5,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(children: cards.sublist(0, 4)),
                      ),
                    ),
                    Expanded(
                      flex: 4,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: cards.sublist(4).first,
                      ),
                    ),
                  ],
                );
              }
              return ListView(
                padding: const EdgeInsets.all(16),
                children: cards,
              );
            },
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
              'Assessment results are posted to GoDaddy /api/vitals/ for the selected patient.',
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
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Vitals & Biometrics',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              Text(
                'Capture key vitals for rapid risk assessment. Values mirror the web workflow.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _numberField(
                    controller: _systolicController,
                    label: 'Blood Pressure (Systolic)',
                    suffix: 'mmHg',
                  ),
                  _numberField(
                    controller: _diastolicController,
                    label: 'Blood Pressure (Diastolic)',
                    suffix: 'mmHg',
                  ),
                  _numberField(
                    controller: _glucoseController,
                    label: 'Glucose',
                    suffix: 'mg/dL',
                  ),
                  _numberField(
                    controller: _bmiController,
                    label: 'BMI',
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
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
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMentalHealthCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Mental Health Screening',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(
              'Capture PHQ-9 score to flag patient mental health support needs.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            _numberField(
              controller: _phq9Controller,
              label: 'PHQ-9 Score',
            ),
          ],
        ),
      ),
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
            Text(
              'Field Notes',
              style: Theme.of(context).textTheme.titleLarge,
            ),
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
                    backgroundColor: _riskColor.withOpacity(0.15),
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
        color: Theme.of(context).colorScheme.surfaceVariant,
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
            'Select a patient, enter vitals, then press "Run & Save Assessment". '
            'Results sync to the GoDaddy backend when online.',
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
  }) {
    return SizedBox(
      width: 220,
      child: TextFormField(
        controller: controller,
        keyboardType: const TextInputType.numberWithOptions(decimal: true),
        decoration: InputDecoration(
          labelText: label,
          suffixText: suffix,
          border: const OutlineInputBorder(),
        ),
        validator: (value) {
          if (value == null || value.trim().isEmpty) {
            return 'Required';
          }
          final parsed = double.tryParse(value.trim());
          if (parsed == null) {
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
