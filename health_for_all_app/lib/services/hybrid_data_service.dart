import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/assessment.dart';
import '../models/patient.dart';
import '../models/volunteer.dart';
import 'api_client.dart';

class DashboardStats {
  const DashboardStats({
    required this.totalPatients,
    required this.pendingPatients,
    required this.totalVolunteers,
    required this.pendingVolunteers,
    required this.assessmentsToday,
    required this.lastSync,
    required this.apiHealthy,
  });

  final int totalPatients;
  final int pendingPatients;
  final int totalVolunteers;
  final int pendingVolunteers;
  final int assessmentsToday;
  final DateTime? lastSync;
  final bool apiHealthy;
}

class LabTestInfo {
  const LabTestInfo({
    required this.id,
    required this.testCode,
    required this.testName,
    required this.categoryName,
    this.normalRange,
    this.unit,
  });

  final String id;
  final String testCode;
  final String testName;
  final String categoryName;
  final String? normalRange;
  final String? unit;

  factory LabTestInfo.fromApi(Map<String, dynamic> json) {
    return LabTestInfo(
      id: '${json['id']}',
      testCode: (json['test_code'] as String?) ?? '',
      testName: (json['test_name'] as String?) ?? 'Unknown test',
      categoryName: (json['category_name'] as String?) ?? 'General',
      normalRange: json['normal_range'] as String?,
      unit: json['unit'] as String?,
    );
  }
}

class HybridDataService {
  HybridDataService._internal()
      : _apiClient = HealthApiClient(baseUrl: ApiConfig.apiBaseUrl),
        _labClient = HealthApiClient(baseUrl: ApiConfig.labBaseUrl);

  static final HybridDataService instance = HybridDataService._internal();

  static const _patientsKey = 'health_for_all_patients';
  static const _volunteersKey = 'health_for_all_volunteers';
  static const _assessmentsKeyPrefix = 'health_for_all_assessments_';
  static const _lastSyncKey = 'health_for_all_last_sync';

  SharedPreferences? _prefs;
  HealthApiClient _apiClient;
  HealthApiClient _labClient;
  String? _authToken;

  void configure({String? baseUrl, String? labBaseUrl}) {
    if (baseUrl != null && baseUrl.isNotEmpty) {
      _apiClient = HealthApiClient(baseUrl: baseUrl);
    }
    if (labBaseUrl != null && labBaseUrl.isNotEmpty) {
      _labClient = HealthApiClient(baseUrl: labBaseUrl);
    }
    _applyToken();
  }

  void updateAuthToken(String? token) {
    _authToken = token;
    _applyToken();
  }

  void _applyToken() {
    _apiClient.updateToken(_authToken);
    _labClient.updateToken(_authToken);
  }

  Future<void> dispose() async {
    _apiClient.close();
    _labClient.close();
  }

