# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repository is

Two things layered together:

1. **A standard AI-development harness** (`.claude/skills/`, `.claude/agents/`, `templates/`, `hooks/`, `scripts/`) — a reusable process framework (skills 01–08, 13 agent roles, 3 human approval gates) described in full in `docs/HARNESS-PROCESS-STANDARD.md`. Read that document before touching any skill/agent/template file; it is the normative spec for how this repo's process is supposed to work.
2. **Coc Docs Platform** — the actual product being built with that harness: a documentation CMS that lets non-technical editors publish pages without a code deploy, replacing a Next.js site whose content today lives in ~14k lines of `content/*.tsx` panels.

`docs/`, `backend/`, `frontend/` are the product. Everything else at the repo root (`.claude/`, `templates/`, `hooks/`, `scripts/`, `reviews/`) is harness tooling.

`tools/` is neither: it holds programs a *teammate* runs on their own machine, against the deployed product. Today that is `tools/claude-usage-reporter/` — the Node script that reads this machine's own `~/.claude` transcripts and POSTs the day's token total to the backend's `/api/ingest`, which is what puts a row on the Claude Usage page. It arrived by `git subtree` from its own repository, so its two original commits are in this history under that prefix; update it with `git subtree pull --prefix=tools/claude-usage-reporter <url> <branch>` rather than by hand, or the next pull conflicts with every local edit.

## Current project state — read this before proposing work

The design has just changed underneath the project and several documents have not caught up yet. Check `docs/.harness-state.yaml` for the live status, but as of the last commit:

