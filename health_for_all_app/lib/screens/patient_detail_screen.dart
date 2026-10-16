import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/assessment.dart';
import '../models/patient.dart';
import '../services/api_client.dart';
import '../services/hybrid_data_service.dart';

class PatientDetailScreen extends StatefulWidget {
  const PatientDetailScreen({super.key, required this.patient});

  final Patient patient;

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  late Patient _patient;
  List<Assessment> _assessments = const [];
  bool _loadingAssessments = true;

  @override
  void initState() {
    super.initState();
    _patient = widget.patient;
    _refreshAll();
  }

  Future<void> _refreshAll() async {
    await Future.wait([_refreshPatient(), _refreshAssessments()]);
  }

  Future<void> _refreshPatient() async {
    try {
      final detail = await HybridDataService.instance.fetchPatientDetail(_patient.id);
      if (!mounted) return;
      setState(() {
        _patient = detail;
      });
    } on ApiException catch (error) {
      _showError('Failed to refresh patient: ${error.message}');
    } catch (error) {
      _showError('Failed to refresh patient: $error');
    }
  }

  Future<void> _refreshAssessments() async {
    setState(() => _loadingAssessments = true);
    try {
      final assessments = await HybridDataService.instance.fetchPatientAssessments(_patient.id);
      if (!mounted) return;
      setState(() {
        _assessments = assessments;
        _loadingAssessments = false;
      });
    } on ApiException catch (error) {
      if (mounted) setState(() => _loadingAssessments = false);
      _showError('Failed to load assessments: ${error.message}');
    } catch (error) {
      if (mounted) setState(() => _loadingAssessments = false);
      _showError('Failed to load assessments: $error');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_patient.fullName),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshAll,
            tooltip: 'Refresh',
          ),
          IconButton(
            icon: const Icon(Icons.edit),
            tooltip: 'Edit patient',
            onPressed: _openEditSheet,
          ),
          IconButton(
            icon: Icon(Icons.delete_outline, color: Colors.red.shade700),
            tooltip: 'Delete patient',
            onPressed: _confirmDelete,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshAll,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildPatientOverview(context),
            const SizedBox(height: 16),
            _buildAssessmentsSection(context),
          ],
        ),
      ),
    );
  }

  Widget _buildPatientOverview(BuildContext context) {
    final infoStyle = Theme.of(context).textTheme.bodyMedium;
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Profile', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            _InfoRow(label: 'Age', value: '${_patient.age}'),
            _InfoRow(label: 'Gender', value: _patient.gender),
            _InfoRow(label: 'Email', value: _patient.email ?? 'n/a'),
            _InfoRow(label: 'Phone', value: _patient.phone ?? 'n/a'),
            _InfoRow(label: 'Volunteer Support', value: _patient.volunteerSupport ?? 'None'),
            const Divider(height: 24),
            Text('Latest Assessment', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('Risk level: ${_patient.riskLevel}', style: infoStyle),
            Text('Health score: ${_patient.healthScore}', style: infoStyle),
            Text('Last assessment: ${_patient.lastAssessment}', style: infoStyle),
          ],
        ),
      ),
    );
  }

  Widget _buildAssessmentsSection(BuildContext context) {
    if (_assessments.isEmpty) {
      return Card(
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Assessments', style: Theme.of(context).textTheme.titleLarge),
              if (_loadingAssessments) ...[
                const SizedBox(height: 12),
                const LinearProgressIndicator(minHeight: 3),
                const SizedBox(height: 8),
                const Text('Loading assessments from GoDaddy…'),
              ] else ...[
                const SizedBox(height: 12),
                Text(
                  'No assessments recorded for this patient yet.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
              ],
            ],
          ),
        ),
      );
    }

    final scores = _assessments.map((a) => a.score).toList().reversed.toList();

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Assessments', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            SizedBox(
              height: 180,
              child: _RiskTrendChart(scores: scores),
            ),
            const SizedBox(height: 12),
            for (final assessment in _assessments)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: Colors.blueGrey.shade50,
                  child: Text(assessment.score.toStringAsFixed(0)),
                ),
                title: Text('${assessment.assessmentType} • ${assessment.riskLevel}'),
                subtitle: Text(_formatTimestamp(assessment.submittedAt)),
                trailing: assessment.performedBy != null ? Text('By ${assessment.performedBy}') : null,
                onTap: () => _showAssessmentDetails(assessment),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _openEditSheet() async {
    final result = await showModalBottomSheet<Patient>(
      context: context,
      isScrollControlled: true,
      builder: (context) => PatientEditSheet(patient: _patient),
    );
    if (result != null) {
      setState(() => _patient = result);
      await _refreshAssessments();
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete patient?'),
        content: Text('Permanently delete ${_patient.fullName} from GoDaddy and this device?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red.shade700),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await HybridDataService.instance.deletePatient(_patient.id);
      if (!mounted) return;
      Navigator.of(context).pop(true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Deleted ${_patient.fullName}')),
      );
    } on ApiException catch (error) {
      _showError(error.message);
    } catch (error) {
      _showError('Delete failed: $error');
    }
  }

  void _showAssessmentDetails(Assessment assessment) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${assessment.assessmentType} Assessment'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Score: ${assessment.score.toStringAsFixed(1)}'),
            Text('Risk level: ${assessment.riskLevel}'),
            Text('Submitted: ${_formatTimestamp(assessment.submittedAt)}'),
            if (assessment.performedBy != null) Text('Performed by: ${assessment.performedBy}'),
            if (assessment.responses != null) ...[
              const SizedBox(height: 12),
              Text('Responses:', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 4),
              ...assessment.responses!.entries.map(
                (entry) => Text('${entry.key}: ${entry.value}'),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('Close')),
        ],
      ),
    );
  }

  void _showError(String message) {
    if (!mounted) return;
    setState(() {
      _loadingAssessments = false;
    });
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  String _formatTimestamp(DateTime dateTime) {
    final formatter = DateFormat('MMM d, yyyy • h:mm a');
    return formatter.format(dateTime.toLocal());
  }
}

