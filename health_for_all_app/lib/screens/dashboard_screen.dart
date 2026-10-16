import 'package:flutter/material.dart';

import '../services/hybrid_data_service.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _isSyncing = false;
  bool _loading = true;
  String? _error;
  DashboardStats? _stats;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final stats = await HybridDataService.instance.fetchDashboardStats();
      if (!mounted) return;
      setState(() {
        _stats = stats;
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

  @override
  Widget build(BuildContext context) {
    final stats = _stats;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (_loading) const LinearProgressIndicator(minHeight: 3),
        Text(
          'Health Fair Dashboard',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 8),
        Text(
          'Live KPIs from api.mywaitime.com (GoDaddy) with local offline cache.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        Card(
          child: ListTile(
            leading: Icon(Icons.tips_and_updates_outlined,
                color: Theme.of(context).colorScheme.primary),
            title: const Text('Quick tip'),
            subtitle: const Text(
              'Patients → Select → search “EE” → Select all → Delete all matches. '
              'Assess tab includes vitals, HbA1c, lipids, carotid Doppler, and PHQ/GAD questions.',
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(_error!, style: TextStyle(color: Colors.red.shade700)),
        ],
        const SizedBox(height: 24),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: [
            _DashboardCard(
              title: 'Total Patients',
              value: '${stats?.totalPatients ?? '—'}',
              icon: Icons.people,
              subtitle: '${stats?.pendingPatients ?? 0} pending upload',
              color: Theme.of(context).colorScheme.primary,
            ),
            _DashboardCard(
              title: 'Assessments Today',
              value: '${stats?.assessmentsToday ?? '—'}',
              icon: Icons.monitor_heart,
              subtitle: 'Cached on this device',
              color: Colors.orange.shade600,
            ),
            _DashboardCard(
              title: 'Volunteers',
              value: '${stats?.totalVolunteers ?? '—'}',
              icon: Icons.volunteer_activism,
              subtitle: '${stats?.pendingVolunteers ?? 0} pending',
              color: Colors.green.shade600,
            ),
            _DashboardCard(
              title: 'API Status',
              value: _isSyncing
                  ? 'Syncing…'
                  : (stats?.apiHealthy == true ? 'Online' : 'Offline'),
              icon: Icons.cloud,
              subtitle: stats?.lastSync == null
                  ? 'Never synced'
                  : 'Last sync ${_timeAgo(stats!.lastSync!)}',
              color: stats?.apiHealthy == true ? Colors.indigo : Colors.blueGrey,
            ),
          ],
        ),
        const SizedBox(height: 24),
        _SyncPanel(
          isSyncing: _isSyncing,
          lastSync: stats?.lastSync ?? DateTime.now().subtract(const Duration(days: 1)),
          apiHealthy: stats?.apiHealthy ?? false,
          onSync: _handleManualSync,
        ),
        const SizedBox(height: 24),
        _SourceBreakdown(
          patients: stats?.totalPatients ?? 0,
          pending: stats?.pendingPatients ?? 0,
          volunteers: stats?.totalVolunteers ?? 0,
          apiHealthy: stats?.apiHealthy ?? false,
        ),
      ],
    );
  }

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'moments ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
  }
}

class _DashboardCard extends StatelessWidget {
  const _DashboardCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.subtitle,
    required this.color,
  });

  final String title;
  final String value;
  final IconData icon;
  final String subtitle;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 168,
      child: Card(
        elevation: 0,
        color: Theme.of(context).colorScheme.surface,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 16),
              Text(
                title,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SyncPanel extends StatelessWidget {
  const _SyncPanel({
    required this.isSyncing,
    required this.lastSync,
    required this.apiHealthy,
    required this.onSync,
  });

  final bool isSyncing;
  final DateTime lastSync;
  final bool apiHealthy;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isSyncing ? Icons.sync : Icons.cloud_done,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(width: 12),
                Text(
                  'Hybrid Sync',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                OutlinedButton.icon(
                  onPressed: isSyncing ? null : onSync,
                  icon: const Icon(Icons.refresh),
                  label: Text(isSyncing ? 'Syncing…' : 'Sync Now'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              isSyncing
                  ? 'Uploading pending records to https://api.mywaitime.com/api/ …'
                  : apiHealthy
                      ? 'Connected to GoDaddy backend. Last sync ${_timeAgo(lastSync)}.'
                      : 'Backend unreachable — showing local cache. Sync when online.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dateTime) {
    final diff = DateTime.now().difference(dateTime);
    if (diff.inMinutes < 1) return 'moments ago';
    if (diff.inMinutes < 60) return '${diff.inMinutes} minutes ago';
    if (diff.inHours < 24) return '${diff.inHours} hours ago';
    return '${diff.inDays} days ago';
  }
}

class _SourceBreakdown extends StatelessWidget {
  const _SourceBreakdown({
    required this.patients,
    required this.pending,
    required this.volunteers,
    required this.apiHealthy,
  });

  final int patients;
  final int pending;
  final int volunteers;
  final bool apiHealthy;

  @override
  Widget build(BuildContext context) {
    final rows = [
      _SourceRow(
        label: 'Main API (GoDaddy)',
        count: patients,
        status: apiHealthy ? 'Healthy' : 'Unreachable',
        icon: Icons.cloud,
        color: apiHealthy ? Colors.green.shade600 : Colors.red.shade600,
      ),
      _SourceRow(
        label: 'Local Cache',
        count: pending,
        status: pending > 0 ? 'Pending upload' : 'Clean',
        icon: Icons.offline_pin,
        color: Colors.blueGrey.shade700,
      ),
      _SourceRow(
        label: 'Volunteers (local hybrid)',
        count: volunteers,
        status: 'No /api/volunteers/ on server yet',
        icon: Icons.volunteer_activism,
        color: Colors.orange.shade700,
      ),
    ];

    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Source Breakdown',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            for (final row in rows) ...[
              row,
              const Divider(height: 16),
            ],
          ],
        ),
      ),
    );
  }
}

class _SourceRow extends StatelessWidget {
  const _SourceRow({
    required this.label,
    required this.count,
    required this.status,
    required this.icon,
    required this.color,
  });

  final String label;
  final int count;
  final String status;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.titleMedium),
              Text(
                status,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
              ),
            ],
          ),
        ),
        Text(
          '$count',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
      ],
    );
  }
}
