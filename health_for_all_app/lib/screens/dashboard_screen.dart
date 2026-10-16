import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../models/patient.dart';
import '../models/volunteer.dart';
import '../services/hybrid_data_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  bool _isSyncing = false;
  bool _loading = true;
  String? _error;
  DashboardStats? _stats;
  List<Patient> _patients = const [];
  List<Volunteer> _volunteers = const [];
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadStats();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final service = HybridDataService.instance;
      final results = await Future.wait([
        service.fetchDashboardStats(),
        service.fetchPatients(),
        service.fetchVolunteers(),
      ]);
      if (!mounted) return;
      setState(() {
        _stats = results[0] as DashboardStats;
        _patients = results[1] as List<Patient>;
        _volunteers = results[2] as List<Volunteer>;
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

  Future<void> _handleManualSync() async {
    if (_isSyncing) return;
    setState(() => _isSyncing = true);
    try {
      await HybridDataService.instance.syncAll();
      await _loadStats();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Hybrid sync completed with GoDaddy API')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $error')),
      );
    } finally {
      if (mounted) setState(() => _isSyncing = false);
    }
  }

  Future<void> _printAiReport() async {
    final buffer = StringBuffer()
      ..writeln('Health For All — Assessment & AI Report')
      ..writeln('Generated: ${DateTime.now().toIso8601String()}')
      ..writeln('Patients: ${_patients.length} · Volunteers: ${_volunteers.length}')
      ..writeln('')
      ..writeln('=== PATIENTS / AI SCORES ===');
    for (final p in _patients) {
      buffer.writeln(
        '${p.fullName} | ${p.email ?? '—'} | score=${p.healthScore} | risk=${p.riskLevel}',
      );
    }
    buffer.writeln('');
    buffer.writeln('=== VOLUNTEERS ===');
    for (final v in _volunteers) {
      buffer.writeln(
        '${v.fullName} | ${v.organization} | ${v.role} | ${v.email ?? '—'}',
      );
    }
    await Clipboard.setData(ClipboardData(text: buffer.toString()));
    if (!mounted) return;
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Print / AI report'),
        content: SizedBox(
          width: 480,
          child: SingleChildScrollView(
            child: SelectableText(buffer.toString()),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Report copied — paste into Notes/Docs to print')),
              );
            },
            child: const Text('Copied to clipboard'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final stats = _stats;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (_loading) const LinearProgressIndicator(minHeight: 3),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Health Fair Dashboard',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Live KPIs from api.mywaitime.com with local offline cache.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: TextStyle(color: Colors.red.shade700)),
              ],
              const SizedBox(height: 12),
              Wrap(
                spacing: 12,
                runSpacing: 12,
                children: [
                  _DashboardCard(
                    title: 'Total Patients',
                    value: '${stats?.totalPatients ?? _patients.length}',
                    icon: Icons.people,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                  _DashboardCard(
                    title: "Today's Assessments",
                    value: '${stats?.assessmentsToday ?? '—'}',
                    icon: Icons.monitor_heart,
                    color: Colors.orange.shade600,
                  ),
                  _DashboardCard(
                    title: 'Volunteers',
                    value: '${stats?.totalVolunteers ?? _volunteers.length}',
                    icon: Icons.volunteer_activism,
                    color: Colors.green.shade600,
                  ),
                  _DashboardCard(
                    title: 'API',
                    value: _isSyncing
                        ? 'Sync…'
                        : (stats?.apiHealthy == true ? 'Online' : 'Offline'),
                    icon: Icons.cloud,
                    color: stats?.apiHealthy == true
                        ? Colors.indigo
                        : Colors.blueGrey,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: OutlinedButton.icon(
                  onPressed: _isSyncing ? null : _handleManualSync,
                  icon: const Icon(Icons.sync),
                  label: Text(_isSyncing ? 'Syncing…' : 'Sync Now'),
                ),
              ),
            ],
          ),
        ),
        TabBar(
          controller: _tabController,
          tabs: [
            Tab(text: 'Patients (${_patients.length})'),
            Tab(text: 'Volunteers (${_volunteers.length})'),
            const Tab(text: 'Print / AI'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _PatientsTab(patients: _patients, onRefresh: _loadStats),
              _VolunteersTab(volunteers: _volunteers, onRefresh: _loadStats),
              _PrintTab(
                patients: _patients,
                volunteers: _volunteers,
                onPrint: _printAiReport,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 150,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color),
              const SizedBox(height: 8),
              Text(value,
                  style: Theme.of(context)
                      .textTheme
                      .headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold)),
              Text(title, style: Theme.of(context).textTheme.bodySmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _PatientsTab extends StatelessWidget {
  const _PatientsTab({required this.patients, required this.onRefresh});
  final List<Patient> patients;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (patients.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('No patients loaded. Tap refresh or sync.'),
              const SizedBox(height: 12),
              FilledButton(onPressed: onRefresh, child: const Text('Refresh')),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: patients.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final p = patients[i];
          return ListTile(
            leading: const CircleAvatar(child: Icon(Icons.person)),
            title: Text(p.fullName),
            subtitle: Text(
              '${p.email ?? 'no email'} · ${p.phone ?? 'no phone'}\n'
              'AI score: ${p.healthScore} · ${p.riskLevel}',
            ),
            isThreeLine: true,
          );
        },
      ),
    );
  }
}

class _VolunteersTab extends StatelessWidget {
  const _VolunteersTab({required this.volunteers, required this.onRefresh});
  final List<Volunteer> volunteers;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    if (volunteers.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('No volunteers yet. Register on the Volunteers tab.'),
              const SizedBox(height: 12),
              FilledButton(onPressed: onRefresh, child: const Text('Refresh')),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: volunteers.length,
        separatorBuilder: (_, __) => const Divider(height: 1),
        itemBuilder: (context, i) {
          final v = volunteers[i];
          return ListTile(
            leading: const CircleAvatar(child: Icon(Icons.volunteer_activism)),
            title: Text(v.fullName),
            subtitle: Text(
              '${v.organization} · ${v.role}\n'
              '${v.email ?? ''} · ${v.phone ?? ''}',
            ),
            isThreeLine: true,
          );
        },
      ),
    );
  }
}

class _PrintTab extends StatelessWidget {
  const _PrintTab({
    required this.patients,
    required this.volunteers,
    required this.onPrint,
  });

  final List<Patient> patients;
  final List<Volunteer> volunteers;
  final VoidCallback onPrint;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Print assessment & AI results',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        Text(
          'Builds a report of all patient AI health scores and volunteers, '
          'copies it to the clipboard so you can paste into Docs/Notes and print.',
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: onPrint,
          icon: const Icon(Icons.print),
          label: const Text('Generate & copy AI report'),
        ),
        const SizedBox(height: 24),
        Text('Preview · ${patients.length} patients',
            style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        ...patients.take(20).map(
              (p) => ListTile(
                dense: true,
                title: Text(p.fullName),
                trailing: Text('${p.healthScore}'),
              ),
            ),
        const Divider(),
        Text('Preview · ${volunteers.length} volunteers',
            style: Theme.of(context).textTheme.titleMedium),
        ...volunteers.take(20).map(
              (v) => ListTile(
                dense: true,
                title: Text(v.fullName),
                subtitle: Text(v.organization),
              ),
            ),
      ],
    );
  }
}
