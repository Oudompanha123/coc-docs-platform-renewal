# Test Plan — Coc Docs Platform

> **Version**: 2.0
> **Date**: 2026-09-09
> **Preceding**: [REQUIREMENTS-SPEC.md](../requirements/REQUIREMENTS-SPEC.md) (v1.1), [requirements-matrix.csv](../requirements/requirements-matrix.csv), [DEV-PLAN.md](DEV-PLAN.md), [ADR-012](adr/ADR-012-revision-of-001-backend-stack.md)
> **Author**: qa-engineer (support agent, Skill 3)
> **Status**: DRAFT — awaiting G2 re-approval

---

## Revision History

| Version | Date | Change | Driver |
|---|---|---|---|
| 1.0 | 2026-09-08 | Initial plan, sized to `CONST-RES-01` (one part-time developer) and a single-service Next.js architecture | Skill 3 baseline |
| **2.0** | **2026-09-09** | **Full revision.** Two forcing changes: (1) `CONST-TECH-05/06/07/08` (ADR-012) split the system into a Spring Boot backend and a Next.js frontend — two toolchains, a required API-contract category, cross-service E2E, real-Postgres backend tests, and a mandatory class of direct-API negative test for `CONST-TECH-07`; (2) `CONST-RES-02` supersedes `CONST-RES-01` — the team is now the PM plus five engineers (Panha, Sreyly, Sarayuth, Chanthy, Sophanna), so tests cut purely for one-person capacity are revisited. Every prior decision is re-examined below; nothing carries over by default. | ADR-012, `REQUIREMENTS-SPEC.md` v1.1 |

---

## 0. How to Read This Plan

Two constraints now shape everything below, and they pull in different directions:

- **`CONST-TECH-05`** — two services, two toolchains, a network boundary that did not exist before. This *adds* required test categories (API contract, cross-service E2E, backend-real-DB tests, direct-API negative tests for `CONST-TECH-07`) regardless of team size.
- **`CONST-RES-02`** — six developers, not one. This makes more of the estate *affordable* — CI becomes the shared safety net rather than a nicety, and several v1.0 scope-downs that were purely capacity-driven are reversed below.

