import 'dart:convert';

import 'package:flutter/material.dart';

enum PatientStatus { synced, pendingUpload, error }

class Patient {
  Patient({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.age,
    required this.healthScore,
    required this.riskLevel,
    required this.lastAssessment,
    this.email,
    this.phone,
    this.address,
    this.dateOfBirth,
    this.volunteerSupport,
    this.status = PatientStatus.synced,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String gender;
  final int age;
  final int healthScore;
  final String riskLevel;
  final String lastAssessment;
  final String? email;
  final String? phone;
  final String? address;
  final String? dateOfBirth;
  final String? volunteerSupport;
  final PatientStatus status;

  String get fullName => '$firstName $lastName'.trim();

  String get initials {
    final parts = fullName.split(' ').where((part) => part.trim().isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return parts.take(2).map((e) => e.substring(0, 1).toUpperCase()).join();
  }

  Color get riskColor {
    switch (riskLevel.toLowerCase()) {
      case 'high risk':
      case 'high':
        return Colors.red.shade600;
      case 'medium risk':
      case 'medium':
      case 'moderate':
        return Colors.orange.shade700;
      default:
        return Colors.green.shade600;
    }
  }

  String get statusLabel {
    switch (status) {
      case PatientStatus.synced:
        return 'Synced';
      case PatientStatus.pendingUpload:
        return 'Pending upload';
      case PatientStatus.error:
        return 'Sync error';
    }
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'firstName': firstName,
        'lastName': lastName,
        'gender': gender,
        'age': age,
        'healthScore': healthScore,
        'riskLevel': riskLevel,
        'lastAssessment': lastAssessment,
        'email': email,
        'phone': phone,
        'address': address,
        'dateOfBirth': dateOfBirth,
        'volunteerSupport': volunteerSupport,
        'status': status.name,
      };

  /// Payload matching GoDaddy `/api/patients/` schema.
  Map<String, dynamic> toApiPayload() {
    final dob = dateOfBirth ?? _dobFromAge(age);
    return {
      'first_name': firstName,
      'last_name': lastName,
      'email': email ?? '',
      'phone': phone ?? '',
      'date_of_birth': dob,
      'gender': gender.toLowerCase(),
      'address': (address == null || address!.isEmpty) ? 'Not provided' : address,
    };
  }

  factory Patient.fromJson(Map<String, dynamic> json) {
    return Patient(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      gender: json['gender'] as String,
      age: json['age'] as int,
      healthScore: json['healthScore'] as int,
      riskLevel: json['riskLevel'] as String,
      lastAssessment: json['lastAssessment'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      dateOfBirth: json['dateOfBirth'] as String?,
      volunteerSupport: json['volunteerSupport'] as String?,
      status: PatientStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => PatientStatus.synced,
      ),
    );
  }

  factory Patient.fromApi(Map<String, dynamic> json) {
    final first = (json['first_name'] as String?)?.trim();
    final last = (json['last_name'] as String?)?.trim();
    String firstName;
    String lastName;
    if ((first != null && first.isNotEmpty) || (last != null && last.isNotEmpty)) {
      firstName = first ?? '';
      lastName = last ?? '';
    } else {
      final fullName =
          (json['full_name'] ?? json['fullName'] ?? json['name'] ?? '') as String;
      final names = _splitName(fullName);
      firstName = names.$1;
      lastName = names.$2;
    }

    final dob = json['date_of_birth'] as String?;
    final ageFromDob = _ageFromDob(dob);
    final riskScore = _toDouble(json['health_risk_score']) ??
        _toDouble(json['health_score']) ??
        _toDouble(json['score']) ??
        0;
    // Backend risk is often 0–10; UI score is 0–100.
    final healthScore = riskScore <= 10 ? (riskScore * 10).round() : riskScore.round();

    final lastAssessmentRaw = json['last_health_assessment'] ??
        json['last_assessment'] ??
        json['updated_at'];
    final lastAssessment = lastAssessmentRaw is String
        ? _formatRelative(lastAssessmentRaw)
        : 'Awaiting assessment';

    return Patient(
      id: '${json['id']}',
      firstName: firstName.isEmpty ? 'Unknown' : firstName,
      lastName: lastName,
      gender: (json['gender'] as String?) ?? 'Unknown',
      age: ageFromDob ?? (_toInt(json['age']) ?? 0),
      healthScore: healthScore,
      riskLevel: _riskLabelFromScore(riskScore),
      lastAssessment: lastAssessment,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      dateOfBirth: dob,
      volunteerSupport: json['volunteer_support'] as String?,
      status: _statusFromApi(json['status']),
    );
  }

  Patient copyWith({
    String? firstName,
    String? lastName,
    String? gender,
    int? age,
    int? healthScore,
    String? riskLevel,
    String? lastAssessment,
    String? email,
    String? phone,
    String? address,
    String? dateOfBirth,
    String? volunteerSupport,
    PatientStatus? status,
  }) {
    return Patient(
      id: id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      gender: gender ?? this.gender,
      age: age ?? this.age,
      healthScore: healthScore ?? this.healthScore,
      riskLevel: riskLevel ?? this.riskLevel,
      lastAssessment: lastAssessment ?? this.lastAssessment,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      address: address ?? this.address,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      volunteerSupport: volunteerSupport ?? this.volunteerSupport,
      status: status ?? this.status,
    );
  }

  static String encodeList(List<Patient> patients) =>
      jsonEncode(patients.map((p) => p.toJson()).toList());

  static List<Patient> decodeList(String encoded) {
    final List<dynamic> decoded = jsonDecode(encoded) as List<dynamic>;
    return decoded.cast<Map<String, dynamic>>().map(Patient.fromJson).toList();
  }

  static (String, String) _splitName(String fullName) {
    final trimmed = fullName.trim();
    if (trimmed.isEmpty) {
      return ('Unknown', '');
    }
    final parts = trimmed.split(' ').where((part) => part.isNotEmpty).toList();
    if (parts.length == 1) {
      return (parts.first, '');
    }
    return (parts.first, parts.sublist(1).join(' '));
  }

  static PatientStatus _statusFromApi(Object? value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'pending':
        case 'pending_upload':
          return PatientStatus.pendingUpload;
        case 'error':
          return PatientStatus.error;
        default:
          return PatientStatus.synced;
      }
    }
    return PatientStatus.synced;
  }

  static int? _ageFromDob(String? dob) {
    if (dob == null || dob.isEmpty) return null;
    final parsed = DateTime.tryParse(dob);
    if (parsed == null) return null;
    final now = DateTime.now();
    var age = now.year - parsed.year;
    if (now.month < parsed.month ||
        (now.month == parsed.month && now.day < parsed.day)) {
      age--;
    }
    return age < 0 ? 0 : age;
  }

  static String _dobFromAge(int age) {
    final year = DateTime.now().year - (age <= 0 ? 30 : age);
    return '$year-01-01';
  }

  static String _riskLabelFromScore(double score) {
    // Prefer 0–10 scale from GoDaddy; also handle 0–100.
    final normalized = score <= 10 ? score * 10 : score;
    if (normalized >= 66) return 'High Risk';
    if (normalized >= 33) return 'Medium Risk';
    if (normalized > 0) return 'Low Risk';
    return 'Pending Assessment';
  }

  static String _formatRelative(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return iso;
    final diff = DateTime.now().toUtc().difference(dt.toUtc());
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    if (diff.inDays < 14) return '${diff.inDays} day${diff.inDays == 1 ? '' : 's'} ago';
    return '${dt.year}-${dt.month.toString().padLeft(2, '0')}-${dt.day.toString().padLeft(2, '0')}';
  }

  static double? _toDouble(Object? value) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value);
    return null;
  }

  static int? _toInt(Object? value) {
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}
