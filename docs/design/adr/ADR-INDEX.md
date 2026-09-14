# ADR Index and Applicability Register — Coc Docs Platform

> **Date**: 2026-09-08 · **Owner**: `architect`
> Skill 03 §8 lists eight mandatory ADRs for the financial sector. This register records which apply, which do not, and **why** — per Skill 07 §5, a validation criterion that does not fit the nature of the project is downgraded and left as a PM-judgment item rather than silently skipped.
> PM decision, 2026-09-08: *"Carry the 4 that apply, mark the rest N/A."*

---

## Written

| ADR | Title | Status | Covers |
|---|---|---|---|
| [ADR-001](ADR-001-tech-stack.md) | Technology stack | **ACCEPTED** | Supabase Postgres · Supabase Storage · BlockNote. Two PM tie-breaks inside the <10% margin |
| [ADR-003](ADR-003-persistence-strategy.md) | Persistence strategy | **ACCEPTED** | Schema, draft/published rows, versioning, optimistic locking, ordering, slug history, derived staleness |
| [ADR-005](ADR-005-pii-encryption.md) | PII handling | **ACCEPTED** | §8 mandatory · account and audit PII, ai-usage teammate data |
| [ADR-006](ADR-006-audit-logging.md) | Audit logging | **ACCEPTED** | §8 mandatory · append-only trail, retention |
| [ADR-008](ADR-008-channel-auth.md) | External channel authentication | **SUPERSEDED IN PART** by ADR-013 | §8 mandatory · ingest bearer secret fenced off (still current). Its **identity-provider** decision — direct Google verification — is superseded |
| [ADR-013](ADR-013-revision-of-008-identity-broker.md) | Keycloak as identity broker | **ACCEPTED** | Keycloak brokers Google; **roles stay in our `account` table**, not in realm roles; session design unchanged. Revises ADR-008, ADR-011 §auth, ADR-012 Decision 4 |
| [ADR-010](ADR-010-content-model.md) | Content model and block vocabulary | **ACCEPTED** | The core design decision — 32 → 10 blocks, no raw HTML, embed registry |
| [ADR-011](ADR-011-security-model.md) | Security model | **ACCEPTED** — authorization pillar revised by ADR-016 | **CONST-SEC-01 umbrella** · authentication, session (AMB-006 → 1 day), role enforcement, sanitisation, upload validation |
| [ADR-016](ADR-016-roles-and-permissions.md) | Many roles per account, many permissions per role | **PROPOSED** | `account_role` + `role_permission`; the ladder survives as `role.rank`, effective rank = highest held; `account.role` dropped. Revises ADR-011 §authz. Permissions stay out of tokens and out of Keycloak — ADR-013's boundary holds |
| [ADR-017](ADR-017-approval-gate.md) | Signing in is not being let in | **PROPOSED** | A first arrival is an application: both sign-up doors create `pending`/`guest`, and a super admin approves while choosing the role. Restores the gate ADR-014 specified and product direction removed on 2026-09-11. Bootstrap: the first person through an empty installation is an active super_admin |
| [ADR-018](ADR-018-revision-of-014-password-reset.md) | Self-service password reset | **ACCEPTED** | Closes the recovery-path gap ADR-014 left open. Hashed, single-use, 30-minute token (`password_reset_token`), same shape as `app_session`; eligible only for accounts that already hold a `password_hash`; `/forgot-password` held to the same anti-enumeration standard as `/login-password`. Revises ADR-014 |
| [ADR-019](ADR-019-revision-of-017-temporary-password-invite.md) | Admin-invited accounts get a temporary password | **PROPOSED** | `AccountService.create` now issues a bcrypt-hashed random temporary password and emails it; `account.must_change_password` gates every request but sign-in, `/auth/me` and `/auth/change-password` until it is replaced, enforced by `MustChangePasswordInterceptor`. Account creation stays `super_admin`-only — PM confirmed against the task's own request to widen it to `admin`. Revises ADR-017 |

---

## Recorded N/A — with rationale

