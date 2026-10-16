import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/patient.dart';
import '../services/hybrid_data_service.dart';
import '../services/icd10_service.dart';
import '../services/icd_lab_recommend_service.dart';
import '../theme/app_theme.dart';

/// Modern SOAP clinical note — Flutter counterpart to React ModernDoctorNote.
class ClinicalNoteScreen extends StatefulWidget {
  const ClinicalNoteScreen({super.key, this.initialPatientId});

  final String? initialPatientId;

  @override
  State<ClinicalNoteScreen> createState() => _ClinicalNoteScreenState();
}

class _ClinicalNoteScreenState extends State<ClinicalNoteScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<Patient> _patients = const [];
  Patient? _patient;
  bool _loading = true;
  String? _error;

  final _subjective = TextEditingController();
  final _objective = TextEditingController();
  final _assessment = TextEditingController();
  final _plan = TextEditingController();
  final _icdQuery = TextEditingController();
  final _rx = TextEditingController();

  List<Icd10Code> _icdCodes = [];
  List<Icd10Code> _icdHits = const [];
  IcdRecommendResult? _ai;
  bool _aiLoading = false;
  bool _saving = false;

  static const _common = [
    Icd10Code(code: 'I10', shortDescription: 'Essential hypertension'),
    Icd10Code(code: 'E11.9', shortDescription: 'Type 2 diabetes mellitus'),
    Icd10Code(code: 'E78.5', shortDescription: 'Hyperlipidemia'),
    Icd10Code(code: 'I50.9', shortDescription: 'Heart failure'),
    Icd10Code(code: 'J44.9', shortDescription: 'COPD'),
    Icd10Code(code: 'Z00.00', shortDescription: 'General adult exam'),
  ];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    _tabs.addListener(() {
      if (!_tabs.indexIsChanging && _tabs.index == 3) {
        _refreshAi();
      }
    });
    _bootstrap();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _subjective.dispose();
    _objective.dispose();
    _assessment.dispose();
    _plan.dispose();
    _icdQuery.dispose();
    _rx.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final patients = await HybridDataService.instance.fetchPatients();
      if (!mounted) return;
      Patient? selected;
      if (widget.initialPatientId != null) {
        for (final p in patients) {
          if (p.id == widget.initialPatientId) {
            selected = p;
            break;
          }
        }
      }
      selected ??= patients.isNotEmpty ? patients.first : null;
      setState(() {
        _patients = patients;
        _patient = selected;
        _loading = false;
      });
      await _loadDraft();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '$e';
        _loading = false;
      });
    }
  }

  String get _draftKey => 'hfa_soap_${_patient?.id ?? 'none'}';

  Future<void> _loadDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_draftKey);
    if (raw == null || !mounted) return;
    // Simple line-delimited draft: S|O|A|P|ICD codes comma|Rx
    final parts = raw.split('\u001e');
    if (parts.length < 4) return;
    setState(() {
      _subjective.text = parts[0];
      _objective.text = parts[1];
      _assessment.text = parts[2];
      _plan.text = parts[3];
      if (parts.length > 4 && parts[4].isNotEmpty) {
        _icdCodes = parts[4].split(',').where((c) => c.isNotEmpty).map((c) {
          Icd10Code? hit;
          for (final x in _common) {
            if (x.code == c) {
              hit = x;
              break;
            }
          }
          return hit ?? Icd10Code(code: c, shortDescription: c);
        }).toList();
      }
      if (parts.length > 5) _rx.text = parts[5];
    });
    await _refreshAi();
  }

  Future<void> _persistDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final payload = [
      _subjective.text,
      _objective.text,
      _assessment.text,
      _plan.text,
      _icdCodes.map((c) => c.code).join(','),
      _rx.text,
    ].join('\u001e');
    await prefs.setString(_draftKey, payload);
  }

  Future<void> _searchIcd(String q) async {
    if (q.trim().length < 2) {
      setState(() => _icdHits = const []);
      return;
    }
    final hits = await Icd10Service.instance.search(q);
    if (!mounted) return;
    setState(() => _icdHits = hits.take(12).toList());
  }

  void _addIcd(Icd10Code code) {
    if (_icdCodes.any((c) => c.code == code.code)) return;
    setState(() => _icdCodes = [..._icdCodes, code]);
    _refreshAi();
    _persistDraft();
  }

  Future<void> _refreshAi() async {
    if (_icdCodes.isEmpty) {
      setState(() => _ai = null);
      return;
    }
    setState(() => _aiLoading = true);
    final result = await IcdLabRecommendService.instance
        .recommend(_icdCodes.map((c) => c.code).toList());
    if (!mounted) return;
    setState(() {
      _ai = result;
      _aiLoading = false;
    });
  }

  void _appendPlanLine(String line) {
    final next = _plan.text.trim().isEmpty ? line : '${_plan.text.trim()}\n$line';
    setState(() => _plan.text = next);
    _persistDraft();
  }

  Future<void> _saveNote() async {
    if (_patient == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Select a patient first')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await _persistDraft();
      final prefs = await SharedPreferences.getInstance();
      final key = 'hfa_clinical_notes_v1';
      final existing = prefs.getStringList(key) ?? [];
      final stamp = DateTime.now().toIso8601String();
      final note = {
        'patientId': _patient!.id,
        'patientName': _patient!.fullName,
        'at': stamp,
        'icd': _icdCodes.map((c) => c.code).join(','),
        'subjective': _subjective.text,
        'objective': _objective.text,
        'assessment': _assessment.text,
        'plan': _plan.text,
        'rx': _rx.text,
        'aiLabs': _ai?.recommendedLabCodes.join(',') ?? '',
        'aiImaging': _ai?.recommendedImagingCodes.join(',') ?? '',
      }.entries.map((e) => '${e.key}=${e.value}').join('|');
      existing.insert(0, note);
      await prefs.setStringList(key, existing.take(100).toList());
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Clinical note saved for ${_patient!.fullName} (hybrid local)'),
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Column(
        children: [
          LinearProgressIndicator(minHeight: 3),
          Expanded(child: SizedBox.shrink()),
        ],
      );
    }

    return Column(
      children: [
        if (_error != null)
          Material(
            color: Colors.red.shade50,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Text(_error!, style: TextStyle(color: Colors.red.shade800)),
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _patient?.id,
                  decoration: const InputDecoration(
                    labelText: 'Patient',
                    prefixIcon: Icon(Icons.person),
                  ),
                  items: [
                    for (final p in _patients)
                      DropdownMenuItem(
                        value: p.id,
                        child: Text(p.fullName, overflow: TextOverflow.ellipsis),
                      ),
                  ],
                  onChanged: (id) async {
                    Patient? p;
                    for (final x in _patients) {
                      if (x.id == id) {
                        p = x;
                        break;
                      }
                    }
                    setState(() => _patient = p);
                    await _loadDraft();
                  },
                ),
              ),
              const SizedBox(width: 12),
              FilledButton.icon(
                onPressed: _saving ? null : _saveNote,
                icon: _saving
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save),
                label: const Text('Save note'),
              ),
            ],
          ),
        ),
        TabBar(
          controller: _tabs,
          isScrollable: true,
          labelColor: AppTheme.primary,
          tabs: const [
            Tab(text: 'S · Subjective'),
            Tab(text: 'O · Objective'),
            Tab(text: 'A · ICD Assessment'),
            Tab(text: 'P · Rx · Labs · Plan'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _soapField(_subjective, 'Chief complaint, HPI, ROS…'),
              _soapField(_objective, 'Vitals, exam findings, labs on hand…'),
              _assessmentTab(),
              _planTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _soapField(TextEditingController c, String hint) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: TextField(
        controller: c,
        maxLines: null,
        expands: true,
        textAlignVertical: TextAlignVertical.top,
        onChanged: (_) => _persistDraft(),
        decoration: InputDecoration(
          hintText: hint,
          alignLabelWithHint: true,
          border: const OutlineInputBorder(),
        ),
      ),
    );
  }

  Widget _assessmentTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        TextField(
          controller: _icdQuery,
          decoration: const InputDecoration(
            labelText: 'Search ICD-10',
            hintText: 'HTN, diabetes, I10…',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: _searchIcd,
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final c in _common)
              ActionChip(
                label: Text('${c.code} ${c.shortDescription}'),
                onPressed: () => _addIcd(c),
              ),
          ],
        ),
        if (_icdHits.isNotEmpty) ...[
          const SizedBox(height: 12),
          const Text('Search results', style: TextStyle(fontWeight: FontWeight.w700)),
          for (final h in _icdHits)
            ListTile(
              dense: true,
              title: Text(h.display),
              trailing: const Icon(Icons.add_circle_outline),
              onTap: () => _addIcd(h),
            ),
        ],
        const SizedBox(height: 12),
        Wrap(
          spacing: 6,
          children: [
            for (final c in _icdCodes)
              Chip(
                label: Text(c.code),
                onDeleted: () {
                  setState(() => _icdCodes = _icdCodes.where((x) => x.code != c.code).toList());
                  _refreshAi();
                  _persistDraft();
                },
              ),
          ],
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _assessment,
          maxLines: 6,
          onChanged: (_) => _persistDraft(),
          decoration: const InputDecoration(
            labelText: 'Assessment narrative',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }

  Widget _planTab() {
    final ai = _ai;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: const Color(0xFFE8F5F4),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'AI recommendations (ICD-10 → Labs & Radiology)',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0D7377),
                        ),
                      ),
                    ),
                    if (_aiLoading)
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    if (ai != null)
                      Chip(
                        label: Text(ai.source == 'live' ? 'Live API' : 'Offline map'),
                        backgroundColor:
                            ai.source == 'live' ? Colors.green.shade100 : Colors.blue.shade50,
                      ),
                  ],
                ),
                if (_icdCodes.isEmpty) ...[
                  const SizedBox(height: 8),
                  const Text(
                    'No ICD-10 selected. Quick-add a diagnosis to unlock AI orders.',
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final c in _common)
                        ActionChip(
                          avatar: const Icon(Icons.add, size: 16),
                          label: Text(c.code),
                          onPressed: () => _addIcd(c),
                        ),
                    ],
                  ),
                ] else ...[
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 6,
                    children: [
                      for (final c in _icdCodes)
                        Chip(label: Text(c.code), visualDensity: VisualDensity.compact),
                    ],
                  ),
                  if (ai != null) ...[
                    for (final r in ai.matchedRules) ...[
                      const SizedBox(height: 10),
                      Text(r.condition, style: const TextStyle(fontWeight: FontWeight.w700)),
                      Text(r.rationale, style: TextStyle(color: Colors.grey.shade800, fontSize: 13)),
                      const SizedBox(height: 6),
                      const Text('Labs', style: TextStyle(fontWeight: FontWeight.w600)),
                      Wrap(
                        spacing: 6,
                        children: [
                          for (final lab in r.labs)
                            ActionChip(
                              label: Text(lab),
                              onPressed: () => _appendPlanLine('Order lab: $lab'),
                            ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text('Imaging', style: TextStyle(fontWeight: FontWeight.w600)),
                      Wrap(
                        spacing: 6,
                        children: [
                          for (final img in r.imaging)
                            ActionChip(
                              label: Text(img),
                              onPressed: () => _appendPlanLine('Order imaging: $img'),
                            ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 8),
                    Text(ai.disclaimer, style: TextStyle(fontSize: 11, color: Colors.grey.shade700)),
                  ],
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _rx,
          maxLines: 3,
          onChanged: (_) => _persistDraft(),
          decoration: const InputDecoration(
            labelText: 'Medications / Rx',
            hintText: 'e.g. Lisinopril 10 mg daily',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _plan,
          maxLines: 8,
          onChanged: (_) => _persistDraft(),
          decoration: const InputDecoration(
            labelText: 'Treatment plan',
            hintText: 'Follow-up, patient education, ordered labs…',
            border: OutlineInputBorder(),
          ),
        ),
      ],
    );
  }
}
