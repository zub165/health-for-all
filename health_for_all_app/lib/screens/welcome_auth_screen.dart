import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/patient.dart';
import '../models/volunteer.dart';
import '../services/app_session.dart';
import '../services/hybrid_data_service.dart';
import '../theme/app_theme.dart';
import 'doctor_login_screen.dart';

/// Entry gate matching React multi-role auth: Staff · Patient · Volunteer.
class WelcomeAuthScreen extends StatefulWidget {
  const WelcomeAuthScreen({
    super.key,
    required this.onStaffLoggedIn,
    required this.onPatientLoggedIn,
    required this.onVolunteerLoggedIn,
  });

  final ValueChanged<String> onStaffLoggedIn;
  final void Function({required String name, required String email, String? id})
      onPatientLoggedIn;
  final void Function({required String name, required String email, String? id})
      onVolunteerLoggedIn;

  @override
  State<WelcomeAuthScreen> createState() => _WelcomeAuthScreenState();
}

class _WelcomeAuthScreenState extends State<WelcomeAuthScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
              child: Row(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: Image.asset(
                      'assets/icons/icon.png',
                      width: 56,
                      height: 56,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Icon(
                        Icons.health_and_safety,
                        size: 48,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Health For All',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppTheme.primary,
                              ),
                        ),
                        Text(
                          'Choose how you sign in — same roles as the web Health Fair app.',
                          style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            TabBar(
              controller: _tabs,
              labelColor: AppTheme.primary,
              tabs: const [
                Tab(icon: Icon(Icons.medical_services_outlined), text: 'Staff'),
                Tab(icon: Icon(Icons.person_outline), text: 'Patient'),
                Tab(icon: Icon(Icons.volunteer_activism_outlined), text: 'Volunteer'),
              ],
            ),
            Expanded(
              child: TabBarView(
                controller: _tabs,
                children: [
                  DoctorLoginScreen(onLoggedIn: widget.onStaffLoggedIn),
                  _PatientAuthPane(onLoggedIn: widget.onPatientLoggedIn),
                  _VolunteerAuthPane(onLoggedIn: widget.onVolunteerLoggedIn),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PatientAuthPane extends StatefulWidget {
  const _PatientAuthPane({required this.onLoggedIn});
  final void Function({required String name, required String email, String? id})
      onLoggedIn;

  @override
  State<_PatientAuthPane> createState() => _PatientAuthPaneState();
}

class _PatientAuthPaneState extends State<_PatientAuthPane> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _age = TextEditingController(text: '35');
  String _gender = 'male';
  bool _register = true;
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _notice;

  static const _pwPrefix = 'hfa_patient_pw_';

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _age.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _notice = null;
    });
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _loading = true);
    try {
      if (_register) {
        await _registerPatient();
      } else {
        await _loginPatient();
      }
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _registerPatient() async {
    final email = _email.text.trim().toLowerCase();
    final password = _password.text;
    final age = int.tryParse(_age.text.trim()) ?? 30;
    final id = 'local-p-${DateTime.now().millisecondsSinceEpoch}';
    final patient = Patient(
      id: id,
      firstName: _first.text.trim(),
      lastName: _last.text.trim(),
      gender: _gender,
      age: age,
      healthScore: 0,
      riskLevel: 'Pending Assessment',
      lastAssessment: 'Just now',
      email: email,
      phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
      status: PatientStatus.pendingUpload,
    );
    final saved = await HybridDataService.instance.registerPatient(patient);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_pwPrefix$email', password);
    if (!mounted) return;
    setState(() => _notice = 'Patient registered. Opening your health record…');
    widget.onLoggedIn(
      name: saved.fullName,
      email: email,
      id: saved.id,
    );
  }

  Future<void> _loginPatient() async {
    final email = _email.text.trim().toLowerCase();
    final password = _password.text;
    final prefs = await SharedPreferences.getInstance();
    final storedPw = prefs.getString('$_pwPrefix$email');

    // Prefer local password match when set at registration.
    if (storedPw != null && storedPw != password) {
      setState(() => _error = 'Wrong email or password. Try again or register.');
      return;
    }

    final patients = await HybridDataService.instance.fetchPatients();
    Patient? match;
    for (final p in patients) {
      if (AppSessionStore.emailMatch(p.email, email)) {
        match = p;
        break;
      }
    }

    // Also try health-fair API lookup by email if not in cache.
    if (match == null) {
      try {
        final uri = Uri.parse('${ApiConfig.healthFairBaseUrl}patients/').replace(
          queryParameters: {'email': email, 'page_size': '20'},
        );
        final res = await http
            .get(uri, headers: {'Accept': 'application/json'})
            .timeout(const Duration(seconds: 12));
        if (res.statusCode >= 200 && res.statusCode < 300) {
          final decoded = jsonDecode(res.body);
          final list = decoded is Map
              ? (decoded['data'] as List? ?? decoded['results'] as List? ?? const [])
              : (decoded is List ? decoded : const []);
          for (final item in list) {
            if (item is Map) {
              final p = Patient.fromApi(Map<String, dynamic>.from(item));
              if (AppSessionStore.emailMatch(p.email, email)) {
                match = p;
                break;
              }
            }
          }
        }
      } catch (_) {/* hybrid fallback below */}
    }

    if (match == null && storedPw == null) {
      setState(() =>
          _error = 'No patient found for that email. Tap Register to create your record.');
      return;
    }

    // First-time web/fair patient with no stored password: allow email login and set pw.
    if (storedPw == null && match != null) {
      await prefs.setString('$_pwPrefix$email', password);
      setState(() => _notice = 'Signed in. Password saved on this device for next time.');
    }

    final name = match?.fullName ?? email;
    widget.onLoggedIn(name: name, email: email, id: match?.id);
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _register ? 'Patient registration' : 'Patient sign in',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _register
                            ? 'Create your health fair record, then open My health record.'
                            : 'Sign in with the email you used at registration.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 16),
                      if (_error != null) _banner(_error!, Colors.red),
                      if (_notice != null) _banner(_notice!, Colors.blue),
                      if (_register) ...[
                        TextFormField(
                          controller: _first,
                          decoration: const InputDecoration(
                            labelText: 'First name',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Required' : null,
                          onChanged: (_) => setState(() => _error = null),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _last,
                          decoration: const InputDecoration(
                            labelText: 'Last name',
                            prefixIcon: Icon(Icons.badge_outlined),
                          ),
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Required' : null,
                          onChanged: (_) => setState(() => _error = null),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: TextFormField(
                                controller: _age,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Age'),
                                validator: (v) {
                                  final n = int.tryParse(v ?? '');
                                  if (n == null || n < 1 || n > 120) return 'Invalid';
                                  return null;
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: DropdownButtonFormField<String>(
                                value: _gender,
                                decoration: const InputDecoration(labelText: 'Gender'),
                                items: const [
                                  DropdownMenuItem(value: 'male', child: Text('Male')),
                                  DropdownMenuItem(value: 'female', child: Text('Female')),
                                  DropdownMenuItem(value: 'other', child: Text('Other')),
                                ],
                                onChanged: (v) => setState(() => _gender = v ?? 'male'),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Phone (optional)',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _password,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          labelText: _register ? 'Create password' : 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _obscure = !_obscure),
                            icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Password is required';
                          if (_register && v.length < 6) return 'At least 6 characters';
                          return null;
                        },
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(_register ? 'REGISTER PATIENT' : 'SIGN IN'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _register = !_register;
                                  _error = null;
                                  _notice = null;
                                }),
                        child: Text(
                          _register
                              ? 'Already registered? Sign in'
                              : 'New here? Register as patient',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _banner(String text, MaterialColor color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Material(
        color: color.shade50,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Text(text, style: TextStyle(color: color.shade800)),
        ),
      ),
    );
  }
}

class _VolunteerAuthPane extends StatefulWidget {
  const _VolunteerAuthPane({required this.onLoggedIn});
  final void Function({required String name, required String email, String? id})
      onLoggedIn;

  @override
  State<_VolunteerAuthPane> createState() => _VolunteerAuthPaneState();
}

class _VolunteerAuthPaneState extends State<_VolunteerAuthPane> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _org = TextEditingController(text: 'Independent');
  final _role = TextEditingController(text: 'Volunteer');
  final _password = TextEditingController();
  bool _register = true;
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  String? _notice;

  static const _pwPrefix = 'hfa_volunteer_pw_';

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _phone.dispose();
    _org.dispose();
    _role.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _notice = null;
    });
    if (_formKey.currentState?.validate() != true) return;
    setState(() => _loading = true);
    try {
      if (_register) {
        await _registerVolunteer();
      } else {
        await _loginVolunteer();
      }
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _registerVolunteer() async {
    final email = _email.text.trim().toLowerCase();
    final password = _password.text;
    final id = 'local-v-${DateTime.now().millisecondsSinceEpoch}';
    final volunteer = Volunteer(
      id: id,
      fullName: _name.text.trim(),
      organization: _org.text.trim().isEmpty ? 'Independent' : _org.text.trim(),
      role: _role.text.trim().isEmpty ? 'Volunteer' : _role.text.trim(),
      availability: 'Fair day',
      email: email,
      phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
      status: VolunteerStatus.pendingUpload,
    );
    final saved = await HybridDataService.instance.registerVolunteer(volunteer);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_pwPrefix$email', password);
    if (!mounted) return;
    setState(() => _notice = 'Volunteer registered. Opening your profile…');
    widget.onLoggedIn(name: saved.fullName, email: email, id: saved.id);
  }

  Future<void> _loginVolunteer() async {
    final email = _email.text.trim().toLowerCase();
    final password = _password.text;
    final prefs = await SharedPreferences.getInstance();
    final storedPw = prefs.getString('$_pwPrefix$email');
    if (storedPw != null && storedPw != password) {
      setState(() => _error = 'Wrong email or password. Try again or register.');
      return;
    }

    final volunteers = await HybridDataService.instance.fetchVolunteers();
    Volunteer? match;
    for (final v in volunteers) {
      if (AppSessionStore.emailMatch(v.email, email)) {
        match = v;
        break;
      }
    }

    if (match == null && storedPw == null) {
      setState(() =>
          _error = 'No volunteer found for that email. Tap Register to join.');
      return;
    }
    if (storedPw == null && match != null) {
      await prefs.setString('$_pwPrefix$email', password);
    }

    final fallbackName =
        _name.text.trim().isEmpty ? email : _name.text.trim();
    widget.onLoggedIn(
      name: match?.fullName ?? fallbackName,
      email: email,
      id: match?.id,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 480),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        _register ? 'Volunteer registration' : 'Volunteer sign in',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _register
                            ? 'Join the fair workforce and manage your volunteer profile.'
                            : 'Sign in with your volunteer email.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                      const SizedBox(height: 16),
                      if (_error != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Material(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
                            ),
                          ),
                        ),
                      if (_notice != null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Material(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Text(_notice!, style: TextStyle(color: Colors.blue.shade800)),
                            ),
                          ),
                        ),
                      if (_register) ...[
                        TextFormField(
                          controller: _name,
                          decoration: const InputDecoration(
                            labelText: 'Full name',
                            prefixIcon: Icon(Icons.person_outline),
                          ),
                          validator: (v) =>
                              (v == null || v.trim().isEmpty) ? 'Required' : null,
                          onChanged: (_) => setState(() => _error = null),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _org,
                          decoration: const InputDecoration(
                            labelText: 'Organization',
                            prefixIcon: Icon(Icons.apartment_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _role,
                          decoration: const InputDecoration(
                            labelText: 'Role (e.g. Greeter, Vitals)',
                            prefixIcon: Icon(Icons.work_outline),
                          ),
                        ),
                        const SizedBox(height: 12),
                        TextFormField(
                          controller: _phone,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Phone (optional)',
                            prefixIcon: Icon(Icons.phone_outlined),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _email,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _password,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          labelText: _register ? 'Create password' : 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _obscure = !_obscure),
                            icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Password is required';
                          if (_register && v.length < 6) return 'At least 6 characters';
                          return null;
                        },
                        onChanged: (_) => setState(() => _error = null),
                      ),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Text(_register ? 'REGISTER VOLUNTEER' : 'SIGN IN'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _register = !_register;
                                  _error = null;
                                  _notice = null;
                                }),
                        child: Text(
                          _register
                              ? 'Already registered? Sign in'
                              : 'New here? Register as volunteer',
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