  Future<void> _ensurePrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
  }

  /// Patients: try GoDaddy `/api/patients/` first, fall back to local cache.
  Future<List<Patient>> fetchPatients({bool forceRefresh = false}) async {
    await _ensurePrefs();
    final cached = _readCachedPatients();

    try {
      final remote = await _fetchPatientsRemote();
      await _prefs!.setString(_lastSyncKey, DateTime.now().toIso8601String());
      return remote;
    } on ApiException catch (e) {
      debugPrint('fetchPatients remote failed: $e');
      if (cached != null) return cached;
      if (!_hasToken) return _seedPatientsAndCache();
      rethrow;
    } catch (e) {
      debugPrint('fetchPatients error: $e');
      if (cached != null) return cached;
      return _seedPatientsAndCache();
    }
  }

  Future<Patient> fetchPatientDetail(String patientId) async {
    await _ensurePrefs();
    final cached = _findCachedPatient(patientId);

    try {
      final response = await _apiClient.getJson('patients/$patientId/');
      final data = (response['data'] as Map<String, dynamic>?) ?? response;
      final patient = Patient.fromApi(data);
      await _updatePatientCache(patient);
      return patient;
    } on ApiException catch (e) {
      debugPrint('fetchPatientDetail failed: $e');
      if (cached != null) return cached;
      rethrow;
    }
  }

  Future<List<Assessment>> fetchPatientAssessments(String patientId) async {
    await _ensurePrefs();
    final cached = _readCachedAssessments(patientId);

    try {
      final response = await _apiClient.getJson('assessments/', queryParameters: {
        'patient_id': patientId,
        'page_size': '100',
      });
      final data = response['data'] as List<dynamic>? ?? const [];
      final assessments = data
          .map((item) => Assessment.fromApi(item as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.submittedAt.compareTo(a.submittedAt));
      await _cacheAssessments(patientId, assessments);
      return assessments;
    } on ApiException catch (e) {
      debugPrint('fetchPatientAssessments failed: $e');
      return cached ?? const [];
    }
  }

  /// Volunteers endpoint is not on GoDaddy yet — hybrid local + optional remote.
  Future<List<Volunteer>> fetchVolunteers({bool forceRefresh = false}) async {
    await _ensurePrefs();
    final cached = _readCachedVolunteers();

    try {
      final remote = await _fetchVolunteersRemote();
      return remote;
    } on ApiException catch (e) {
      debugPrint('fetchVolunteers remote unavailable ($e); using local cache');
      return cached ?? _seedVolunteersAndCache();
    } catch (e) {
      debugPrint('fetchVolunteers error: $e');
      return cached ?? _seedVolunteersAndCache();
    }
  }

  Future<Patient> registerPatient(Patient patient) async {
    await _ensurePrefs();
    try {
      final response =
          await _apiClient.postJson('patients/', body: patient.toApiPayload());
      final data = (response['data'] as Map<String, dynamic>?) ?? response;
      final created = Patient.fromApi(data).copyWith(status: PatientStatus.synced);
      final patients = await fetchPatients(forceRefresh: true);
      final exists = patients.any((p) => p.id == created.id);
      if (!exists) {
        await _cachePatients([created, ...patients]);
      }
      return created;
    } on ApiException catch (e) {
      debugPrint('registerPatient API failed, caching offline: $e');
      final local = patient.copyWith(status: PatientStatus.pendingUpload);
      final patients = _readCachedPatients() ?? [];
      final updated = List<Patient>.from(patients)..insert(0, local);
      await _prefs!.setString(_patientsKey, Patient.encodeList(updated));
      return local;
    }
  }

  Future<Volunteer> registerVolunteer(Volunteer volunteer) async {
    await _ensurePrefs();
    try {
      await _apiClient.postJson('volunteers/', body: volunteer.toApiPayload());
      final refreshed = await fetchVolunteers(forceRefresh: true);
      return refreshed.firstWhere(
        (v) => v.fullName.toLowerCase() == volunteer.fullName.toLowerCase(),
        orElse: () => volunteer.copyWith(status: VolunteerStatus.synced),
      );
    } on ApiException catch (e) {
      debugPrint('registerVolunteer API failed, caching offline: $e');
      final local = volunteer.copyWith(status: VolunteerStatus.pendingUpload);
      final volunteers = _readCachedVolunteers() ?? [];
      final updated = List<Volunteer>.from(volunteers)..insert(0, local);
      await _prefs!.setString(_volunteersKey, Volunteer.encodeList(updated));
      return local;
    }
  }

  /// Upload pending patients one-by-one (GoDaddy has no `/patients/sync/`).
  Future<List<Patient>> syncPatients() async {
    await _ensurePrefs();
    final patients = _readCachedPatients() ?? await fetchPatients();
    final pending = patients.where((p) => p.status != PatientStatus.synced).toList();
    final remaining = <Patient>[];

    for (final patient in pending) {
      try {
        await _apiClient.postJson('patients/', body: patient.toApiPayload());
      } on ApiException catch (e) {
        debugPrint('syncPatients item failed for ${patient.id}: $e');
        remaining.add(patient.copyWith(status: PatientStatus.error));
      }
    }

    try {
      final refreshed = await _fetchPatientsRemote();
      if (remaining.isNotEmpty) {
        final merged = [...remaining, ...refreshed];
        await _cachePatients(merged);
        await _prefs!.setString(_lastSyncKey, DateTime.now().toIso8601String());
        return merged;
      }
      await _prefs!.setString(_lastSyncKey, DateTime.now().toIso8601String());
      return refreshed;
    } on ApiException catch (e) {
      debugPrint('syncPatients refresh failed: $e');
      if (remaining.isNotEmpty) {
        final updated = patients.map((p) {
          final failed = remaining.where((r) => r.id == p.id).toList();
          return failed.isNotEmpty ? failed.first : p;
        }).toList();
        await _cachePatients(updated);
        return updated;
      }
      return patients;
    }
  }

  Future<Patient> updatePatient(Patient patient, {Map<String, dynamic>? changes}) async {
    await _ensurePrefs();
    final payload = changes ?? patient.toApiPayload();
    try {
      await _apiClient.putJson('patients/${patient.id}/', body: payload);
      try {
        return await fetchPatientDetail(patient.id);
      } on ApiException {
        final synced = patient.copyWith(status: PatientStatus.synced);
        await _updatePatientCache(synced);
        return synced;
      }
    } on ApiException catch (e) {
      debugPrint('updatePatient API failed, caching offline: $e');
      final updatedLocal = patient.copyWith(status: PatientStatus.pendingUpload);
      final patients = _readCachedPatients() ?? [];
      final updated =
          patients.map((p) => p.id == patient.id ? updatedLocal : p).toList();
      await _cachePatients(updated);
      return updatedLocal;
    }
  }

  /// Delete patient on GoDaddy `/api/patients/{id}/` and remove from local cache.
  Future<void> deletePatient(String patientId) async {
    await _ensurePrefs();
    var remoteDeleted = false;
    try {
      await _apiClient.deleteJson('patients/$patientId/');
      remoteDeleted = true;
    } on ApiException catch (e) {
      // 404 = already gone on server; still clear local.
      if (e.statusCode == 404) {
        remoteDeleted = true;
      } else {
        debugPrint('deletePatient API failed: $e');
      }
    }

    final patients = _readCachedPatients() ?? [];
    final updated = patients.where((p) => p.id != patientId).toList();
    await _cachePatients(updated);
    await _prefs!.remove('$_assessmentsKeyPrefix$patientId');

    if (!remoteDeleted) {
      throw ApiException(
        message: 'Deleted locally only — server delete failed. Sync when online.',
      );
    }
  }

  /// Bulk delete — returns counts for UI feedback.
  Future<({int deleted, int failed})> deletePatients(List<String> patientIds) async {
    var deleted = 0;
    var failed = 0;
    for (final id in patientIds) {
      try {
        await deletePatient(id);
        deleted++;
      } on ApiException catch (e) {
        debugPrint('bulk delete failed for $id: $e');
        // Still removed locally inside deletePatient before throw in some cases;
        // count as partial success if cache was cleared.
        failed++;
      } catch (e) {
        debugPrint('bulk delete error for $id: $e');
        failed++;
      }
    }
    return (deleted: deleted, failed: failed);
  }

  /// Client-side AI risk scoring (same rules as React AIHealthAssessment).
  /// GoDaddy `/api/ai/` is not available — decisions run locally + optional vitals POST.
  Map<String, dynamic> runAiDecision(Patient patient) {
    var score = 100.0;
    final factors = <String>[];
    final recs = <String>[];

    if (patient.age > 65) {
      score -= 20;
      factors.add('Advanced Age');
      recs.add('Regular health monitoring recommended');
    } else if (patient.age > 50) {
      score -= 10;
      factors.add('Age-related Risk');
      recs.add('Annual comprehensive checkup');
    }

    if (patient.healthScore > 0 && patient.healthScore < 50) {
      score -= 25;
      factors.add('Low existing health score (${patient.healthScore})');
      recs.add('Specialist consultation recommended');
    } else if (patient.healthScore > 0 && patient.healthScore < 70) {
      score -= 10;
      factors.add('Moderate health score');
      recs.add('Follow-up vitals and lifestyle coaching');
    }

    final risk = patient.riskLevel.toLowerCase();
    if (risk.contains('high')) {
      score -= 20;
      factors.add('High risk profile on record');
      recs.add('Priority clinical review at health fair');
    } else if (risk.contains('medium') || risk.contains('moderate')) {
      score -= 10;
      factors.add('Medium risk profile on record');
      recs.add('Schedule nurse triage');
    }

    if (patient.email == null || patient.email!.isEmpty) {
      score -= 5;
      factors.add('Missing contact email');
      recs.add('Collect email for follow-up recommendations');
    }

    recs.add('Mental health screening (PHQ-9) recommended');
    recs.add('Stress management techniques');

    final finalScore = score.clamp(0, 100).toDouble();
    String level;
    if (finalScore >= 75) {
      level = 'Low Risk';
    } else if (finalScore >= 50) {
      level = 'Medium Risk';
    } else {
      level = 'High Risk';
    }

    return {
      'health_score': finalScore,
      'risk_level': level,
      'risk_factors': factors.isEmpty ? <String>['No major risk factors detected'] : factors,
      'recommendations': recs,
    };
  }

  Future<List<Volunteer>> syncVolunteers() async {
    await _ensurePrefs();
    final volunteers = _readCachedVolunteers() ?? await fetchVolunteers();
    final pending =
        volunteers.where((v) => v.status != VolunteerStatus.synced).toList();
    final failed = <Volunteer>[];

    for (final volunteer in pending) {
      try {
        await _apiClient.postJson('volunteers/', body: volunteer.toApiPayload());
      } on ApiException catch (e) {
        debugPrint('syncVolunteers item failed: $e');
        failed.add(volunteer.copyWith(status: VolunteerStatus.error));
      }
    }

    try {
      final refreshed = await _fetchVolunteersRemote();
      if (failed.isNotEmpty) {
        final merged = [...failed, ...refreshed];
        await _prefs!.setString(_volunteersKey, Volunteer.encodeList(merged));
        return merged;
      }
      return refreshed;
    } on ApiException {
      // Endpoint missing on GoDaddy — keep local, mark successful uploads synced.
      final updated = volunteers.map((v) {
        if (failed.any((f) => f.id == v.id)) {
          return v.copyWith(status: VolunteerStatus.error);
        }
        if (v.status == VolunteerStatus.pendingUpload &&
            !failed.any((f) => f.id == v.id) &&
            pending.any((p) => p.id == v.id)) {
          // POST failed with 404 for all — keep pending, do not fake synced.
          return v;
        }
        return v;
      }).toList();
      await _prefs!.setString(_volunteersKey, Volunteer.encodeList(updated));
      return updated;
    }
  }

  /// Record vitals on GoDaddy `/api/vitals/` and cache locally as an assessment.
  /// Fields match React `VitalsTracking` (HbA1c, lipids, carotid, mental health).
  Future<Assessment> submitVitalsAssessment({
    required String patientId,
    required double systolic,
    required double diastolic,
    double? heartRate,
    double? temperature,
    double? oxygenSaturation,
    double? weight,
    double? height,
    required double glucose,
    required double bmi,
    double? hba1c,
    double? totalCholesterol,
    double? ldlCholesterol,
    double? hdlCholesterol,
    double? triglycerides,
    String? carotidDoppler,
    double? phq2,
    double? gad2,
    required double phq9,
    double? gad7,
    required double riskScore,
    required String riskLevel,
    String? notes,
  }) async {
    await _ensurePrefs();

    try {
      await _apiClient.postJson('vitals/', body: {
        'patient': patientId,
        'blood_pressure_systolic': systolic.round(),
        'blood_pressure_diastolic': diastolic.round(),
        if (heartRate != null) 'heart_rate': heartRate.round(),
        if (temperature != null) 'temperature': temperature,
        if (oxygenSaturation != null) 'oxygen_saturation': oxygenSaturation.round(),
        if (weight != null) 'weight': weight,
        if (height != null) 'height': height,
        'blood_sugar': glucose,
        'bmi': bmi,
        if (hba1c != null) 'hba1c': hba1c,
        if (totalCholesterol != null) 'total_cholesterol': totalCholesterol,
        if (ldlCholesterol != null) 'ldl_cholesterol': ldlCholesterol,
        if (hdlCholesterol != null) 'hdl_cholesterol': hdlCholesterol,
        if (triglycerides != null) 'triglycerides': triglycerides,
        if (carotidDoppler != null && carotidDoppler.isNotEmpty)
          'carotid_doppler': carotidDoppler,
        'mental_health_score': phq9.round(),
        if (phq2 != null) 'phq2_score': phq2.round(),
        if (gad2 != null) 'gad2_score': gad2.round(),
        if (gad7 != null) 'gad7_score': gad7.round(),
        'notes': notes,
      });
    } on ApiException catch (e) {
      debugPrint('submitVitalsAssessment vitals POST failed: $e');
    }

    try {
      await _apiClient.postJson('assessments/', body: {
        'patient': patientId,
        'doctor': patientId, // backend requires doctor; reuse until auth doctor id exists
        'assessment_type': 'health_fair_vitals',
        'score': riskScore,
        'risk_level': riskLevel,
        'notes': notes,
      });
    } on ApiException catch (e) {
      debugPrint('submitVitalsAssessment assessment POST failed: $e');
    }

    final assessment = Assessment(
      id: 'local_${DateTime.now().microsecondsSinceEpoch}',
      patientId: patientId,
      assessmentType: 'health_fair_vitals',
      score: riskScore,
      riskLevel: riskLevel,
      submittedAt: DateTime.now(),
      performedBy: 'Health Fair App',
      responses: {
        'systolic': systolic,
        'diastolic': diastolic,
        if (heartRate != null) 'heart_rate': heartRate,
        if (temperature != null) 'temperature': temperature,
        if (oxygenSaturation != null) 'oxygen_saturation': oxygenSaturation,
        if (weight != null) 'weight': weight,
        if (height != null) 'height': height,
        'glucose': glucose,
        'bmi': bmi,
        if (hba1c != null) 'hba1c': hba1c,
        if (totalCholesterol != null) 'total_cholesterol': totalCholesterol,
        if (ldlCholesterol != null) 'ldl_cholesterol': ldlCholesterol,
        if (hdlCholesterol != null) 'hdl_cholesterol': hdlCholesterol,
        if (triglycerides != null) 'triglycerides': triglycerides,
        if (carotidDoppler != null) 'carotid_doppler': carotidDoppler,
        if (phq2 != null) 'phq2': phq2,
        if (gad2 != null) 'gad2': gad2,
        'phq9': phq9,
        if (gad7 != null) 'gad7': gad7,
        if (notes != null) 'notes': notes,
      },
    );

    final existing = _readCachedAssessments(patientId) ?? [];
    await _cacheAssessments(patientId, [assessment, ...existing]);
    return assessment;
  }

  Future<List<LabTestInfo>> fetchLabTests({int limit = 50}) async {
    try {
      final list = await _labClient.getJsonList('tests/');
      return list
          .cast<Map<String, dynamic>>()
          .map(LabTestInfo.fromApi)
          .take(limit)
          .toList();
    } on ApiException catch (e) {
      debugPrint('fetchLabTests failed: $e');
      rethrow;
    }
  }

  Future<DashboardStats> fetchDashboardStats() async {
    await _ensurePrefs();
    var apiHealthy = false;
    List<Patient> patients = _readCachedPatients() ?? [];
    List<Volunteer> volunteers = _readCachedVolunteers() ?? [];

    try {
      patients = await fetchPatients(forceRefresh: true);
      apiHealthy = true;
    } catch (_) {
      apiHealthy = false;
    }

    try {
      volunteers = await fetchVolunteers();
    } catch (_) {}

    final lastSyncRaw = _prefs!.getString(_lastSyncKey);
    final lastSync =
        lastSyncRaw != null ? DateTime.tryParse(lastSyncRaw) : null;

    final today = DateTime.now();
    var assessmentsToday = 0;
    for (final p in patients) {
      final assessments = _readCachedAssessments(p.id) ?? [];
      assessmentsToday += assessments.where((a) {
        final d = a.submittedAt.toLocal();
        return d.year == today.year && d.month == today.month && d.day == today.day;
      }).length;
    }

    return DashboardStats(
      totalPatients: patients.length,
      pendingPatients:
          patients.where((p) => p.status != PatientStatus.synced).length,
      totalVolunteers: volunteers.length,
      pendingVolunteers:
          volunteers.where((v) => v.status != VolunteerStatus.synced).length,
      assessmentsToday: assessmentsToday,
      lastSync: lastSync,
      apiHealthy: apiHealthy,
    );
  }

  Future<void> syncAll() async {
    await syncPatients();
    await syncVolunteers();
    await _prefs!.setString(_lastSyncKey, DateTime.now().toIso8601String());
  }

  bool get _hasToken => _authToken != null && _authToken!.isNotEmpty;

  Future<List<Patient>> _fetchPatientsRemote() async {
    final response = await _apiClient.getJson('patients/', queryParameters: {
      'page_size': '100',
    });
    final data = response['data'] as List<dynamic>? ?? const [];
    final patients =
        data.map((item) => Patient.fromApi(item as Map<String, dynamic>)).toList();
    await _cachePatients(patients);
    return patients;
  }

  Future<List<Volunteer>> _fetchVolunteersRemote() async {
    final response = await _apiClient.getJson('volunteers/', queryParameters: {
      'page_size': '100',
    });
    final data = response['data'] as List<dynamic>? ?? const [];
    final volunteers = data
        .map((item) => Volunteer.fromApi(item as Map<String, dynamic>))
        .toList();
    await _prefs!.setString(_volunteersKey, Volunteer.encodeList(volunteers));
    return volunteers;
  }

  List<Patient>? _readCachedPatients() {
    final stored = _prefs!.getString(_patientsKey);
    if (stored == null) return null;
    try {
      return Patient.decodeList(stored);
    } catch (error) {
      debugPrint('Failed to decode cached patients: $error');
      _prefs!.remove(_patientsKey);
      return null;
    }
  }

  List<Volunteer>? _readCachedVolunteers() {
    final stored = _prefs!.getString(_volunteersKey);
    if (stored == null) return null;
    try {
      return Volunteer.decodeList(stored);
    } catch (error) {
      debugPrint('Failed to decode cached volunteers: $error');
      _prefs!.remove(_volunteersKey);
      return null;
    }
  }

  Future<void> _cachePatients(List<Patient> patients) async {
    await _prefs!.setString(_patientsKey, Patient.encodeList(patients));
  }

  Future<void> _updatePatientCache(Patient patient) async {
    final current = _readCachedPatients() ?? [];
    final updated = <Patient>[];
    var found = false;
    for (final existing in current) {
      if (existing.id == patient.id) {
        updated.add(patient);
        found = true;
      } else {
        updated.add(existing);
      }
    }
    if (!found) {
      updated.add(patient);
    }
    await _cachePatients(updated);
  }

  Patient? _findCachedPatient(String patientId) {
    final cached = _readCachedPatients();
    if (cached == null) return null;
    for (final patient in cached) {
      if (patient.id == patientId) {
        return patient;
      }
    }
    return null;
  }

  Future<void> _cacheAssessments(String patientId, List<Assessment> assessments) async {
    final key = '$_assessmentsKeyPrefix$patientId';
    final encoded = jsonEncode(assessments
        .map((a) => {
              'id': a.id,
              'patient_id': a.patientId,
              'assessment_type': a.assessmentType,
              'score': a.score,
              'risk_level': a.riskLevel,
              'submitted_at': a.submittedAt.toIso8601String(),
              'performed_by': a.performedBy,
              'responses': a.responses,
            })
        .toList());
    await _prefs!.setString(key, encoded);
  }

  List<Assessment>? _readCachedAssessments(String patientId) {
    final key = '$_assessmentsKeyPrefix$patientId';
    final stored = _prefs!.getString(key);
    if (stored == null) return null;
    try {
      final decoded = jsonDecode(stored) as List<dynamic>;
      return decoded
          .cast<Map<String, dynamic>>()
          .map(Assessment.fromApi)
          .toList()
        ..sort((a, b) => b.submittedAt.compareTo(a.submittedAt));
    } catch (error) {
      debugPrint('Failed to decode cached assessments: $error');
      _prefs!.remove(key);
      return null;
    }
  }

  List<Patient> _seedPatientsAndCache() {
    final seed = _seedPatients();
    _cachePatients(seed);
    return seed;
  }

  List<Volunteer> _seedVolunteersAndCache() {
    final seed = _seedVolunteers();
    _prefs!.setString(_volunteersKey, Volunteer.encodeList(seed));
    return seed;
  }

  List<Patient> _seedPatients() {
    return [
      Patient(
        id: _randomId(),
        firstName: 'Amina',
        lastName: 'Khan',
        gender: 'Female',
        age: 42,
        healthScore: 82,
        riskLevel: 'Low Risk',
        lastAssessment: '2 hours ago',
        email: 'amina.khan@example.com',
        volunteerSupport: 'Sarah Ahmed',
        status: PatientStatus.pendingUpload,
      ),
      Patient(
        id: _randomId(),
        firstName: 'Derek',
        lastName: 'Silva',
        gender: 'Male',
        age: 56,
        healthScore: 58,
        riskLevel: 'Medium Risk',
        lastAssessment: 'Yesterday',
        phone: '(813) 555-1092',
        status: PatientStatus.pendingUpload,
      ),
    ];
  }

  List<Volunteer> _seedVolunteers() {
    return [
      Volunteer(
        id: _randomId(),
        fullName: 'Sarah Ahmed',
        organization: 'Masjid Al-Rahma',
        role: 'Nurse - Vitals',
        availability: 'Sat 8am-2pm',
        skills: 'Vitals, First Aid',
        email: 'sarah.ahmed@rahma.org',
        phone: '(813) 555-3201',
        status: VolunteerStatus.pendingUpload,
      ),
      Volunteer(
        id: _randomId(),
        fullName: 'Carlos Mendoza',
        organization: 'Community Health Alliance',
        role: 'Registration Desk',
        availability: 'Fri 6pm-9pm',
        skills: 'Spanish, Data Entry',
        phone: '(813) 555-4881',
        status: VolunteerStatus.pendingUpload,
      ),
    ];
  }

  String _randomId() {
    final rand = Random();
    return 'id_${rand.nextInt(1 << 32)}';
  }
}
