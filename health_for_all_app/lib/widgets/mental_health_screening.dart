import 'package:flutter/material.dart';

/// Same instruments as React `EnhancedMentalHealthScreening`:
/// PHQ-2 → (if ≥3) PHQ-9; GAD-2 → (if ≥3) GAD-7.
class MentalHealthScreeningResult {
  const MentalHealthScreeningResult({
    required this.phq2,
    required this.gad2,
    required this.phq2Score,
    required this.gad2Score,
    required this.needsPhq9,
    required this.needsGad7,
    this.phq9,
    this.phq9Score,
    this.gad7,
    this.gad7Score,
    this.functionalImpairment,
    this.followUpPlan,
  });

  final List<int> phq2;
  final List<int> gad2;
  final int phq2Score;
  final int gad2Score;
  final bool needsPhq9;
  final bool needsGad7;
  final List<int>? phq9;
  final int? phq9Score;
  final List<int>? gad7;
  final int? gad7Score;
  final int? functionalImpairment;
  final String? followUpPlan;

  /// Primary depression score used in risk (PHQ-9 if completed, else PHQ-2).
  int get primaryDepressionScore => phq9Score ?? phq2Score;
}

class MentalHealthScreeningForm extends StatefulWidget {
  const MentalHealthScreeningForm({
    super.key,
    this.onChanged,
  });

  final ValueChanged<MentalHealthScreeningResult>? onChanged;

  @override
  State<MentalHealthScreeningForm> createState() =>
      MentalHealthScreeningFormState();
}

class MentalHealthScreeningFormState extends State<MentalHealthScreeningForm> {
  static const _phq2Questions = [
    'Little interest or pleasure in doing things?',
    'Feeling down, depressed, or hopeless?',
  ];

  static const _gad2Questions = [
    'Feeling nervous, anxious, or on edge?',
    'Not being able to stop or control worrying?',
  ];

  static const _phq9Questions = [
    'Little interest or pleasure in doing things?',
    'Feeling down, depressed, or hopeless?',
    'Trouble falling or staying asleep, or sleeping too much?',
    'Feeling tired or having little energy?',
    'Poor appetite or overeating?',
    'Feeling bad about yourself — or that you are a failure or have let yourself or your family down?',
    'Trouble concentrating on things, such as reading the newspaper or watching television?',
    'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual?',
    'Thoughts that you would be better off dead, or of hurting yourself in some way?',
  ];

  static const _gad7Questions = [
    'Feeling nervous, anxious, or on edge?',
    'Not being able to stop or control worrying?',
    'Worrying too much about different things?',
    'Trouble relaxing?',
    'Being so restless that it is hard to sit still?',
    'Becoming easily annoyed or irritable?',
    'Feeling afraid, as if something awful might happen?',
  ];

  static const _responseOptions = [
    (0, 'Not at all'),
    (1, 'Several days'),
    (2, 'More than half the days'),
    (3, 'Nearly every day'),
  ];

  static const _impairmentOptions = [
    (0, 'Not difficult at all'),
    (1, 'Somewhat difficult'),
    (2, 'Very difficult'),
    (3, 'Extremely difficult'),
  ];

  final List<int?> _phq2 = [null, null];
  final List<int?> _gad2 = [null, null];
  final List<int?> _phq9 = List<int?>.filled(9, null);
  final List<int?> _gad7 = List<int?>.filled(7, null);
  int? _functionalImpairment;
  final _followUpController = TextEditingController();
  int _step = 0; // 0 = PHQ-2/GAD-2, 1 = full if needed

  @override
  void dispose() {
    _followUpController.dispose();
    super.dispose();
  }

  int get _phq2Score =>
      _phq2.whereType<int>().fold(0, (a, b) => a + b);
  int get _gad2Score =>
      _gad2.whereType<int>().fold(0, (a, b) => a + b);
  int get _phq9Score =>
      _phq9.whereType<int>().fold(0, (a, b) => a + b);
  int get _gad7Score =>
      _gad7.whereType<int>().fold(0, (a, b) => a + b);

