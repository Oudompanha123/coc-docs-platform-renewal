#!/bin/bash
# Prepare the realm, then start Keycloak.
#
# WHY THIS IS A FILE AND NOT A `command:` IN docker-compose.yml
#
# It was inline, and it crashed the container on every start:
#
#   ${env.GOOGLE_CLIENT_SECRET}: bad substitution
#
# The realm file carries the literal text ${env.GOOGLE_CLIENT_SECRET} as a
# placeholder. Getting that literal through YAML, then through Compose's own
# $$-escaping, and then past bash without bash trying to expand it as a
# variable takes three layers of escaping that all have to be right at once.
# One of them was not, and the failure surfaced as an unhealthy container with
# no obvious connection to a quoting mistake.
#
# In a file there is one layer: bash. \${...} is escaped once, visibly, here.
set -euo pipefail

: "${GOOGLE_CLIENT_SECRET:?GOOGLE_CLIENT_SECRET is not set}"
: "${PUBLIC_DOMAIN:?PUBLIC_DOMAIN is not set}"

SRC=/opt/keycloak/realm-src/docs_platform-realm.json
DEST_DIR=/opt/keycloak/data/import
DEST="${DEST_DIR}/docs_platform-realm.json"

mkdir -p "${DEST_DIR}"

# Two substitutions Keycloak will not do for itself:
#
#   1. ${env.GOOGLE_CLIENT_SECRET}. Keycloak does NOT resolve that on import —
#      verified on 2026-09-15 by importing a realm with the placeholder in a
#      non-secret field and reading it back: the literal string is what gets
#      stored. Google then rejects every sign-in with invalid_client.
#
#   2. http://localhost:3000, which the committed realm uses for its redirect
#      URIs and web origins. Right on a developer machine, wrong here —
#      Keycloak would refuse the redirect back to the real site.
#
# The \$ is escaped so bash leaves the placeholder alone and sed sees it whole.
sed -e "s|\${env.GOOGLE_CLIENT_SECRET}|${GOOGLE_CLIENT_SECRET}|g" \
    -e "s|http://localhost:3000|https://${PUBLIC_DOMAIN}|g" \
    "${SRC}" > "${DEST}"

if grep -q 'env.GOOGLE_CLIENT_SECRET' "${DEST}"; then
    echo "FATAL: the Google client secret was not substituted into the realm." >&2
    echo "Keycloak would import the placeholder and Google would reject every sign-in." >&2
    exit 1
fi

# Says which Keycloak the realm was exported from, beside the one importing it.
# A mismatch fails as "Unrecognized field <something>" naming a setting nobody
# chose — true, and no help at all in working out that the versions differ.
# This makes the next one obvious from the log.
REALM_VERSION="$(grep -o '"keycloakVersion"[^,]*' "${SRC}" | head -1 | cut -d'"' -f4)"

echo "realm prepared for https://${PUBLIC_DOMAIN} (exported from Keycloak ${REALM_VERSION:-unknown})"

# --import-realm only imports a realm that does not already exist, so this is
# safe to re-run. To take the file's version again, delete the realm in the
# admin console first.
exec /opt/keycloak/bin/kc.sh start --import-realm
