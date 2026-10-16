import 'package:shared_preferences/shared_preferences.dart';

enum AppRole { admin, doctor, patient, volunteer, guest }

class AppSession {
  const AppSession({
    required this.role,
    required this.name,
    required this.email,
    this.id,
  });

  final AppRole role;
  final String name;
  final String email;
  final String? id;

  bool get isStaff => role == AppRole.admin || role == AppRole.doctor;
}

const _roleKey = 'hfa_app_role';
const _nameKey = 'hfa_app_name';
const _emailKey = 'hfa_app_email';
const _idKey = 'hfa_app_id';

class AppSessionStore {
  AppSessionStore._();
  static final AppSessionStore instance = AppSessionStore._();

  static const _adminEmails = {'admin@healthforall.org', 'zub165@yahoo.com'};

  Future<AppSession?> read() async {
    final prefs = await SharedPreferences.getInstance();
    final roleRaw = prefs.getString(_roleKey);
    if (roleRaw == null || roleRaw == 'guest') return null;
    final role = AppRole.values.firstWhere(
      (r) => r.name == roleRaw,
      orElse: () => AppRole.guest,
    );
    if (role == AppRole.guest) return null;
    return AppSession(
      role: role,
      name: prefs.getString(_nameKey) ?? '',
      email: prefs.getString(_emailKey) ?? '',
      id: prefs.getString(_idKey),
    );
  }

  Future<AppSession> saveStaff({
    required String name,
    required String email,
    String? id,
  }) async {
    final role = _adminEmails.contains(email.trim().toLowerCase())
        ? AppRole.admin
        : AppRole.doctor;
    return _save(role: role, name: name, email: email, id: id);
  }

  Future<AppSession> savePatient({
    required String name,
    required String email,
    String? id,
  }) =>
      _save(role: AppRole.patient, name: name, email: email, id: id);

  Future<AppSession> saveVolunteer({
    required String name,
    required String email,
    String? id,
  }) =>
      _save(role: AppRole.volunteer, name: name, email: email, id: id);

  Future<AppSession> _save({
    required AppRole role,
    required String name,
    required String email,
    String? id,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_roleKey, role.name);
    await prefs.setString(_nameKey, name);
    await prefs.setString(_emailKey, email);
    if (id != null) {
      await prefs.setString(_idKey, id);
    } else {
      await prefs.remove(_idKey);
    }
    // legacy doctor keys
    if (role == AppRole.admin || role == AppRole.doctor) {
      await prefs.setBool('doctor_logged_in', true);
      await prefs.setString('doctor_name', name);
    } else {
      await prefs.setBool('doctor_logged_in', false);
      await prefs.remove('doctor_name');
    }
    return AppSession(role: role, name: name, email: email, id: id);
  }

  Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_roleKey);
    await prefs.remove(_nameKey);
    await prefs.remove(_emailKey);
    await prefs.remove(_idKey);
    await prefs.setBool('doctor_logged_in', false);
    await prefs.remove('doctor_name');
  }

  static bool emailMatch(String? a, String? b) {
    if (a == null || b == null) return false;
    return a.trim().toLowerCase() == b.trim().toLowerCase();
  }
}
