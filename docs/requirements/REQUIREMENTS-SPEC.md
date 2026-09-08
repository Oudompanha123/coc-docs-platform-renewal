# Requirements Specification — Coc Docs Platform

> **Version**: 1.0
> **Date**: 2026-09-08
> **Preceding**: [PROJECT-PROPOSAL.md](../planning/PROJECT-PROPOSAL.md), [BUSINESS-REQUIREMENTS.md](../planning/BUSINESS-REQUIREMENTS.md)
> **Traceability Matrix**: [requirements-matrix.csv](requirements-matrix.csv)
> **Question Log**: [questions-log.md](questions-log.md)
> **Status**: DRAFT — awaiting G1

---

## 1. Overview

Elaborates the Skill 1 proposal and the 30 business requirements into Functional / Non-Functional / Constraint requirements with REQ-IDs, priorities and verification methods.

**Scope of this release (MVP)**: an admin console through which a non-technical administrator manages documentation content, navigation, translations, media and user accounts — with no code change and no deploy. The site remains behind login; public/`guest` access is phase 2.

### 1.1 Classification Scheme

| Category | Prefix | Description |
|------|-------|------|
| Functional Requirement | `FR-<area>-` | What the system must do |
| Non-Functional Requirement | `NFR-<area>-` | Quality attributes |
| Constraint | `CONST-<area>-` | Non-negotiable constraints |
| Use Case | `UC-` | Scenario-level flows |

### 1.2 Priority (MoSCoW) `[basis:external-standard]`

| Level | Meaning |
|------|------|
| Must | Required for this release |
| Should | Recommended for this release |
| Could | This release if possible, otherwise next |
| Won't | Excluded from this release |

### 1.3 Counts

| Category | Must | Should | Could | Won't | Total |
|---|---:|---:|---:|---:|---:|
| Functional | 41 | 5 | 2 | 5 | **53** |
| Non-Functional | 19 | 2 | 0 | 0 | **21** |
| Constraint | 10 | 0 | 0 | 0 | **10** |
| **Total** | **70** | **7** | **2** | **5** | **84** |

Use cases: **7**. Orphan requirements: **0** — every in-scope FR and NFR maps to ≥ 1 use case (verified in the matrix). The 5 `Won't` requirements are deliberately unmapped, since they are excluded from this release.

---

## 2. Functional Requirements

### 2.1 Content Authoring (`FR-CONT-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-CONT-001 | An `admin` can open any existing page in a WYSIWYG editor | Must | E2E test |
| FR-CONT-002 | An `admin` can edit page body content using the standard block vocabulary without writing code or markup | Must | E2E test |
| FR-CONT-003 | An `admin` can save a page as a **draft** without publishing it | Must | E2E test |
| FR-CONT-004 | An `admin` can preview a draft rendered exactly as readers will see it | Must | E2E test |
| FR-CONT-005 | An `admin` can **publish** a draft, making it live immediately with **no build and no deploy** | Must | E2E test |
| FR-CONT-006 | An `admin` can create a new page within an existing section | Must | E2E test |
| FR-CONT-007 | An `admin` can soft-delete a page; internal references to it are flagged in the admin console | Must | E2E test |
| FR-CONT-008 | An `admin` can edit page metadata: title, description, slug | Must | E2E test |
| FR-CONT-009 | Page body is stored as an ordered list of typed blocks drawn from a fixed vocabulary of 8–10 types | Must | Schema review + unit test |
| FR-CONT-010 | The block vocabulary includes an **embed block** referencing a code-resident component by identifier, with props (Tier B content) | Must | Integration test |
| FR-CONT-011 | The block vocabulary includes a **copyable code block** as a distinct type carrying its copy affordance | Must | E2E test |
| FR-CONT-012 | Page edits are versioned; an `admin` can view and restore a previous version | Must | E2E test |
| FR-CONT-013 | If two admins edit the same page concurrently, the second to save is **warned and not silently overwritten** (optimistic locking) | Must | Integration test |
| FR-CONT-014 | An `admin` can duplicate an existing page as the starting point for a new one | Could | E2E test |

### 2.2 Navigation (`FR-NAV-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-NAV-001 | An `admin` can reorder pages within a section | Must | E2E test |
| FR-NAV-002 | An `admin` can rename a page's navigation label independently of its title | Must | E2E test |
| FR-NAV-003 | An `admin` can move a page from one section to another | Should | E2E test |
| FR-NAV-004 | Page order is stored as a **single explicit value per page**, not duplicated across sources | Must | Schema review |
| FR-NAV-005 | Reader navigation renders from the database, not from code arrays | Must | Integration test |
| FR-NAV-006 | An `admin` can mark a page with a badge (e.g. "New") | Could | E2E test |

