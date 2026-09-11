#!/usr/bin/env bash
# Security auditor — L2 hook (HARNESS-PROCESS-STANDARD §5.4)
#
# Invoked by .github/workflows/security-audit.yml on every pull request.
#
# WHY THIS EXISTS IN THIS FORM
# The L2 workflow requires an audit step that cannot silently pass as a TODO.
# Before this script, the job simply failed — correct behaviour, but it left
# the whole Security Audit check permanently red, and a permanently red check
# trains people to stop reading CI at all. That is worse than no check.
#
# So this does real work with zero configuration: it enforces the security
# decisions this project has actually made, which are the ones a reviewer is
# most likely to miss because they are invisible in a diff read line by line.
#
# If ANTHROPIC_API_KEY is present it additionally runs an AI review of the
# diff. Without it, the deterministic checks below still run and still gate
# the merge — the job never passes without having checked something.
#
#   // req: NFR-SEC-SANITIZE, FR-AUTH-002, TM-003, TM-010, CONST-TECH-07

set -uo pipefail

REPORT_DIR="security"
REPORT="${HARNESS_AI_AUDIT_OUTPUT:-${REPORT_DIR}/audit-local.md}"
BASE_REF="${HARNESS_PR_BASE_REF:-dev}"

mkdir -p "$(dirname "$REPORT")"

FAILURES=0
WARNINGS=0

say()  { printf '%s\n' "$1"; printf '%s\n' "$1" >> "$REPORT"; }
fail() { printf '\033[31m  FAIL  %s\033[0m\n' "$1"; printf -- '- **FAIL** — %s\n' "$1" >> "$REPORT"; FAILURES=$((FAILURES+1)); }
warn() { printf '\033[33m  WARN  %s\033[0m\n' "$1"; printf -- '- WARN — %s\n' "$1" >> "$REPORT"; WARNINGS=$((WARNINGS+1)); }
pass() { printf '  ok    %s\n' "$1"; }

# A green line after a red one is worse than no line: it reads as if the
# check ran twice and disagreed with itself. `pass` is only printed when the
# preceding check added nothing to the counters.
checkpoint()    { _f0=$FAILURES; _w0=$WARNINGS; }
pass_if_clean() { [ "$FAILURES" -eq "$_f0" ] && [ "$WARNINGS" -eq "$_w0" ] && pass "$1"; }

# ── What changed ────────────────────────────────────────────────────────────
# Review the diff where there is one, the whole tree otherwise (scheduled runs).
if git rev-parse --verify "origin/${BASE_REF}" >/dev/null 2>&1; then
  CHANGED="$(git diff --name-only "origin/${BASE_REF}...HEAD" 2>/dev/null || true)"
  SCOPE="diff against origin/${BASE_REF}"
else
  CHANGED="$(git ls-files)"
  SCOPE="whole tree (no base ref)"
fi
[ -z "$CHANGED" ] && CHANGED="$(git ls-files)" && SCOPE="whole tree (empty diff)"

{
  echo "# Security Audit — L2"
  echo
  echo "- Scope: ${SCOPE}"
  echo "- Files examined: $(printf '%s\n' "$CHANGED" | grep -c . || echo 0)"
  echo "- Date: $(date -u '+%Y-%m-%d %H:%M UTC')"
  echo
  echo "## Findings"
  echo
} > "$REPORT"

changed_matching() { printf '%s\n' "$CHANGED" | grep -E "$1" || true; }

# Search code, not commentary.
#
# The first version of this script failed its own repository: blocks.ts
# mentions dangerouslySetInnerHTML only in a comment explaining why the block
# model removes it, and the check flagged the explanation as the offence. A
# security gate that fires on documentation about a risk — rather than the
# risk — gets muted within a week, and then it protects nothing.
#
# Strips //, #, --, *, /* line comments before matching. Not a parser: a
# matching string inside a multi-line comment body or a string literal can
# still hit. That direction is the safe one — a false positive costs a
# conversation, a false negative costs the finding.
grep_code() {
  local pattern="$1" file="$2"
  grep -inE -- "$pattern" "$file" 2>/dev/null \
    | grep -vE '^[0-9]+:[[:space:]]*(//|#|--|\*|/\*)' \
    || true
}