class PatientEditSheet extends StatefulWidget {
  const PatientEditSheet({required this.patient, super.key});

  final Patient patient;

  @override
  State<PatientEditSheet> createState() => _PatientEditSheetState();
}

class _PatientEditSheetState extends State<PatientEditSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _ageController;
  late TextEditingController _genderController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _volunteerController;
  late TextEditingController _healthScoreController;
  late TextEditingController _riskLevelController;
  late TextEditingController _lastAssessmentController;

  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final patient = widget.patient;
    _firstNameController = TextEditingController(text: patient.firstName);
    _lastNameController = TextEditingController(text: patient.lastName);
    _ageController = TextEditingController(text: patient.age.toString());
    _genderController = TextEditingController(text: patient.gender);
    _emailController = TextEditingController(text: patient.email ?? '');
    _phoneController = TextEditingController(text: patient.phone ?? '');
    _volunteerController = TextEditingController(text: patient.volunteerSupport ?? '');
    _healthScoreController = TextEditingController(text: patient.healthScore.toString());
    _riskLevelController = TextEditingController(text: patient.riskLevel);
    _lastAssessmentController = TextEditingController(text: patient.lastAssessment);
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _ageController.dispose();
    _genderController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _volunteerController.dispose();
    _healthScoreController.dispose();
    _riskLevelController.dispose();
    _lastAssessmentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: SafeArea(
        child: Form(
          key: _formKey,
          child: ListView(
            padding: const EdgeInsets.all(16),
            shrinkWrap: true,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 20),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Text('Edit Patient', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              _buildTextField(_firstNameController, 'First name', validator: _requiredValidator),
              const SizedBox(height: 12),
              _buildTextField(_lastNameController, 'Last name', validator: _requiredValidator),
              const SizedBox(height: 12),
              _buildTextField(_ageController, 'Age', keyboardType: TextInputType.number, validator: _requiredValidator),
              const SizedBox(height: 12),
              _buildTextField(_genderController, 'Gender'),
              const SizedBox(height: 12),
              _buildTextField(_emailController, 'Email', keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 12),
              _buildTextField(_phoneController, 'Phone', keyboardType: TextInputType.phone),
              const SizedBox(height: 12),
              _buildTextField(_volunteerController, 'Volunteer support'),
              const SizedBox(height: 12),
              _buildTextField(_healthScoreController, 'Health score', keyboardType: TextInputType.number),
              const SizedBox(height: 12),
              _buildTextField(_riskLevelController, 'Risk level'),
              const SizedBox(height: 12),
              _buildTextField(_lastAssessmentController, 'Last assessment'),
              const SizedBox(height: 20),
              FilledButton.icon(
                onPressed: _saving ? null : _handleSave,
                icon: _saving
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.save),
                label: const Text('Save changes'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: _saving ? null : () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String label, {
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(labelText: label),
      keyboardType: keyboardType,
      validator: validator,
    );
  }

  String? _requiredValidator(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Required';
    }
    return null;
  }

  Future<void> _handleSave() async {
    if (_formKey.currentState?.validate() != true) return;

    setState(() => _saving = true);

    try {
      final updated = widget.patient.copyWith(
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        age: int.tryParse(_ageController.text.trim()) ?? widget.patient.age,
        gender: _genderController.text.trim().isEmpty ? widget.patient.gender : _genderController.text.trim(),
        email: _emailController.text.trim().isEmpty ? null : _emailController.text.trim(),
        phone: _phoneController.text.trim().isEmpty ? null : _phoneController.text.trim(),
        volunteerSupport:
            _volunteerController.text.trim().isEmpty ? null : _volunteerController.text.trim(),
        healthScore: int.tryParse(_healthScoreController.text.trim()) ?? widget.patient.healthScore,
        riskLevel: _riskLevelController.text.trim().isEmpty ? widget.patient.riskLevel : _riskLevelController.text.trim(),
        lastAssessment: _lastAssessmentController.text.trim().isEmpty
            ? widget.patient.lastAssessment
            : _lastAssessmentController.text.trim(),
      );

      final saved = await HybridDataService.instance.updatePatient(
        updated,
        changes: updated.toApiPayload(),
      );
      if (!mounted) return;
      Navigator.of(context).pop(saved);
    } on ApiException catch (error) {
      _showError('Failed to update patient: ${error.message}');
    } catch (error) {
      _showError('Failed to update patient: $error');
    } finally {
      if (mounted) {
        setState(() => _saving = false);
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final labelStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        );
    final valueStyle = Theme.of(context).textTheme.bodyMedium;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(width: 140, child: Text(label, style: labelStyle)),
          Expanded(child: Text(value, style: valueStyle)),
        ],
      ),
    );
  }
}

