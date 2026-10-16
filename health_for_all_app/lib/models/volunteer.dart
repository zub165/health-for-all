import 'dart:convert';

import 'package:flutter/material.dart';

enum VolunteerStatus { synced, pendingUpload, error }

class Volunteer {
  Volunteer({
    required this.id,
    required this.fullName,
    required this.organization,
    required this.role,
    required this.availability,
    this.email,
    this.phone,
    this.skills,
    this.status = VolunteerStatus.synced,
  });

  final String id;
  final String fullName;
  final String organization;
  final String role;
  final String availability;
  final String? email;
  final String? phone;
  final String? skills;
  final VolunteerStatus status;

  String get initials {
    final parts = fullName.split(' ');
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return parts.take(2).map((e) => e.substring(0, 1).toUpperCase()).join();
  }

  Color get statusColor {
    switch (status) {
      case VolunteerStatus.synced:
        return Colors.green.shade600;
      case VolunteerStatus.pendingUpload:
        return Colors.orange.shade700;
      case VolunteerStatus.error:
        return Colors.red.shade600;
    }
  }

  String get contactSummary {
    if (email != null && phone != null) {
      return '$email • $phone';
    }
    return email ?? phone ?? 'No contact info';
  }

  Volunteer copyWith({VolunteerStatus? status}) {
    return Volunteer(
      id: id,
      fullName: fullName,
      organization: organization,
      role: role,
      availability: availability,
      email: email,
      phone: phone,
      skills: skills,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'organization': organization,
        'role': role,
        'availability': availability,
        'email': email,
        'phone': phone,
        'skills': skills,
        'status': status.name,
      };

  Map<String, dynamic> toApiPayload() {
    return {
      'full_name': fullName,
      'organization': organization,
      'role': role,
      'availability': availability,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (skills != null) 'skills': skills,
      'status': _statusToApi(status),
    };
  }

  factory Volunteer.fromJson(Map<String, dynamic> json) {
    return Volunteer(
      id: json['id'] as String,
      fullName: json['fullName'] as String,
      organization: json['organization'] as String,
      role: json['role'] as String,
      availability: json['availability'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      skills: json['skills'] as String?,
      status: VolunteerStatus.values.firstWhere(
        (e) => e.name == json['status'],
        orElse: () => VolunteerStatus.synced,
      ),
    );
  }

  factory Volunteer.fromApi(Map<String, dynamic> json) {
    return Volunteer(
      id: '${json['id']}',
      fullName: (json['full_name'] as String?) ?? (json['name'] as String?) ?? 'Unknown Volunteer',
      organization: (json['organization'] as String?) ?? 'Independent Volunteer',
      role: (json['role'] as String?) ?? 'General Support',
      availability: (json['availability'] as String?) ?? 'TBD',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      skills: json['skills'] is List
          ? (json['skills'] as List<dynamic>).join(', ')
          : json['skills'] as String?,
      status: _statusFromApi(json['status']),
    );
  }

  static String encodeList(List<Volunteer> volunteers) =>
      jsonEncode(volunteers.map((v) => v.toJson()).toList());

  static List<Volunteer> decodeList(String encoded) {
    final List<dynamic> decoded = jsonDecode(encoded) as List<dynamic>;
    return decoded.cast<Map<String, dynamic>>().map(Volunteer.fromJson).toList();
  }

  static VolunteerStatus _statusFromApi(Object? value) {
    if (value is String) {
      switch (value.toLowerCase()) {
        case 'pending':
        case 'pending_upload':
          return VolunteerStatus.pendingUpload;
        case 'error':
          return VolunteerStatus.error;
        default:
          return VolunteerStatus.synced;
      }
    }
    return VolunteerStatus.synced;
  }

  static String _statusToApi(VolunteerStatus status) {
    switch (status) {
      case VolunteerStatus.pendingUpload:
        return 'pending';
      case VolunteerStatus.error:
        return 'error';
      case VolunteerStatus.synced:
        return 'available';
    }
  }
}
