/// Canonical GoDaddy / nginx API hosts for Health For All.
///
/// Production: HTTPS via nginx on port 443 → Django on :3015
/// Dev (localhost): HTTP direct to :3015
class ApiConfig {
  ApiConfig._();

  /// Main hospitalfinder API (`/api/...`) — patients, vitals, assessments, doctors.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://api.mywaitime.com/api/',
  );

  /// Lab microservice (`/lab/...`).
  static const String labBaseUrl = String.fromEnvironment(
    'LAB_BASE_URL',
    defaultValue: 'https://api.mywaitime.com/lab/',
  );

  /// Health Fair paths (`/health-fair/...`).
  static const String healthFairBaseUrl = String.fromEnvironment(
    'HEALTH_FAIR_BASE_URL',
    defaultValue: 'https://api.mywaitime.com/health-fair/',
  );

  /// Optional auth token (prefer `--dart-define=API_TOKEN=...` for releases).
  static const String apiToken = String.fromEnvironment(
    'API_TOKEN',
    defaultValue: '',
  );
}
