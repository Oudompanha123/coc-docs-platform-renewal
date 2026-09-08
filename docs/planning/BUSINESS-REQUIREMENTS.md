# Business Requirements — Coc Docs Platform

> **Version**: 1.0
> **Date**: 2026-09-08
> **Author**: Socheat-Hun (PM)
> **Status**: DRAFT
> **Parent**: [PROJECT-PROPOSAL.md](PROJECT-PROPOSAL.md)
> **Source record**: [questions-log.md](questions-log.md)

BR-IDs assigned here are the traceability anchors carried into `docs/requirements/requirements-matrix.csv` in Skill 2.

---

## 1. Overview

Coc Docs Platform is the internal developer-documentation site for **jexmcp**, a Claude Code plugin suite for **JEX Studio** — the legacy enterprise low-code Java platform behind the organisation's banking and insurance applications.

The platform exists today and works. This project changes **who can maintain it**: content currently lives as compiled React components, so every change requires a developer and a deploy. The business goal is to move content into a database behind an admin console that non-technical staff can operate.

| Attribute | Value |
|---|---|
| Doc sets | 5 authored (`jex3.0`, `jex2.0`, `coach`, `idea`, `workflow`) + 1 live (`ai-usage`) |
| Pages per language | 35 |
| Authored panels | 105 (35 × en/km/ko) |
| Content volume | ~14,000 lines / ~39,000 words |
| Languages | English, Khmer, Korean — currently 100% coverage |
| Current audience | Internal, behind a single shared password |

---

## 2. Business Areas / Domain Definition

| Area | Description | Owner |
|---|---|---|
| **Content management** | Authoring, editing, publishing and organising documentation pages | `admin` |
| **Navigation management** | Section membership, page order, labels | `admin` |
| **Translation management** | Maintaining en / km / ko parity across all pages | `admin` |
| **Media management** | Uploading and inserting images | `admin` |
| **Identity & access** | Accounts, roles, page visibility | `super admin` |
| **Usage reporting** | Per-teammate Claude Code token usage dashboard | `super admin` (data), `user` (own data) |

The five authored doc sets are content *within* these areas, not areas themselves: `jex3.0` (current plugin), `jex2.0` (older CHECKPAY-family plugin), `coach` (the 8-skill AI development-process harness), `idea` (IntelliJ IDEA run-configuration setup), `workflow` (AI Engineering Harness vision, with live interactive demos).

---

## 3. Business Rules

### 3.1 Content

| ID | Rule | Source |
|---|---|---|
| **BR-001** | A page belongs to exactly one section and has exactly one slug within that section | AS-IS `lib/i18n.ts` |
| **BR-002** | Navigation is two levels deep: section → page. **No page has children.** | AS-IS `Sidebar.tsx` |
| **BR-003** | Page order within a section is explicit and editable, expressed as a single stored `order` value — **not** duplicated across multiple sources | Q5; replaces 3 hand-synced arrays |
| **BR-004** | A page exists in three languages (en / km / ko). English is the reference language | AS-IS `lib/i18n.ts:1` |
| **BR-005** | Publishing a page makes it immediately visible to readers with sufficient role — **no build or deploy** | Q2 (core driver) |
| **BR-006** | Page body is composed of typed content blocks drawn from a fixed vocabulary of ~8–10 block types | Q-block decision |
| **BR-007** | Interactive components (`HarnessDemo`, `OwnerTree`) and data-bound tables (`ideaData.ts`) remain code, referenced from a page as an embed block. They are **not** editable in the WYSIWYG | Q4 tiering |
| **BR-008** | Internal links between pages are stored as page references, not literal URLs, so that renaming a slug does not break them | Migration hazard 3 |
| **BR-009** | Legacy `/#slug` hash URLs must continue to resolve to their current pages | `LegacyHashRedirect.tsx:11-21` |
| **BR-010** | A "copyable code block" is a distinct block type, not plain preformatted text — the copy affordance is part of its meaning | 183 instances in AS-IS |