- **G2 (design gate) is reverted to `pending`.** It was originally approved against a single-service Next.js + Supabase design. The PM then clarified the requirement meant a genuinely separate backend, which produced **ADR-012** (`docs/design/adr/ADR-012-revision-of-001-backend-stack.md`), superseding ADR-001's stack section. G2 cannot re-pass until the items in ADR-012's "Open Items Blocking G2 Re-Approval" table are closed.
- **Backend hosting target is `[DEFERRED]`** (PM decision). Because of that, the database/storage provider decision is also deferred — do not assume Supabase, Neon, or any specific host. Code must stay portable: plain PostgreSQL 15+ over JDBC, Flyway migrations, S3-compatible object storage API only (CONST-TECH-08).
- **`docs/design/architecture-overview.md` and `docs/design/DEV-PLAN.md` are still v1.0 and describe the old single-service/Supabase design.** They are known-stale pending rewrite (ADR-012's consequences table). Do not treat them as current architecture — treat `ADR-012` and `docs/requirements/REQUIREMENTS-SPEC.md` (v1.1, `CONST-TECH-05/06/07/08`) as authoritative instead.
- **`docs/design/sprint-1-tasks.md` is also stale** for the same reason: it assumes Supabase/T1 and a `middleware.ts`-based auth flow. Per ADR-012, only T2 (schema) and T5 (block types) survive as written; T3–T9 need to be redesigned around the two-service split.
- Gate approvals (`G1`/`G2`/`G3` in `docs/.harness-state.yaml`) are recorded **only** by a human, never by the AI (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). Never write an "approved" status into that file yourself, even if asked to summarize a decision — surface it to the PM instead.

## Architecture (target — per ADR-012)

Two services, not one:

| | |
|---|---|
| **Frontend** (`frontend/`) | Next.js 15 / React 19 / TypeScript. Presentation only — no database access, no authorization decisions. Hosts the reader routes and the BlockNote-based admin editor. |
| **Backend** (`backend/`) | Java 21 / Spring Boot 3.4 / Maven. Owns all persistence, authorization, and validation. Exposes a versioned OpenAPI REST contract that the frontend consumes. |

`frontend/` currently has no Next.js scaffold yet — only `frontend/lib/content/{blocks.ts,validate.ts}`, carried forward from the pre-ADR-012 single-service design as the TypeScript content-block model and client-side pre-check validator (advisory only now; see below).

### Content model (`ADR-010`)

A page body is an ordered array of typed blocks (`frontend/lib/content/blocks.ts` defines the 10 types: heading, paragraph, list, table, code, callout, steps, cards, image, embed). There is deliberately **no raw-HTML block type** — this is a structural XSS prevention, not a filtering one. `embed` blocks may only reference a closed, server-resolved component registry (`EMBEDDABLE_COMPONENTS`), never arbitrary code.

Validation is two-tier (ADR-012 Decision 3):
- **Backend (Java) is authoritative.** Every write must be validated server-side before persistence; the Java port must match `validate.ts`'s rules exactly.
- **Frontend (`frontend/lib/content/validate.ts`) is advisory only** — immediate editor feedback. No write path may rely on it for security.

### Persistence (`ADR-003`, `backend/src/main/resources/db/migration/V1__initial_schema.sql`)

- Draft and published content coexist as **rows**, not a status flag on one row — `page_version` has partial unique indexes enforcing at most one `published` and one `draft` row per `(page, locale)`. This is what makes publishing a status transition and version history free.
- Optimistic locking via `version_no` on `page_version` — a stale write is refused, never silently overwritten.
- Internal links are stored as page references (`pageId`), never literal URLs, so renaming a slug can't break a link.
- `audit_log` is append-only by convention (`revoke update, delete ... from public`), retained ≥1 year.
- Per-section `db_backed` flag allows migrating one doc set (e.g. `jex2.0`) to the database while others keep rendering from `content/*.tsx` — the coexistence/rollback mechanism during migration.
- Content includes Khmer and Korean text — encoding is UTF-8 everywhere, never left to a platform default.

### Authentication

Google OIDC only — there is no password column/flow anywhere. The backend verifies Google ID tokens (signature, audience, issuer, nonce) and issues its own session credential; the frontend never asserts identity. Role is always read server-side from the `account` table per request, never trusted from a client header/claim (this predates and survives the two-service split — see ADR-011, being revised for the new frontend↔backend trust boundary per ADR-012 Decision 4).

## Commands

### Backend (`backend/`, Maven)

```
mvn -f backend/pom.xml spring-boot:run   # run the API locally
mvn -f backend/pom.xml test              # unit tests
mvn -f backend/pom.xml verify            # full build incl. integration tests
```

Integration tests use **Testcontainers against real Postgres** (`org.testcontainers:postgresql`), not H2 — the schema relies on partial unique indexes, a deferred constraint trigger, and jsonb, none of which H2 reproduces faithfully. Docker must be available to run them.

Flyway migrations live in `backend/src/main/resources/db/migration/` (`V1__*.sql`, ...) and run automatically against `spring-boot-starter-jdbc` + `flyway-core` on startup.

### Frontend (`frontend/`)

No `package.json`/build tooling exists yet — only the two TypeScript modules under `frontend/lib/content/`. There is no `npm`/lint/test command to run until the Next.js app is scaffolded (Sprint 1/2 work, per the — currently stale — sprint plan).

## Operational constraints that affect how you should edit this repo 

- **Never bulk-edit content files with Windows PowerShell 5.1** (`Get-Content`/`-replace`/`Set-Content`) — it reads UTF-8 as the Korean system codepage on this machine and corrupts em-dashes and Korean/Khmer text (`CONST-OPS-01`, binding on all migration tooling). Use the `Edit`/`Write` tools, or `Bash`, for any content or migration-script edits — not `PowerShell` string replacement.
- Do not read or output `*.properties`, `*.yml`/`*.yaml`, `*.env`, `application-*.xml`, or key/cert files (`*.key`, `*.pem`, `*.jks`, `*.p12`, `*.cer`) per the user's global `SEC-001`/`SEC-003` rules — this includes `backend/src/main/resources/application.yml`.
- Monetary/precision-sensitive values must use `BigDecimal` with explicit `RoundingMode` in Java (`double`/`float` prohibited) if any are ever added — none exist yet in this schema.
- `// req: <REQ-ID>` traceability comments are the convention for greenfield code in this project (see `blocks.ts`, `validate.ts`, `V1__initial_schema.sql`, `DocsPlatformApplication.java` for examples) — follow it for new code.
- ADRs are mandatory at the moments listed in HARNESS-PROCESS-STANDARD §5.2 (stack choice, schema decisions, security decisions, revisions to an existing decision, etc.) — write one under `docs/design/adr/ADR-NNN-*.md` (template: `templates/design/ADR.template.md`) rather than making a silent design change.

## Where to look for current truth

- `docs/HARNESS-PROCESS-STANDARD.md` — the process this repo follows (skills, gates, agent roles, mandatory code-gen rules).
- `docs/.harness-state.yaml` — current skill/gate status; treat as a hint, cross-check against the actual docs it references.
- `docs/design/adr/` — architecture decisions, newest-numbered wins over older ones it supersedes (`ADR-INDEX.md` lists them).
- `docs/requirements/REQUIREMENTS-SPEC.md` — requirements and `CONST-*` constraints, with a change history section noting amendments (currently at v1.1).
- `.claude/agents/*.md` frontmatter `write_dirs` — authoritative per-agent write-scope isolation, if operating as one of the named subagents (`architect`, `backend-developer`, `frontend-developer`, `code-reviewer`, `security-auditor`, `qa-engineer`, `docs-writer`, `trace-mapper`, `team-leader`, etc.) rather than as a general assistant.
