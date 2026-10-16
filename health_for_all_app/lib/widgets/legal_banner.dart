import 'package:flutter/material.dart';

class LegalBanner extends StatelessWidget {
  const LegalBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFFFFF3E0),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.orange.shade800, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                'LEGAL DISCLAIMER: Volunteer health screening for educational purposes only. '
                'Not a substitute for professional medical care.',
                style: TextStyle(
                  color: Colors.orange.shade900,
                  fontSize: 12.5,
                  height: 1.35,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