### 3.2 Translation

| ID | Rule | Source |
|---|---|---|
| **BR-011** | Translation coverage must not regress below today's 100% | Q9 / §7.1 of proposal |
| **BR-012** | The system must show which pages are missing or stale in each language | Q5 (Translation status screen) |
| **BR-013** | Editing the English version of a page marks its km / ko versions **stale**, not invalid — the stale version remains published | Derived; avoids taking pages offline on edit |
| **BR-014** | A page may be published with incomplete translations, but this must be visible, never silent | Compensating control for lost compile-time enforcement |

### 3.3 Access

| ID | Rule | Source |
|---|---|---|
| **BR-015** | Roles form a single ordered ladder: `guest` < `user` < `admin` < `super admin` | Q3 (PM) |
| **BR-016** | Every page carries a **minimum role required to view** | Q3 |
| **BR-017** | `admin` may create, edit, delete and publish content and navigation. `admin` may **not** manage accounts | Q3 |
| **BR-018** | `super admin` may manage accounts and role assignment | Q3, scenario 5 |
| **BR-019** | Authentication is Google Sign-In. The system stores no passwords | Q6 |
| **BR-020** | ai-usage data is personal data. A `user` sees only their own usage; only `admin` and above see all teammates' data | Q3 open point — **stricter default pending Skill 2 confirmation** |

### 3.4 Content Safety

| ID | Rule | Source |
|---|---|---|
| **BR-021** | All rich content is sanitised before rendering. Authors may not inject executable markup through the editor | RISK-005 |
| **BR-022** | Uploaded files are validated on type and size, and stored outside the application's executable path | RISK-006 |
| **BR-023** | Every content change is attributed to an account and timestamped | Q7 (audit trail) |

---

## 4. Data Lifecycle

| Entity | Created by | Updated by | Deleted by | Retention |
|---|---|---|---|---|
| Page | `admin` | `admin` | `admin` (soft delete) | Indefinite; version history retained |
| Page version | System, on each publish | — | — | Indefinite `[ASSUMED]` |
| Section | Developer (MVP) | Developer | Developer | Indefinite |
| Navigation order | `admin` | `admin` | — | Current state only |
| Media asset | `admin` | — | `admin` | Until explicitly deleted |
| Account | `super admin` | `super admin` | `super admin` | While employed `[ASSUMED]` |
| Audit entry | System | — | — | `[ASSUMED]` — policy to be set in Skill 2 |
| Usage record | `/api/ingest` (machine) | Upsert on `(user_email, date)` | — | Currently unbounded on Sheets |

**Critical change of system of record.** Today content lives in git, which provides history, review, rollback and backup for free. Once content moves to a database, **the database becomes the system of record and those properties must be rebuilt** — version history (BR-024), backup, and restore. This is a real loss to compensate for, not an incidental detail.

| ID | Rule |
|---|---|
| **BR-024** | Page edits are versioned; a previous version can be restored |
| **BR-025** | The content database is backed up, and restore is tested at least once before go-live |

---

## 5. Permissions / Roles

| Capability | `guest` | `user` | `admin` | `super admin` |
|---|:---:|:---:|:---:|:---:|
| Read public pages | ✓ | ✓ | ✓ | ✓ |
| Read internal pages | — | ✓ | ✓ | ✓ |
| Read own usage data | — | ✓ | ✓ | ✓ |
| Read all usage data | — | — | ✓ | ✓ |
| Create / edit / publish pages | — | — | ✓ | ✓ |
| Upload media | — | — | ✓ | ✓ |
| Reorder / rename navigation | — | — | ✓ | ✓ |
| Set a page's minimum role | — | — | ✓ | ✓ |
| Create sections | — | — | — | — *(developer task in MVP)* |
| Manage accounts and roles | — | — | — | ✓ |

**MVP note**: the `guest` column is defined but **not enforced in MVP** — the whole site stays behind login until phase 2 (proposal §4.1).

---

## 6. External Interfaces (Business Perspective)