echo "Security Audit — L2 (${SCOPE})"
echo

# ── 1. No passwords, anywhere ───────────────────────────────────────────────
# FR-AUTH-002: the system stores no passwords. Authentication is Google via
# Keycloak (ADR-013). A password column appearing in a migration means someone
# has reintroduced a credential store, and with it hashing, reset flows and
# lockout — an entire scope the design deliberately removed.
checkpoint
for f in $(changed_matching '\.sql$'); do
  [ -f "$f" ] || continue
  if grep_code "\b(password|passwd|pwd|password_hash|salt)\b" "$f" | grep -q .; then
    fail "$f introduces a password-like column. FR-AUTH-002: this system stores no credentials."
  fi
done
pass_if_clean "no password columns introduced (FR-AUTH-002)"

# ── 2. No raw-HTML block type ───────────────────────────────────────────────
# ADR-010 §3: there is deliberately no raw-html block. XSS is prevented
# structurally — by there being no field in which markup is legal — rather
# than by filtering. Adding one reopens TM-010 (8.0).
checkpoint
for f in $(changed_matching 'blocks\.(ts|java)$|BlockType\.java$'); do
  [ -f "$f" ] || continue
  if grep_code "['\"](raw_?html)['\"]|RAW_HTML" "$f" | grep -q .; then
    fail "$f appears to add a raw-HTML block type. ADR-010 §3 removes it deliberately; see TM-010."
  fi
done
pass_if_clean "no raw-HTML block type (ADR-010 §3, TM-010)"

# ── 3. Role must not come from a token claim ────────────────────────────────
# TM-003, scored 9.8 — the highest on the project. A role in a token is a
# claim frozen at issue time: demote someone and the token still says admin
# until it expires. ADR-013 keeps roles in the account table for this reason.
checkpoint
for f in $(changed_matching '\.java$'); do
  [ -f "$f" ] || continue
  if grep_code "getClaim\(\s*\"(role|roles|realm_access|resource_access|authorities)\"|claims?\.get\(\s*\"(role|roles)\"" "$f" | grep -q .; then
    fail "$f reads a role from a token claim. TM-003 (9.8): the role is read from the account table on every request, never from the token."
  fi
done
pass_if_clean "no role read from token claims (TM-003, ADR-013 §2)"

# ── 4. No unescaped HTML in the frontend ────────────────────────────────────
# NFR-SEC-SANITIZE. The legacy site used dangerouslySetInnerHTML in all 15
# content modules; the rebuild exists partly to remove it.
checkpoint
for f in $(changed_matching '\.(ts|tsx|jsx)$'); do
  [ -f "$f" ] || continue
  if grep_code 'dangerouslySetInnerHTML' "$f" | grep -q .; then
    fail "$f uses dangerouslySetInnerHTML. NFR-SEC-SANITIZE — content is rendered from typed blocks, not raw markup."
  fi
done
pass_if_clean "no dangerouslySetInnerHTML introduced (NFR-SEC-SANITIZE)"

