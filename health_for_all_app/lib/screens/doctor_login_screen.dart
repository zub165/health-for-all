import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../theme/app_theme.dart';

class DoctorLoginScreen extends StatefulWidget {
  const DoctorLoginScreen({super.key, this.onLoggedIn});

  final ValueChanged<String>? onLoggedIn;

  @override
  State<DoctorLoginScreen> createState() => _DoctorLoginScreenState();
}

class _DoctorLoginScreenState extends State<DoctorLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _hipaa = false;
  bool _loading = false;
  bool _obscure = true;
  String? _error;
  bool _registerMode = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_formKey.currentState?.validate() != true) return;
    if (!_hipaa) {
      setState(() => _error = 'You must agree to HIPAA compliance to continue.');
      return;
    }

    setState(() => _loading = true);
    try {
      if (_registerMode) {
        await _registerDoctor();
      } else {
        await _loginDoctor();
      }
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loginDoctor() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();

    // Try Health Fair login, then fall back to local session for fair demo use.
    final urls = [
      '${ApiConfig.healthFairBaseUrl}doctors/login/',
      '${ApiConfig.apiBaseUrl}doctors/login/',
    ];

    Map<String, dynamic>? data;
    for (final url in urls) {
      try {
        final response = await http
            .post(
              Uri.parse(url),
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: jsonEncode({'email': email, 'password': password}),
            )
            .timeout(const Duration(seconds: 12));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          final decoded = jsonDecode(response.body);
          if (decoded is Map<String, dynamic>) {
            data = (decoded['data'] as Map<String, dynamic>?) ?? decoded;
            break;
          }
        }
      } catch (_) {
        // try next
      }
    }

    final displayName = name.isNotEmpty
        ? name
        : (data?['full_name'] as String?) ??
            '${data?['first_name'] ?? 'Doctor'} ${data?['last_name'] ?? ''}'.trim();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('doctor_logged_in', true);
    await prefs.setString('doctor_email', email);
    await prefs.setString('doctor_name', displayName);
    if (data?['token'] != null) {
      await prefs.setString('doctor_token', '${data!['token']}');
    }

    if (!mounted) return;
    widget.onLoggedIn?.call(displayName);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          data != null
              ? 'Signed in as $displayName'
              : 'Signed in locally as $displayName (server login unavailable)',
        ),
      ),
    );
  }

  Future<void> _registerDoctor() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;
    final name = _nameController.text.trim();
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    final first = parts.isNotEmpty ? parts.first : 'Doctor';
    final last = parts.length > 1 ? parts.sublist(1).join(' ') : 'User';

    final payload = {
      'first_name': first,
      'last_name': last,
      'email': email,
      'phone': '0000000000',
      'specialization': 'General Practice',
      'license_number': 'PENDING-${DateTime.now().millisecondsSinceEpoch}',
      'department': 'Health Fair',
      'password': password,
    };

    final urls = [
      '${ApiConfig.apiBaseUrl}doctors/',
      '${ApiConfig.healthFairBaseUrl}doctors/',
    ];

    Object? lastError;
    for (final url in urls) {
      try {
        final response = await http
            .post(
              Uri.parse(url),
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              body: jsonEncode(payload),
            )
            .timeout(const Duration(seconds: 15));
        if (response.statusCode >= 200 && response.statusCode < 300) {
          if (!mounted) return;
          setState(() => _registerMode = false);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Doctor registered. Sign in with your email and password.')),
          );
          return;
        }
        lastError = 'HTTP ${response.statusCode}: ${response.body}';
      } catch (e) {
        lastError = e;
      }
    }

    // Hybrid fallback — allow local doctor session for fair day
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('doctor_email', email);
    await prefs.setString('doctor_name', name.isEmpty ? 'Dr. $first $last' : name);
    await prefs.setString('doctor_local_password', password);
    if (!mounted) return;
    setState(() => _registerMode = false);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Saved doctor locally (API register failed: $lastError). You can sign in on this device.',
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final maxWidth = width > 720 ? 480.0 : double.infinity;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: maxWidth),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Icon(Icons.medical_services, size: 48, color: AppTheme.primary),
                      const SizedBox(height: 12),
                      Text(
                        _registerMode ? 'Register New Doctor' : 'Doctor Login',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              color: AppTheme.primary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Access the doctor dashboard to manage patients and screenings.',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey.shade700,
                            ),
                      ),
                      const SizedBox(height: 24),
                      if (_error != null) ...[
                        Material(
                          color: Colors.red.shade50,
                          borderRadius: BorderRadius.circular(12),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                      TextFormField(
                        controller: _nameController,
                        decoration: const InputDecoration(
                          labelText: 'Doctor name (optional)',
                          prefixIcon: Icon(Icons.person_outline),
                        ),
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: const InputDecoration(
                          labelText: 'Email address',
                          prefixIcon: Icon(Icons.email_outlined),
                        ),
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return 'Email is required';
                          if (!v.contains('@')) return 'Enter a valid email';
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      TextFormField(
                        controller: _passwordController,
                        obscureText: _obscure,
                        decoration: InputDecoration(
                          labelText: 'Password',
                          prefixIcon: const Icon(Icons.lock_outline),
                          suffixIcon: IconButton(
                            onPressed: () => setState(() => _obscure = !_obscure),
                            icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off),
                          ),
                        ),
                        validator: (v) {
                          if (v == null || v.isEmpty) return 'Password is required';
                          if (_registerMode && v.length < 8) {
                            return 'Password must be at least 8 characters';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.blue.shade50,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'HIPAA Compliance Required: Access to patient data requires '
                          'compliance with HIPAA regulations.',
                          style: TextStyle(fontSize: 13),
                        ),
                      ),
                      const SizedBox(height: 8),
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        value: _hipaa,
                        onChanged: (v) => setState(() => _hipaa = v ?? false),
                        controlAffinity: ListTileControlAffinity.leading,
                        title: const Text(
                          'I agree to HIPAA regulations and will protect patient confidentiality.',
                          style: TextStyle(fontSize: 13),
                        ),
                      ),
                      const SizedBox(height: 8),
                      FilledButton(
                        onPressed: _loading ? null : _submit,
                        child: _loading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text(_registerMode ? 'REGISTER' : 'SIGN IN'),
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton(
                        onPressed: _loading
                            ? null
                            : () => setState(() {
                                  _registerMode = !_registerMode;
                                  _error = null;
                                }),
                        child: Text(
                          _registerMode ? 'Back to Sign In' : 'REGISTER NEW DOCTOR',
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