| Interface | Business purpose | Direction | Owner |
|---|---|---|---|
| Google Sign-In | Colleagues sign in with existing work accounts; no password administration | Inbound | `super admin` |
| Usage reporter (`push-usage.mjs`) | Teammates' machines report their own Claude Code token usage | Inbound | Individual teammate (opt-in) |
| Object storage | Holds images uploaded by editors | Bidirectional | `admin` |
| Vercel | Serves the site | — | PM |

**Retired by this project**: Google Sheets as the usage data store (migrating into the database, Q6).

---

## 7. Compliance / Regulations

Skill 01 §6 check, applied at Q1 and Q3:

| Check item | Applies | Basis |
|---|:---:|---|
| Personal data processing (PII expected) | **YES** | Account names, email addresses, session and audit records; plus per-teammate email and usage figures in ai-usage |
| Financial transaction processing (BigDecimal mandatory) | No | No monetary domain in this platform |
| Regulatory scope (EFSR / ISMS-P / Credit Information Act) | **TBD** | The documented systems are banking/insurance; this documentation platform is not itself a financial system. To be confirmed before phase 2 public exposure |
| Audit log retention obligation | **TBD** | Editorial audit trail is wanted regardless (BR-023); statutory retention not established |
| PCI-DSS / KISA certification | No | No card data |

**Consequence**: because at least one item applies, a **separate security ADR is mandatory in Skill 3** (Skill 01 §6). Scope: authentication, session management, role enforcement, HTML sanitisation, upload validation, and PII handling.

### 7.1 Disclosure Decision Required Before Phase 2

| ID | Rule |
|---|---|
| **BR-026** | Before any page becomes `guest`-visible, a human must explicitly approve the disclosure of its contents |

This is not procedural caution. The `idea` doc set publishes the organisation's internal application portfolio — 9 system names (CHECKPAY, LOAN, LOAN_ADMIN, INSU, ELECDOC, ELECDOC_ADMIN, DUREADMIN, PLUGIN, PLUGIN_ADMIN), environment IDs, configuration filenames, debug ports, Tomcat versions (9.0.117 / 8.5.100) and workspace paths (`content/ideaData.ts:16-34`). For an organisation running banking and insurance systems, that is portfolio and version disclosure and should be an explicit decision, never a default inherited from a visibility setting.

**Reassuring**: all URLs in content are `localhost`; no internal hostnames or IP addresses are exposed.

---

## 8. Operations Policy

### 8.1 Availability

Best-effort on Vercel. No uptime commitment. `[ASSUMED]`

Note a change in failure profile: the current site is largely pre-rendered, so it survives a backend outage. Once pages are database-backed, **the database becomes a single point of failure for reading documentation**. Caching strategy is an ADR-001 concern.

### 8.2 Backup / Recovery

| ID | Rule |
|---|---|
| **BR-027** | Content database backed up on a defined schedule; restore verified before go-live (see BR-025) |
| **BR-028** | Uploaded media included in the backup scope |

Today content is in git and therefore backed up implicitly on every push, across every clone. That safety net disappears at migration.

### 8.3 Monitoring

| ID | Rule |
|---|---|
| **BR-029** | Failed sign-ins and permission-denied events are logged |
| **BR-030** | Upload failures and rejected files are logged |

---

## Appendix — Requirements Traceability Seed

| BR-ID range | Area | Feeds |
|---|---|---|
| BR-001 – BR-010 | Content model & navigation | Content schema, editor, migration tooling |
| BR-011 – BR-014 | Translation | Translation status screen |
| BR-015 – BR-020 | Access control | Auth, roles, page visibility |
| BR-021 – BR-023 | Content safety | **Mandatory security ADR** |
| BR-024 – BR-028 | Data lifecycle & recovery | Versioning, backup |
| BR-029 – BR-030 | Monitoring | Operations |

**30 business requirements** carried into Skill 2 for decomposition into functional / non-functional / constraint requirements with REQ-IDs.