  bool get _needsPhq9 => _phq2Score >= 3 && _phq2.every((e) => e != null);
  bool get _needsGad7 => _gad2Score >= 3 && _gad2.every((e) => e != null);

  bool get _part1Complete =>
      _phq2.every((e) => e != null) && _gad2.every((e) => e != null);

  MentalHealthScreeningResult get result => MentalHealthScreeningResult(
        phq2: _phq2.map((e) => e ?? 0).toList(),
        gad2: _gad2.map((e) => e ?? 0).toList(),
        phq2Score: _phq2Score,
        gad2Score: _gad2Score,
        needsPhq9: _needsPhq9,
        needsGad7: _needsGad7,
        phq9: _needsPhq9 ? _phq9.map((e) => e ?? 0).toList() : null,
        phq9Score: _needsPhq9 ? _phq9Score : null,
        gad7: _needsGad7 ? _gad7.map((e) => e ?? 0).toList() : null,
        gad7Score: _needsGad7 ? _gad7Score : null,
        functionalImpairment: _needsPhq9 ? _functionalImpairment : null,
        followUpPlan: _followUpController.text.trim().isEmpty
            ? null
            : _followUpController.text.trim(),
      );

  void _notify() {
    widget.onChanged?.call(result);
    setState(() {});
  }

  void reset() {
    for (var i = 0; i < _phq2.length; i++) {
      _phq2[i] = null;
    }
    for (var i = 0; i < _gad2.length; i++) {
      _gad2[i] = null;
    }
    for (var i = 0; i < _phq9.length; i++) {
      _phq9[i] = null;
    }
    for (var i = 0; i < _gad7.length; i++) {
      _gad7[i] = null;
    }
    _functionalImpairment = null;
    _followUpController.clear();
    _step = 0;
    _notify();
  }

  String _phq9Severity(int score) {
    if (score <= 4) return 'Minimal depression';
    if (score <= 9) return 'Mild depression';
    if (score <= 14) return 'Moderate depression';
    if (score <= 19) return 'Moderately severe depression';
    return 'Severe depression';
  }