### 2.3 Translation (`FR-I18N-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-I18N-001 | Every page supports a version in each of en, km, ko. English is the reference language | Must | Schema review |
| FR-I18N-002 | Editing and publishing the `en` version marks the km and ko versions **stale** | Must | Integration test |
| FR-I18N-003 | A translation status screen lists, per language, every page that is **missing** or **stale** | Must | E2E test |
| FR-I18N-004 | A stale translation **remains published** and readable; staleness is not a takedown | Must | Integration test |
| FR-I18N-005 | An `admin` can edit one language version of a page without touching the others | Must | E2E test |
| FR-I18N-006 | The system warns when publishing a page that has no translation in one or more languages | Should | E2E test |

### 2.4 Media (`FR-MEDIA-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-MEDIA-001 | An `admin` can upload an image | Must | E2E test |
| FR-MEDIA-002 | An `admin` can insert an uploaded image into a page body | Must | E2E test |
| FR-MEDIA-003 | An `admin` can browse previously uploaded media and delete an item | Should | E2E test |
| FR-MEDIA-004 | Uploads are rejected unless they pass type and size validation | Must | Security test |
| FR-MEDIA-005 | An `admin` can set alternative text on an inserted image | Should | E2E test |

### 2.5 Authentication / Authorization (`FR-AUTH-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-AUTH-001 | Users sign in with Google | Must | E2E test |
| FR-AUTH-002 | The system stores **no passwords** | Must | Security audit / schema review |
| FR-AUTH-003 | A `super admin` can create and **deactivate** accounts. Accounts are never hard-deleted; authored content and audit attribution survive deactivation | Must | E2E test |
| FR-AUTH-004 | A `super admin` can assign a role to an account | Must | E2E test |
| FR-AUTH-005 | The role ladder `guest` < `user` < `admin` < `super admin` is enforced on every request | Must | Integration test + security audit |
| FR-AUTH-006 | Every page carries a **minimum role required to view**, enforced server-side | Must | Integration test |
| FR-AUTH-007 | A signed-in user can sign out, invalidating the session | Must | E2E test |
| FR-AUTH-008 | An `admin` may not access account management | Must | Security test (negative) |

### 2.6 Reader Experience (`FR-READ-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-READ-001 | A reader with sufficient role can view a published page in the language they select | Must | E2E test |
| FR-READ-002 | Legacy `/#slug` hash URLs continue to resolve to their current pages | Must | E2E test |
| FR-READ-003 | Changing a page's slug creates a permanent redirect from the old path | Must | Integration test |
| FR-READ-004 | Requesting a deleted, unpublished, or non-existent page returns the styled 404 | Must | E2E test |
| FR-READ-005 | Switching language keeps the reader on the equivalent page | Must | E2E test |
| FR-READ-006 | A page not translated into the selected language falls back with a visible notice and a link to English | Should | E2E test |

### 2.7 Operations / Audit (`FR-OPS-`)

| REQ-ID | Requirement | Priority | Verification Method |
|--------|---------|---------|----------|
| FR-OPS-001 | Every content change records actor, action, target and timestamp in an audit trail | Must | Integration test |
| FR-OPS-002 | Failed sign-ins and permission-denied events are logged | Must | Integration test |
| FR-OPS-003 | Rejected uploads are logged with the reason | Must | Integration test |

### 2.8 Excluded from This Release (`Won't`)

| REQ-ID | Requirement | Priority | Rationale |
|--------|---------|---------|----------|
| FR-WORKFLOW-001 | Draft → Review → Publish approval workflow with separate author and publisher roles | **Won't** | AMB-001. Requires a second editor, which does not yet exist. Revisit when one does. |
| FR-SEARCH-001 | Full-text search across documentation | **Won't** | G-10. No search exists today; does not serve the Q2 driver. |
| FR-PUBLIC-001 | Anonymous (`guest`) reading of public pages | **Won't** | Phase 2. Keeps migration and public exposure from landing together. |
| FR-SECTION-001 | Creating and deleting whole sections from the admin console | **Won't** | Q5. Remains a developer task; rarer than page editing. |
| FR-USAGE-001 | Migrating ai-usage from Google Sheets into the database | **Won't** | AMB-004, superseding the Q6 answer. Does not reduce the content bottleneck. |

---

## 3. Non-Functional Requirements

### 3.1 NFR-USE (Usability) — the project's central claim

| REQ-ID | Requirement | Measurement |
|--------|---------|------|
| **NFR-USE-01** | A named non-technical colleague edits and publishes a real page **unaided**, with no training beyond a one-page guide. **Pass = completed without asking the PM.** | Observed task test before G3 |
| NFR-USE-02 | Operating the admin console requires no knowledge of TypeScript, JSX, Markdown, HTML, git or deployment | Task test + review |

> Deliberately behavioural, not time-based (AMB-003). This is the direct restatement of the §2.3 value proposition; if it fails, the project has not delivered regardless of what else passes.

