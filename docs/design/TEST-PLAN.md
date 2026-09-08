# Test Plan — Coc Docs Platform

> **Version**: 1.0
> **Date**: 2026-09-08
> **Preceding**: [REQUIREMENTS-SPEC.md](../requirements/REQUIREMENTS-SPEC.md), [requirements-matrix.csv](../requirements/requirements-matrix.csv), [DEV-PLAN.md](DEV-PLAN.md)
> **Author**: qa-engineer (support agent, Skill 3)
> **Status**: DRAFT — awaiting G2

---

## 0. How to Read This Plan

`CONST-RES-01` — **one part-time developer, no deadline** — is the single most important shaping constraint on everything below. A test estate sized the way `sg-gw` (a funded, multi-agent financial migration) sized its estate is not executable here. Every section states, explicitly, what is automated, what is manual, and how often it runs — because for a solo developer, *frequency* is a cost decision as real as scope.

| What | Decision | Why |
|---|---|---|
| Unit + integration tests | Automated, run on every commit (CI) | Cheapest to write and cheapest to maintain solo; catches regressions for free once written |
| E2E (Top 5 flows) | Automated (Playwright), run on every push to `main` | Pays for itself: once written, regression re-runs are free. Anything beyond 5 flows is manual/exploratory |
| Load tests | Automated script (k6), run manually **once per shippable slice**, not every sprint | The NFR-SCALE-01 ceiling (200 pages, 10 editors) is small; frequent load testing would cost more developer time than the risk it retires |
| Security (SAST/secrets) | Automated, every commit / PR (hooks already exist in this harness) | Zero marginal cost once wired up |
| NFR-USE-01 (usability) | **Manual, human-observed, cannot be automated** | This is the project's central claim — see §2 |
| Content-fidelity (105 panels) | Semi-automated (structural script) + manual read-through, once per migrated doc set | Substitutes for parity testing (N/A here — see §8) |
| Accessibility | Automated smoke scan (axe) on the 5 E2E flows only | Full WCAG 2.1 AA certification of all 105 pages is out of proportion to one part-time developer; scoped down deliberately (stated as a limitation, not hidden) |

---

## 1. Test Strategy

### 1.1 Test Pyramid (solo-affordable shape)

```
        ┌────────────────────┐
        │   E2E — 5 flows    │   automated, regression-only after authoring
       ┌┴────────────────────┴┐
       │ Integration — ~25%   │   API routes, DB access, role middleware, staleness/versioning logic
      ┌┴──────────────────────┴┐
      │      Unit — ~70%       │   block schema validators, slug/redirect logic, sanitisation, RBAC guard
      └────────────────────────┘
```

The shape is unchanged from the template default — this is deliberate. Unit tests are the cheapest tests to maintain alone; a wide, thin E2E layer is the most expensive to maintain alone. The pyramid shape is *how* a solo developer affords testing at all, not a convention kept for its own sake.

### 1.2 Test Levels

| Level | Scope | Tooling | Entry criteria | Exit criteria | Who runs it |
|---|---|---|---|---|---|
| **Unit** | Block schema validators (8–10 types), slug generation/uniqueness, redirect resolution, sanitisation rules, RBAC role-comparison, staleness computation, optimistic-lock version check | Vitest (matches Next.js 15/Vite-adjacent tooling) or Jest + ts-jest | Function/module has a merged PR | Line ≥ 80% / branch ≥ 70% on **core domain logic only** (§3) | Solo developer, every commit (CI) |
| **Integration** | API routes (`/api/pages`, `/api/media`, `/api/users`) against a real Postgres via Testcontainers; role-ladder enforcement end-to-end through middleware; navigation render from DB; i18n staleness propagation | Vitest/Jest + Testcontainers (Postgres) + Supertest | API route implemented against the DB schema | All Must-priority API contracts covered (see §9); ≥ 70% branch on route handlers | Solo developer, every PR |
| **E2E** | Top 5 user-facing flows end-to-end through the real UI (§4) | Playwright | Flow's UI screens exist in a deployed preview | All 5 flows green on `main`; regression suite (accumulated cases, §11) also green | Solo developer (author) / CI (execution) |
| **Component (frontend)** | Editor blocks, block-menu, translation-status widget | Vitest + Testing Library | Component built | No regression in component snapshot/behavioural tests | frontend-developer authors → qa-engineer spot-verifies |
| **Accessibility** | The 5 E2E flows only (admin console), WCAG 2.1 AA subset (contrast, labels, keyboard nav, alt-text presence) | `@axe-core/playwright` embedded in the E2E suite; manual keyboard pass once per shippable slice | E2E flow exists | Zero axe **critical/serious** violations on scanned flows (not a full AA certification — see §7) | frontend-developer produces axe/Jest results → qa-engineer verifies pass bar, sends back if below standard |
| **Security** | OWASP Top 10, the 6 mandatory `NFR-SEC-*` cards, secret scanning, SAST | See §5 | Feature touches auth, PII, uploads, or rich-content rendering | Zero unresolved finding ≥ CVSS 7.0 | security-auditor (lead) + qa-engineer (negative-test authoring) |
| **Load** | Reader P95, admin-save P95, editor-TTI P95 at 2× NFR-PERF SLA, sized to NFR-SCALE-01 | k6 (lightweight, scriptable, free — no enterprise rig justified at this scale) | Staging environment mirrors prod config | P95 targets met at 2× load (§6); if missed, documented as a known limitation, not silently dropped | Solo developer, once per shippable slice (not every sprint) |
| **Content-fidelity** | Every one of the 105 authored panels, post-migration | Node/TS structural-check script + manual checklist | A doc set's migration is code-complete | 100% of that doc set's panels marked PASS | Solo developer, once per doc-set migration (§8) |