Each of the four below is a §8 "mandatory" ADR that has no subject matter in this system. Recording them as N/A is a positive statement — *we looked, and there is nothing to decide* — not an omission.

### ADR-002 — Transaction boundary · **N/A**
**Why**: There is no business transaction model. The system has no monetary domain, no multi-step commit spanning external systems, and no compensating-transaction requirement. Skill 01 §6 confirmed *"Financial transaction processing (BigDecimal mandatory): No"*.

The only atomicity requirement is publish (draft → published, prior → archived), which is a single-statement database transaction and is specified in ADR-003 §2 rather than warranting its own ADR.

**Revisit if**: the platform ever gains workflow state spanning multiple systems.

### ADR-004 — Message integrity · **N/A**
**Why**: There is no message-passing architecture. No MQ, no fixed-format telegrams, no inter-system messages requiring HMAC or signatures. All communication is HTTPS request/response between browser, Next.js server and Supabase.

The one machine-to-machine channel (`/api/ingest`) is covered by ADR-008 and is out of MVP scope regardless (`FR-USAGE-001` = `Won't`).

**Revisit if**: an asynchronous or queued integration is introduced.

### ADR-007 — Key management · **N/A**
**Why**: The system holds no encryption keys of its own to manage. FR-AUTH-002 means **no passwords are stored**; ADR-005 uses provider-native encryption at rest, so key custody belongs to Supabase; and there is no application-layer column encryption to key.

What remains is *credential* management — database credentials, `INGEST_SECRET`, and the Keycloak client secret — which is environment-variable handling covered by ADR-008, ADR-011 and ADR-013, not a key-management architecture.

**Note (ADR-013, 2026-09-10)**: the **Google OAuth client secret is no longer held by the application** — it moves into Keycloak, which brokers Google on our behalf. That shrinks our secret surface by one, and is one of the few unambiguous security *gains* from introducing the broker.

**Revisit if**: ADR-005's deferred application-layer column encryption is ever adopted — that decision would require this ADR.

### ADR-009 — Retry / idempotency · **N/A**
**Why**: There are no unreliable channels to retry against and no operation whose duplicate execution causes harm. Content writes are user-initiated, synchronous, and idempotent by construction — FR-CONT-013's optimistic locking on `version_no` means a repeated save either applies once or is refused as a conflict.

The one genuine idempotency case in the codebase — `/api/ingest` upserting on `(user_email, date)` — already exists, is unchanged in MVP, and is out of scope.

**Revisit if**: background jobs, queues or webhook receivers are added.

---

## Coverage Check

| §8 area | Disposition |
|---|---|
| Transaction model | N/A — no transaction model |
| Persistence strategy | ✅ ADR-003 |
| Message integrity | N/A — no message-passing |
| PII encryption | ✅ ADR-005 |
| Audit logging | ✅ ADR-006 |
| Key management | N/A — no keys held |
| External channel auth | ✅ ADR-008 |
| Retry / idempotency | N/A — no unreliable channels |

Plus, beyond §8's list: **ADR-001** (stack, mandated by §2), **ADR-010** (content model — the project's most consequential decision, and not anticipated by a financial-sector ADR list), and **ADR-011** (the CONST-SEC-01 security umbrella).

**7 ADRs written · 4 recorded N/A with rationale · 0 §8 areas unaddressed.**

---

## Note on the §4.6 "ADR ≥ 10" Metric

The 7-dimension self-evaluation scores standards compliance partly on *"ADR ≥ 10"* (HARNESS-PROCESS-STANDARD §4.6). This project has 7 written plus 4 N/A records.

That threshold carries `[basis:sg-gw-retrospective,adjustable]` and was calibrated on a 29-sprint migration of a financial gateway. Writing three further ADRs purely to reach a count would produce documents with no decision in them, which is worse than not writing them. Per §4.9, the adjustment and its rationale are recorded here rather than the metric being quietly ignored.

**Adjusted target for this project: ≥ 7 substantive ADRs.** Currently met. Expect ADR-012 onward as implementation decisions arise in Sprints 1–7.
