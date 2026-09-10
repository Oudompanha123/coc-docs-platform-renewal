# Contributing — Coc Docs Platform

Six people work on this repository. These rules exist so that parallel work stays coherent, not as ceremony.

---

## Branch model

```
main   ← protected. Release-ready only. Receives PRs from dev, nothing else.
dev    ← protected. Integration branch. Everyone's work lands here first.
  └── feature/short-description   ← your working branch
```

**Nobody pushes directly to `main` or `dev`.** Not even the PM. Everything arrives by pull request.

## Your workflow

```bash
git checkout dev
git pull                                  # always, before starting
git checkout -b feature/login-api

# ... work, commit ...

git push -u origin feature/login-api
scripts/open-pr.sh                        # opens the PR into dev
```

**Target `dev`, not `main`.** A PR into `main` will be rejected unless it comes from `dev`.

Use `scripts/open-pr.sh` rather than `gh pr create` or the "Compare & pull request" button GitHub shows after a push. **Both of those target the repository's default branch, which is `main`** — so the wrong target is what you get by doing nothing. The script passes `--base dev`, refuses `main` from anything but `dev`, pushes the branch if you haven't, and prints the compare URL when `gh` isn't authenticated.

This is not a hypothetical tidiness rule. On 2026-09-10 two PRs went straight into `main`, leaving `dev` six commits behind it — and every branch cut from `dev` afterwards silently reintroduced a CI job that had already been fixed.

## A pull request merges when

| | |
|---|---|
| ✅ **CI passes** | Backend build and tests, frontend build and tests |
| ✅ **Security checks pass** | gitleaks, dependency scan, SBOM, licence check, CodeQL |
| ✅ **One approval from someone else** | You cannot approve your own PR |
| ✅ **Branch is up to date with `dev`** | Rebase or merge `dev` in before merging |

**Nobody merges their own work unreviewed.** With six people, review is what keeps the design coherent — it is not a formality, and it is the only thing standing between "six people wrote code" and "six people built one system".

## Before your first commit

**1. Install the secret-scanning hook** — this is L1 of the three-level security model, and it runs on your machine, not in CI:

```bash
cp hooks/pre-commit-gitleaks.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

You also need `gitleaks` installed. It blocks the commit if a secret is detected. Bypassing it requires a written, approved exception file — see the script.

**2. Use Java 21.** Not 22, not 25. The build now fails on the wrong version with an explanation:

```bash
java -version    # must report 21
mvn -version     # must report 3.9 or newer
```

This is not pedantry. Spring Boot 3.4 predates Java 25 and does not list it as supported, and six developers on differing JDKs produce defects that reproduce on exactly one machine.

**3. Node 24** for the frontend.

**4. Authenticate the GitHub CLI** — this is the step everyone forgets:

```bash
gh auth login          # then: gh auth status
```

Being able to `git push` is **not** the same as being authenticated to `gh`. Git credentials and GitHub CLI auth are separate stores, and one working tells you nothing about the other. Without `gh` auth, the `ship` step of Skill 09 can only print a pull-request URL for you to click — it cannot open the PR. `scripts/install-hooks.sh` now checks this and says so.

## Your tooling, shared

Two files configure everyone's Claude Code the same way, so the workflow behaves identically on six machines:

| File | What it does |
|---|---|
| `.mcp.json` | Registers the Flow board as an MCP server, so the task-board steps of Skill 09 work without per-person setup. Claude Code asks you to approve it the first time you open the project |
| `.claude/settings.json` | Permission rules for the commands this repo actually runs — git, `mvn`, `npm`, `gh`, `gitleaks`, `scripts/*`. Without it every routine command prompts, and people stop using the workflow and go back to raw git |

The `deny` rules in `.claude/settings.json` mirror the rules in Skill 09 §6 — no `--no-verify`, no force pushes, no direct pushes to `main` or `dev`. **Be clear about what they are worth**: permission rules match on a command prefix, so `git commit --no-verify` is caught and `git commit -m "x" --no-verify` is not. They stop the obvious path, not a determined one. The git hooks are the real control, and even those are discipline rather than security — see `.githooks/pre-push`.

Keep personal overrides in `.claude/settings.local.json`, which is gitignored. Do not put them in the shared file.

## Commit messages

Conventional Commits, per HARNESS-PROCESS-STANDARD §4.4:

```
feat(auth): verify Google ID tokens server-side
fix(content): reject links with a javascript: scheme
docs(adr-010): correct the LinkTarget description
```

Reference requirement IDs in the body where relevant — `// req: FR-AUTH-001` comments belong in the code itself (§5.1).

## Things that will get a PR sent back

- **A permission check implemented only in the frontend.** Anyone can call the API directly and skip it. Authorisation lives in the backend or it does not exist (`CONST-TECH-07`, `RISK-019`).
- **A test that proves a button is hidden** rather than that the server refuses the request. Authorisation tests call the API directly, with no browser involved.
- **Bulk-editing content with Windows PowerShell 5.1.** It reads UTF-8 as the Korean system codepage and silently corrupts em-dashes, Korean and Khmer text (`CONST-OPS-01`). Use Git Bash or an editor.
- **A secret in the diff.** The L1 hook should catch it first; CI catches it second.
- **Frontend and backend changed together without the OpenAPI contract updated.** That is how the two services drift apart (`RISK-018`).

## Where to look things up

| | |
|---|---|
| Why the project exists | `docs/planning/PROJECT-PROPOSAL.md` |
| What we are building | `docs/requirements/REQUIREMENTS-SPEC.md` — 84 requirements |
| How it fits together | `docs/design/architecture-overview.md` |
| The content model | `docs/design/adr/ADR-010-content-model.md` — the least reversible decision |
| Security model | `docs/design/adr/ADR-011-security-model.md`, `docs/design/threat-model.md` |
| Sprint plan and ownership | `docs/design/DEV-PLAN.md` |
| Testing rules | `docs/design/TEST-PLAN.md` |

If a decision looks wrong, say so. Every ADR records the alternatives it rejected and why — if the reasoning does not hold, that is worth knowing while it is still a document rather than a hundred migrated pages.