---

## 2. NFR-USE-01 — The Central, Non-Automatable Test

> **NFR-USE-01**: *"A named non-technical colleague edits and publishes a real page unaided, with no training beyond a one-page guide. Pass = completed without asking the PM."*

This is not a nice-to-have usability check. Per the Requirements Spec (§3.1): *"if it fails, the project has not delivered regardless of what else passes."* It gets a dedicated procedure, not a line in a table.

### 2.1 Why it cannot be automated

No test framework can assert "a real human, who has never seen this tool, was not confused." Playwright can prove the buttons work; it cannot prove the labels, the flow, and the one-page guide are comprehensible to someone who does not already know the answer. This is deliberately behavioural, not time-based (`AMB-003`).

### 2.2 Recruitment

| Item | Rule |
|---|---|
| Who | One named, real, non-technical colleague — a writer, PM-adjacent staff member, or domain owner who **does not currently code** (no TypeScript/JSX/git background). Not the PM. Not the developer. |
| Google account | Must have a Google Workspace account already provisioned via UC-004, at `admin` role, **before** the test starts (provisioning itself is not part of this test) |
| Prior exposure | Must **not** have watched the developer use the admin console, and must not have been shown the console before the test session |
| Sample size | One colleague, one session, per shippable slice that changes the editor UI materially. A second, *different* colleague is recruited for the re-test after any fix, to avoid learning-effect contamination (see §2.6) |

### 2.3 The one-page guide

The guide itself is a testable artifact, not a given. It is written by the developer, reviewed by nobody but the developer (solo constraint), and its **only validation is this test** — if the colleague cannot follow it, the guide fails, not just the console.

- Format: one printed or single-screen page. No links to a second document, no video.
- Content ceiling: task steps only (open console → find page → edit → preview → publish). No conceptual explanation of blocks, drafts, or staleness beyond what the task requires.
- Stored at: `docs/deliverables/ADMIN-QUICKSTART.md` (produced under Skill 6; referenced, not authored, here).

### 2.4 Script

1. Facilitator (the PM) hands the colleague the one-page guide and a single, specific, real task: *"Page X currently says Y. Change it to say Z, and publish the change."* The correction is a genuine one — pulled from an actual known content issue, not a synthetic placeholder — so the test also incidentally produces real value.
2. The colleague works alone, at their own machine, with the guide as their only reference.
3. The facilitator is present but **silent** by default: no unsolicited hints, no leaning over the shoulder, no "you're doing great" cues that imply progress or direction.
4. The facilitator has a stopwatch running for diagnostic purposes only — **NFR-USE-01 is explicitly not time-boxed (`AMB-003`)**; duration is recorded but never used as a pass/fail criterion.
5. Session ends when the colleague either (a) publishes successfully, (b) explicitly asks the facilitator a question, or (c) gives up.

### 2.5 What counts as "asking for help" (the pass/fail line)

This has to be defined precisely or the test is unfalsifiable.

| Counts as a fail-triggering ask | Does **not** count |
|---|---|
| "How do I save this?" / "Where's the publish button?" / "What does 'stale' mean?" | Asking what the *correct replacement wording* should be (Y→Z) — that is an editorial judgment call, not a system-usability failure |
| Any question directed at the PM/facilitator about *how to operate the console* | Muttering out loud while reading the guide, if not directed as a question |
| Asking the facilitator to intervene physically ("can you click it for me?") | Re-reading the one-page guide a second time unprompted |
| Opening a second tab to search "how to use [product]" (this is still "asking," just not asking the PM) | Using standard browser affordances (back button, zoom) |

The facilitator answers **only**: *"Try what makes sense to you; I've written down that you asked."* No system-usability question receives a real answer during the session — answering it would erase the very thing being measured.

### 2.6 Recording

| Field | Recorded |
|---|---|
| Colleague (name, role) | For accountability and to prevent reuse without a fresh naive tester |
| Task given | Verbatim page + intended correction |
| Result | PASS (published unaided) / FAIL (asked for help — quote the question) |
| Time taken | Diagnostic only, never gating |
| Every question/hesitation point | Verbatim, timestamped — this is the actual defect list if it fails |
| Guide revision needed? | Yes/No + what changed |

Output: `qa/nfr-use-01-observation-N.md` (N increments per attempt).

### 2.7 When it runs