  String _gad7Severity(int score) {
    if (score <= 4) return 'Minimal anxiety';
    if (score <= 9) return 'Mild anxiety';
    if (score <= 14) return 'Moderate anxiety';
    return 'Severe anxiety';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Mental Health Screening', style: theme.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              'Answer each question (same as web). Scores are calculated automatically — '
              'you do not type the score.',
              style: theme.textTheme.bodyMedium,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                Chip(label: Text('PHQ-2: $_phq2Score / 6')),
                Chip(label: Text('GAD-2: $_gad2Score / 6')),
                if (_needsPhq9)
                  Chip(
                    label: Text('PHQ-9: $_phq9Score / 27'),
                    backgroundColor: Colors.orange.shade50,
                  ),
                if (_needsGad7)
                  Chip(
                    label: Text('GAD-7: $_gad7Score / 21'),
                    backgroundColor: Colors.orange.shade50,
                  ),
              ],
            ),
            const SizedBox(height: 16),
            if (_step == 0) ...[
              Text(
                'Part 1 — Over the last 2 weeks, how often have you been bothered by…',
                style: theme.textTheme.titleMedium,
              ),
              const SizedBox(height: 12),
              Text('PHQ-2 (Depression screen)', style: theme.textTheme.titleSmall),
              const SizedBox(height: 8),
              ...List.generate(
                _phq2Questions.length,
                (i) => _questionBlock(
                  context,
                  number: i + 1,
                  question: _phq2Questions[i],
                  value: _phq2[i],
                  onChanged: (v) {
                    _phq2[i] = v;
                    _notify();
                  },
                ),
              ),
              const Divider(height: 32),
              Text('GAD-2 (Anxiety screen)', style: theme.textTheme.titleSmall),
              const SizedBox(height: 8),
              ...List.generate(
                _gad2Questions.length,
                (i) => _questionBlock(
                  context,
                  number: i + 1,
                  question: _gad2Questions[i],
                  value: _gad2[i],
                  onChanged: (v) {
                    _gad2[i] = v;
                    _notify();
                  },
                ),
              ),
              if (_part1Complete) ...[
                const SizedBox(height: 12),
                AlertBanner(
                  needsFull: _needsPhq9 || _needsGad7,
                  message: _needsPhq9 || _needsGad7
                      ? 'Screen positive — continue to full PHQ-9 / GAD-7 questions.'
                      : 'Screen negative — no full PHQ-9/GAD-7 required. You can still save.',
                ),
                const SizedBox(height: 12),
                if (_needsPhq9 || _needsGad7)
                  FilledButton.tonalIcon(
                    onPressed: () => setState(() => _step = 1),
                    icon: const Icon(Icons.arrow_forward),
                    label: const Text('Continue to full assessment'),
                  ),
              ],
            ] else ...[
              if (_needsPhq9) ...[
                Text(
                  'PHQ-9 — Full depression assessment',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Severity: ${_phq9Severity(_phq9Score)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                ...List.generate(
                  _phq9Questions.length,
                  (i) => _questionBlock(
                    context,
                    number: i + 1,
                    question: _phq9Questions[i],
                    value: _phq9[i],
                    onChanged: (v) {
                      _phq9[i] = v;
                      _notify();
                    },
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'If you checked any problems, how difficult have these problems made it for you '
                  'to do your work, take care of things at home, or get along with other people?',
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 8),
                ..._impairmentOptions.map(
                  (opt) => RadioListTile<int>(
                    dense: true,
                    title: Text(opt.$2),
                    value: opt.$1,
                    groupValue: _functionalImpairment,
                    onChanged: (v) {
                      _functionalImpairment = v;
                      _notify();
                    },
                  ),
                ),
                const Divider(height: 32),
              ],
              if (_needsGad7) ...[
                Text(
                  'GAD-7 — Full anxiety assessment',
                  style: theme.textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  'Severity: ${_gad7Severity(_gad7Score)}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                ...List.generate(
                  _gad7Questions.length,
                  (i) => _questionBlock(
                    context,
                    number: i + 1,
                    question: _gad7Questions[i],
                    value: _gad7[i],
                    onChanged: (v) {
                      _gad7[i] = v;
                      _notify();
                    },
                  ),
                ),
              ],
              const SizedBox(height: 12),
              TextField(
                controller: _followUpController,
                onChanged: (_) => _notify(),
                decoration: const InputDecoration(
                  labelText: 'Follow-up plan (optional)',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => setState(() => _step = 0),
                icon: const Icon(Icons.arrow_back),
                label: const Text('Back to PHQ-2 / GAD-2'),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _questionBlock(
    BuildContext context, {
    required int number,
    required String question,
    required int? value,
    required ValueChanged<int> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$number. $question',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 4),
          ..._responseOptions.map(
            (opt) => RadioListTile<int>(
              dense: true,
              contentPadding: EdgeInsets.zero,
              title: Text('${opt.$2} (${opt.$1})'),
              value: opt.$1,
              groupValue: value,
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ],
      ),
    );
  }
}

class AlertBanner extends StatelessWidget {
  const AlertBanner({super.key, required this.needsFull, required this.message});

  final bool needsFull;
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: needsFull ? Colors.orange.shade50 : Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: needsFull ? Colors.orange.shade200 : Colors.green.shade200,
        ),
      ),
      child: Row(
        children: [
          Icon(
            needsFull ? Icons.warning_amber : Icons.check_circle_outline,
            color: needsFull ? Colors.orange.shade800 : Colors.green.shade800,
          ),
          const SizedBox(width: 8),
          Expanded(child: Text(message)),
        ],
      ),
    );
  }
}