Where a v1.0 decision was cut for **capacity** (one person couldn't do it), it is revisited and, in most cases, added back. Where a decision was scoped for **proportionality** to the project's actual size (200 pages, 10 editors, an internal tool with no enterprise load profile) or for **budget** (no paid tooling), team size does not change the reasoning, and the original scope-down stands — restated explicitly, not silently carried over.

| What | v1.0 decision (one developer) | v2.0 decision (six developers, two services) | Why it changed (or didn't) |
|---|---|---|---|
| Unit tests | One suite (Vitest/Jest), every commit | **Two suites**: JUnit 5 + Mockito (backend), Vitest/Jest (frontend), both every commit (CI) | Forced by `CONST-TECH-05` — two languages, two toolchains |
| Integration tests | Vitest/Jest + Testcontainers Postgres + Supertest, against API routes in the same process as the frontend | **Spring Boot Test + Testcontainers (real PostgreSQL 15+)**, every PR — not H2. The schema's partial unique indexes, deferred constraint trigger and `jsonb` are not faithfully reproduced by H2 | Forced by `CONST-TECH-05`/`06`; already reflected in `backend/pom.xml` |
| API contract | Did not exist as a category (one process, no contract to drift) | **New, mandatory**: OpenAPI schema validation + generated-client drift check, every PR (§1.2, §5.5) | Forced by `CONST-TECH-05` — frontend and backend can now drift independently |
| E2E | Top 5 flows automated, rest manual (capacity cut) | **Top 7 — all seven UCs automated** (UC-003, UC-006 added back); both services orchestrated via Docker Compose locally and in CI (§4) | Capacity cut reversed — six engineers can author and maintain 2 more flows; the network boundary means E2E now spans two services regardless |
| `CONST-TECH-07` negative tests | Did not exist as a named category; FR-AUTH-008 was the only mandatory negative test | **New, mandatory class**: every write/authz path gets a direct-API test that bypasses the UI entirely (§5.2, §5.5) | Forced by `CONST-TECH-07` — the frontend validator is advisory only; a browser-only test proves nothing about it |
| Accessibility | Automated smoke scan (axe) on 5 E2E flows only (capacity cut) | Axe scan on **all 7 automated E2E flows** + a scripted axe pass over **every migrated page** (not just flows) as each doc set ships; full manual AA certification of all 105 pages still out of scope | Capacity cut on flow-count reversed; full manual AA audit remains a proportionality call, not a capacity one — automating a scan is cheap, manually certifying 105 pages by hand is not, regardless of team size |
| Load tests | k6, manual, once per shippable slice | k6, **automated smoke run in CI on every merge to `main`** + full run once per shippable slice (unchanged targets — `NFR-SCALE-01` did not grow) | Capacity cut (manual-only) reversed; the *scale target* itself is a proportionality call and is unchanged — running an enterprise rig would still be cargo-culting `sg-gw` onto a documentation site |
| CI | "Hooks already exist" — described in one line | **Elevated to its own section (§1.3)** — the shared safety net for six people pushing to the same repo | Team-size change, not a technical one |
| Toolchain drift | Not a risk category (one developer, one machine) | **New, mandatory check (§12)** — six machines, one real incident already observed (a developer reported Java 25 against a Java 21 target) | `CONST-RES-02` |
| Security (SAST/secrets) | Automated, every commit/PR | Unchanged, extended to both repos | No budget signal received; proportionate free tooling stands |
| NFR-USE-01 | Manual, human-observed, one named colleague | **Unchanged in method.** The colleague is now named: **Pann Voleak** (§2) | Central requirement — preserved, not reopened |
| Content-fidelity (105 panels) | Semi-automated + manual, once per migrated doc set | Unchanged method; now **parallelisable across the content-migration workstream** instead of serial on one person (§8) | Capacity change speeds throughput, does not change the bar (100% per doc set) |
| Coverage tooling | `vitest --coverage`, no SonarQube (budget) | Same reasoning, **extended**: JaCoCo (backend, free, Maven-native) + `vitest --coverage` (frontend). Still no SonarQube/Snyk — no budget signal was given alongside the team-size change | Budget-driven scope-downs are untouched by a headcount change |

---

## 1. Test Strategy

### 1.1 Test Shape (two services + a contract layer)

```
                 ┌───────────────────────────┐
                 │   E2E — 7 flows (both      │  automated, both services running
                 │   services orchestrated)   │  (Playwright)
                ┌┴───────────────────────────┴┐
                │   API Contract — schema     │  new layer: catches drift the
                │   validation + client-drift │  pyramid below cannot see
               ┌┴─────────────────────────────┴┐
               │        BACKEND                │  FRONTEND
               │  Integration (~25%)           │  Component (Vitest/RTL)
               │  Spring Boot Test +           │
               │  Testcontainers (real PG)     │
              ┌┴────────────────────────────────┴┐
              │  Unit — ~70% each side            │  JUnit 5/Mockito (backend)
              │                                    │  Vitest/Jest (frontend)
              └────────────────────────────────────┘
```

The pyramid shape (wide unit base, thin E2E top) is unchanged from v1.0 — that reasoning was never about headcount, it is about which tests are cheapest to maintain. What changed is that there are now **two pyramids sharing one contract layer**, not one. The contract layer is new precisely because two independently-deployable services can pass their own tests while disagreeing with each other about the shape of a request or response — that failure mode did not exist when frontend and backend were one process.

### 1.2 Test Levels

| Level | Scope | Where | Tooling | Entry criteria | Exit criteria | Who runs it |
|---|---|---|---|---|---|---|
| **Unit (backend)** | Block-schema validators, slug/redirect logic, RBAC role comparison, sanitisation rules, staleness computation, optimistic-lock version check, OIDC token verification logic | `backend/` (Java) | JUnit 5, Mockito, AssertJ | Class/method has a merged PR | Line ≥ 80% / branch ≥ 70% on core domain logic (§3) | Backend workstream engineers, every commit (CI) |
| **Unit (frontend)** | BlockNote editor blocks, `lib/content/validate.ts` (advisory pre-check), presentation components with logic, i18n status widget logic | `frontend/` (TS) | Vitest (or Jest + ts-jest) | Component/module has a merged PR | Line ≥ 80% / branch ≥ 70% on core logic (§3) | Frontend workstream engineers, every commit (CI) |
| **Integration (backend)** | REST controllers against a real PostgreSQL 15+ via **Testcontainers** (not H2 — the schema's partial unique indexes, deferred constraint trigger, and `jsonb` columns are not faithfully emulated by H2); role-ladder enforcement through Spring Security filters; Flyway migration correctness | `backend/` | Spring Boot Test (`@SpringBootTest`), Testcontainers `postgresql` module, REST-assured or `MockMvc` | Controller/service implemented against the schema | All Must-priority API contracts covered (§9); ≥ 70% branch on controllers/services | Backend workstream engineers, every PR |
| **API Contract** | Every REST endpoint's request/response conforms to the published OpenAPI spec; the frontend's generated types are not stale relative to that spec | Cross-service, verified from `backend/` CI job | springdoc-openapi (spec generation) + `atlassian-oai-validator`/`openapi4j` (schema-conformance assertions inside the backend's own integration tests) + `openapi-typescript` (frontend type generation) + a CI diff-check on the generated types | OpenAPI spec is published for the endpoint under test | Zero schema-conformance failures; zero stale-generated-type diffs | Backend workstream authors schema-validation assertions; frontend workstream keeps the generated client current; qa-engineer gates the CI check (§1.3, §5.5) |
| **E2E** | All 7 user-facing flows (§4), through the real UI, against both services running together | Repo root (drives `frontend/` + `backend/`) | Playwright, Docker Compose orchestration (§4.2) | Flow's UI screens exist against a running backend | All 7 flows green on `main`; regression suite (§11) also green | Authoring engineer (whichever workstream owns the flow) → qa-engineer reviews before merge |
| **Component (frontend)** | Editor blocks, block-menu, translation-status widget, admin console screens | `frontend/` | Vitest + Testing Library | Component built | No regression in component snapshot/behavioural tests | frontend-developer(s) author → qa-engineer spot-verifies |
| **Accessibility** | All 7 automated E2E flows + a scripted axe pass over every page in a doc set as it migrates (§7) | `frontend/` (scan target: rendered pages, served by both services) | `@axe-core/playwright` in the E2E suite; manual keyboard pass once per shippable slice | E2E flow or migrated doc set exists | Zero axe **critical/serious** violations (not full AA certification — §7) | frontend-developer(s) produce axe/Jest results → qa-engineer verifies pass bar |
| **Security** | OWASP Top 10, the 6 mandatory `NFR-SEC-*` cards, `CONST-TECH-07` direct-API negative tests, secret scanning, SAST — both repos | Both | See §5 | Feature touches auth, PII, uploads, rich-content, or any write path | Zero unresolved finding ≥ CVSS 7.0 | security-auditor (lead) + qa-engineer (negative-test authoring) + backend workstream (fixes) |
| **Load** | Reader P95, admin-save P95, editor-TTI P95 at 2× NFR-PERF SLA, sized to `NFR-SCALE-01` | Both services, staging | k6 | Staging mirrors prod config (both services deployed) | P95 targets met at 2× load (§6) | Backend workstream owns API performance; qa-engineer runs and reports |
| **Content-fidelity** | Every one of the 105 authored panels, post-migration | Data layer (backend DB) + rendered frontend | Node/TS structural-check script + manual checklist | A doc set's migration is code-complete | 100% of that doc set's rows marked PASS | Content-migration workstream authors; qa-engineer verifies (§8) |
| **Toolchain verification** | Java version, Node version, on every developer machine and in CI | Both | Maven Enforcer Plugin (backend), `package.json` `engines` + `.nvmrc` (frontend), CI version-pin step | New | Zero mismatches; a mismatch fails the build, not just a warning (§12) | Every engineer, on first setup and every CI run |

### 1.3 CI Pipeline — the shared safety net

Under `CONST-RES-01`, CI was "a nicety, wired up once, free from then on." Under `CONST-RES-02`, **six people push to the same two repos**, and the pipeline is what stops any one person's regression from reaching another's branch. This is a team-size-driven elevation, not a technical one.

| Stage | Trigger | Runs | Gate |
|---|---|---|---|
| Pre-commit | Local, every commit | `gitleaks` (secret scan, unchanged from v1.0) | Blocks the commit locally |
| PR — backend | Every PR touching `backend/` | Toolchain check (§12) → `mvn -q verify` (unit + Testcontainers integration + JaCoCo) → OpenAPI spec regeneration + schema-conformance assertions → Semgrep + `mvn dependency-check:check` (SAST/SCA) | Merge blocked on any failure |
| PR — frontend | Every PR touching `frontend/` | Toolchain check (§12) → `npm run build` → `vitest --coverage` (unit + component) → generated-API-client staleness diff (fails if `frontend/` types are behind the backend's OpenAPI spec) → `npm audit`/Dependabot | Merge blocked on any failure |
| PR — cross-cutting | Any PR | `gitleaks` full-repo scan, `ci-security-auditor.yml` (unchanged from v1.0) | Merge blocked |
| Merge to `main` | Every merge | Full E2E suite (7 flows, Docker Compose–orchestrated, §4.2) + axe scan + k6 **smoke** run (light load, fast feedback — not the full 2×-SLA run) | Blocks promotion to staging; does not block the merge itself (E2E runs after merge, on the merged commit, to keep PR feedback fast) |
| Nightly / pre-slice | Scheduled, or manually triggered before a shippable slice | Full k6 run at 2× SLA (§6), full regression ledger (§11), content-fidelity script (§8) for any doc set migrated since the last run | Feeds the shippable-slice go/no-go, not a per-PR gate |
| Pre-release | Before G3 of a slice | Security audit, cross-validation (Skill 5), NFR-USE-01 observation if the editor UI changed materially | G3 gate |

**Review policy (naming test ownership without pre-empting DEV-PLAN's roster split)**: `DEV-PLAN.md` assigns the five engineers to backend/frontend/content-migration workstreams; this plan binds test ownership to **workstream**, not to a fixed name, so it stays correct however that split lands. The one fixed rule here: **no PR merges on a self-review** — a PR touching `backend/` needs an approving review from a backend-workstream engineer other than the author; same rule for `frontend/`. Cross-service E2E PRs need one reviewer from each side.

---

## 2. NFR-USE-01 — The Central, Non-Automatable Test

> **NFR-USE-01**: *"A named non-technical colleague edits and publishes a real page unaided, with no training beyond a one-page guide. Pass = completed without asking the PM."*

Unchanged in status from v1.0: per the Requirements Spec, *"if it fails, the project has not delivered regardless of what else passes."* Neither the two-service split nor the larger team changes this — if anything, a larger team makes it more important that this test is not quietly dropped as "someone else's job."

### 2.1 Why it cannot be automated

No test framework can assert "a real human, who has never seen this tool, was not confused." This is unchanged from v1.0 (`AMB-003`).

### 2.2 The volunteer is named

| Item | v1.0 | v2.0 |
|---|---|---|
| Who | A generic "one named, real, non-technical colleague," to be identified at test time | **Pann Voleak** — identified now, ahead of the first observation |
| Google account | Must have a Google Workspace account already provisioned via UC-004, at `admin` role, before the test starts | Unchanged — Pann Voleak's account must be provisioned before the session, and provisioning itself is not part of the test |
| Prior exposure | Must not have watched the developer use the admin console | Unchanged — Pann Voleak must not have been shown the console or the editor UI before the session |
| Sample size | One colleague, one session, per shippable slice that changes the editor UI materially; a *different* colleague for any re-test | Unchanged. Pann Voleak is the first named tester; per §2.7, a **different** person is recruited for any re-test after a fix, to avoid learning-effect contamination |

### 2.3 The one-page guide

Unchanged from v1.0: written by a developer (now: whichever engineer owns the editor UI for the slice under test), reviewed by another engineer before the session (this is new — with six people, "reviewed by nobody" is no longer the only option, and a second set of eyes on the guide is nearly free). Its only *validation*, however, remains this test — a guide that reads well to an engineer who already knows the system proves nothing.

- Format: one printed or single-screen page. No links to a second document, no video.
- Content ceiling: task steps only. No conceptual explanation of blocks, drafts, or staleness beyond what the task requires.
- Stored at: `docs/deliverables/ADMIN-QUICKSTART.md` (produced under Skill 6; referenced, not authored, here).

### 2.4 Two services, one session — what changes operationally

The colleague only ever touches the **frontend** (the admin console at its origin); the backend is invisible to them by design (`CONST-TECH-05`). The only new requirement is environmental: **both services must be running and the backend must be reachable from the frontend's origin (CORS configured) before the session starts.** This is a pre-flight check for the facilitator, not something the colleague ever sees or needs to know about. A session that fails because the backend was down, or a CORS misconfiguration silently broke a save, is an **infrastructure failure of the test setup**, not an NFR-USE-01 finding — it must be caught in pre-flight and the session rescheduled, not scored as a fail.

### 2.5 Script (unchanged from v1.0)

1. Facilitator (the PM) hands Pann Voleak the one-page guide and a single, specific, real task: *"Page X currently says Y. Change it to say Z, and publish the change."* A genuine correction, not a synthetic placeholder.
2. Pann Voleak works alone, at her own machine, with the guide as her only reference.
3. The facilitator is present but **silent** by default.
4. A stopwatch runs for diagnostic purposes only — **not time-boxed** (`AMB-003`).
5. Session ends when Pann Voleak either (a) publishes successfully, (b) explicitly asks the facilitator a question, or (c) gives up.

### 2.6 What counts as "asking for help" (unchanged from v1.0)

| Counts as a fail-triggering ask | Does **not** count |
|---|---|
| "How do I save this?" / "Where's the publish button?" / "What does 'stale' mean?" | Asking what the *correct replacement wording* should be — editorial, not a usability failure |
| Any question directed at the PM/facilitator about *how to operate the console* | Muttering out loud while reading the guide, if not directed as a question |
| Asking the facilitator to intervene physically | Re-reading the guide unprompted |
| Opening a second tab to search "how to use [product]" | Using standard browser affordances |

### 2.7 Recording and cadence (unchanged from v1.0)

Output: `qa/nfr-use-01-observation-N.md`. First run: before G3 of the `jex2.0` pilot slice — still the smallest, first-shipped doc set, and `CONST-RES-02` explicitly re-confirms `jex2.0` as the pilot. Re-run after any fix, with a different colleague. Ceiling: 3 consecutive different colleagues failing blocks G3 for that slice regardless of every other passing test.

---

## 3. Coverage Targets

| Metric | Target | Scope | Backend tool | Frontend tool | Rationale |
|---|---|---|---|---|---|
| Line coverage | ≥ 80% | Core domain logic: block-schema validation, slug/redirect resolution, RBAC comparison, sanitisation, staleness/versioning, optimistic-lock logic, OIDC verification (backend); block validators, staleness/status widgets, `validate.ts` (frontend) | JaCoCo (`jacoco-maven-plugin`, free, Maven-native) | `vitest --coverage` (native V8 coverage) | Kept at the `[basis:industry-convention]` default in both suites — unchanged by the split, since the reasoning (cheap to write, expensive to skip on security/data-integrity code) is per-line, not per-team-size |
| Branch coverage | ≥ 70% | Same scope, both sides | JaCoCo | `vitest --coverage` | Same rationale |
| Method coverage | Not tracked separately | — | — | — | Revisited for v2.0 and **still dropped** — this was a proportionality call (an extra metric with no extra signal), not a capacity one, so the larger team does not change it |
| Excluded from coverage targets | Generated DB client code (JPA entities/repositories with no custom logic, Flyway migration SQL), thin CRUD controllers with no branching, presentational React components with no logic | — | — | — | Also a proportionality call, not a capacity one — chasing 80% across generated code burns engineer time for near-zero regression protection regardless of headcount |
| Cross-service assertion | The OpenAPI spec itself is treated as covered code: every path/operation in it must have at least one schema-conformance test (§1.2, §5.5) | — | springdoc-openapi + `atlassian-oai-validator` | `openapi-typescript` staleness check | New in v2.0 — coverage of the *contract*, not just the code either side of it |
| Coverage tool budget note | No SonarQube/Snyk in either suite | — | — | — | Unchanged from v1.0 — no budget signal accompanied the team-size change, so the free-tooling decision stands; flagged for PM confirmation if that assumption is wrong |

---

## 4. E2E Scenarios — Top 7 (all seven UCs, added back from Top 5)

`CONST-RES-01`'s v1.0 plan automated 5 of 7 flows and treated UC-003 and UC-006 as manual/integration-only, purely because one developer could not author and maintain 7 Playwright suites. `CONST-RES-02` removes that constraint: six engineers can afford to author and maintain all 7. Both UCs are **added back** below.

| # | Scenario | UC | Core TC IDs | Status |
|---|---|---|---|---|
| 1 | Edit an existing page and publish it | UC-001 | TC-001-01…-05, -07, -08 | Automated (unchanged from v1.0 — this is the project) |
| 2 | Create an account and assign a role, then sign in | UC-004 | TC-004-01, -03 | Automated (unchanged) |
| 3 | Read a documentation page (happy path + legacy URL + role denial) | UC-005 | TC-005-01, -02, -06 | Automated (unchanged) |
| 4 | Create a new page in a section | UC-002 | TC-002-01, -02 | Automated (unchanged) |
| 5 | Find and fix a stale translation | UC-007 | TC-007-02, -03 | Automated (unchanged) |
| 6 | **Reorder/rename navigation** | UC-003 | TC-003-01, -02, -03 | **Added back.** Was integration + manual click-through only in v1.0; now full Playwright automation, authored by the frontend workstream engineer who owns the nav UI |
| 7 | **Upload an image (happy path)** | UC-006 | TC-006-01, -02 | **Added back.** The security-critical sub-cases (`TC-006-03`, `-04`) were already automated as integration tests in v1.0 and remain so (§5.1); this adds the happy-path UI flow to E2E, closing the last manual-only gap in the Top 5/7 |

All 56+ TC IDs from `UC-001`…`UC-007`, plus the new IDs assigned in §5.5 and §9.11, remain valid test cases. The Top 7 selection now governs **CI frequency emphasis** more than "automated vs. not" — with all seven UCs automated, the distinction v1.0 drew between "Top 5" and "everything else" is largely closed. The full case list lives under `backend/src/test/` (unit/integration/contract) and `tests/e2e/` (Playwright, repo root), ID-for-ID against the UC files.

### 4.1 API contract tests are not E2E

A schema-conformance failure is a **contract** test failure (§1.2, §5.5), authored and run entirely within the backend's own test suite — it does not require a browser and does not belong in the E2E count. Conflating the two would hide contract drift behind slower, flakier browser tests; keeping them separate means a drift regression is caught in the PR stage (`mvn verify`), not after a full Playwright run.

### 4.2 Orchestrating two services for E2E

| Environment | Orchestration | Detail |
|---|---|---|
| Local (engineer machine) | `docker-compose.yml` at repo root: `backend` (Spring Boot, built via Maven), `frontend` (Next.js), `postgres` (local dev instance, or reused from the engineer's own local PostgreSQL per ADR-012 §2.2) | `npm run e2e` (or equivalent) brings up the compose stack, waits on both services' health endpoints, then runs Playwright against the frontend origin |
| CI | Same `docker-compose.yml`, run as a CI job after both the backend and frontend PR/merge jobs pass independently | The E2E job never builds against a service that has not already passed its own unit/integration suite — this keeps a slow, flaky cross-service failure from masking a fast, precise one-service failure |
| Health-gating | Both services expose a health endpoint (`/actuator/health` for Spring Boot; a lightweight `/api/health` route for Next.js) | The E2E runner polls both before starting Playwright; a service that fails to start is a **setup failure**, reported distinctly from a test failure, matching the NFR-USE-01 pre-flight discipline in §2.4 |

---

## 5. Security Testing

Mapped to the 6 mandatory `NFR-SEC-*` cards, OWASP Top 10, `FR-AUTH-008`, and — new in v2.0 — the `CONST-TECH-07` class of direct-API negative tests.

### 5.1 Mandatory NFR-SEC cards

| REQ-ID | Requirement | Test | Where | Level |
|---|---|---|---|---|
| `NFR-SEC-AUTH` | Google OIDC verified server-side; no password storage/reset flow | TC-004-01 (happy sign-in, E2E) + TC-004-07 (schema/storage inspection: assert no password/hash column exists) + unit tests on OIDC token verification (signature/audience/issuer/nonce, per ADR-012 Decision 4) | Backend (verification, schema) + E2E (sign-in) | Security audit + backend unit/integration |
| `NFR-SEC-PII` | Account/audit/ai-usage data restricted by role, never exposed to `guest`/unauthenticated, **and role is read server-side on every request, never from a client header or claim** (ADR-012 Decision 4) | Backend integration test: request ai-usage/account endpoints as each role directly against the API; security audit of response payloads for over-exposure; a dedicated test asserting a forged/absent role claim is ignored server-side | Backend integration + security audit | Integration + security audit |
| `NFR-SEC-SANITIZE` | All rich content sanitised **in the backend** before persistence; the frontend's sanitiser is advisory only (`CONST-TECH-07`) | TC-001-05 (UI paste, E2E) **plus** TC-001-15 (§5.5 — direct API call posting raw `<script>` content, bypassing the editor entirely) | Frontend (E2E) + Backend (direct-API, authoritative) | Security test (both levels) + SAST + code review |
| `NFR-SEC-UPLOAD` | Declared type + sniffed content type + size validated **in the backend**; stored outside executable paths | TC-006-03 (disguised executable) + TC-006-04 (oversized) + backend integration test asserting the storage bucket/path is not web-executable — all as direct calls against the media API, not routed through the browser | Backend integration | Security test |
| `NFR-SEC-CHANNEL` | TLS on all external calls; CORS restricted to the frontend's known origin(s); `/api/ingest` bearer secret scope-limited | Security audit: TLS-only config at the GCP hosting layer (ADR-012 §2.1); **new**: CORS policy inspection — assert the backend accepts requests only from the frontend's registered origin, not `*`; confirm the ingest secret grants no access beyond `/api/ingest` | Backend config + security audit | Security audit |
| `NFR-SEC-SESSION` | Cookies `httpOnly`, `secure`, `sameSite`; TTL = 1 day (`AMB-006`); **new**: `SameSite` behaviour across the frontend/backend origin split (ADR-012 Decision 4 — "a new attack surface that did not exist in the single-service design") | TC-004-08 (old session cookie rejected after sign-out) + security audit of cookie flags/TTL + **new cross-origin cookie test**: confirm the session cookie is scoped and sent correctly across the two origins without falling back to a permissive `SameSite=None` without `Secure` | Backend (session issuance) + cross-origin config | Security audit + integration |

### 5.2 `CONST-TECH-07` — validation and authorisation are authoritative in the backend

> *"All validation and authorisation are authoritative in the backend. Client-side validation is advisory only and no write path may depend on it."* (ADR-012 §3)

This is a **named test category**, not a single test. The frontend's `validate.ts` (repurposed per ADR-012 as an advisory pre-check) can be entirely correct and the system can still be broken if the backend trusts it. The class of test this demands: **call the API directly — via REST-assured/curl/an HTTP client, with no browser, no frontend process, no UI involved at all — and confirm the backend still rejects what it should reject.** A Playwright test that only drives the browser proves nothing about this, because a browser always goes through the frontend's validator first; only a direct call skips it.

| Requirement covered | Direct-API test | Test ID |
|---|---|---|
| `FR-AUTH-008` — an `admin` must not reach account management even by direct call | Authenticate as `admin`, issue the request directly against the users/roles REST endpoint — no browser session, no UI navigation | TC-004-09 (§5.5) |
| `FR-CONT-009` — block-type/order schema validation | POST a block payload with an invalid block type / out-of-vocabulary type directly to the pages API | TC-001-14 (§5.5) |
| `NFR-SEC-SANITIZE` | POST a raw `<script>` payload directly to the pages API, bypassing the editor's own sanitiser entirely | TC-001-15 (§5.5) |
| `FR-AUTH-005`/`006` — role ladder | Direct-API role-ladder matrix: all 4 roles × all page-minimum-roles, issued as raw HTTP requests, not browser navigations | Covered by the existing OWASP A01 integration matrix (§5.3), now explicitly re-scoped as backend-only (no browser) |

### 5.3 OWASP Top 10

| ID | Item | Verification | Project-specific instance |
|---|---|---|---|
| A01 | Broken Access Control | Direct-API TC-004-03/-09 + backend integration role-ladder matrix (all 4 roles × all page-minimum-roles, HTTP-client only, no browser) | The `guest < user < admin < super admin` ladder, `FR-AUTH-005/006`; now explicitly backend-only per `CONST-TECH-07` |
| A02 | Cryptographic Failures | Security audit | Session cookie signing (backend), OAuth token verification (backend), no in-house crypto beyond what Google OIDC + Spring Security provide |
| A03 | Injection | Semgrep (both repos) + backend unit tests on the sanitiser + JPA/parameterised-query review (no raw SQL string concatenation) | Rich-content XSS (`NFR-SEC-SANITIZE`) remains the dominant surface; backend now also reviewed for JPQL/native-query injection |
| A04 | Insecure Design | Architecture review + `docs/design/threat-model.md` (STRIDE) — **new boundary B7 (frontend ↔ backend), TM-003 re-scored** per ADR-012 | Reviewed jointly with `architect`/`security-auditor` |
| A05 | Security Misconfiguration | Configuration inspection | **New**: Spring Boot Actuator endpoints not publicly exposed; CORS allow-list, not wildcard; env-var/secret exposure on both GCP services; `NODE_ENV`/Spring profile checks |
| A06 | Vulnerable Components | `npm audit`/Dependabot (frontend) **+ OWASP Dependency-Check via `mvn dependency-check:check`, free** (backend, new) | No paid Snyk/SBOM tooling — no budget signal with the team-size change, so the free-tooling stance is unchanged |
| A07 | Identification & Auth Failures | E2E (TC-004-01, -02, -04, -05, -08) + backend unit tests on OIDC verification | Google OIDC verified server-side; account lifecycle (deactivation, last-super-admin protection) |
| A08 | Software & Data Integrity Failures | Code review; `/api/ingest` bearer secret explicitly scoped and not reused for editorial write paths | Unchanged from v1.0 |
| A09 | Logging & Monitoring Failures | Audit log inspection (`FR-OPS-001/002/003`) | Failed sign-ins, permission denials, rejected uploads all in the audit trail — now written by the backend exclusively |
| A10 | SSRF | Semgrep (backend) | Low surface area — no user-supplied URL fetches in the design |

### 5.4 Secret scanning & SAST

| Level | Tool | Timing | Notes |
|---|---|---|---|
| L1 | `gitleaks` (`hooks/pre-commit-gitleaks.sh`, `hooks/gitleaks.toml`) | Pre-commit | Unchanged — scans both `backend/` and `frontend/` |
| L2 | Semgrep (community rules) + `npm audit` (frontend) + `mvn dependency-check:check` (backend, new) + `ci-security-auditor.yml` | CI/PR | The backend addition is new in v2.0 — a Java service has a dependency-vulnerability surface a Next.js-only project did not |
| L3 | `hooks/prod-gate-checklist.md` | Immediately before production deploy | Unchanged; add a line item confirming both services' health/actuator endpoints are not publicly exposed |

### 5.5 New Test IDs authored for v2.0 (contract + `CONST-TECH-07`)

Reusing the existing `TC-<UC>-<NN>` scheme — no parallel numbering. Assigned against the next free sequence number per UC file, same pattern already used for the v1.0 gaps (`TC-001-11`, `TC-001-12`).

| Test ID | UC | Purpose | Level |
|---|---|---|---|
| TC-001-13 | UC-001 | Pages API (create/update/publish) response conforms to the published OpenAPI schema | Contract |
| TC-001-14 | UC-001 | Direct API call posts an invalid/out-of-vocabulary block type, bypassing the editor's own validator (`CONST-TECH-07`, `FR-CONT-009`) | Security (negative) |
| TC-001-15 | UC-001 | Direct API call posts raw `<script>` content, bypassing the editor's sanitiser (`CONST-TECH-07`, `NFR-SEC-SANITIZE`) | Security (negative) |
| TC-002-08 | UC-002 | Pages-creation API response conforms to schema | Contract |
| TC-003-06 | UC-003 | Navigation API response conforms to schema | Contract |
| TC-004-09 | UC-004 | **Direct API call** (no browser, no UI) as `admin` against the users/roles endpoint — the authoritative `FR-AUTH-008` test demanded by `CONST-TECH-07` | Security (negative) |
| TC-004-10 | UC-004 | Users/roles API response conforms to schema | Contract |
| TC-005-11 | UC-005 | Reader API response conforms to schema; CORS/`SameSite` behaviour verified across the two origins (ADR-012 Decision 4) | Contract + security |
| TC-006-09 | UC-006 | Media/upload API response conforms to schema | Contract |
| TC-007-09 | UC-007 | i18n/staleness API response conforms to schema | Contract |

All ten are authored in Sprint 1, same as the two v1.0 gaps, and folded into §9's traceability and §11's regression ledger from that point on.

---

## 6. Load Testing

Scaled to `NFR-SCALE-01` (200 pages/language, 10 concurrent editors, internal reader volume) — this target is **unchanged by `CONST-RES-02`**. Six developers do not mean the documentation site suddenly serves more readers; running an enterprise-scale rig here would still be cargo-culting the `sg-gw` financial-services load profile onto a project whose actual scale hasn't moved. What changed is **cadence**, which was a capacity trade-off, not a scale one.

| Scenario | Target load (2× SLA basis) | Duration | Pass criteria | Maps to |
|---|---|---|---|---|
| Reader page load | 20 concurrent reader sessions (2× the stated conservative assumption of ~10 concurrent internal readers, flagged for PM confirmation at G2, unchanged from v1.0) | 15 min sustained | **P95 < 1s**, error rate < 1% | `NFR-PERF-01` |
| Admin save action | 20 concurrent save operations against the backend API (2× `NFR-SCALE-01`'s literal ceiling of 10 concurrent editors) | 10 min | **P95 < 2s**, error rate < 1% | `NFR-PERF-02` |
| Editor becomes interactive | 20 concurrent editor page loads (frontend, backed by the API) | 10 min | **P95 < 2s** time-to-interactive | `NFR-PERF-03` |
| Full-scale content check | Backend database seeded to 200 pages × 3 languages (600 rows) before the above runs | — | No degradation versus a lightly-seeded DB (catches missing indexes early) | `NFR-SCALE-01` |
| **New — CI smoke run** | 5 concurrent sessions, 2 min, against a staging or ephemeral compose stack | 2 min | No error-rate regression versus the prior run (directional, not a pass/fail SLA gate) | Fast feedback on every merge to `main` (§1.3) — affordable now with CI capacity, not run manually by one person |

**Explicitly still not tested**: sustained 24-hour throughput, daily-transaction-volume runs, multi-region load distribution — this remains a proportionality call, unchanged by team size.

**Cadence**: CI smoke run on every merge to `main` (new, cheap, catches gross regressions fast); full 2×-SLA run once per independently-shippable slice (unchanged cadence from v1.0 — the full run is still expensive enough that six engineers pushing daily doesn't justify running it on every merge).

---

## 7. Accessibility Testing

| Item | v1.0 | v2.0 |
|---|---|---|
| Scope | The 5 automated E2E flows only | **All 7 automated E2E flows**, plus a scripted axe pass over **every page in a doc set as it migrates** (not just flow-adjacent pages) — added back because scanning is cheap and scriptable; it was scoped down in v1.0 purely because authoring 2 extra E2E flows to scan was the actual cost driver, and that cost is now affordable |
| Full manual WCAG 2.1 AA certification of all 105 pages | Explicitly out of scope, stated as a limitation | **Still out of scope.** This is a proportionality call, not a capacity one: manually certifying 105 pages against the full AA checklist is disproportionate to an internal documentation tool regardless of team size. What changed is the automated scan's breadth (all pages, not just 5 flows), which catches the highest-value class of violation (missing labels, contrast, keyboard traps) at near-zero marginal cost |
| Tooling | `@axe-core/playwright`, inside the Playwright suite | Unchanged, extended: the migration script that verifies content-fidelity (§8) also triggers an axe scan per migrated page as a side effect, so the two checks share one pass over each doc set rather than running twice |
| Pass bar | Zero critical/serious axe violations on scanned flows | Zero critical/serious axe violations, now across the wider scan surface |
| `FR-MEDIA-005` (alt text) | TC-006-08 — warned, not blocked | Unchanged |
| Ownership | frontend-developer produces results, qa-engineer verifies | Unchanged in principle; now frontend workstream (plural) produce results per doc set as it ships, qa-engineer verifies the pass bar before that doc set's slice is marked done |

---

## 8. Content-Fidelity Verification (replaces Parity Testing)

### 8.1 Why Parity Testing is N/A here (unchanged from v1.0)

Marked N/A, with rationale, per Skill 07's instruction to downgrade a criterion that does not fit the project's nature:

- Byte-level equivalence assumes the new system reproduces the old system's *output* exactly for the same *input*. This project is **not** a 1:1 port — content moves from 32 hand-styled CSS-class block types to a reduced 8–10 type block vocabulary (`CONST-TECH-04`). A byte-comparison would fail on every page by design.
- The rendering model changes (static-generated JSX → database-backed blocks rendered on demand). There is no shared "legacy output"/"new output" pair for the same code path to diff.
- **Unaffected by the two-service split or the larger team** — the rationale is about the content model, not the architecture or headcount.

### 8.2 The substitute: Content-Fidelity Verification (unchanged method)

Every one of the 105 authored panels survived the migration, is present, and reads correctly.

**Deliverable**: `qa/content-fidelity-checklist.csv`, one row per (doc set × slug × locale), up to 315 rows.

| Column | Meaning |
|---|---|
| `doc_set` | jex3.0 / jex2.0 / coach / idea / workflow / ai-usage |
| `slug` | Page identifier |
| `locale` | en / km / ko |
| `tier` | A (fully editable), B (embed), C (ai-usage) |
| `structural_check` | PASS/FAIL — automated: page exists in the backend DB, has ≥1 block, has a published version |
| `block_count_expected` / `block_count_actual` | Derived from the AS-IS source vs. queried from the backend DB via its API (not a direct DB query from a script — keeps the check honest about what a real client sees) |
| `manual_readthrough` | PASS/FAIL — human comparison against a fixed checklist |
| `notes` | Any accepted content loss (expected per the 32→10 block reduction, `RISK-002`) |

**Manual read-through checklist** (per panel): all prose/headings/callouts present; tables preserved (81 tables in AS-IS); copyable code blocks present and functional (183 instances, `FR-CONT-011`); Tier B embeds render and are interactive; internal links resolve; all 3 locales present for Tier A/B content.

### 8.3 Sequencing and ownership — parallelised, not serial

v1.0 ran this serially because one developer had no choice. With `CONST-RES-02`, the content-migration workstream can run fidelity verification **per doc set in parallel** with backend/frontend feature work, rather than as a single-threaded bottleneck at the end of each doc set's migration. The sequencing itself is unchanged (Proposal §8.1's order: `jex2.0` first, then `coach` early to find where the block model breaks, then the rest) — what changed is that more than one doc set's verification can be in flight at once.

**Exit criterion, unchanged**: 100% of a doc set's rows marked PASS before that doc set's slice is considered done.

### 8.4 Tooling and the `CONST-OPS-01` constraint (unchanged, binding on more people now)

Any fixture-generation or content-extraction script **must never use Windows PowerShell 5.1 for bulk text operations** (`Get-Content`/`-replace`/`Set-Content`) — it corrupts UTF-8 (em-dashes, Korean, Khmer) (`CONST-OPS-01`). This is now binding on **five engineers**, not one, so it is worth restating plainly rather than assuming it will be remembered: extraction/comparison scripts are Node.js/TypeScript or Python with explicit `encoding='utf-8'`, never PowerShell text cmdlets. The one-time round-trip verification of the tooling itself (fixed em-dash/Korean/Khmer sample, byte-diffed) is unchanged and remains a gating check before the tool is trusted against real content.

---

## 9. Traceability — Must Requirements to Tests

Every **Must**-priority requirement mapped to at least one test, reusing existing `TC-xxx-yy` IDs. New rows below cover the constraints added or changed by ADR-012 and `CONST-RES-02`; all other rows carry over from v1.0 unchanged unless noted.

### 9.1 Content Authoring (`FR-CONT-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-CONT-001 | TC-001-01 | E2E |
| FR-CONT-002 | TC-001-01, TC-001-09 | E2E |
| FR-CONT-003 | TC-001-01, TC-001-02 | E2E |
| FR-CONT-004 | TC-001-01 | E2E |
| FR-CONT-005 | TC-001-01, TC-001-03 | E2E |
| FR-CONT-006 | TC-002-01 | E2E |
| FR-CONT-007 | TC-002-07 | E2E |
| FR-CONT-008 | TC-002-01 | E2E |
| FR-CONT-009 | Backend unit test (block-type/order validator, authoritative per `CONST-TECH-07`) + TC-001-14 (direct-API negative) + TC-002-01 | Unit + security (negative) + E2E |
| FR-CONT-010 | TC-002-04 | Integration (backend) |
| FR-CONT-011 | TC-001-11 (assigned Sprint 1, v1.0 gap, carried over) | E2E |
| FR-CONT-012 | TC-001-07 | E2E |
| FR-CONT-013 | TC-001-04 | Integration (backend) |

### 9.2 Navigation (`FR-NAV-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-NAV-001 | TC-003-01 | E2E (added back — was integration+manual in v1.0, §4) |
| FR-NAV-002 | TC-003-03 | E2E |
| FR-NAV-004 | TC-003-02 + schema review | Schema review + integration |
| FR-NAV-005 | TC-003-01 | Integration |

### 9.3 Translation (`FR-I18N-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-I18N-001 | Schema review + TC-007-08 | Schema review |
| FR-I18N-002 | TC-007-02 | Integration |
| FR-I18N-003 | TC-007-01, TC-007-04 | E2E |
| FR-I18N-004 | TC-007-03 | Integration |
| FR-I18N-005 | TC-007-07 | E2E |

### 9.4 Media (`FR-MEDIA-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-MEDIA-001 | TC-006-01 | E2E (added back — happy-path UI flow now automated, §4) |
| FR-MEDIA-002 | TC-006-01 | E2E |
| FR-MEDIA-004 | TC-006-03, TC-006-04 (direct-API against the media endpoint, backend-authoritative per `CONST-TECH-07`) | Security test |

### 9.5 Authentication / Authorization (`FR-AUTH-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-AUTH-001 | TC-004-01 | E2E |
| FR-AUTH-002 | TC-004-07 | Security audit / schema review |
| FR-AUTH-003 | TC-004-04, TC-004-05 | E2E |
| FR-AUTH-004 | TC-004-06 | E2E |
| FR-AUTH-005 | TC-005-06, TC-001-08 + backend-only role-ladder matrix (§5.3) | Integration + security audit |
| FR-AUTH-006 | TC-005-06 + backend-only role-ladder matrix (§5.3) | Integration |
| FR-AUTH-007 | TC-004-08 | E2E |
| **FR-AUTH-008** | **TC-004-03** (UI deep-link) **+ TC-004-09** (direct API, no browser — the authoritative test per `CONST-TECH-07`, §5.2/§5.5) | Security test (negative), both levels required |

### 9.6 Reader Experience (`FR-READ-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-READ-001 | TC-005-01 | E2E |
| FR-READ-002 | TC-005-02 | E2E |
| FR-READ-003 | TC-005-03, TC-003-04 | Integration |
| FR-READ-004 | TC-005-07 | E2E |
| FR-READ-005 | TC-005-09 | E2E |

### 9.7 Operations / Audit (`FR-OPS-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-OPS-001 | TC-001-12 (assigned Sprint 1, v1.0 gap, carried over — now a backend-only integration test since audit writes happen in the backend exclusively) | Integration |
| FR-OPS-002 | TC-004-02, TC-004-03 | Integration |
| FR-OPS-003 | TC-006-03, TC-006-04 | Integration |

### 9.8 Non-Functional Requirements

| REQ-ID | Test ID(s) / Method | Level |
|---|---|---|
| **NFR-USE-01** | Dedicated observed task procedure, §2 (Pann Voleak named). TC-001-09 is the UC-level marker | Observed task test |
| NFR-USE-02 | TC-001-09 + design review (no code/JSX/Markdown/HTML/git/deploy step in any flow) | Task test + review |
| NFR-PERF-01 | Load test "Reader page load", §6 | Load test |
| NFR-PERF-02 | Load test "Admin save action", §6 | Load test |
| NFR-PERF-03 | Load test "Editor interactive", §6 | Load test |
| NFR-SEC-AUTH | §5.1 | Security audit + backend unit/integration |
| NFR-SEC-PII | §5.1 | Backend integration + security audit |
| NFR-SEC-SANITIZE | §5.1, §5.2 (TC-001-05 + TC-001-15) | Security test (both levels) + code review |
| NFR-SEC-UPLOAD | §5.1 (TC-006-03/04) | Security test |
| NFR-SEC-CHANNEL | §5.1 — now includes CORS policy inspection | Security audit |
| NFR-SEC-SESSION | §5.1 (TC-004-08) — now includes cross-origin cookie test | Security audit + integration |
| NFR-AVAIL-01 | Declaration/review only | Review |
| NFR-SCALE-01 | Load test "Full-scale content check", §6 + architecture review | Load test + architecture review |
| NFR-COMPAT-01 | Cross-browser pass (Chrome/Edge/Firefox/Safari incl. mobile) on all 7 E2E flows; TC-005-10 (mobile) | Cross-browser test |
| NFR-COMPAT-02 | Cross-browser pass (Chrome/Edge desktop) on admin console flows | Cross-browser test |
| NFR-OPS-AUDIT | TC-001-12 companion check (assigned Sprint 1, v1.0 gap, carried over): attempt an UPDATE/DELETE on an audit row directly against the backend and confirm rejection at the DB/application layer | Operational audit |
| NFR-OPS-BACKUP | Manual restore drill, once before go-live. **Note**: production database provider is still open (ADR-012 §2.3); the drill is authored against whichever provider is chosen, and must not assume a specific cloud database's backup mechanism (see §10) | Backup inspection + restore drill |
| NFR-I18N-01 | TC-007-08 | Translation status screen |
| NFR-EXT-01 | Architecture review only | Architecture review |

### 9.9 Constraints (`CONST-`)

| REQ-ID | Test ID(s) / Method | Level |
|---|---|---|
| CONST-TECH-01 | Architecture review — frontend is presentation-only, no DB access | Architecture review |
| CONST-TECH-02 | Architecture review — Vercel retained as frontend hosting | Architecture review |
| **CONST-TECH-03** | Architecture review + ADR-010 | Architecture review |
| **CONST-TECH-04** | Schema review — count the shipped block-type registry, assert 8 ≤ n ≤ 10 | Schema review |
| **CONST-TECH-05** | **New.** Architecture review confirming two independently deployable services; integration test confirming the frontend has no direct DB credentials/connection string in its runtime config | Architecture review + integration |
| **CONST-TECH-06** | **New.** CI toolchain-verification step (§12) confirms `backend/` builds under Java 21 / Spring Boot 3.4 / Maven, matching `pom.xml` | Toolchain verification (CI) |
| **CONST-TECH-07** | **New.** The direct-API negative test class in full: TC-001-14, TC-001-15, TC-004-09, plus the backend-only role-ladder matrix (§5.2, §5.3, §5.5) | Security test (negative), mandatory |
| **CONST-TECH-08** | **New.** Architecture/config review confirming no provider-proprietary Postgres features or storage-API calls anywhere in `backend/`; test environments run against plain PostgreSQL 15+ only (§10, §13) | Architecture review + config review |
| CONST-OPS-01 | Tooling round-trip check, §8.4 | Tooling review |
| CONST-OPS-02 | TC-005-02 | E2E |
| CONST-OPS-03 | Rollback test, §11.2 | Release review |
| CONST-SEC-01 | Deliverable check — a security ADR exists under `docs/design/adr/` before G2 | ADR review |
| CONST-PROC-01 | Gate record inspection — `docs/.harness-state.yaml` shows a human approver, never the AI | Gate record inspection |
| ~~CONST-RES-01~~ | Superseded — retained here only so the traceability record shows what v1.0 was sized against | Plan review (historical) |
| **CONST-RES-02** | **New.** This document itself — every section states an automation/manual/cadence decision sized to six developers across two services, and explicitly distinguishes capacity-driven scope from proportionality-driven scope (§0) | Plan review |

### 9.10 Should-priority requirements (best-effort, not gating)

| REQ-ID | Test ID(s) |
|---|---|
| FR-NAV-003 | TC-003-04 |
| FR-I18N-006 | TC-002-05 |
| FR-MEDIA-003 | TC-006-05, TC-006-06 |
| FR-MEDIA-005 | TC-006-08 |
| FR-READ-006 | TC-005-04 |
| NFR-AVAIL-02 | TC-005-08 |
| NFR-OPS-VERSION | Schema/query check — assert ≥ 20 versions retained per page after repeated edits |

### 9.11 Summary of Gaps

| Gap | Root cause | Remediation |
|---|---|---|
| `FR-CONT-011` has no dedicated `TC` id | Carried over from v1.0 — described only in UC-001's alt-flow narrative | Author `TC-001-11` in Sprint 1 (unchanged from v1.0) |
| `FR-OPS-001` / `NFR-OPS-AUDIT` have no dedicated `TC` id | Carried over from v1.0 | Author `TC-001-12` in Sprint 1, now explicitly scoped as a backend-only integration test (unchanged remediation, updated scope) |
| API contract and `CONST-TECH-07` direct-API tests did not exist as a category | New in v2.0, forced by `CONST-TECH-05`/`07` | Author TC-001-13/-14/-15, TC-002-08, TC-003-06, TC-004-09/-10, TC-005-11, TC-006-09, TC-007-09 in Sprint 1 (§5.5) |

Two carried-over gaps plus ten new v2.0 test IDs to author in Sprint 1 — all flagged now, not discovered at Skill 5.

---

## 10. Test Data Strategy

| Item | Rule |
|---|---|
| PII | **Never use real PII.** No real employee names/emails in test fixtures for accounts, audit logs, or ai-usage data — synthetic accounts only (e.g. `test-admin-1@example.test`), on every engineer's local environment, not just one |
| Content fixtures | Derived from the real `content/{en,km,ko}/*` source for content-fidelity verification (§8) — documentation prose, not PII |
| km/ko fixture handling | **Binding on all five engineers, not one.** Never generate, transform, or bulk-edit km/ko (or en) fixture text using Windows PowerShell 5.1's text cmdlets (`CONST-OPS-01`). Node/TS or Python, explicit UTF-8 only. See §8.4 |
| Backend test database | **Testcontainers-managed ephemeral PostgreSQL 15+ for unit/integration tests — never a shared, mutable seed DB.** This keeps six engineers' CI runs isolated from each other; two PRs running concurrently never contend for the same database state |
| Cloud-database portability (`CONST-TECH-08`) | **Test environments must not assume a specific cloud database provider.** No test, fixture, or CI config may hardcode a Cloud SQL/Neon/Supabase-specific connection string, extension, or feature — only plain PostgreSQL 15+ over JDBC. This is what keeps ADR-012 §2.3's still-open production-provider decision non-blocking: whichever provider is chosen before first deploy, the entire test suite already runs unmodified against it | 
| Local development database | Per ADR-012 §2.2: each engineer runs **PostgreSQL locally, administered with pgAdmin**. pgAdmin is the admin client, not the database itself — both are required in local setup. Flyway applies the same `V1__initial_schema.sql` locally as everywhere else, so local, CI (Testcontainers), staging and production all run identical schema | 
| Seed volume for load tests | 200 pages × 3 languages (600 page-rows) to match `NFR-SCALE-01` — unchanged | 
| Environments | Local: hand-built fixtures + a small seeded set, per engineer. CI: Testcontainers-ephemeral, per run. Staging: the same synthetic fixture set, scaled up for load tests, on plain PostgreSQL regardless of eventual production provider. **Never** production data copied to dev/staging | 
| Regression fixtures | Each accumulated regression case (§11) carries its own minimal fixture, checked into `tests/fixtures/` (or `backend/src/test/resources/` for backend-only cases), so CI runs are self-contained | 

---

## 11. Regression Strategy and the Rollback Test

### 11.1 Regression Accumulation

- After each sprint, every automated case that passed (unit, integration, contract, E2E, component) is retained in CI and re-run automatically on every subsequent push to `main` — structural via CI configuration, unchanged in principle from v1.0.
- `qa/regression-cases.md` tracks the accumulated automated case count per sprint, split by suite (backend unit / frontend unit / backend integration / contract / E2E) so growth is visible per workstream, not just as one number.
- **Sizing expectation, updated**: v1.0 explicitly sized this "at this project's actual scale rather than sg-gw's 200+ regression cases — a number sized for a funded team, not one person." With `CONST-RES-02`, the team is no longer one person, and the case count is expected to grow materially faster than v1.0 projected — this is not scope creep, it is the natural result of two new mandatory categories (contract, direct-API negative tests) plus two E2E flows added back. It will still likely land well under `sg-gw`'s count, since `sg-gw` was a funded financial-services migration at a different scale entirely — restated, not assumed.
- Manual-only cases (NFR-USE-01, the restore drill) are **not** re-run every sprint — re-run only when the flow they cover changes. (UC-003 and UC-006 happy path move from this list to the automated list per §4 — they are no longer manual-only.)

### 11.2 Rollback Test (`CONST-OPS-03`)

> *"From cutover the database is authoritative. The `site` branch must remain deployable as the rollback path until go-live sign-off."*

Unchanged by ADR-012 — this constraint concerns the legacy `site` branch's continued deployability on Vercel, independent of the new backend service.

| Item | Detail |
|---|---|
| What is tested | The legacy `site` branch (current compiled-TSX application) still builds and deploys successfully on Vercel, independent of the migration branch(es) |
| Method | Before each go-live checkpoint, and periodically during migration, build-and-preview-deploy the `site` branch as-is and smoke-test it renders as today |
| Pass criterion | `site` branch builds cleanly; preview deployment serves at least one page from each of the 6 top-level sections correctly |
| Rollback procedure itself | Documented in the `RUNBOOK` deliverable (Skill 6) |
| Exit condition | Retired **only** after a human-recorded go-live sign-off (`CONST-PROC-01`) in `docs/.harness-state.yaml` |
| Cadence | At minimum once before the first production cutover of any doc set, and once immediately before go-live sign-off |

---

## 12. Toolchain Verification (New — `CONST-RES-02`)

**Real, already-observed incident**: one developer reported Java 25 in their local environment while the project targets **Java 21** (`CONST-TECH-06`). One machine mismatching was tolerable-if-annoying under `CONST-RES-01`; six machines mismatching is a standing source of "works on my machine" defects and non-reproducible CI failures, and is treated here as an actual, checked risk — not a documentation reminder.

| Check | Mechanism | Enforcement point | Failure mode caught |
|---|---|---|---|
| Backend JDK version | `maven-enforcer-plugin` with a `requireJavaVersion` rule pinned to `[21,22)` in `backend/pom.xml` (recommended to the backend workstream for immediate addition — not yet present) | `mvn verify`, both locally and in CI | A build silently compiling/running against Java 25 (or any non-21 JDK), producing behaviour that only manifests on that engineer's machine or, worse, passes locally and fails in CI |
| Backend CI pin | GitHub Actions `actions/setup-java@vX` with `java-version: '21'`, `distribution: 'temurin'`, explicit in the workflow file | Every backend CI job | CI silently using a runner's default JDK instead of the pinned one |
| Frontend Node version | `.nvmrc` at `frontend/` root + `engines` field in `package.json` | Local (`nvm use`) + CI (`actions/setup-node` reading `.nvmrc`) | Node version drift across five engineers' machines |
| Maven version | Recorded in `README`/setup doc as a minimum version; not separately enforced (Maven itself is far less version-sensitive than the JDK for this project) | Setup doc | Proportionate — Maven version drift has not been observed as a real defect source; JDK drift has |
| First-setup check | A documented one-line check (`java -version` / `node -v`) each new engineer runs against the pinned versions before their first commit, referenced from the onboarding section of the setup docs (Skill 6 deliverable) | Manual, once per engineer | Catches the exact `CONST-RES-02` incident (Java 25 vs. 21) before it reaches a PR at all |

**Ownership**: the toolchain-verification CI step is a **required, non-optional** part of both the backend and frontend PR pipelines (§1.3) — a mismatch fails the build, it does not merely warn. This is deliberately stricter than v1.0's stance on any tooling check, because the risk it addresses (silent multi-machine drift) did not exist when there was only one machine.

---

## 13. 7-Dimension Self-Assessment

| Dimension | Weight | Assessment Criteria |
|---|---|---|
| Completeness | 20% | 100% of sprint tasks completed |
| Traceability | 15% | `// source:`-style comments / ADR references / this Test Plan's §9 table kept current |
| Security | 20% | Zero hardcoded secrets / PII access-restricted / hooks pass (§5.4) / `CONST-TECH-07` negative tests pass |
| Performance | 10% | NFR-PERF SLA met at the load-test cadence defined in §6 |
| Readability | 15% | Code comments / Mermaid diagrams in design docs / table alignment in deliverables |
| Standards compliance | 10% | Zero directory-isolation violations; ADRs exist where mandated (`CONST-SEC-01`); toolchain checks pass (§12) |
| Test coverage | 10% | This Test Plan's criteria met (§3, §9), across both suites |

- Threshold: kept at **90/100**, `[basis:sg-gw-retrospective,adjustable]` — unchanged.
- **Cadence, reverted from v1.0's capacity-driven relaxation**: v1.0 ran this once per shippable slice rather than every sprint, reasoning that "there is no team to escalate to" and "no deadline" made weekly runs disproportionate process overhead for one person. Both premises are gone under `CONST-RES-02` — there **is** a team now, and six people generate enough throughput per sprint that a per-sprint check has real signal. **Self-assessment now runs once per sprint**, restoring the harness default.
- Remediation loop: fix the lowest dimension, regenerate, up to 5 iterations. "Still below after 5 attempts" escalates to the PM — unchanged, now via the team-leader coordination role rather than a single developer stopping to ask directly, consistent with a six-person team structure.
- Cross-validation (Skill 5): kept as a **pre-release** check per shippable slice, unchanged from v1.0 — this was never purely a capacity trade-off, it is about spending a genuinely non-free check at the moment it matters most (release gates).

---

## 14. Test Environments

| Environment | Purpose | Data | Database |
|---|---|---|---|
| local | Each engineer's machine | Hand-built fixtures; small seeded set | **Local PostgreSQL 15+, administered with pgAdmin** (ADR-012 §2.2). Both must be installed — pgAdmin manages, it is not the database itself |
| CI | Every PR/merge | Testcontainers-ephemeral fixtures (backend); mocked/fixture data (frontend) | Testcontainers-provisioned PostgreSQL 15+, torn down after each run — never shared across concurrent CI jobs |
| staging | Pre-release verification, load tests, content-fidelity checks | Synthetic fixtures scaled to `NFR-SCALE-01` (600 page-rows); real (non-PII) content text for fidelity checks | **Plain PostgreSQL 15+, provider not yet fixed** (ADR-012 §2.3 — Cloud SQL, or a self-managed instance on Compute Engine, decided before first deploy). Per §10, no test may assume the eventual provider's specific features |
| prod | Live, on **Google Cloud** (ADR-012 §2.1) | Real data, once launched | Provider decided before first production deploy, not before first commit (ADR-012 §2.3) — this is a deliberately non-blocking, deferred decision, and this Test Plan is written so its suite runs unmodified whichever way it resolves |

> No separate "dev" tier distinct from "local" is maintained. Revisited for v2.0: with six engineers now working in parallel, a shared "dev" tier could reduce environment drift between them — but each engineer already runs an identical local stack (same Flyway migrations, same Docker Compose file, same pinned toolchain per §12), so a shared dev tier would mostly duplicate what CI's ephemeral environment already provides. Not added; flagged here as a deliberate call, not an oversight.

---

## 15. Defect Management

| Severity | CVSS / Signal | Handling |
|---|---|---|
| CRITICAL | ≥ 9.0, or any `FR-AUTH-008`-style access-control bypass (including a `CONST-TECH-07` direct-API bypass) | Fix before the next deploy of any kind, regardless of sprint boundary |
| HIGH | 7.0–8.9, **or any API-contract drift that silently breaks the frontend/backend integration (new in v2.0 — a failure mode that did not exist in a single-service design)** | Fix within the current shippable slice; blocks that slice's G3 |
| MEDIUM | 4.0–6.9 | Backlog, addressed opportunistically, tracked in the regression ledger (§11.1) |
| LOW | < 4.0 | Backlog |

NFR-USE-01 failures are handled outside this table — see §2.7 (they gate the slice's G3 directly, independent of CVSS).

---

## 16. Deliverables

| Deliverable | Timing | Format |
|---|---|---|
| Backend unit/integration/contract test results | Every backend CI run | CI output (JUnit XML, JaCoCo HTML) |
| Frontend unit/component test results | Every frontend CI run | CI output (Vitest/Jest) |
| E2E (all 7 flows) results | Every merge to `main` | CI output |
| `qa/api-contract-report-N.md` | Once per shippable slice, plus on any CI-detected drift | md (**new in v2.0**) |
| `qa/nfr-use-01-observation-N.md` | Before each shippable slice's G3 | md |
| `qa/content-fidelity-checklist.csv` | Once per migrated doc set | csv |
| `qa/regression-cases.md` | Updated each sprint, split by suite | md |
| `qa/load-test-N.md` | Once per shippable slice (full run); CI smoke-run results inline in CI output | md |
| Security audit report | Skill 5, per slice, covering both repos | md |
| Toolchain-verification CI evidence | Every CI run (§12) | CI output |
| `docs/design/threat-model.md` cross-reference | Alongside this plan (Skill 3) | md |
| Rollback test evidence | Before each cutover checkpoint and before go-live sign-off | Recorded in the sprint log / runbook |

Explicitly **not produced**: `parity/parity-report-N.md` in the byte-comparison sense — N/A per §8. The content-fidelity checklist substitutes for it, unchanged from v1.0.

---

**G2 Approval (Design Gate)**

| Date | Approver | Comments | Status |
|---|---|---|---|
| {YYYY-MM-DD} | PM | | {APPROVED/REJECTED/PENDING} |
| {YYYY-MM-DD} | QA Leader | | {APPROVED/REJECTED/PENDING} |

> Recorded by a human, never by the AI (`CONST-PROC-01`).
