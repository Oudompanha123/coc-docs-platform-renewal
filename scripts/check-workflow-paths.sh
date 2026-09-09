#!/usr/bin/env bash
# Coc Docs Platform — verify that CI workflows only execute paths that exist.
#
#   bash scripts/check-workflow-paths.sh
#
# WHY THIS EXISTS
# security-audit.yml was installed from the harness template with its build step
# unchanged: `./mvnw -q -DskipTests package`. The Maven wrapper has never been
# committed to this repository. Every pull request failed the L2 security gate
# for a minute of CodeQL time before dying on a missing file, and it took a
# developer reading the raw Actions log to find out why. The workflow was
# syntactically perfect — YAML linting would not have caught it.
#
# This is the cheap check that would have: if a workflow runs ./something, that
# something must be in the repository.
#
# WHAT IT CHECKS
#   1. Every workflow file parses as YAML (via node, if available)
#   2. Every `working-directory:` value is a directory that exists
#   3. Every `./path` executed in a `run:` block exists — at the repo root, or
#      under one of the working directories the workflow declares
#
# WHAT IT DOES NOT CHECK — be honest about the edges
#   - Paths built from expressions or variables (${{ }}, $VAR)
#   - Whether a bare command (mvn, npm) is installed on the runner
#   - Files a workflow creates during the run and executes later
#   - Which specific step a working-directory applies to; a `./x` is accepted
#     if it exists under ANY declared working directory, not only its own
# It is a floor, not a ceiling. A path that resolves nowhere is always a bug;
# a path that resolves somewhere may still be wrong.

set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

WORKFLOW_DIR=".github/workflows"
failures=0
checked=0

red()  { printf '\033[31m%s\033[0m\n' "$1"; }
green(){ printf '\033[32m%s\033[0m\n' "$1"; }

if [ ! -d "$WORKFLOW_DIR" ]; then
  echo "No $WORKFLOW_DIR directory — nothing to check."
  exit 0
fi

shopt -s nullglob
workflows=("$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml)
shopt -u nullglob

if [ ${#workflows[@]} -eq 0 ]; then
  echo "No workflow files in $WORKFLOW_DIR — nothing to check."
  exit 0
fi

echo "Checking ${#workflows[@]} workflow file(s) in $WORKFLOW_DIR"
echo ""

for wf in "${workflows[@]}"; do
  echo "  $wf"

  # ── 1. YAML parses ────────────────────────────────────────────────────────
  # Optional: only runs where node is available. A workflow that does not parse
  # will not run at all, so this is worth catching before pushing.
  if command -v node >/dev/null 2>&1 && command -v npx >/dev/null 2>&1; then
    if ! npx --yes --quiet js-yaml "$wf" >/dev/null 2>&1; then
      red "      [FAIL] does not parse as YAML"
      failures=$((failures + 1))
      continue
    fi
  fi

  # ── 2. working-directory values exist ─────────────────────────────────────
  # Collected first, because they form the search path for step 3.
  wds=()
  while IFS= read -r wd; do
    [ -z "$wd" ] && continue
    case "$wd" in *'${{'*|*'$'*) continue ;; esac   # expression — cannot resolve
    checked=$((checked + 1))
    if [ -d "$wd" ]; then
      wds+=("$wd")
    else
      red "      [FAIL] working-directory does not exist: $wd"
      failures=$((failures + 1))
    fi
  done < <(grep -hoE '^[[:space:]]*working-directory:[[:space:]]*[^[:space:]#]+' "$wf" \
             | sed -E 's/^[[:space:]]*working-directory:[[:space:]]*//' \
             | tr -d '"'"'" | sort -u)

  # ── 3. executed ./paths resolve somewhere ─────────────────────────────────
  while IFS= read -r rel; do
    [ -z "$rel" ] && continue
    case "$rel" in *'${{'*|*'$'*) continue ;; esac
    stripped="${rel#./}"
    checked=$((checked + 1))

    found=""
    [ -e "$stripped" ] && found="$stripped"
    if [ -z "$found" ]; then
      for wd in "${wds[@]}"; do
        if [ -e "$wd/$stripped" ]; then found="$wd/$stripped"; break; fi
      done
    fi

    if [ -z "$found" ]; then
      red "      [FAIL] workflow executes '$rel' but it exists nowhere in the repo"
      echo  "             looked at: ./$stripped${wds[*]+, and under: ${wds[*]}}"
      failures=$((failures + 1))
    fi
  done < <(grep -hoE '(^|[[:space:]]|&&|\|\||;)\./[A-Za-z0-9_./-]+' "$wf" \
             | grep -oE '\./[A-Za-z0-9_./-]+' | sort -u)
done

echo ""
if [ "$failures" -ne 0 ]; then
  red "FAIL — $failures problem(s) across ${#workflows[@]} workflow file(s)."
  echo ""
  echo "A workflow that executes a path which is not in the repository cannot"
  echo "succeed. Fix the path, or commit the file it expects."
  exit 1
fi

green "PASS — $checked path reference(s) checked, all resolve."
exit 0
