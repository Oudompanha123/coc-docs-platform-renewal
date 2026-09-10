#!/usr/bin/env bash
# Open a pull request against the integration branch.
#
# WHY THIS EXISTS
# `gh pr create` with no --base targets the repository's default branch, and
# so does the "Compare & pull request" button GitHub shows after a push. On
# this repository that default is `main` — the release branch — so the wrong
# target is what you get by doing nothing.
#
# That is not hypothetical. On 2026-09-10 PRs #10 and #18 went straight into
# main, leaving dev six commits behind it. Every branch cut from dev after
# that silently reintroduced a broken CI job that had already been fixed.
#
# Usage:
#   scripts/open-pr.sh                 # PR from the current branch into dev
#   scripts/open-pr.sh -t "Title"      # with an explicit title
#   PR_BASE=main scripts/open-pr.sh    # only allowed from dev itself
#
#   // req: CONST-PROC-01, HARNESS-PROCESS-STANDARD §5.4

set -uo pipefail

BASE="${PR_BASE:-dev}"
RELEASE_BRANCH="${RELEASE_BRANCH:-main}"
TITLE=""

while [ $# -gt 0 ]; do
  case "$1" in
    -t|--title) TITLE="${2:-}"; shift 2 ;;
    -b|--base)  BASE="${2:-}"; shift 2 ;;
    -h|--help)  sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done

HEAD_BRANCH="$(git branch --show-current 2>/dev/null)"
if [ -z "$HEAD_BRANCH" ]; then
  echo "Not on a branch (detached HEAD). Check out a feature branch first." >&2
  exit 1
fi

# ── The rule: main receives pull requests from dev, and from nothing else ───

if [ "$BASE" = "$RELEASE_BRANCH" ] && [ "$HEAD_BRANCH" != "dev" ]; then
  cat >&2 <<EOF
Refusing to open a pull request into '${RELEASE_BRANCH}' from '${HEAD_BRANCH}'.

'${RELEASE_BRANCH}' is the release branch. It receives pull requests from 'dev'
and from nothing else. A feature branch merged straight into it skips
integration and leaves 'dev' behind, so every branch cut afterwards is missing
whatever landed here.

Open it against 'dev' instead:

  scripts/open-pr.sh

If you genuinely mean to promote a release, do that from 'dev':

  git checkout dev && scripts/open-pr.sh --base ${RELEASE_BRANCH}
EOF
  exit 1
fi

if [ "$HEAD_BRANCH" = "$BASE" ]; then
  echo "Head and base are both '${BASE}'. Nothing to open." >&2
  exit 1
fi

# ── Make sure the branch is actually pushed ─────────────────────────────────
if ! git rev-parse --verify "origin/${HEAD_BRANCH}" >/dev/null 2>&1; then
  echo "'${HEAD_BRANCH}' is not on the remote yet. Pushing it."
  git push -u origin "$HEAD_BRANCH" || exit 1
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null)"
SLUG="$(printf '%s' "$REMOTE_URL" | sed -E 's#^git@github\.com:##; s#^https://github\.com/##; s#\.git$##')"
COMPARE_URL="https://github.com/${SLUG}/compare/${BASE}...${HEAD_BRANCH}?expand=1"

# ── Open it, or hand back the URL ───────────────────────────────────────────
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  if [ -n "$TITLE" ]; then
    gh pr create --base "$BASE" --head "$HEAD_BRANCH" --title "$TITLE" --body-file - <<'BODY'
<!-- Body left for you to fill in. Say why, not what. -->
BODY
  else
    gh pr create --base "$BASE" --head "$HEAD_BRANCH" --fill
  fi
  exit $?
fi

# `git push` is not the same credential store as `gh auth`; one working tells
# you nothing about the other. CONTRIBUTING.md calls this the step everyone
# forgets, so say it plainly rather than failing obscurely.
cat <<EOF

gh is not authenticated, so the pull request was not opened for you.
The branch is pushed. Open it here — the target is already set to '${BASE}':

  ${COMPARE_URL}

To let this script open PRs itself:

  gh auth login --web -h github.com -p https --scopes "repo,workflow"

EOF
exit 0
