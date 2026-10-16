import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'config/api_config.dart';
import 'screens/ai_decisions_screen.dart';
import 'screens/assessments_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/doctor_login_screen.dart';
import 'screens/lab_screen.dart';
import 'screens/patients_screen.dart';
import 'screens/volunteers_screen.dart';
import 'services/app_session.dart';
import 'services/hybrid_data_service.dart';
import 'theme/app_theme.dart';
import 'widgets/app_shell.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarIconBrightness: Brightness.light,
    statusBarBrightness: Brightness.dark,
    systemNavigationBarIconBrightness: Brightness.dark,
    systemNavigationBarContrastEnforced: false,
  ));

  HybridDataService.instance
    ..configure(
      baseUrl: ApiConfig.apiBaseUrl,
      labBaseUrl: ApiConfig.labBaseUrl,
    )
    ..updateAuthToken(
      ApiConfig.apiToken.isEmpty ? null : ApiConfig.apiToken,
    );

  runApp(const HealthForAllApp());
}

class HealthForAllApp extends StatelessWidget {
  const HealthForAllApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Health For All',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      home: const _AuthGate(),
    );
  }
}

class _AuthGate extends StatefulWidget {
  const _AuthGate();

  @override
  State<_AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<_AuthGate> {
  bool _loading = true;
  AppSession? _session;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final session = await AppSessionStore.instance.read();
    if (!mounted) return;
    setState(() {
      _session = session;
      _loading = false;
    });
  }

  Future<void> _logout() async {
    await AppSessionStore.instance.clear();
    if (!mounted) return;
    setState(() => _session = null);
  }

  List<AppNavItem> _itemsFor(AppSession session) {
    if (session.isStaff) {
      return const [
        AppNavItem(
          title: 'Dashboard',
          shortLabel: 'Home',
          icon: Icons.home_outlined,
          selectedIcon: Icons.home_rounded,
          screen: DashboardScreen(),
        ),
        AppNavItem(
          title: 'Patients',
          shortLabel: 'Patients',
          icon: Icons.people_outline_rounded,
          selectedIcon: Icons.people_rounded,
          screen: PatientsScreen(),
        ),
        AppNavItem(
          title: 'Volunteers',
          shortLabel: 'Volunteer',
          icon: Icons.volunteer_activism_outlined,
          selectedIcon: Icons.volunteer_activism,
          screen: VolunteersScreen(),
        ),
        AppNavItem(
          title: 'AI Decisions',
          shortLabel: 'AI',
          icon: Icons.psychology_outlined,
          selectedIcon: Icons.psychology_rounded,
          screen: AiDecisionsScreen(),
        ),
        AppNavItem(
          title: 'Health Assessment',
          shortLabel: 'Assess',
          icon: Icons.monitor_heart_outlined,
          selectedIcon: Icons.monitor_heart,
          screen: AssessmentsScreen(),
        ),
        AppNavItem(
          title: 'Lab & ICD-10',
          shortLabel: 'Lab',
          icon: Icons.science_outlined,
          selectedIcon: Icons.science_rounded,
          screen: LabScreen(),
        ),
      ];
    }
    if (session.role == AppRole.patient) {
      return [
        AppNavItem(
          title: 'My health record',
          shortLabel: 'My record',
          icon: Icons.badge_outlined,
          selectedIcon: Icons.badge,
          screen: PatientsScreen(ownEmailOnly: session.email, ownId: session.id),
        ),
        AppNavItem(
          title: 'My assessments',
          shortLabel: 'Assess',
          icon: Icons.monitor_heart_outlined,
          selectedIcon: Icons.monitor_heart,
          screen: AssessmentsScreen(ownEmailOnly: session.email),
        ),
      ];
    }
    // volunteer
    return [
      AppNavItem(
        title: 'My volunteer profile',
        shortLabel: 'Profile',
        icon: Icons.volunteer_activism_outlined,
        selectedIcon: Icons.volunteer_activism,
        screen: VolunteersScreen(ownEmailOnly: session.email, ownId: session.id),
      ),
    ];
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Column(
          children: [
            LinearProgressIndicator(minHeight: 3),
            Expanded(child: SizedBox.shrink()),
          ],
        ),
      );
    }
    final session = _session;
    if (session == null || !session.isStaff) {
      // Mobile app remains staff-first: require doctor/admin login for full app.
      // Patient/volunteer own-data portals are on the web app; if session is
      // patient/volunteer show scoped shell, else show staff login.
      if (session != null && !session.isStaff) {
        return AppShell(
          doctorName: session.name,
          onLogout: _logout,
          items: _itemsFor(session),
        );
      }
      return DoctorLoginScreen(
        onLoggedIn: (name) async {
          await AppSessionStore.instance.saveStaff(
            name: name,
            email: name.contains('@') ? name : 'zub165@yahoo.com',
          );
          await _restoreSession();
        },
      );
    }
    return AppShell(
      doctorName: session.name,
      onLogout: _logout,
      items: _itemsFor(session),
    );
  }
}
