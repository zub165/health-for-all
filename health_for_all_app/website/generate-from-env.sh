#!/usr/bin/env bash
# Generate paypal-config.js + android/key.properties from ../.env
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${1:-$ROOT/.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy .env.example to .env and fill credentials."
  exit 1
fi

python3 - "$ENV_FILE" "$ROOT" <<'PY'
import json, pathlib, re, sys

env_path = pathlib.Path(sys.argv[1])
root = pathlib.Path(sys.argv[2])
env = {}
for raw in env_path.read_text().splitlines():
    line = raw.strip()
    if not line or line.startswith("#"):
        continue
    if "=" not in line:
        continue
    key, val = line.split("=", 1)
    env[key.strip()] = val.strip().strip('"').strip("'")

def g(key, default=""):
    return env.get(key, default)

codes = [c.strip() for c in g("UNLOCK_CODES").split(",") if c.strip()]
email = g("ADMIN_EMAIL")
admins = []
for i in range(1, 6):
    pw = g(f"ADMIN_PASSWORD_{i}")
    if email and pw:
        admins.append({"email": email, "password": pw})

cfg = {
    "paypalMeUrl": g("PAYPAL_ME_URL", "https://paypal.me/innovatorgeneration/4.99"),
    "amount": g("PAYPAL_AMOUNT", "4.99"),
    "priceLabel": g("PAYPAL_PRICE_LABEL", "$4.99"),
    "unlockCodes": codes,
    "admins": admins,
    "storageKey": g("WEB_STORAGE_KEY", "healthforall_web_paid_v1"),
    "appPath": g("WEB_APP_PATH", "/health-for-all/app/"),
    "contactEmail": g("CONTACT_EMAIL", "zub165@yahoo.com"),
    "appName": g("APP_NAME", "Health For All"),
}

out_js = root / "website" / "paypal-config.js"
out_js.write_text(
    "/* Generated from .env — run: website/generate-from-env.sh */\n"
    "window.HFA_PAYPAL = "
    + json.dumps(cfg, indent=2)
    + ";\n"
)

key_props = root / "android" / "key.properties"
key_props.parent.mkdir(parents=True, exist_ok=True)
key_props.write_text(
    f"storePassword={g('ANDROID_KEYSTORE_PASSWORD')}\n"
    f"keyPassword={g('ANDROID_KEY_PASSWORD')}\n"
    f"keyAlias={g('ANDROID_KEY_ALIAS', 'upload')}\n"
    f"storeFile={g('ANDROID_STORE_FILE', 'upload-keystore.jks')}\n"
)

print(f"Wrote {out_js}")
print(f"Wrote {key_props}")
print(f"Unlock codes ({len(codes)}): {', '.join(codes)}")
print(f"Admin passwords: {len(admins)}")
PY
