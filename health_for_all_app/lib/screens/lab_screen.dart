import 'package:flutter/material.dart';

import '../services/api_client.dart';
import '../services/hybrid_data_service.dart';

class LabScreen extends StatefulWidget {
  const LabScreen({super.key});

  @override
  State<LabScreen> createState() => _LabScreenState();
}

class _LabScreenState extends State<LabScreen> {
  List<LabTestInfo> _tests = const [];
  bool _loading = true;
  String? _error;
  final List<Icd10Result> _recentCodes = sampleIcd10Results;

  @override
  void initState() {
    super.initState();
    _loadLabTests();
  }

  Future<void> _loadLabTests() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tests = await HybridDataService.instance.fetchLabTests();
      if (!mounted) return;
      setState(() {
        _tests = tests;
        _loading = false;
      });
    } on ApiException catch (error) {
      if (!mounted) return;
      setState(() {
        _error = error.message;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _error = '$error';
        _loading = false;
      });
    }
  }

  void _showTestDetails(LabTestInfo test) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(test.testName),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _DetailRow(label: 'Code', value: test.testCode),
            _DetailRow(label: 'Category', value: test.categoryName),
            _DetailRow(label: 'Normal range', value: test.normalRange ?? '—'),
            _DetailRow(label: 'Unit', value: test.unit ?? '—'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showCodeDetails(Icd10Result result) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${result.code} • ${result.shortDescription}'),
        content: Text(result.longDescription),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        if (_loading) const LinearProgressIndicator(minHeight: 3),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(
                'Lab & ICD-10 Tools',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 12),
              Text(
                'Lab catalog from https://api.mywaitime.com/lab/ (GoDaddy).',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: Colors.red.shade700)),
                TextButton(onPressed: _loadLabTests, child: const Text('Retry')),
              ],
              const SizedBox(height: 24),
              _buildLabCatalogCard(context),
              const SizedBox(height: 16),
              _buildIcd10Card(context),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildLabCatalogCard(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Lab Catalog', style: Theme.of(context).textTheme.titleLarge),
                const Spacer(),
                TextButton.icon(
                  onPressed: _loading ? null : _loadLabTests,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Refresh'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (!_loading && _tests.isEmpty)
              const Text('No lab tests returned from backend.')
            else
              ..._tests.take(40).map(
                    (test) => ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: Colors.teal.withOpacity(0.12),
                        child: const Icon(Icons.science, color: Colors.teal),
                      ),
                      title: Text(test.testName),
                      subtitle: Text(
                        '${test.testCode} • ${test.categoryName}'
                        '${test.normalRange != null ? ' • ${test.normalRange}' : ''}',
                      ),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => _showTestDetails(test),
                    ),
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildIcd10Card(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('ICD-10 Lookup', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 12),
            TextField(
              decoration: const InputDecoration(
                labelText: 'Search ICD-10 code or description',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
              onSubmitted: (value) {
                final match = _recentCodes.where(
                  (c) =>
                      c.code.toLowerCase().contains(value.toLowerCase()) ||
                      c.shortDescription.toLowerCase().contains(value.toLowerCase()),
                );
                if (match.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('No local match for "$value"')),
                  );
                } else {
                  _showCodeDetails(match.first);
                }
              },
            ),
            const SizedBox(height: 16),
            Text('Common codes', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ..._recentCodes.map(
              (code) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.receipt_long),
                title: Text('${code.code} • ${code.shortDescription}'),
                subtitle: Text(
                  code.longDescription,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => _showCodeDetails(code),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class Icd10Result {
  Icd10Result({
    required this.code,
    required this.shortDescription,
    required this.longDescription,
  });

  final String code;
  final String shortDescription;
  final String longDescription;
}

final sampleIcd10Results = <Icd10Result>[
  Icd10Result(
    code: 'E11.9',
    shortDescription: 'Type 2 diabetes mellitus',
    longDescription: 'Type 2 diabetes mellitus without complications.',
  ),
  Icd10Result(
    code: 'I10',
    shortDescription: 'Essential (primary) hypertension',
    longDescription: 'Primary hypertension without specification of complications.',
  ),
  Icd10Result(
    code: 'Z00.00',
    shortDescription: 'General adult medical exam',
    longDescription:
        'Encounter for general adult medical examination without abnormal findings.',
  ),
];
