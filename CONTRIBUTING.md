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

git push -u origin feature/login-api      # then open a PR into dev
```

**Target `dev`, not `main`.** A PR into `main` will be rejected unless it comes from `dev`.

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
