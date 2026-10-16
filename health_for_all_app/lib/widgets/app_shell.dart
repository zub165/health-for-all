import 'package:flutter/material.dart';

import '../services/hybrid_data_service.dart';
import '../theme/app_theme.dart';

class AppNavItem {
  const AppNavItem({
    required this.title,
    required this.shortLabel,
    required this.icon,
    required this.selectedIcon,
    required this.screen,
  });

  final String title;
  final String shortLabel;
  final IconData icon;
  final IconData selectedIcon;
  final Widget screen;
}

/// Adaptive shell: bottom tabs on phone, rail on tablet/desktop.
class AppShell extends StatefulWidget {
  const AppShell({
    super.key,
    required this.items,
    this.doctorName,
    this.onLogout,
  });

  final List<AppNavItem> items;
  final String? doctorName;
  final VoidCallback? onLogout;

  @override
  State<AppShell> createState() => AppShellState();
}

class AppShellState extends State<AppShell> {
  int _index = 0;
  bool _syncing = false;
  bool _railExtended = true;

  void selectTab(int i) {
    if (i < 0 || i >= widget.items.length) return;
    setState(() => _index = i);
  }

  Future<void> _syncAll() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      await HybridDataService.instance.syncAll();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Synced with api.mywaitime.com')),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Sync failed: $error')),
      );
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  void _select(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final useRail = width >= 840;
    final item = widget.items[_index];

    return Scaffold(
      body: Row(
        children: [
          if (useRail) ...[
            NavigationRail(
              extended: _railExtended && width >= 1100,
              selectedIndex: _index,
              onDestinationSelected: _select,
              leading: Padding(
                padding: const EdgeInsets.only(top: 12, bottom: 8),
                child: Column(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.asset(
                        'assets/icons/icon.png',
                        width: 44,
                        height: 44,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppTheme.primary, AppTheme.primaryDark],
                            ),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.health_and_safety, color: Colors.white),
                        ),
                      ),
                    ),
                    if (_railExtended && width >= 1100) ...[
                      const SizedBox(height: 8),
                      const Text(
                        'Health For All',
                        style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                      ),
                    ],
                    IconButton(
                      tooltip: _railExtended ? 'Collapse' : 'Expand',
                      onPressed: () => setState(() => _railExtended = !_railExtended),
                      icon: Icon(
                        _railExtended ? Icons.chevron_left : Icons.chevron_right,
                      ),
                    ),
                  ],
                ),
              ),
              destinations: [
                for (final nav in widget.items)
                  NavigationRailDestination(
                    icon: Icon(nav.icon),
                    selectedIcon: Icon(nav.selectedIcon),
                    label: Text(nav.shortLabel),
                  ),
              ],
            ),
            const VerticalDivider(width: 1),
          ],
          Expanded(
            child: Column(
              children: [
                _ModernAppBar(
                  title: item.title,
                  doctorName: widget.doctorName,
                  syncing: _syncing,
                  onSync: _syncAll,
                  onLogout: widget.onLogout,
                  showMenu: !useRail,
                  onMenu: !useRail
                      ? () => _openMobileDrawer(context)
                      : null,
                ),
                if (_syncing) const LinearProgressIndicator(minHeight: 2),
                Expanded(
                  child: ColoredBox(
                    color: AppTheme.surface,
                    child: SafeArea(
                      top: false,
                      child: IndexedStack(
                        index: _index,
                        children: [for (final n in widget.items) n.screen],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: useRail
          ? null
          : NavigationBar(
              selectedIndex: _index,
              onDestinationSelected: _select,
              destinations: [
                for (final nav in widget.items)
                  NavigationDestination(
                    icon: Icon(nav.icon),
                    selectedIcon: Icon(nav.selectedIcon),
                    label: nav.shortLabel,
                  ),
              ],
            ),
    );
  }

  void _openMobileDrawer(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Padding(
                  padding: EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Text(
                    'Go to',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
                for (var i = 0; i < widget.items.length; i++)
                  ListTile(
                    leading: Icon(
                      _index == i
                          ? widget.items[i].selectedIcon
                          : widget.items[i].icon,
                      color: _index == i ? AppTheme.primary : null,
                    ),
                    title: Text(widget.items[i].title),
                    selected: _index == i,
                    selectedTileColor: AppTheme.primary.withValues(alpha: 0.08),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    onTap: () {
                      Navigator.pop(ctx);
                      _select(i);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _ModernAppBar extends StatelessWidget {
  const _ModernAppBar({
    required this.title,
    required this.syncing,
    required this.onSync,
    required this.showMenu,
    this.doctorName,
    this.onLogout,
    this.onMenu,
  });

  final String title;
  final String? doctorName;
  final bool syncing;
  final VoidCallback onSync;
  final VoidCallback? onLogout;
  final bool showMenu;
  final VoidCallback? onMenu;

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 0,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.primary, AppTheme.primaryDark],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 14),
            child: Row(
              children: [
                if (showMenu)
                  IconButton(
                    tooltip: 'Tabs',
                    onPressed: onMenu,
                    icon: const Icon(Icons.menu_rounded, color: Colors.white),
                  ),
                const SizedBox(width: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.asset(
                    'assets/icons/icon.png',
                    width: 36,
                    height: 36,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.health_and_safety,
                      color: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Health For All',
                        style: TextStyle(
                          color: Colors.white70,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 0.3,
                        ),
                      ),
                      Text(
                        title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (doctorName != null && doctorName!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Text(
                      doctorName!,
                      style: const TextStyle(color: Colors.white70, fontSize: 12),
                    ),
                  ),
                FilledButton.tonalIcon(
                  onPressed: syncing ? null : onSync,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white.withValues(alpha: 0.18),
                    foregroundColor: Colors.white,
                  ),
                  icon: syncing
                      ? const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.cloud_sync_outlined, size: 18),
                  label: Text(syncing ? 'Syncing' : 'Sync'),
                ),
                if (onLogout != null)
                  IconButton(
                    tooltip: 'Sign out',
                    onPressed: onLogout,
                    icon: const Icon(Icons.logout, color: Colors.white),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
