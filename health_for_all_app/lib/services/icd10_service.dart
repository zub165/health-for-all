import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class Icd10Code {
  const Icd10Code({
    required this.code,
    required this.shortDescription,
    this.longDescription,
  });

  final String code;
  final String shortDescription;
  final String? longDescription;

  String get display => '$code • $shortDescription';
}

/// ICD-10 lookup via NIH Clinical Tables + local alias fallback (HTN → I10).
class Icd10Service {
  Icd10Service._();
  static final Icd10Service instance = Icd10Service._();

  static const _nlmBase =
      'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

  /// Common clinical abbreviations → search terms / codes.
  static const Map<String, List<String>> _aliases = {
    'htn': ['I10', 'essential hypertension', 'hypertension'],
    'hbp': ['I10', 'essential hypertension'],
    'high blood pressure': ['I10', 'essential hypertension'],
    'dm': ['E11.9', 'type 2 diabetes'],
    'dm2': ['E11.9', 'type 2 diabetes'],
    't2dm': ['E11.9', 'type 2 diabetes'],
    'diabetes': ['E11.9', 'type 2 diabetes'],
    'hld': ['E78.5', 'hyperlipidemia'],
    'cholesterol': ['E78.5', 'hyperlipidemia'],
    'obesity': ['E66.9', 'obesity'],
    'depression': ['F32.9', 'major depressive disorder'],
    'anxiety': ['F41.9', 'anxiety'],
    'asthma': ['J45.909', 'asthma'],
    'ckd': ['N18.9', 'chronic kidney disease'],
    'cad': ['I25.10', 'atherosclerotic heart disease'],
    'chf': ['I50.9', 'heart failure'],
    'copd': ['J44.9', 'COPD'],
  };

  static const List<Icd10Code> _localCatalog = [
    Icd10Code(
      code: 'I10',
      shortDescription: 'Essential (primary) hypertension',
      longDescription: 'Also coded for HTN / high blood pressure.',
    ),
    Icd10Code(
      code: 'E11.9',
      shortDescription: 'Type 2 diabetes mellitus without complications',
      longDescription: 'Also coded for DM / DM2 / T2DM.',
    ),
    Icd10Code(
      code: 'E78.5',
      shortDescription: 'Hyperlipidemia, unspecified',
    ),
    Icd10Code(
      code: 'E66.9',
      shortDescription: 'Obesity, unspecified',
    ),
    Icd10Code(
      code: 'F32.9',
      shortDescription: 'Major depressive disorder, single episode, unspecified',
    ),
    Icd10Code(
      code: 'F41.9',
      shortDescription: 'Anxiety disorder, unspecified',
    ),
    Icd10Code(
      code: 'J45.909',
      shortDescription: 'Unspecified asthma, uncomplicated',
    ),
    Icd10Code(
      code: 'N18.9',
      shortDescription: 'Chronic kidney disease, unspecified',
    ),
    Icd10Code(
      code: 'I25.10',
      shortDescription: 'Atherosclerotic heart disease of native coronary artery',
    ),
    Icd10Code(
      code: 'I50.9',
      shortDescription: 'Heart failure, unspecified',
    ),
    Icd10Code(
      code: 'J44.9',
      shortDescription: 'Chronic obstructive pulmonary disease, unspecified',
    ),
    Icd10Code(
      code: 'Z00.00',
      shortDescription: 'General adult medical examination without abnormal findings',
    ),
  ];

  Future<List<Icd10Code>> search(String rawQuery, {int maxResults = 20}) async {
    final query = rawQuery.trim();
    if (query.isEmpty) return const [];

    final terms = _expandQuery(query);
    final results = <String, Icd10Code>{};

    // 1) Local alias / catalog first (instant HTN → I10)
    for (final term in terms) {
      for (final code in _matchLocal(term)) {
        results[code.code] = code;
      }
    }

    // 2) NIH Clinical Tables API
    for (final term in terms) {
      try {
        final remote = await _searchNlm(term, maxResults: maxResults);
        for (final code in remote) {
          results.putIfAbsent(code.code, () => code);
        }
      } catch (e) {
        debugPrint('ICD-10 NLM search failed for "$term": $e');
      }
    }

    final list = results.values.toList();
    // Prefer exact code matches first
    list.sort((a, b) {
      final q = query.toUpperCase();
      final ae = a.code.toUpperCase() == q ? 0 : 1;
      final be = b.code.toUpperCase() == q ? 0 : 1;
      if (ae != be) return ae.compareTo(be);
      return a.code.compareTo(b.code);
    });
    return list.take(maxResults).toList();
  }

  List<String> _expandQuery(String query) {
    final lower = query.toLowerCase();
    final terms = <String>{query};
    final aliased = _aliases[lower];
    if (aliased != null) {
      terms.addAll(aliased);
    }
    // Also match partial alias keys (e.g. "htn " )
    for (final entry in _aliases.entries) {
      if (lower.contains(entry.key) || entry.key.contains(lower)) {
        terms.addAll(entry.value);
      }
    }
    return terms.toList();
  }

  List<Icd10Code> _matchLocal(String term) {
    final t = term.toLowerCase();
    return _localCatalog.where((c) {
      return c.code.toLowerCase() == t ||
          c.code.toLowerCase().contains(t) ||
          c.shortDescription.toLowerCase().contains(t) ||
          (c.longDescription?.toLowerCase().contains(t) ?? false);
    }).toList();
  }

  Future<List<Icd10Code>> _searchNlm(String terms, {int maxResults = 20}) async {
    final uri = Uri.parse(_nlmBase).replace(queryParameters: {
      'sf': 'code,name',
      'terms': terms,
      'maxList': '$maxResults',
    });
    final response = await http.get(uri).timeout(const Duration(seconds: 12));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('NIH ICD-10 HTTP ${response.statusCode}');
    }
    final decoded = jsonDecode(response.body);
    if (decoded is! List || decoded.length < 4) return const [];
    final rows = decoded[3];
    if (rows is! List) return const [];
    return rows
        .whereType<List>()
        .where((row) => row.length >= 2)
        .map(
          (row) => Icd10Code(
            code: '${row[0]}',
            shortDescription: '${row[1]}',
            longDescription: '${row[1]}',
          ),
        )
        .toList();
  }
}
