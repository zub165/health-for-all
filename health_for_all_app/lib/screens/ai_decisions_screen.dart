import 'package:flutter/material.dart';

import '../models/patient.dart';
import '../services/hybrid_data_service.dart';

/// AI decision support — mirrors React `AIHealthAssessment` (client-side rules).
/// Backend `/api/ai/` is not deployed on GoDaddy; scoring runs locally.
class AiDecisionsScreen extends StatefulWidget {
  const AiDecisionsScreen({super.key});

  @override
  State<AiDecisionsScreen> createState() => _AiDecisionsScreenState();
}

class _AiDecisionsScreenState extends State<AiDecisionsScreen> {
  List<Patient> _patients = const [];
  bool _loading = true;
  bool _processing = false;
  String? _error;
  String _search = '';

  Patient? _selected;
  double? _healthScore;
  String? _riskLevel;
  List<String> _riskFactors = const [];
  List<String> _recommendations = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final patients = await HybridDataService.instance.fetchPatients();
      if (!mounted) return;
      setState(() {
        _patients = patients;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  List<Patient> get _filtered {
    final q = _search.trim().toLowerCase();
    if (q.isEmpty) return _patients;
    return _patients.where((p) {
      return p.fullName.toLowerCase().contains(q) ||
          (p.email?.toLowerCase().contains(q) ?? false) ||
          (p.phone?.contains(q) ?? false);
    }).toList();
  }

  Future<void> _runAi(Patient patient) async {
    setState(() {
      _selected = patient;
      _processing = true;
      _healthScore = null;
      _riskLevel = null;
      _riskFactors = const [];
      _recommendations = const [];
    });

    // Match React UX delay so users see "AI processing"
    await Future<void>.delayed(const Duration(milliseconds: 1200));

    final result = HybridDataService.instance.runAiDecision(patient);
    if (!mounted) return;
    setState(() {
      _processing = false;
      _healthScore = (result['health_score'] as num).toDouble();
      _riskLevel = result['risk_level'] as String;
      _riskFactors = List<String>.from(result['risk_factors'] as List);
      _recommendations = List<String>.from(result['recommendations'] as List);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_loading || _processing) const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'AI Decisions',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Select a patient to generate AI risk score, factors, and care recommendations '
                '(same decision rules as the React AI Health Assessment).',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: Colors.red.shade700)),
              ],
              const SizedBox(height: 16),
              TextField(
                decoration: const InputDecoration(
                  labelText: 'Search patients',
                  prefixIcon: Icon(Icons.search),
                  border: OutlineInputBorder(),
                ),
                onChanged: (v) => setState(() => _search = v),
              ),
              const SizedBox(height: 16),
              if (_filtered.isEmpty && !_loading)
                const Text('No patients found. Add a patient first.')
              else
                ..._filtered.take(30).map(
                      (p) => Card(
                        elevation: 0,
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(child: Text(p.initials)),
                          title: Text(p.fullName),
                          subtitle: Text(
                            '${p.age} yrs • ${p.riskLevel} • score ${p.healthScore}',
                          ),
                          trailing: FilledButton(
                            onPressed: _processing ? null : () => _runAi(p),
                            child: const Text('Run AI'),
                          ),
                        ),
                      ),
                    ),
              if (_selected != null) ...[
                const SizedBox(height: 24),
                _buildResultsCard(context),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildResultsCard(BuildContext context) {
    final color = () {
      switch (_riskLevel) {
        case 'High Risk':
          return Colors.red.shade600;
        case 'Medium Risk':
          return Colors.orange.shade700;
        default:
          return Colors.green.shade600;
      }
    }();

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'AI Decision — ${_selected!.fullName}',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            if (_processing)
              const Text('Analyzing patient profile…')
            else if (_healthScore != null) ...[
              Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    backgroundColor: color.withOpacity(0.15),
                    child: Text(
                      _healthScore!.toStringAsFixed(0),
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _riskLevel ?? '',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(color: color),
                      ),
                      Text('Health score ${_healthScore!.toStringAsFixed(1)} / 100'),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text('Risk factors', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ..._riskFactors.map(
                (f) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    children: [
                      Icon(Icons.warning_amber, size: 18, color: Colors.orange.shade700),
                      const SizedBox(width: 8),
                      Expanded(child: Text(f)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text('Recommendations', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ..._recommendations.map(
                (r) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.check_circle_outline, size: 18),
                      const SizedBox(width: 8),
                      Expanded(child: Text(r)),
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
}
