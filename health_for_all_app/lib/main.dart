import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'config/api_config.dart';
import 'screens/ai_decisions_screen.dart';
import 'screens/assessments_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/doctor_login_screen.dart';
import 'screens/lab_screen.dart';
import 'screens/patients_screen.dart';
import 'screens/volunteers_screen.dart';
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
  String? _doctorName;

  @override
  void initState() {
    super.initState();
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final loggedIn = prefs.getBool('doctor_logged_in') ?? false;
    final name = prefs.getString('doctor_name');
    if (!mounted) return;
    setState(() {
      _doctorName = loggedIn && name != null && name.isNotEmpty ? name : null;
      _loading = false;
    });
  }

  Future<void> _onLoggedIn(String name) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('doctor_logged_in', true);
    await prefs.setString('doctor_name', name);
    if (!mounted) return;
    setState(() => _doctorName = name);
  }

  Future<void> _logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('doctor_logged_in', false);
    await prefs.remove('doctor_name');
    if (!mounted) return;
    setState(() => _doctorName = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    if (_doctorName == null) {
      return DoctorLoginScreen(onLoggedIn: _onLoggedIn);
    }
    return AppShell(
      doctorName: _doctorName!,
      onLogout: _logout,
      items: const [
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
      ],
    );
  }
}