### 3.2 NFR-PERF (Performance)

| REQ-ID | Requirement | Measurement |
|--------|---------|------|
| NFR-PERF-01 | Reader page response **P95 < 1s** | Load test |
| NFR-PERF-02 | Admin save action completes **P95 < 2s** | Load test |
| NFR-PERF-03 | Page editor becomes interactive **P95 < 2s** | Load test |

> Honest note: NFR-PERF-01 is **slower than today**, since current pages are statically generated and CDN-served. Accepted as a deliberate trade (AMB-005) to avoid forcing a CDN-layer design into ADR-001.

### 3.3 NFR-SEC (Security) — §7 mandatory cards

| REQ-ID | Requirement | Verification |
|--------|---------|------|
| **NFR-SEC-AUTH** | Authentication via Google OIDC. No password storage, no password reset flow, no credential handling in scope | Security audit |
| **NFR-SEC-PII** | Personal data (account name, email, audit records; ai-usage teammate data) is access-restricted by role and never exposed to `guest` or unauthenticated requests | Security audit |
| **NFR-SEC-SANITIZE** | All rich content is sanitised before rendering. An author cannot inject executable markup through the editor | Security test + code review |
| **NFR-SEC-UPLOAD** | Uploaded files are validated on declared type, actual content type and size, and stored outside any executable path | Security test |
| **NFR-SEC-CHANNEL** | All external calls use TLS. The `/api/ingest` bearer secret is retained but scope-limited to that endpoint and is **explicitly not a template** for editorial write paths | Security audit |
| NFR-SEC-SESSION | Session cookies are `httpOnly`, `secure`, `sameSite`; TTL is a single defined value | Security audit |

> **Open contradiction inherited from AS-IS**: `lib/auth.ts:9` sets `SESSION_DAYS = 1` while `CLAUDE.md:172` documents 30 days. NFR-SEC-SESSION requires one authoritative value; must be settled in Skill 3.

### 3.4 NFR-AVAIL (Availability)

| REQ-ID | Requirement | Measurement |
|--------|---------|------|
| NFR-AVAIL-01 | Best-effort. **No uptime SLA is committed.** | Review (declaration) |
| NFR-AVAIL-02 | Reader pages remain servable from cache during brief database unavailability | Failure-injection test |

> NFR-AVAIL-02 exists because of a real regression: today's pages are pre-rendered and survive a backend outage. Once pages are database-backed, the database becomes a single point of failure for *reading documentation*.

### 3.5 NFR-SCALE (Scalability)

| REQ-ID | Requirement | Verification |
|--------|---------|------|
| NFR-SCALE-01 | Supports at least 200 pages per language, 10 concurrent editors, and internal-scale reader volume, without architectural change | Load test + architecture review |

### 3.6 NFR-COMPAT (Compatibility)

| REQ-ID | Requirement | Verification |
|--------|---------|------|
| NFR-COMPAT-01 | Reader site works on current Chrome, Edge, Firefox and Safari, including mobile viewports | Cross-browser test |
| NFR-COMPAT-02 | Admin console works on current Chrome and Edge, desktop-first. Mobile admin is not required | Cross-browser test |

### 3.7 NFR-OPS (Operations)

| REQ-ID | Requirement | Verification |
|--------|---------|------|
| **NFR-OPS-AUDIT** | Audit trail retained at least 1 year; entries are append-only | Operational audit |
| NFR-OPS-BACKUP | Content database backed up daily; **restore verified at least once before go-live** | Backup inspection + restore drill |
| NFR-OPS-VERSION | At least the last 20 versions of each page are retained | Schema review |

> NFR-OPS-BACKUP is not routine. Today content lives in git and is therefore backed up implicitly on every push to every clone. That safety net disappears at migration; this requirement replaces it deliberately.

### 3.8 NFR-I18N / NFR-EXT

| REQ-ID | Requirement | Verification |
|--------|---------|------|
| NFR-I18N-01 | Translation **coverage** — a published version exists in all three locales — is 100%. Staleness is tracked separately and is **not** a coverage breach (AMB-002) | Translation status screen |
| NFR-EXT-01 | New managed entity types can be added without reworking the content schema or editor core | Architecture review |

---

## 4. Constraints

