import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/patient.dart';
import '../services/api_client.dart';
import '../services/hybrid_data_service.dart';

/// Imaging codes from GoDaddy /lab/tests/ Imaging category (= radiology).
const _imagingCodes = {'XRAY', 'CT', 'MRI', 'US'};

class LabScreen extends StatefulWidget {
  const LabScreen({super.key});

  @override
  State<LabScreen> createState() => _LabScreenState();
}

class _LabScreenState extends State<LabScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<LabTestInfo> _tests = const [];
  List<Patient> _patients = const [];
  Patient? _selectedPatient;
  List<_LocalOrder> _orders = const [];
  bool _loading = true;
  String? _error;
  final List<Icd10Result> _recentCodes = sampleIcd10Results;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _bootstrap();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final tests = await HybridDataService.instance.fetchLabTests(limit: 200);
      final patients = await HybridDataService.instance.fetchPatients();
      if (!mounted) return;
      setState(() {
        _tests = tests;
        _patients = patients;
        _loading = false;
      });
      if (_selectedPatient != null) {
        await _loadOrders(_selectedPatient!.id);
      }
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

  bool _isImaging(LabTestInfo t) {
    final code = t.testCode.toUpperCase();
    if (_imagingCodes.contains(code)) return true;
    return t.categoryName.toLowerCase().contains('imaging');
  }

  List<LabTestInfo> get _labTests => _tests.where((t) => !_isImaging(t)).toList();
  List<LabTestInfo> get _radTests => _tests.where(_isImaging).toList();

  Future<void> _loadOrders(String patientId) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('hfa_patient_lab_orders_v1');
    if (raw == null || raw.isEmpty) {
      setState(() => _orders = const []);
      return;
    }
    try {
      final list = (jsonDecode(raw) as List)
          .cast<Map<String, dynamic>>()
          .map(_LocalOrder.fromJson)
          .where((o) => o.patientId == patientId)
          .toList();
      if (!mounted) return;
      setState(() => _orders = list);
    } catch (_) {
      if (!mounted) return;
      setState(() => _orders = const []);
    }
  }

  Future<void> _orderTest(LabTestInfo test) async {
    final patient = _selectedPatient;
    if (patient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a patient first')),
      );
      return;
    }
    final kind = _isImaging(test) ? 'radiology' : 'lab';
    final order = _LocalOrder(
      id: 'hfa-lab-${DateTime.now().millisecondsSinceEpoch}',
      patientId: patient.id,
      patientName: patient.fullName,
      kind: kind,
      testCode: test.testCode,
      testName: test.testName,
      resultValue: kind == 'radiology' ? 'Ordered — awaiting report' : 'Pending',
      status: 'pending',
      orderDate: DateTime.now().toIso8601String(),
    );

    final prefs = await SharedPreferences.getInstance();
    final existing = <Map<String, dynamic>>[];
    final raw = prefs.getString('hfa_patient_lab_orders_v1');
    if (raw != null && raw.isNotEmpty) {
      try {
        existing.addAll((jsonDecode(raw) as List).cast<Map<String, dynamic>>());
      } catch (_) {}
    }
    existing.insert(0, order.toJson());
    await prefs.setString('hfa_patient_lab_orders_v1', jsonEncode(existing));

    // Hybrid: POST GoDaddy /api/lab-results/
    try {
      await HybridDataService.instance.createPatientLabResult(
        patientId: patient.id,
        testName: test.testName,
        testCode: test.testCode,
        category: kind == 'radiology' ? 'imaging' : 'blood',
        resultValue: order.resultValue,
        units: test.unit ?? (kind == 'radiology' ? 'report' : 'n/a'),
        normalRange: test.normalRange ?? 'N/A',
      );
    } catch (e) {
      debugPrint('lab-results sync failed (kept local): $e');
    }

    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('$kind order saved for ${patient.fullName}')),
    );
    await _loadOrders(patient.id);
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
            const SizedBox(height: 8),
            const Text(
              'GoDaddy: https://api.mywaitime.com/lab/tests/\n'
              'Radiology = Imaging category on same API.',
              style: TextStyle(fontSize: 12),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Close'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.of(context).pop();
              _orderTest(test);
            },
            child: const Text('Order for patient'),
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
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: DropdownButtonFormField<Patient>(
            value: _selectedPatient,
            decoration: const InputDecoration(
              labelText: 'Patient (required to order)',
              border: OutlineInputBorder(),
              helperText: 'Orders sync to GoDaddy /api/lab-results/ + local',
            ),
            items: _patients
                .map(
                  (p) => DropdownMenuItem(
                    value: p,
                    child: Text(p.fullName, overflow: TextOverflow.ellipsis),
                  ),
                )
                .toList(),
            onChanged: (p) async {
              setState(() => _selectedPatient = p);
              if (p != null) await _loadOrders(p.id);
            },
          ),
        ),
        TabBar(
          controller: _tabs,
          tabs: [
            Tab(text: 'Lab (${_labTests.length})'),
            Tab(text: 'Radiology (${_radTests.length})'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _buildCatalog(_labTests, 'lab'),
              _buildCatalog(_radTests, 'radiology'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCatalog(List<LabTestInfo> tests, String kind) {
    final orders = _orders.where((o) => o.kind == kind).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'GoDaddy backends',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 4),
        Text(
          'Catalog: https://api.mywaitime.com/lab/tests/ (:3015 lab_management)\n'
          'Patient attach: https://api.mywaitime.com/api/lab-results/\n'
          'Radiology = Imaging (XRAY/CT/MRI/US) — no /radiology/ URL',
          style: Theme.of(context).textTheme.bodySmall,
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(_error!, style: TextStyle(color: Colors.red.shade700)),
          TextButton(onPressed: _bootstrap, child: const Text('Retry')),
        ],
        const SizedBox(height: 16),
        Text(
          kind == 'lab' ? 'Lab catalog' : 'Radiology / imaging',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        if (!_loading && tests.isEmpty)
          const Text('No tests returned from backend.')
        else
          ...tests.take(60).map(
                (test) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    backgroundColor: (kind == 'radiology' ? Colors.deepPurple : Colors.teal)
                        .withOpacity(0.12),
                    child: Icon(
                      kind == 'radiology' ? Icons.medical_services : Icons.science,
                      color: kind == 'radiology' ? Colors.deepPurple : Colors.teal,
                    ),
                  ),
                  title: Text(test.testName),
                  subtitle: Text('${test.testCode} • ${test.categoryName}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.add_circle_outline),
                    onPressed: () => _orderTest(test),
                  ),
                  onTap: () => _showTestDetails(test),
                ),
              ),
        const SizedBox(height: 24),
        Text(
          'Orders for selected patient',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        if (_selectedPatient == null)
          const Text('Select a patient to see orders.')
        else if (orders.isEmpty)
          const Text('No orders yet.')
        else
          ...orders.map(
            (o) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text('${o.testCode} — ${o.testName}'),
              subtitle: Text('${o.status} • ${o.resultValue}'),
              trailing: Text(o.orderDate.split('T').first),
            ),
          ),
        const SizedBox(height: 24),
        _buildIcd10Card(context),
      ],
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
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LocalOrder {
  _LocalOrder({
    required this.id,
    required this.patientId,
    required this.patientName,
    required this.kind,
    required this.testCode,
    required this.testName,
    required this.resultValue,
    required this.status,
    required this.orderDate,
  });

  final String id;
  final String patientId;
  final String patientName;
  final String kind;
  final String testCode;
  final String testName;
  final String resultValue;
  final String status;
  final String orderDate;

  Map<String, dynamic> toJson() => {
        'id': id,
        'patientId': patientId,
        'patientName': patientName,
        'kind': kind,
        'testCode': testCode,
        'testName': testName,
        'resultValue': resultValue,
        'status': status,
        'orderDate': orderDate,
      };

  factory _LocalOrder.fromJson(Map<String, dynamic> json) => _LocalOrder(
        id: '${json['id']}',
        patientId: '${json['patientId']}',
        patientName: '${json['patientName'] ?? ''}',
        kind: '${json['kind'] ?? 'lab'}',
        testCode: '${json['testCode'] ?? ''}',
        testName: '${json['testName'] ?? ''}',
        resultValue: '${json['resultValue'] ?? ''}',
        status: '${json['status'] ?? 'pending'}',
        orderDate: '${json['orderDate'] ?? ''}',
      );
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
