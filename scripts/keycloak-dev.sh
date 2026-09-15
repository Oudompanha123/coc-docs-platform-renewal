#!/usr/bin/env bash
#
# Start Keycloak for local development with this project's realm already in it.
#
# WHY THIS EXISTS
#
# `kc start-dev` runs on a local H2 file, so every developer's Keycloak is a
# separate installation with its own realm, clients and identity provider.
# Before this script each person reproduced that configuration by hand, and on
# 2026-09-15 that produced:
#
#   Unexpected response from token endpoint https://oauth2.googleapis.com/token
#   status=401 "error": "invalid_client"
#   "error_description": "The provided client secret is invalid."
#
# a Google client secret mistyped into one machine's admin console, with
# nothing to compare it against. Configuration that only exists on whoever's
# machine happens to work is the same failure this project already had with
# database schemas.
#
# WHAT IS AND IS NOT IN THE REALM FILE
#
# In:  the realm, the cocdocs-frontend public client, the Google identity
#      provider, and the declarative user profile that stops Keycloak
#      demanding a first and last name from a Google sign-in.
# Out: realm signing keys (each installation generates its own, since sharing
#      them would mean every developer could mint tokens the others accept),
#      and the Google client secret, read from the environment at import.
#
# Usage:
#   GOOGLE_CLIENT_SECRET=... scripts/keycloak-dev.sh
#   scripts/keycloak-dev.sh --port 8180
#
set -euo pipefail

PORT="8180"
while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:?--port needs a value}"; shift 2 ;;
    -h|--help) sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REALM_FILE="$REPO_ROOT/keycloak/docs_platform-realm.json"

if [ ! -f "$REALM_FILE" ]; then
  echo "Realm file not found: $REALM_FILE" >&2
  exit 1
fi

# Checked before Keycloak starts rather than after. Keycloak substitutes
# ${env.GOOGLE_CLIENT_SECRET} at import and does not complain when the variable
# is missing: it imports an empty secret, and the first Google sign-in fails
# with invalid_client from Google, several minutes and one confusing log later.
if [ -z "${GOOGLE_CLIENT_SECRET:-}" ]; then
  cat >&2 <<'MISSING_SECRET'
GOOGLE_CLIENT_SECRET is not set.

It is the Client Secret of the project's Google OAuth client, the pair to the
client ID already in keycloak/docs_platform-realm.json. Get it from Google
Cloud Console -> APIs & Services -> Credentials. It is deliberately not in the
repository, and Keycloak will not give it back either: it masks stored secrets
everywhere.

  export GOOGLE_CLIENT_SECRET='...'      # bash
  $env:GOOGLE_CLIENT_SECRET = '...'      # PowerShell

Then run this again. Without it Keycloak starts, Google sign-in reaches Google,
and Google answers "The provided client secret is invalid".
MISSING_SECRET
  exit 1
fi

if command -v kc.sh >/dev/null 2>&1; then
  KC="kc.sh"
elif command -v kc.bat >/dev/null 2>&1; then
  KC="kc.bat"
else
  echo "Keycloak (kc.sh / kc.bat) is not on PATH. Install Keycloak 26+ and add its bin/ to PATH." >&2
  exit 1
fi

# --import-realm reads realm files from KEYCLOAK_HOME/data/import and nowhere
# else. It has no --dir: that option belongs to the separate `kc import`
# command, and start-dev rejects it outright with
#
#   Disabled option: '--dir'
#
# So the realm is copied to where Keycloak actually looks. The file in the
# repository stays the single source, and nobody ends up editing a copy.
KC_BIN="$(command -v "$KC")"
KC_HOME="$(cd "$(dirname "$KC_BIN")/.." && pwd)"
IMPORT_DIR="$KC_HOME/data/import"

mkdir -p "$IMPORT_DIR"
cp "$REALM_FILE" "$IMPORT_DIR/docs_platform-realm.json"

cat <<BANNER
Starting Keycloak on http://localhost:$PORT
  realm file : $REALM_FILE
  copied to  : $IMPORT_DIR
  admin      : admin / admin  (dev mode only, never a deployed setting)

--import-realm imports only a realm that does not already exist. An existing
docs_platform is left exactly as it is, so this is safe to re-run; to take the
file's version instead, delete the realm in the admin console first.
BANNER

exec "$KC" start-dev \
  --http-port="$PORT" \
  --import-realm \
  --bootstrap-admin-username=admin \
  --bootstrap-admin-password=admin
