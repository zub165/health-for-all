import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/api_config.dart';

class IcdRecommendRule {
  const IcdRecommendRule({
    required this.icdMatched,
    required this.condition,
    required this.rationale,
    required this.labs,
    required this.imaging,
    required this.sources,
  });

  final String icdMatched;
  final String condition;
  final String rationale;
  final List<String> labs;
  final List<String> imaging;
  final List<String> sources;

  factory IcdRecommendRule.fromJson(Map<String, dynamic> json) {
    return IcdRecommendRule(
      icdMatched: '${json['icd_matched'] ?? ''}',
      condition: '${json['condition'] ?? ''}',
      rationale: '${json['rationale'] ?? ''}',
      labs: _stringList(json['labs']),
      imaging: _stringList(json['imaging']),
      sources: _stringList(json['sources']),
    );
  }
}

class IcdRecommendResult {
  const IcdRecommendResult({
    required this.inputCodes,
    required this.matchedRules,
    required this.recommendedLabCodes,
    required this.recommendedImagingCodes,
    required this.disclaimer,
    required this.source,
    this.aiEnhanced = false,
  });

  final List<String> inputCodes;
  final List<IcdRecommendRule> matchedRules;
  final List<String> recommendedLabCodes;
  final List<String> recommendedImagingCodes;
  final String disclaimer;
  final String source; // live | local
  final bool aiEnhanced;

  factory IcdRecommendResult.fromJson(Map<String, dynamic> json, {required String source}) {
    final rules = (json['matched_rules'] as List?)
            ?.whereType<Map>()
            .map((e) => IcdRecommendRule.fromJson(Map<String, dynamic>.from(e)))
            .toList() ??
        const [];
    return IcdRecommendResult(
      inputCodes: _stringList(json['input_codes']),
      matchedRules: rules,
      recommendedLabCodes: _stringList(json['recommended_lab_codes']),
      recommendedImagingCodes: _stringList(json['recommended_imaging_codes']),
      disclaimer: '${json['disclaimer'] ?? 'Clinical decision support — not a substitute for clinical judgment.'}',
      source: source,
      aiEnhanced: json['ai_enhanced'] == true,
    );
  }
}

List<String> _stringList(dynamic value) {
  if (value is! List) return const [];
  return value.map((e) => '$e'.trim()).where((e) => e.isNotEmpty).toList();
}

/// ICD-10 → labs/imaging recommendations (live GoDaddy API + local guideline map).
class IcdLabRecommendService {
  IcdLabRecommendService._();
  static final IcdLabRecommendService instance = IcdLabRecommendService._();

  static const _localRules = <_LocalRule>[
    _LocalRule(
      prefixes: ['I10', 'I11', 'I12', 'I13'],
      label: 'Hypertension',
      labs: ['BMP', 'CMP', 'LIPID', 'CBC', 'UA', 'UACR', 'HSCRP'],
      imaging: ['EKG', 'ECHO', 'CXR'],
      rationale: 'Baseline metabolic, lipids, renal, and cardiac screening for hypertension.',
    ),
    _LocalRule(
      prefixes: ['E11', 'E10', 'E13', 'R73'],
      label: 'Diabetes / hyperglycemia',
      labs: ['HBA1C', 'A1C', 'GLUC', 'BMP', 'CMP', 'LIPID', 'UACR', 'UA', 'CBC'],
      imaging: ['EKG', 'US-RENAL'],
      rationale: 'ADA-oriented monitoring: A1c, glucose, lipids, kidney labs.',
    ),
    _LocalRule(
      prefixes: ['E78'],
      label: 'Dyslipidemia',
      labs: ['LIPID', 'HBA1C', 'GLUC', 'CMP', 'HSCRP', 'TSH'],
      imaging: ['EKG'],
      rationale: 'Lipid panel and metabolic risk labs.',
    ),
    _LocalRule(
      prefixes: ['I50'],
      label: 'Heart failure',
      labs: ['BNP', 'PROBNP', 'BMP', 'CMP', 'CBC', 'TSH'],
      imaging: ['EKG', 'CXR', 'ECHO'],
      rationale: 'Natriuretic peptides and echocardiography.',
    ),
    _LocalRule(
      prefixes: ['J44', 'J45', 'J18'],
      label: 'Respiratory',
      labs: ['CBC', 'BMP', 'CRP'],
      imaging: ['CXR', 'CT-CHEST'],
      rationale: 'Infection labs and chest imaging.',
    ),
    _LocalRule(
      prefixes: ['N18', 'N17'],
      label: 'Kidney disease',
      labs: ['BMP', 'CMP', 'CBC', 'UA', 'UACR'],
      imaging: ['US-RENAL'],
      rationale: 'Renal labs and ultrasound.',
    ),
    _LocalRule(
      prefixes: ['Z00'],
      label: 'General exam',
      labs: ['CBC', 'CMP', 'LIPID', 'TSH', 'UA'],
      imaging: ['CXR'],
      rationale: 'Age-appropriate wellness panel.',
    ),
  ];

  Future<IcdRecommendResult> recommend(List<String> codes) async {
    final cleaned = codes
        .map((c) => c.trim().toUpperCase())
        .where((c) => c.isNotEmpty)
        .toSet()
        .toList();
    if (cleaned.isEmpty) {
      return const IcdRecommendResult(
        inputCodes: [],
        matchedRules: [],
        recommendedLabCodes: [],
        recommendedImagingCodes: [],
        disclaimer: 'Select ICD-10 codes to unlock AI lab & imaging suggestions.',
        source: 'local',
      );
    }

    try {
      final uri = Uri.parse(
        '${ApiConfig.labBaseUrl}icd-recommendations/',
      ).replace(queryParameters: {'codes': cleaned.join(',')});
      final response = await http
          .get(uri, headers: {'Accept': 'application/json'})
          .timeout(const Duration(seconds: 12));
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) {
          return IcdRecommendResult.fromJson(decoded, source: 'live');
        }
      }
      debugPrint('ICD recommend HTTP ${response.statusCode}');
    } catch (e) {
      debugPrint('ICD recommend live failed: $e');
    }

    return _localRecommend(cleaned);
  }

  IcdRecommendResult _localRecommend(List<String> codes) {
    final matched = <IcdRecommendRule>[];
    final labs = <String>{};
    final imaging = <String>{};
    for (final code in codes) {
      for (final rule in _localRules) {
        if (rule.prefixes.any((p) => code.startsWith(p))) {
          matched.add(
            IcdRecommendRule(
              icdMatched: code,
              condition: rule.label,
              rationale: rule.rationale,
              labs: rule.labs,
              imaging: rule.imaging,
              sources: const ['Local guideline map'],
            ),
          );
          labs.addAll(rule.labs);
          imaging.addAll(rule.imaging);
          break;
        }
      }
    }
    return IcdRecommendResult(
      inputCodes: codes,
      matchedRules: matched,
      recommendedLabCodes: labs.toList(),
      recommendedImagingCodes: imaging.toList(),
      disclaimer:
          'Guideline map (offline OK). Clinical decision support — verify before ordering.',
      source: 'local',
    );
  }
}

class _LocalRule {
  const _LocalRule({
    required this.prefixes,
    required this.label,
    required this.labs,
    required this.imaging,
    required this.rationale,
  });

  final List<String> prefixes;
  final String label;
  final List<String> labs;
  final List<String> imaging;
  final String rationale;
}
