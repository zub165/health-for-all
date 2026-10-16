import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

typedef HubNavigate = void Function(int tabIndex);

/// Module hub matching React Home — brand-first entry for staff.
class HomeHubScreen extends StatelessWidget {
  const HomeHubScreen({
    super.key,
    required this.onOpenTab,
    this.doctorName,
  });

  final HubNavigate onOpenTab;
  final String? doctorName;

  @override
  Widget build(BuildContext context) {
    // Indices match AppShell staff tabs in main.dart (Home = 0).
    final modules = <_HubModule>[
      _HubModule('Health Fair Desk', 'Patients, volunteers, AI print', Icons.dashboard_customize, 1, AppTheme.primary),
      _HubModule('Patients', 'Register & manage records', Icons.people_alt_rounded, 2, const Color(0xFF00897B)),
      _HubModule('Clinical note', 'SOAP + ICD → labs AI', Icons.medical_services_rounded, 3, AppTheme.accent),
      _HubModule('Volunteers', 'Fair day workforce', Icons.volunteer_activism, 4, const Color(0xFF6A1B9A)),
      _HubModule('AI Assessment', 'Health risk decisions', Icons.psychology_alt, 5, const Color(0xFFEF6C00)),
      _HubModule('Assessments', 'Vitals & screenings', Icons.monitor_heart, 6, const Color(0xFF1565C0)),
      _HubModule('Lab & ICD-10', 'Orders & catalog', Icons.science, 7, const Color(0xFF455A64)),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppTheme.primary, AppTheme.primaryDark],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Image.asset(
                  'assets/icons/icon.png',
                  width: 72,
                  height: 72,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => const Icon(
                    Icons.health_and_safety,
                    color: Colors.white,
                    size: 56,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Health For All',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      doctorName != null && doctorName!.isNotEmpty
                          ? 'Welcome, $doctorName'
                          : 'Community health fair · patients · volunteers · clinical care',
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          'Modules',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Text(
          'Same clinical workflows as the web Health Fair app — built natively in Flutter.',
          style: TextStyle(color: Colors.grey.shade700),
        ),
        const SizedBox(height: 16),
        LayoutBuilder(
          builder: (context, constraints) {
            final wide = constraints.maxWidth >= 700;
            return Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final m in modules)
                  SizedBox(
                    width: wide
                        ? (constraints.maxWidth - 12) / 2
                        : constraints.maxWidth,
                    child: _ModuleCard(module: m, onTap: () => onOpenTab(m.tabIndex)),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }
}

class _HubModule {
  const _HubModule(this.title, this.subtitle, this.icon, this.tabIndex, this.color);
  final String title;
  final String subtitle;
  final IconData icon;
  final int tabIndex;
  final Color color;
}

class _ModuleCard extends StatelessWidget {
  const _ModuleCard({required this.module, required this.onTap});
  final _HubModule module;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: module.color.withValues(alpha: 0.12),
                foregroundColor: module.color,
                child: Icon(module.icon),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(module.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(module.subtitle, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }
}
