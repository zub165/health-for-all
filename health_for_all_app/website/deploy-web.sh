#!/usr/bin/env bash
# Deploy Flutter web + legal/paywall to GitHub Pages:
# https://zub165.github.io/health-for-all/  (repo gh-pages branch)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PAGES_SLUG="health-for-all"
VERSION="$(grep '^version:' "$ROOT/pubspec.yaml" | awk '{print $2}' | cut -d+ -f1)"
WORK="${TMPDIR:-/tmp}/hfa-gh-pages-$$"

cd "$ROOT"
chmod +x website/generate-from-env.sh
./website/generate-from-env.sh
flutter pub get
flutter build web --release --base-href "/${PAGES_SLUG}/app/" \
  --dart-define=API_BASE_URL=https://api.mywaitime.com/api/ \
  --dart-define=LAB_BASE_URL=https://api.mywaitime.com/lab/ \
  --dart-define=HEALTH_FAIR_BASE_URL=https://api.mywaitime.com/health-fair/

rm -rf "$WORK"
mkdir -p "$WORK"
git clone --depth 1 --branch gh-pages "https://github.com/zub165/health-for-all.git" "$WORK/site"
cd "$WORK/site"

cp -f "$ROOT/website/"*.html .
cp -f "$ROOT/website/paypal-config.js" .
cp -f "$ROOT/website/paypal-config.admin2.js" . 2>/dev/null || cp -f "$ROOT/website/paypal-config.js" paypal-config.admin2.js
cp -f "$ROOT/website/app-ads.txt" .
touch .nojekyll
cp -f "$ROOT/assets/icons/icon.png" favicon.png
rm -rf app
mkdir -p app
rsync -a --delete "$ROOT/build/web/" app/

git add -A
git commit -m "Deploy Flutter Health For All web ${VERSION}" || true
git push origin gh-pages

rm -rf "$WORK"
echo "Live: https://zub165.github.io/${PAGES_SLUG}/"
echo "Pay:  https://zub165.github.io/${PAGES_SLUG}/pay.html"
echo "App:  https://zub165.github.io/${PAGES_SLUG}/app/"
