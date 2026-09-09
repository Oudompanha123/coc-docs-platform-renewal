#!/usr/bin/env bash
# Coc Docs Platform — one-time developer setup.
#
#   bash scripts/install-hooks.sh
#
# Points git at the versioned .githooks/ directory, so hooks are tracked in
# the repo and every developer gets the same ones. No copying files by hand,
# and updates arrive with a normal git pull.

set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "Coc Docs Platform — developer setup"
echo ""

git config core.hooksPath .githooks
echo "  [ok]  git hooks       -> .githooks (versioned, shared by everyone)"
echo "          pre-commit    : gitleaks secret scan"
echo "          pre-push      : blocks direct pushes to main and dev"

fail=0

if command -v gitleaks >/dev/null 2>&1; then
  echo "  [ok]  gitleaks       $(gitleaks version 2>/dev/null | head -1)"
else
  echo "  [!!]  gitleaks       NOT INSTALLED — the pre-commit hook will fail"
  echo "          macOS:   brew install gitleaks"
  echo "          Windows: winget install Gitleaks.Gitleaks"
  echo "          Linux:   see https://github.com/gitleaks/gitleaks/releases"
  fail=1
fi

if command -v java >/dev/null 2>&1; then
  jv="$(java -version 2>&1 | head -1)"
  case "$jv" in
    *\"21*) echo "  [ok]  java           $jv" ;;
    *)      echo "  [!!]  java           $jv"
            echo "          This project requires Java 21 (CONST-TECH-06)."
            echo "          The Maven build will fail on any other version."
            fail=1 ;;
  esac
else
  echo "  [!!]  java           NOT FOUND — install JDK 21"
  fail=1
fi

command -v mvn  >/dev/null 2>&1 && echo "  [ok]  maven          $(mvn -version 2>/dev/null | head -1 | cut -d' ' -f1-3)" || { echo "  [!!]  maven          NOT FOUND — install Maven 3.9+"; fail=1; }
command -v node >/dev/null 2>&1 && echo "  [ok]  node           $(node --version)" || echo "  [--]  node           not found (only needed for frontend work)"

echo ""
if [ "$fail" -eq 0 ]; then
  echo "Setup complete. You are ready to work."
else
  echo "Setup finished with warnings above. Fix them before committing."
fi
echo ""
echo "Workflow:  branch from dev  ->  push the branch  ->  open a PR into dev"
echo "Details:   CONTRIBUTING.md"
