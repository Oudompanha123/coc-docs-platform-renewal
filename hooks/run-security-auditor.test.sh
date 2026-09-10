#!/usr/bin/env bash
# Negative test for the L2 security auditor.
#
# A gate that only ever passes is indistinguishable from a gate that does
# nothing, and the difference is invisible until the day it matters. This
# builds a throwaway repository containing exactly one violation per check
# and asserts that each one is caught.
#
# Run it whenever a check is added or a pattern is changed:
#   bash hooks/run-security-auditor.test.sh
#
#   // req: NFR-SEC-SANITIZE, FR-AUTH-002, TM-003, TM-010

set -uo pipefail

AUDITOR="$(cd "$(dirname "$0")" && pwd)/run-security-auditor.sh"
[ -f "$AUDITOR" ] || { echo "auditor not found at $AUDITOR"; exit 1; }

T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
cd "$T" || exit 1

git init -q .
git config user.email test@local
git config user.name test

mkdir -p db/migration frontend/lib/content backend/src scripts

# 1. a credential store, which FR-AUTH-002 says cannot exist
# 6. a destructive statement, which NFR-OPS-AUDIT says a human must see
printf 'alter table account add column password_hash text not null;\ndrop table audit_log;\n' \
  > db/migration/V9__violation.sql

# 2. a raw-HTML block type (ADR-010 §3)  4. unescaped markup (NFR-SEC-SANITIZE)
printf "export type BlockType = 'heading' | 'raw_html';\nexport function r(b){return <div dangerouslySetInnerHTML={{__html:b.h}} />}\n" \
  > frontend/lib/content/blocks.ts

# 3. a role taken from a token claim (TM-003, 9.8)
printf 'String role = jwt.getClaim("realm_access");\n' > backend/src/AuthFilter.java

# 5. a bypass of the L1 secret scan
printf 'git commit -m "wip" --no-verify\n' > scripts/deploy.sh

git add -A >/dev/null 2>&1
git commit -qm "planted violations"

OUT="$T/report.md"
RAW="$(HARNESS_AI_AUDIT_OUTPUT="$OUT" HARNESS_PR_BASE_REF=__no_such_ref__ \
       bash "$AUDITOR" 2>&1)"
CODE=$?          # the auditor's status — taking it after a pipe would read sed's
# Colour codes wrap each line at its ends; the substrings matched below sit
# between them, so there is nothing to strip and no escape to get wrong.
RESULT="$RAW"

expect() {
  if printf '%s' "$RESULT" | grep -qF "$1"; then
    printf '  ok    caught: %s\n' "$2"
  else
    printf '  MISS  not caught: %s\n' "$2"
    MISSED=$((MISSED+1))
  fi
}

MISSED=0
echo "Auditor negative test"
echo
expect "V9__violation.sql introduces a password-like column" "password column (FR-AUTH-002)"
expect "blocks.ts appears to add a raw-HTML block type"      "raw-HTML block type (ADR-010 §3)"
expect "AuthFilter.java reads a role from a token claim"     "role from token claim (TM-003)"
expect "blocks.ts uses dangerouslySetInnerHTML"              "unescaped markup (NFR-SEC-SANITIZE)"
expect "deploy.sh contains --no-verify"                      "L1 bypass"
expect "V9__violation.sql contains a destructive DDL"        "destructive DDL (warning)"

echo
if [ "$MISSED" -gt 0 ]; then
  echo "FAILED — ${MISSED} check(s) did not fire on a planted violation."
  echo
  printf '%s\n' "$RESULT"
  exit 1
fi
if [ "$CODE" -eq 0 ]; then
  echo "FAILED — the auditor exited 0 with violations present."
  exit 1
fi
echo "PASSED — all 6 checks fired, auditor exited non-zero."
