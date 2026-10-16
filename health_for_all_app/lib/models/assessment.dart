import 'dart:convert';

class Assessment {
  Assessment({
    required this.id,
    required this.patientId,
    required this.assessmentType,
    required this.score,
    required this.riskLevel,
    required this.submittedAt,
    this.performedBy,
    this.responses,
  });

  final String id;
  final String patientId;
  final String assessmentType;
  final double score;
  final String riskLevel;
  final DateTime submittedAt;
  final String? performedBy;
  final Map<String, dynamic>? responses;

  factory Assessment.fromApi(Map<String, dynamic> json) {
    return Assessment(
      id: '${json['id'] ?? json['assessment_id'] ?? json['uuid']}',
      patientId: '${json['patient_id'] ?? json['patient'] ?? ''}',
      assessmentType: (json['assessment_type'] as String?) ?? 'general',
      score: (json['score'] is num) ? (json['score'] as num).toDouble() : 0,
      riskLevel: (json['risk_level'] as String?) ?? 'unknown',
      submittedAt: DateTime.tryParse(json['submitted_at'] as String? ?? json['created_at'] as String? ?? '') ??
          DateTime.now(),
      performedBy: json['performed_by'] as String?,
      responses: json['responses'] is Map<String, dynamic>
          ? json['responses'] as Map<String, dynamic>
          : json['responses'] is String
              ? jsonDecode(json['responses'] as String) as Map<String, dynamic>
              : null,
    );
  }
}