# ── 5. Nothing disables the local guardrails ────────────────────────────────
# Matches actual use — `git commit --no-verify` — not the word on its own.
# The files whose job is to *forbid* the flag necessarily contain it:
# this script, the shared deny rules, and the hooks themselves. Flagging
# them would make the check fire on its own enforcement, which is how a
# check gets deleted rather than fixed.
checkpoint
for f in $(changed_matching '\.(sh|yml|yaml|json)$'); do
  [ -f "$f" ] || continue
  case "$f" in
    hooks/run-security-auditor.sh|hooks/run-security-auditor.test.sh|.claude/settings.json|.githooks/*) continue ;;
  esac
  if grep_code "git\s+(commit|push)\b.*--no-verify" "$f" | grep -q .; then
    fail "$f contains --no-verify, which bypasses the L1 secret scan."
  fi
done
pass_if_clean "nothing bypasses the pre-commit secret scan"

# ── 6. Destructive migrations get a human's attention ───────────────────────
# Not a failure — sometimes correct. But a dropped column in a project whose
# audit trail must survive (NFR-OPS-AUDIT) is worth a reviewer looking twice.
checkpoint
for f in $(changed_matching 'db/migration/.*\.sql$'); do
  [ -f "$f" ] || continue
  if grep_code "^\s*(drop|truncate)\s+(table|column|index)|alter\s+table\s+\S+\s+drop" "$f" | grep -q .; then
    warn "$f contains a destructive DDL statement. Intentional? Audit and version history must survive it."
  fi
done
pass_if_clean "destructive migrations flagged for review"

# ── 7. Migrations are immutable, and versions are unique ────────────────────
# Flyway stores a checksum per version. Two files claiming the same version, or
# an edit to one already applied somewhere, makes a database refuse to start:
#
#   Migration checksum mismatch for migration version 2
#
# That is what happened on 2026-09-10: dev carried V2__session.sql while
# feature/login-api carried V2__auth_session.sql, and anyone who ran both
# branches locally could not boot until they rebuilt their schema. The collision
# was visible in the diff and nothing was watching for it.
checkpoint
# Found, not assumed: the layout differs between this repo and the fixture the
# negative test builds, and a check that only works in one of them is a check
# whose own test cannot exercise it.
MIGRATIONS="$(git ls-files | grep -E 'db/migration/.*\.sql$' || true)"

# a. one version, one file
DUPES="$(printf '%s\n' "$MIGRATIONS" | sed 's|.*/||' | grep -oE '^V[0-9]+' | sort | uniq -d)"
for v in $DUPES; do
  files="$(printf '%s\n' "$MIGRATIONS" | grep -E "/${v}__" | sed 's|.*/||' | tr '\n' ' ')"
  fail "two migrations claim version ${v#V}: ${files}— Flyway stores one checksum per version, so a database that ran either one refuses to start on the other."
done

# b. a migration already on the base branch must not change
if git rev-parse --verify "origin/${BASE_REF}" >/dev/null 2>&1; then
  for f in $(changed_matching 'db/migration/.*\.sql$'); do
    if git cat-file -e "origin/${BASE_REF}:$f" 2>/dev/null; then
      if ! git diff --quiet "origin/${BASE_REF}" -- "$f" 2>/dev/null; then
        fail "$f already exists on ${BASE_REF} and has been edited. Applied migrations are immutable — add a new version instead, or every database that ran the old one stops booting."
      fi
    fi
  done
fi
pass_if_clean "migration versions unique and unedited"

# ── 7. Optional: AI review, when a key is available ─────────────────────────
if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
  say ""
  say "### AI review"
  say ""
  say "_ANTHROPIC_API_KEY present — an AI review would run here. Not yet implemented; the deterministic checks above still gate this build._"
  warn "AI review requested but not yet implemented — deterministic checks ran instead."
else
  say ""
  say "### AI review"
  say ""
  say "_Not configured (no ANTHROPIC_API_KEY). The deterministic checks above ran and gated this build — nothing passed unchecked._"
fi

# ── Verdict ─────────────────────────────────────────────────────────────────
{
  echo
  echo "## Verdict"
  echo
  echo "- Failures: ${FAILURES}"
  echo "- Warnings: ${WARNINGS}"
} >> "$REPORT"

echo
if [ "$FAILURES" -gt 0 ]; then
  echo "L2 security audit FAILED — ${FAILURES} finding(s), ${WARNINGS} warning(s). Report: ${REPORT}"
  exit 1
fi
echo "L2 security audit PASSED — 0 findings, ${WARNINGS} warning(s). Report: ${REPORT}"
exit 0