| REQ-ID | Constraint | Basis |
|--------|------|------|
| CONST-TECH-01 | Next.js 15 / React 19 / TypeScript retained as the frontend base | Proposal §8 |
| CONST-TECH-02 | Vercel retained as hosting | Proposal §8 |
| CONST-TECH-03 | Content model is a **block schema**, not MDX. MDX is code, and would leave non-technical editors as blocked as today | Q2 driver, proposal §11 |
| CONST-TECH-04 | Block vocabulary limited to 8–10 types | Q-block decision; largest cost lever |
| **CONST-OPS-01** | Content must **never** be bulk-edited with Windows PowerShell 5.1 (`Get-Content`/`-replace`/`Set-Content`) — it reads UTF-8 as the Korean system codepage and corrupts em-dashes, Korean and Khmer text. Binding on all migration tooling | `CLAUDE.md:152` |
| CONST-OPS-02 | Legacy `/#slug` hash URLs must keep resolving | `LegacyHashRedirect.tsx:11-21` |
| **CONST-OPS-03** | From cutover the database is authoritative. The `site` branch must remain deployable as the rollback path until go-live sign-off | G-12 |
| **CONST-SEC-01** | A separate security ADR is mandatory in Skill 3, covering authentication, session management, role enforcement, sanitisation, upload validation and PII handling | Skill 01 §6 (PII triggered) |
| CONST-PROC-01 | G1/G2/G3 approvals are recorded by a human. The AI must never record a gate approval | HARNESS-PROCESS-STANDARD §4.8 CQ3 |
| CONST-RES-01 | One part-time developer. Scope must be shippable in independently valuable slices; `jex2.0` (5 pages) is the pilot | Q8 |

---

## 5. Use Cases (Summary)

| UC-ID | Scenario | Primary User | Related FR |
|-------|---------|-----------|---------|
| UC-001 | Edit an existing page and publish it | `admin` | FR-CONT-001..005, 012, 013 · FR-I18N-002 · FR-OPS-001 |
| UC-002 | Create a new page in a section | `admin` | FR-CONT-006, 008, 009 · FR-NAV-004, 005 · FR-I18N-001, 006 |
| UC-003 | Reorder and rename navigation | `admin` | FR-NAV-001..005 |
| UC-004 | Create an account and assign a role | `super admin` | FR-AUTH-001..008 |
| UC-005 | Read a documentation page | `user` | FR-READ-001..006 · FR-AUTH-005, 006 |
| UC-006 | Upload and insert an image | `admin` | FR-MEDIA-001..005 · FR-OPS-003 |
| UC-007 | Find and fix a stale translation | `admin` | FR-I18N-002..005 |

Detailed flows: `use-cases/UC-NNN.md`.

---

## 6. AMBIGUOUS / Pending Items

| ID | Item | Candidate Options | PM Response | Status |
|----|------|--------|---------|------|
| AMB-001 | Publishing state model (C-01) | A: Draft+Published, one person / B: Published only / C: Draft→Review→Publish, two roles | **A** | RESOLVED |
| AMB-002 | Meaning of "100% translation coverage" (C-02) | A: coverage = exists / B: coverage = fresh | **A**, by definition — not put to PM per §4.8 | RESOLVED — confirm at G1 |
| AMB-003 | Usability measure (G-01) | A: unassisted task test / B: time-boxed / C: both / D: defer | **A** | RESOLVED |
| AMB-004 | ai-usage migration scope (C-03) | A: defer to phase 2 / B: MVP / C: remove from platform | **A** — supersedes the Q6 answer | RESOLVED |
| AMB-005 | Performance target (G-02) | A: P95<1s / B: P95<500ms / C: admin only / D: measure baseline | **A** | RESOLVED |
| AMB-006 | Session TTL — `lib/auth.ts:9` says 1 day, `CLAUDE.md:172` says 30 days | A: 1 day / B: 30 days / C: other | Awaiting — inherited AS-IS defect | **PENDING → Skill 3** |

**Zero `[AMBIGUOUS]` items block G1.** AMB-006 is an inherited defect in the existing system, not a gap in these requirements; it must be settled before the session model is designed.

### 6.1 Defaults Applied Without a Question

Nine gaps (G-03 to G-12) were closed with stated defaults rather than questions, per §4.8's prohibition on queries with no defect signal. Each is now a numbered requirement above and is **open to correction at G1**: NFR-SCALE-01, NFR-COMPAT-01/02, NFR-OPS-AUDIT/BACKUP/VERSION, FR-AUTH-003, FR-CONT-013, FR-READ-003, FR-CONT-007, FR-SEARCH-001, NFR-SEC-CHANNEL, CONST-OPS-03.

---

## 7. Change History

| Date | Version | Changes | Author |
|------|------|----------|--------|
| 2026-09-08 | 1.0 | Initial specification. 70 requirements, 7 use cases, 0 orphans. 3 contradictions and 12 gaps resolved | Socheat-Hun (PM) |

---

**G1 Approval (Analysis Gate)**

Required before Skill 3. Approver: PM (Socheat-Hun), with colleague review of these requirements first (proposal §12). **Recorded by a human in `docs/.harness-state.yaml` — never by the AI (CONST-PROC-01).**

| Date | Approver | Comments | Status |
|------|--------|------|------|
| | | | **PENDING** |