class _RiskTrendChart extends StatelessWidget {
  const _RiskTrendChart({required this.scores});

  final List<double> scores;

  @override
  Widget build(BuildContext context) {
    if (scores.length < 2) {
      return Center(
        child: Text('Not enough assessments for trend', style: Theme.of(context).textTheme.bodyMedium),
      );
    }
    return CustomPaint(
      painter: _RiskTrendPainter(scores: scores),
      child: Container(),
    );
  }
}

class _RiskTrendPainter extends CustomPainter {
  _RiskTrendPainter({required this.scores});

  final List<double> scores;

  @override
  void paint(Canvas canvas, Size size) {
    final paintLine = Paint()
      ..color = Colors.indigo
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke;
    final paintFill = Paint()
      ..color = Colors.indigo.withOpacity(0.12)
      ..style = PaintingStyle.fill;

    final normalized = scores.map((s) => s.clamp(0, 100) / 100).toList();
    final points = <Offset>[];
    final dx = size.width / (normalized.length - 1);
    for (var i = 0; i < normalized.length; i++) {
      final x = dx * i;
      final y = size.height - (normalized[i] * size.height);
      points.add(Offset(x, y));
    }

    final path = Path()..moveTo(points.first.dx, points.first.dy);
    for (var i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }

    final fillPath = Path.from(path)
      ..lineTo(points.last.dx, size.height)
      ..lineTo(points.first.dx, size.height)
      ..close();

    canvas.drawPath(fillPath, paintFill);
    canvas.drawPath(path, paintLine);

    final pointPaint = Paint()
      ..color = Colors.indigo
      ..style = PaintingStyle.fill;
    for (final point in points) {
      canvas.drawCircle(point, 3, pointPaint);
    }
  }

  @override
  bool shouldRepaint(covariant _RiskTrendPainter oldDelegate) {
    return oldDelegate.scores != scores;
  }
}
