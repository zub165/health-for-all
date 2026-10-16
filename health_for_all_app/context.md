# Health For All Mobile App (Flutter)

This folder contains the unified Flutter application targeting both Android and iOS platforms (`health_for_all_app`).  
The mobile app mirrors the existing web experience while prioritizing mobile-friendly navigation, hybrid storage, and offline resilience.

## Project Structure & Setup

- Project generated with `flutter create --platforms=android,ios health_for_all_app`.  
- Shared Dart code lives under `lib/`; platform specifics reside in `android/` and `ios/`.  
- Update this document as screens, services, and integrations are completed.

## Application Workflow

1. **Authentication & Landing**
   - Optional login for staff/volunteers (future scope).
   - Quick entry into dashboard for field volunteers.

2. **Main Navigation (planned tabs)**
   - `Dashboard`: hybrid patient overview, KPIs, offline cache status.
   - `Patients`: register, edit, and review patient details; sync with Django + Health Fair APIs.
   - `Volunteers`: dedicated volunteer worker registration (not tied to patients), roster list.
   - `Assessments`: vitals capture, AI risk score, health recommendations.
   - `Lab & ICD-10`: access lab order status and ICD-10 lookup (future iterations).

3. **Hybrid Data Strategy**
   - Use local storage (Hive/shared_preferences) for offline mode.
   - Sync with backend services via existing REST endpoints (`api.mywaitime.com`, `health-fair` APIs).
   - Handle cache merging, conflict resolution, and error reporting.

4. **Key Flows**
   - **Patient Registration**: multi-step form, volunteer support details, consent capture.
   - **Volunteer Registration**: standalone form + roster management.
   - **Health Assessments**: vitals entry, AI scoring, printable/shareable recommendations.
   - **Dashboard Insights**: aggregated metrics, filters, refresh controls.

5. **Offline/Online Handling**
   - Detect connectivity; queue submissions when offline.
   - Provide manual sync controls and status indicators.

6. **Security & Compliance**
   - Ensure sensitive data uses secure storage.
   - Enforce HTTPS endpoints (per existing backend rules).

7. **Deployment Targets**
   - Android: Google Play (APK/AAB).
   - iOS: App Store (IPA via Xcode archives).

Use this document as the living blueprint—update it as tabs/features ship, API integrations change, or deployment steps evolve.

