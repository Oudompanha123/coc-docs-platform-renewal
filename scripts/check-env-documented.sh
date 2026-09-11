#!/usr/bin/env bash
# Every environment variable the backend config reads must appear in
# backend/env.example.
#
# WHY THIS EXISTS
# On 2026-09-11 backend/env.example documented five variables, all of them
# NEXT_PUBLIC_* — the frontend's, duplicated from frontend/.env.example — and
# none of the backend's eleven. A new developer had no way to learn that
# DB_URL or DB_PASSWORD existed except by reading a stack trace.
#
# The file is also untracked, so nobody noticed.
#
# This reads variable NAMES out of the yml. It never reads values, so it is
# safe to run under the SEC-001 / SEC-003 rule that forbids opening those
# files for their content.
#
#   // req: CONST-TECH-08

set -uo pipefail

CONFIG_GLOB="backend/src/main/resources/application*.yml"
TEMPLATE="backend/env.example"

[ -f "$TEMPLATE" ] || { echo "missing ${TEMPLATE}"; exit 1; }

# Strip comment lines first: application-dev.yml explains the ${VAR:default}
# syntax in a comment, and a checker that reads its own documentation as a
# requirement is a checker nobody trusts.
REFERENCED="$(
  cat $CONFIG_GLOB 2>/dev/null \
    | sed 's/#.*$//' \
    | grep -oE '\$\{[A-Z_][A-Z0-9_]*' \
    | tr -d '${' \
    | sort -u
)"

DOCUMENTED="$(grep -oE '^[A-Z_][A-Z0-9_]*' "$TEMPLATE" | sort -u)"

MISSING="$(comm -23 <(printf '%s\n' "$REFERENCED") <(printf '%s\n' "$DOCUMENTED"))"
EXTRA="$(comm -13 <(printf '%s\n' "$REFERENCED") <(printf '%s\n' "$DOCUMENTED"))"

rc=0

if [ -n "$MISSING" ]; then
  echo "Read by the config but absent from ${TEMPLATE}:"
  printf '  %s\n' $MISSING
  echo
  echo "Add each one, with a comment saying what it is for and a safe local default."
  rc=1
fi

if [ -n "$EXTRA" ]; then
  # A warning, not a failure. A variable can legitimately be documented ahead
  # of the config that will read it — which is exactly the state SESSION_TTL,
  # KEYCLOAK_ISSUER_URI and KEYCLOAK_AUDIENCE are in right now.
  echo "Documented in ${TEMPLATE} but not yet read by the config:"
  printf '  %s\n' $EXTRA
  echo
  echo "Fine if the yml change is still pending. Stale otherwise."
  echo
fi

if [ "$rc" -eq 0 ]; then
  echo "Every variable the config reads is documented ($(printf '%s\n' "$REFERENCED" | grep -c .) of them)."
fi
exit $rc