- **First run**: before G3 of the `jex2.0` pilot slice (the smallest, first-shipped doc set — `CONST-RES-01`'s named pilot). This is the earliest point a real page and a real console both exist.
- **Re-run**: after any fix to the failure points, with a **different** colleague (never the same person twice — once someone has seen the flow, they are no longer naive).
- **Not re-run** on every sprint. Re-running this test has a real cost (a colleague's time); it is reserved for gate checkpoints, not routine regression.
- Ceiling: if 3 consecutive different colleagues fail, this blocks G3 for that slice regardless of every other passing test — per the Requirements Spec's own framing, no other result compensates for this one failing.

---

## 3. Coverage Targets

| Metric | Target | Scope | Rationale |
|---|---|---|---|
| Line coverage | ≥ 80% | **Core domain logic only**: block-schema validation, slug/redirect resolution, RBAC comparison, sanitisation, staleness/versioning, optimistic-lock logic | Kept at the `[basis:industry-convention]` default — this is exactly the code where a silent regression is expensive (security, data integrity) and where unit tests are cheap |
| Branch coverage | ≥ 70% | Same scope as above | Same rationale |
| Method coverage | Not tracked separately | — | An extra metric with no extra signal for a one-developer project; dropped rather than carried as unused ceremony |
| Excluded from coverage targets | Generated DB client code (Prisma/Drizzle), thin CRUD API wrappers with no branching, presentational React components with no logic | — | Chasing 80% across generated code and pure-presentation components would burn solo-developer time for near-zero regression protection. This is a **deliberate scope-down**, stated rather than hidden |
| Coverage tool | `vitest --coverage` (native V8 coverage) | — | Free, already in the Next.js/Vite-adjacent toolchain; no SonarQube — not proportionate to a one-person project's budget (`§8 PROJECT-PROPOSAL.md` — no budget allocated) |

---

## 4. E2E Top 5 Scenarios

Per `03-draft-dev-plan` §3, E2E is scoped to the top 5 core scenarios. Chosen from `UC-001`…`UC-007` on **KPI-criticality + regression-blast-radius**, not on volume of test cases per use case.

| # | Scenario | UC | Core TC IDs | Why it's Top 5 |
|---|---|---|---|---|
| 1 | Edit an existing page and publish it | UC-001 | TC-001-01, -02, -03, -04, -05 | **This is the project.** Per the Requirements Spec: "if UC-001 fails, nothing else matters." Also the direct measurement of the KPI (§9 PROJECT-PROPOSAL.md): zero deploys for a content change |
| 2 | Create an account and assign a role, then sign in | UC-004 | TC-004-01, -03 | Without this, UC-001 is only ever exercised by the PM — the bottleneck moves, it doesn't disappear (UC-004's own framing). TC-004-03 is also the mandatory `FR-AUTH-008` negative test (§5) |
| 3 | Read a documentation page (happy path + legacy URL + role denial) | UC-005 | TC-005-01, -02, -06 | The read path is what users already have today and must not regress (`NFR-PERF-01` is already a known trade-down — §3.2 Requirements Spec — so protecting it is higher-value here, not lower); `CONST-OPS-02` (legacy hash URLs) is a hard migration constraint with real inbound-bookmark blast radius |
| 4 | Create a new page in a section | UC-002 | TC-002-01, -02 | Second half of the KPI: TC-002-02 asserts `lib/i18n.ts`/`Sidebar.tsx` are untouched and no build runs — this is the literal, falsifiable definition of "no deploy" from the proposal's evidence table |
| 5 | Find and fix a stale translation | UC-007 | TC-007-02, -03 | The compensating control for a real, named regression (§7.1 Proposal): TypeScript's compile-time 100%-translation guarantee disappears at migration. If this flow silently breaks, translation coverage degrades with no signal — exactly the failure mode that produced the two untranslated pages that exist today |

**Deliberately not in the automated Top 5** (regression risk accepted, covered by manual/integration testing instead — stated, not hidden):

| UC | Reason for lighter treatment |
|---|---|
| UC-003 (reorder/rename navigation) | Lower blast radius — a wrong order is visible and trivially fixable in the UI, not a data-loss or security risk. Covered by integration test (`TC-003-02` single-source-of-truth) + manual click-through, not full Playwright automation |
| UC-006 (upload image) | Automate the **security-critical** sub-cases only (disguised executable, oversized file — `TC-006-03`, `-04`) as integration tests against the upload API; the happy-path UI flow is exercised manually once per release, since image upload has no KPI linkage and low regression frequency expected |

All 56 TC IDs from `UC-001`…`UC-007` remain valid test cases — the Top 5 selection governs **automation priority and CI frequency**, not which cases exist. The full case list is authored during Skill 4 (Sprint 1) and lives under `tests/e2e/` and `tests/integration/`, ID-for-ID against the UC files.

---

## 5. Security Testing

Mapped to the 6 mandatory `NFR-SEC-*` cards (Skill 02 §7), OWASP Top 10, and the negative test explicitly demanded by the brief (`FR-AUTH-008`).

### 5.1 Mandatory NFR-SEC cards

| REQ-ID | Requirement | Test | Level |
|---|---|---|---|
| `NFR-SEC-AUTH` | Google OIDC, no password storage/reset flow | TC-004-01 (happy sign-in) + TC-004-07 (schema/storage inspection: **assert no password/hash column exists anywhere in the schema**) | Security audit + integration |
| `NFR-SEC-PII` | Account name/email/audit records + ai-usage teammate data restricted by role, never exposed to `guest`/unauthenticated | Integration test: request ai-usage and account endpoints as each role (`guest` request rejected pre-auth; `user` sees only own usage; `admin`/`super admin` per role); security audit of API response payloads for over-exposure | Integration + security audit |
| `NFR-SEC-SANITIZE` | All rich content sanitised before render; author cannot inject executable markup | TC-001-05 (`<script>` paste blocked at publish) + SAST rule flagging any new `dangerouslySetInnerHTML` call site not routed through the sanitiser + code review | Security test + SAST + code review |
| `NFR-SEC-UPLOAD` | Declared type + actual sniffed content type + size validated; stored outside executable paths | TC-006-03 (disguised executable, sniffed-content rejection) + TC-006-04 (oversized) + integration test asserting the storage bucket/path is not web-executable | Security test |
| `NFR-SEC-CHANNEL` | TLS on all external calls; `/api/ingest` bearer secret scope-limited and explicitly **not** a template for editorial write paths | Security audit: confirm TLS-only config at the platform (Vercel) level; confirm the ingest secret grants no access beyond `/api/ingest`; confirm no editorial write endpoint reuses that secret pattern | Security audit |
| `NFR-SEC-SESSION` | Cookies `httpOnly`, `secure`, `sameSite`; single defined TTL | TC-004-08 (old session cookie rejected after sign-out) + security audit of cookie flags and **TTL = 1 day** (resolved value per `AMB-006`, RESOLVED 2026-09-08 — the code's existing `SESSION_DAYS = 1` is authoritative; `CLAUDE.md`'s "30 days" was the stale, incorrect value) | Security audit + integration |

### 5.2 Negative test — `FR-AUTH-008` (mandatory, explicit)

> *"An `admin` may not access account management, enforced server-side, not merely hidden in the UI."*

This is the one test in this plan flagged as **non-negotiable and independent of UI state**:

| Item | Detail |
|---|---|
| Test ID | TC-004-03 |
| Method | **Direct API/route call**, not a UI click-path. An automated integration test authenticates as an `admin`-role session and issues a request directly against the users/roles API route (and the admin-console URL for account management) **bypassing the UI entirely** |
| Pass condition | Server returns 403/redirect for **every** such request, regardless of whether the UI happens to hide the "Users & roles" menu item for that role |
| Why UI-hiding is insufficient | A hidden menu item is not a security control — anyone who guesses or is given the URL reaches it unless the server itself checks the role. This test exists specifically to catch "security by obscurity" regressions where a future refactor removes the server check but leaves the UI hidden |
| Cadence | Every PR touching `FR-AUTH-*` or the users/roles route; part of the regression suite thereafter (§11) |

### 5.3 OWASP Top 10

| ID | Item | Verification | Project-specific instance |
|---|---|---|---|
| A01 | Broken Access Control | E2E (TC-004-03) + integration (role-ladder matrix test: all 4 roles × all page-minimum-roles) | The `guest < user < admin < super admin` ladder, `FR-AUTH-005/006` |
| A02 | Cryptographic Failures | Security audit | Session cookie signing, OAuth token handling — no in-house crypto to audit beyond what Google OIDC + the framework provide |
| A03 | Injection | SAST (Semgrep community ruleset, free) + unit tests on the sanitiser and any raw SQL (if used outside an ORM) | Rich-content XSS (`NFR-SEC-SANITIZE`) is the dominant injection surface here — there is no SQL console exposed to users |
| A04 | Insecure Design | Architecture review + `docs/design/threat-model.md` (STRIDE, produced alongside this plan) | Reviewed jointly with `architect`/`security-auditor` in Skill 3 |
| A05 | Security Misconfiguration | Configuration inspection | Vercel env vars, DB connection string exposure, `NODE_ENV` checks |
| A06 | Vulnerable Components | `npm audit` / Dependabot (free, already GitHub-native) — no paid Snyk/SBOM tooling given zero budget | Proportionate substitute stated explicitly |
| A07 | Identification & Auth Failures | E2E (TC-004-01, -02, -04, -05, -08) | Google OIDC replaces the shared-password scheme; account lifecycle (deactivation, last-super-admin protection) |
| A08 | Software & Data Integrity Failures | Code review; no HMAC/signature scheme needed beyond the existing `/api/ingest` bearer secret, which is explicitly scoped and not extended | Lower relevance than in a financial-transaction system — stated, not padded with unnecessary controls |
| A09 | Logging & Monitoring Failures | Audit log inspection (`FR-OPS-001/002/003`) | Failed sign-ins, permission denials, rejected uploads all must appear in the audit trail |
| A10 | SSRF | Static analysis (Semgrep) | Low surface area — no user-supplied URL fetches exist in this application's design; noted as low-risk rather than skipped |

### 5.4 Secret scanning & SAST

| Level | Tool | Timing | Notes |
|---|---|---|---|
| L1 | `gitleaks` (already provisioned: `hooks/pre-commit-gitleaks.sh`, `hooks/gitleaks.toml`) | Pre-commit | No change from the standard harness — free, already wired |
| L2 | Semgrep (community rules, free) + `npm audit` + the existing `ci-security-auditor.yml` | CI/PR | SAST substitutes for a paid tool given zero budget (`§8 Proposal`); this is a stated trade-off, not an oversight |
| L3 | `hooks/prod-gate-checklist.md` | Immediately before production deploy | Unchanged |

---

## 6. Load Testing

Scaled to `NFR-SCALE-01` (200 pages/language, 10 concurrent editors, internal reader volume) — **not** an enterprise rig. Running k6 from a single developer machine or a small CI runner against staging is proportionate; anything larger would test infrastructure this project does not have and will not have.

| Scenario | Target load (2× SLA basis) | Duration | Pass criteria | Maps to |
|---|---|---|---|---|
| Reader page load | 20 concurrent reader sessions (2× an assumed internal peak of ~10 concurrent readers — the "internal-scale reader volume" in `NFR-SCALE-01` is not numerically specified elsewhere, so this is a stated, conservative assumption, flagged for PM confirmation at G2) | 15 min sustained | **P95 < 1s**, error rate < 1% | `NFR-PERF-01` |
| Admin save action | 20 concurrent save operations (2× the literal `NFR-SCALE-01` ceiling of 10 concurrent editors) | 10 min | **P95 < 2s**, error rate < 1% | `NFR-PERF-02` |
| Editor becomes interactive | 20 concurrent editor page loads | 10 min | **P95 < 2s** time-to-interactive | `NFR-PERF-03` |
| Full-scale content check | Database seeded to 200 pages × 3 languages (600 rows) before the above runs | — | No degradation versus a lightly-seeded DB (catches missing indexes early) | `NFR-SCALE-01` |

**Explicitly not tested**: sustained 24-hour throughput, daily-transaction-volume style runs, or multi-region load distribution — none of these have a basis in this project's actual scale (200 pages, 10 editors, internal readers). Including them would be cargo-culting the `sg-gw` financial-services load profile onto a documentation site. This is a deliberate scope-down.

**Cadence**: once per independently-shippable slice (e.g., after the `jex2.0` pilot, and again before wider rollout), not every sprint — consistent with §0's stated automation-vs-frequency trade-off.

---

## 7. Accessibility Testing

| Item | Decision |
|---|---|
| Scope | The 5 automated E2E flows (§4) only, plus the admin console's editor/block UI | Not all 105 reader-facing content pages — full-site WCAG 2.1 AA certification is disproportionate for one part-time developer and is **explicitly out of scope**, stated here rather than silently dropped |
| Tooling | `@axe-core/playwright`, run inside the same Playwright E2E suite | Zero additional infrastructure — reuses the E2E harness |
| Pass bar | Zero **critical/serious** axe violations on scanned flows | A pragmatic bar, not full AA sign-off |
| `FR-MEDIA-005` (alt text) | TC-006-08 — publishing without alt text is **warned, not blocked** (an accessibility nudge, not a hard gate, matching the requirement's `Should` priority) |
| Ownership | frontend-developer produces the axe/Jest results as part of component work; qa-engineer verifies the pass bar is met and sends the work back if not (per the standard hand-off in this role's brief) |

---

## 8. Content-Fidelity Verification (replaces Parity Testing)

### 8.1 Why Parity Testing is N/A here

The standard harness's Skill 3 §3 / Skill 5 checklist lists parity testing (byte-level legacy-vs-new output equivalence) as a migration deliverable. **It is marked N/A for this project**, with rationale, per Skill 07 §2.6/§5's instruction to downgrade a criterion that does not fit the project's nature rather than force it:

- Byte-level equivalence assumes the new system reproduces the old system's *output* exactly for the same *input* — the model that fits porting C to Java line-for-line.
- This project is **not a 1:1 port**. Content moves from 32 hand-styled CSS-class block types to a deliberately reduced 8–10 type block vocabulary (`CONST-TECH-04`). The Proposal (§8.1) states plainly: *"some pages will not look exactly as they do today."* A byte-comparison would fail on every single page by design, telling us nothing.
- The rendering model itself changes (static-generated JSX → database-backed blocks rendered on demand — Proposal §11.1). There is no shared "legacy output" and "new output" pair for the same code path to diff.

### 8.2 The substitute: Content-Fidelity Verification

What actually needs proving is narrower and more honest: **every one of the 105 authored panels survived the migration, is present, and reads correctly** — not that it is byte-identical.

**Deliverable**: `qa/content-fidelity-checklist.csv`, one row per (doc set × slug × locale), covering all 105 panels × 3 locales = up to 315 rows (fewer where a panel is Tier C / excluded, per the Proposal §4.2 tiering).

| Column | Meaning |
|---|---|
| `doc_set` | jex3.0 / jex2.0 / coach / idea / workflow / ai-usage |
| `slug` | Page identifier |
| `locale` | en / km / ko |
| `tier` | A (fully editable), B (embed, e.g. `HarnessDemo`/`OwnerTree`), C (ai-usage — decided per Skill 2) |
| `structural_check` | PASS/FAIL — automated: page exists in DB, has ≥1 block, has a published version |
| `block_count_expected` | Derived from the AS-IS source file (panel's approximate content chunks) |
| `block_count_actual` | Queried from the new DB |
| `manual_readthrough` | PASS/FAIL — human comparison of rendered new page against the AS-IS source, checked against a fixed checklist (below) |
| `notes` | Any accepted content loss (e.g. bespoke styling dropped per the 32→10 block reduction — expected and accepted per `RISK-002`) |

**Manual read-through checklist** (per panel, ticked by the solo developer):
- [ ] All prose/headings/callouts present, no missing paragraphs
- [ ] Tables preserved with correct row/column structure (81 tables in AS-IS)
- [ ] Copyable code blocks present and copy affordance still works (183 instances in AS-IS — `FR-CONT-011`)
- [ ] Tier B embeds (`HarnessDemo`, `OwnerTree`) render and are interactive, not broken placeholders
- [ ] Internal links resolve (no dangling references introduced by the migration)
- [ ] All 3 locales present for Tier A/B content (`FR-I18N-001`, `NFR-I18N-01`)

### 8.3 Sequencing (aligned with the migration order, not a single big-bang pass)

Per the Proposal's own recommended sequencing (§8.1): migrate and verify `jex2.0` first (smallest, 5 slugs), then the hardest content (`coach`, 1,707 lines) early to find where the block model breaks, then the rest. Content-fidelity verification runs **once per doc set as it migrates**, not once at the end — failing fast on the hard doc set costs a day; failing at the end costs the whole project (Proposal §8.1's own words).

**Exit criterion**: 100% of a doc set's rows marked PASS before that doc set's slice is considered done. A doc set is not "half fidelity-verified and shipped" — this is the closest equivalent this project has to parity's "100%, mandatory" rule.

### 8.4 Tooling and the `CONST-OPS-01` constraint

Any fixture-generation or content-extraction script used to build the expected/actual comparison **must never use Windows PowerShell 5.1 for bulk text operations** (`Get-Content`/`-replace`/`Set-Content`) — it reads UTF-8 as the Korean system codepage and corrupts em-dashes, Korean, and Khmer text (`CONST-OPS-01`, `CLAUDE.md:152`). This is binding on this exact tooling, since it processes the km/ko content directly.

- Extraction/comparison scripts: Node.js/TypeScript (`ts-node`) or Python with explicit `encoding='utf-8'`, never `Get-Content`/`Set-Content` for anything that reads or writes km/ko/en text.
- PowerShell may still be used to *invoke* such a script or check file existence — never to transform text content itself.
- **Verification of the tooling itself**: before it is trusted against real content, round-trip a fixed sample string containing an em-dash, Korean, and Khmer characters through the extraction/comparison pipeline and byte-diff (UTF-8) the output against the input. This is a one-time tooling test, not a per-panel one, but it is a gating check — a corrupted extraction tool would produce false FAILs (or worse, false PASSes) across all 315 rows.

---

## 9. Traceability — Must Requirements to Tests

Every **Must**-priority requirement (70 of 84) mapped to at least one test, reusing the existing `TC-xxx-yy` IDs from the use-case files rather than a parallel scheme. Where a Must requirement has no dedicated `TC` id in the use-case files as written, this is flagged as a **gap** — honestly, not silently patched — for explicit `TC` authorship in Sprint 1 of Skill 4.

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
| FR-CONT-009 | Schema review + unit test (block-type/order validator) + TC-002-01 | Schema review + unit + E2E |
| FR-CONT-010 | TC-002-04 | Integration |
| FR-CONT-011 | **Gap**: exercised narratively by UC-001's A-4 alt-flow but has no dedicated TC id today. Assign `TC-001-11` (copy-affordance renders and functions) in Sprint 1 | E2E (to be authored) |
| FR-CONT-012 | TC-001-07 | E2E |
| FR-CONT-013 | TC-001-04 | Integration |

### 9.2 Navigation (`FR-NAV-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-NAV-001 | TC-003-01 | E2E |
| FR-NAV-002 | TC-003-03 | E2E |
| FR-NAV-004 | TC-003-02 + schema review | Schema review + integration |
| FR-NAV-005 | TC-003-01 | Integration |

### 9.3 Translation (`FR-I18N-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-I18N-001 | Schema review + TC-007-08 (coverage measurement) | Schema review |
| FR-I18N-002 | TC-007-02 | Integration |
| FR-I18N-003 | TC-007-01, TC-007-04 | E2E |
| FR-I18N-004 | TC-007-03 | Integration |
| FR-I18N-005 | TC-007-07 | E2E |

### 9.4 Media (`FR-MEDIA-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-MEDIA-001 | TC-006-01 | E2E |
| FR-MEDIA-002 | TC-006-01 | E2E |
| FR-MEDIA-004 | TC-006-03, TC-006-04 | Security test |

### 9.5 Authentication / Authorization (`FR-AUTH-`)

| REQ-ID | Test ID(s) | Level |
|---|---|---|
| FR-AUTH-001 | TC-004-01 | E2E |
| FR-AUTH-002 | TC-004-07 | Security audit / schema review |
| FR-AUTH-003 | TC-004-04, TC-004-05 | E2E |
| FR-AUTH-004 | TC-004-06 | E2E |
| FR-AUTH-005 | TC-005-06, TC-001-08 | Integration + security audit |
| FR-AUTH-006 | TC-005-06 | Integration |
| FR-AUTH-007 | TC-004-08 | E2E |
| **FR-AUTH-008** | **TC-004-03** — mandatory negative test, see §5.2 | Security test (negative) |

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
| FR-OPS-001 | **Gap**: UC-001 Step 8 describes the audit write but no `TC` id asserts it directly. Assign `TC-001-12` (audit entry recorded: actor/action/target/timestamp) in Sprint 1 | Integration (to be authored) |
| FR-OPS-002 | TC-004-02, TC-004-03 | Integration |
| FR-OPS-003 | TC-006-03, TC-006-04 | Integration |

### 9.8 Non-Functional — Usability, Performance, Security, Availability, Scale, Compatibility, Operations, i18n/Extensibility

| REQ-ID | Test ID(s) / Method | Level |
|---|---|---|
| **NFR-USE-01** | Dedicated observed task procedure, §2. TC-001-09 is the UC-level marker | Observed task test |
| NFR-USE-02 | TC-001-09 + design review (no code/JSX/Markdown/HTML/git/deploy step in any flow) | Task test + review |
| NFR-PERF-01 | Load test scenario "Reader page load", §6 | Load test |
| NFR-PERF-02 | Load test scenario "Admin save action", §6 | Load test |
| NFR-PERF-03 | Load test scenario "Editor interactive", §6 | Load test |
| NFR-SEC-AUTH | §5.1 | Security audit |
| NFR-SEC-PII | §5.1 | Security audit |
| NFR-SEC-SANITIZE | §5.1 (TC-001-05) | Security test + code review |
| NFR-SEC-UPLOAD | §5.1 (TC-006-03/04) | Security test |
| NFR-SEC-CHANNEL | §5.1 | Security audit |
| NFR-SEC-SESSION | §5.1 (TC-004-08) | Security audit |
| NFR-AVAIL-01 | Declaration/review only — no test proves the absence of an SLA commitment | Review |
| NFR-SCALE-01 | Load test "Full-scale content check", §6 + architecture review | Load test + architecture review |
| NFR-COMPAT-01 | Cross-browser pass (Chrome/Edge/Firefox/Safari incl. mobile) on the Top-5 E2E flows; TC-005-10 (mobile) | Cross-browser test |
| NFR-COMPAT-02 | Cross-browser pass (Chrome/Edge desktop) on the admin console flows | Cross-browser test |
| NFR-OPS-AUDIT | **Gap, same root cause as FR-OPS-001**: retention/append-only property needs an explicit operational check (e.g., attempt an UPDATE/DELETE on an audit row and confirm it is rejected at the DB/application layer). Assign as a Sprint 1 integration test alongside `TC-001-12` | Operational audit (to be authored) |
| NFR-OPS-BACKUP | Manual restore drill, performed **once, before go-live** — not automated, not repeated routinely, per the requirement's own wording | Backup inspection + restore drill |
| NFR-I18N-01 | TC-007-08 | Translation status screen |
| NFR-EXT-01 | Architecture review only (no functional test — this is a design-shape property, verified when a second entity type is actually added, which is beyond MVP) | Architecture review |

### 9.9 Constraints (`CONST-`)

| REQ-ID | Test ID(s) / Method | Level |
|---|---|---|
| CONST-TECH-01 | Architecture review | Architecture review |
| CONST-TECH-02 | Architecture review | Architecture review |
| CONST-TECH-03 | Architecture review + ADR-001 | Architecture review |
| CONST-TECH-04 | Schema review — count the shipped block-type registry, assert 8 ≤ n ≤ 10 | Schema review |
| CONST-OPS-01 | Tooling round-trip check, §8.4 | Tooling review |
| CONST-OPS-02 | TC-005-02 | E2E |
| CONST-OPS-03 | Rollback test, §11.2 | Release review |
| CONST-SEC-01 | Deliverable check — a security ADR exists under `docs/design/adr/` before G2 | ADR review |
| CONST-PROC-01 | Gate record inspection — `docs/.harness-state.yaml` shows a human approver, never the AI, at each gate | Gate record inspection |
| CONST-RES-01 | This document itself — every section above states an automation/manual/cadence decision sized to one part-time developer | Plan review |

### 9.10 Should-priority requirements (best-effort, not gating)

Included for completeness — not required by the "every Must" rule, but cheap to state given the TC IDs already exist.

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
| `FR-CONT-011` has no dedicated `TC` id | The use-case files describe the copyable code block only in an alternative-flow narrative | Author `TC-001-11` in Sprint 1 |
| `FR-OPS-001` / `NFR-OPS-AUDIT` have no dedicated `TC` id | UC-001 Step 8 states the audit-write behaviour narratively but the Test Scenarios table (§7 of UC-001.md) does not enumerate it separately | Author `TC-001-12` in Sprint 1, covering both the write (`FR-OPS-001`) and the append-only/retention property (`NFR-OPS-AUDIT`) |

Two gaps out of 70 Must requirements. Both are logging/audit-trail assertions that are straightforward to add once the audit-log schema exists — flagged now rather than discovered at Skill 5.

---

## 10. Test Data Strategy

| Item | Rule |
|---|---|
| PII | **Never use real PII.** No real employee names/emails in test fixtures for accounts, audit logs, or ai-usage data — synthetic accounts only (e.g. `test-admin-1@example.test`), even in the developer's own local environment |
| Content fixtures | Derived from the real `content/{en,km,ko}/*.tsx` files for content-fidelity verification (§8) — this is not PII, it is documentation prose, and using the real content is the point (that's what "fidelity" means here) |
| km/ko fixture handling | **Binding**: never generate, transform, or bulk-edit km/ko (or en) fixture text using Windows PowerShell 5.1's text cmdlets (`CONST-OPS-01`). All fixture-generation scripts are Node/TS or Python with explicit UTF-8 encoding. See §8.4 for the mandatory round-trip verification of any such tool before it is trusted |
| Seed volume for load tests | 200 pages × 3 languages (600 page-rows) to match `NFR-SCALE-01`'s stated ceiling — not more, not less; over-seeding tests a scale this project doesn't have |
| Environments | Local: hand-built fixtures + a small seeded set. Dev/staging: the same synthetic fixture set, scaled up for load tests. **Never** production data — there is no production data yet pre-launch, and post-launch, real user/account data must never be copied down to dev/staging (a stricter, simpler rule than "anonymize it" — for a project this size, "don't copy it" is cheaper and safer than building anonymization tooling) |
| Regression fixtures | Each accumulated regression case (§11) carries its own minimal fixture, checked into `tests/fixtures/`, so CI runs are self-contained and don't depend on a shared mutable seed DB |

---

## 11. Regression Strategy and the Rollback Test

### 11.1 Regression Accumulation

Consistent with this role's standing rule ("accumulate regression cases; re-run all cases from previous sprints"), adapted to a solo, no-deadline project:

- After each sprint, every automated case that passed (Top-5 E2E, integration suite, unit suite) is retained in CI and re-run automatically on every subsequent push to `main` — the accumulation is structural (CI configuration), not a manual re-run ritual the developer has to remember.
- A running ledger, `qa/regression-cases.md`, lists the currently accumulated automated case count per sprint, so scope creep or silently-dropped tests are visible over time (mirroring the `sg-gw` precedent of tracking accumulated case counts, at this project's actual scale rather than "200+ regression cases" — a number sized for a funded team, not one person).
- Manual-only cases (UC-003, UC-006 happy path, NFR-USE-01, the restore drill) are **not** re-run every sprint — they are re-run only when the flow they cover changes, per §0's stated cadence discipline.

### 11.2 Rollback Test (`CONST-OPS-03`)

> *"From cutover the database is authoritative. The `site` branch must remain deployable as the rollback path until go-live sign-off."*

| Item | Detail |
|---|---|
| What is tested | That the legacy `site` branch (the current compiled-TSX application) still builds and deploys successfully on Vercel, independent of any changes made on the migration branch |
| Method | Before each go-live checkpoint (and periodically during the migration, not just once at the end), run a build-and-preview-deploy of the `site` branch as-is, and smoke-test that its pages render as they do today |
| Pass criterion | `site` branch builds cleanly and its preview deployment serves at least one page from each of the 6 top-level sections correctly |
| Rollback procedure itself | Documented in the `RUNBOOK` deliverable (Skill 6) — the actual mechanism (re-pointing the Vercel production alias/DNS to the `site` branch's deployment) is an operations action, not a test, but this test is what proves that action would work if invoked |
| Exit condition | The rollback test — and the `site` branch itself — is retired **only** after a human-recorded go-live sign-off (`CONST-PROC-01` — recorded by the PM, never by the AI) in `docs/.harness-state.yaml` |
| Cadence | At minimum: once before the first production cutover of any doc set, and once immediately before go-live sign-off. More frequent checks are cheap (it's a build, not a load test) and encouraged but not mandated given solo capacity |

---

## 12. 7-Dimension Self-Assessment (adapted for a solo project)

| Dimension | Weight | Assessment Criteria |
|---|---|---|
| Completeness | 20% | 100% of sprint tasks completed |
| Traceability | 15% | `// source:`-style comments / ADR references / this Test Plan's §9 table kept current |
| Security | 20% | Zero hardcoded secrets / PII access-restricted / hooks pass (§5.4) |
| Performance | 10% | NFR-PERF SLA met at the load-test cadence defined in §6 |
| Readability | 15% | Code comments / Mermaid diagrams in design docs / table alignment in deliverables |
| Standards compliance | 10% | Zero directory-isolation violations; ADRs exist where mandated (`CONST-SEC-01`) |
| Test coverage | 10% | This Test Plan's criteria met (§3, §9) |

- Threshold: kept at **90/100**, `[basis:sg-gw-retrospective,adjustable]` — not lowered, because it is a discipline check on the developer's own work, and the bar itself costs nothing to keep high; only its **cadence** is adapted below.
- **Cadence, adapted**: run this self-assessment once per shippable slice (e.g., after the `jex2.0` pilot ships, then after each subsequent doc set), not after every sprint — running it weekly for a project with "no deadline" produces process overhead without proportional signal.
- Remediation loop: unchanged in principle (fix the lowest dimension, regenerate, up to 5 iterations), but since there is no team to escalate to, "still below after 5 attempts" escalates to **the PM directly**, i.e., the developer stops and asks rather than keeps grinding solo.
- Cross-validation (Skill 5, a different LLM vendor reviewing the work) is kept as a **pre-release** check for each shippable slice rather than every sprint, for the same cost reason — it is valuable but not free, and "no deadline" means it should be spent at the moments that matter (release gates), not spread thin.

---

## 13. Test Environments

| Environment | Purpose | Data |
|---|---|---|
| local | Developer machine | Hand-built fixtures; small seeded set |
| staging | Pre-release verification, load tests, content-fidelity checks | Synthetic fixtures scaled to `NFR-SCALE-01` (600 page-rows); real (non-PII) content text for fidelity checks (§8, §10) |
| prod | Live | Real data, once launched |

> No separate "dev" tier distinct from "local" is maintained — a third environment is infrastructure a solo developer would maintain for its own sake, not because a distinct dev/staging split adds signal at this scale.

---

## 14. Defect Management

| Severity | CVSS / Signal | Handling |
|---|---|---|
| CRITICAL | ≥ 9.0, or any `FR-AUTH-008`-style access-control bypass | Fix before the next deploy of any kind, regardless of sprint boundary |
| HIGH | 7.0–8.9 | Fix within the current shippable slice; blocks that slice's G3 |
| MEDIUM | 4.0–6.9 | Backlog, addressed opportunistically — "no deadline" means there is no artificial forcing function to fix these fast, but they are not forgotten (tracked in the same regression ledger, §11.1) |
| LOW | < 4.0 | Backlog |

NFR-USE-01 failures are handled outside this table — see §2.7 (they gate the slice's G3 directly, independent of CVSS).

---

## 15. Deliverables

| Deliverable | Timing | Format |
|---|---|---|
| Unit/integration test results | Every CI run | CI output (xml/html) |
| E2E (Top 5) results | Every push to `main` | CI output |
| `qa/nfr-use-01-observation-N.md` | Before each shippable slice's G3 | md |
| `qa/content-fidelity-checklist.csv` | Once per migrated doc set | csv |
| `qa/regression-cases.md` | Updated each sprint | md |
| `qa/load-test-N.md` | Once per shippable slice | md |
| Security audit report | Skill 5, per slice | md |
| `docs/design/threat-model.md` cross-reference | Alongside this plan (Skill 3) | md |
| Rollback test evidence | Before each cutover checkpoint and before go-live sign-off | Recorded in the sprint log / runbook |

Explicitly **not produced**: `parity/parity-report-N.md` in the byte-comparison sense — N/A per §8. The content-fidelity checklist is the deliverable that substitutes for it.

---

**G2 Approval (Design Gate)**

| Date | Approver | Comments | Status |
|---|---|---|---|
| {YYYY-MM-DD} | PM | | {APPROVED/REJECTED/PENDING} |
| {YYYY-MM-DD} | QA Leader | | {APPROVED/REJECTED/PENDING} |

> Recorded by a human, never by the AI (`CONST-PROC-01`).
