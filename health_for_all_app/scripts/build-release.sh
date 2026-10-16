#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
VERSION="$(grep '^version:' pubspec.yaml | awk '{print $2}')"
NAME="health-for-all-${VERSION%%+*}-release"
mkdir -p releases

echo "==> flutter clean / pub get / test / analyze"
flutter clean
flutter pub get
flutter test
flutter analyze --no-fatal-infos

echo "==> Android AAB"
flutter build appbundle --release \
  --dart-define=API_BASE_URL=https://api.mywaitime.com/api/ \
  --dart-define=LAB_BASE_URL=https://api.mywaitime.com/lab/ \
  --dart-define=HEALTH_FAIR_BASE_URL=https://api.mywaitime.com/health-fair/

AAB="build/app/outputs/bundle/release/app-release.aab"
jarsigner -verify "$AAB" >/dev/null
SIGNER="$(jarsigner -verify -verbose -certs "$AAB" 2>/dev/null | grep -m1 'CN=' || true)"
if echo "$SIGNER" | grep -qi 'Android Debug'; then
  echo "ERROR: AAB is debug-signed"; exit 1
fi
cp -f "$AAB" "releases/${NAME}.aab"
echo "AAB OK → releases/${NAME}.aab ($SIGNER)"

echo "==> macOS (desktop OS)"
flutter build macos --release \
  --dart-define=API_BASE_URL=https://api.mywaitime.com/api/ \
  --dart-define=LAB_BASE_URL=https://api.mywaitime.com/lab/ \
  --dart-define=HEALTH_FAIR_BASE_URL=https://api.mywaitime.com/health-fair/ || {
  echo "WARN: macOS build skipped/failed"
}

echo "==> Web deploy"
chmod +x website/deploy-web.sh
./website/deploy-web.sh

echo "Done. Version $VERSION"
ls -la releases/
