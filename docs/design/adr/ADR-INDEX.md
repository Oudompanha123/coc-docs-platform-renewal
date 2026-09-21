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
| [ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md) | `/forgot-password` reveals whether an account exists | **ACCEPTED** | Revises ADR-018 Decision 3 only: a `404` + exact message now distinguishes "no account at all" from every other case on this one endpoint. Deliberately reopens the anti-enumeration property ADR-018/ADR-014 established, on explicit, twice-confirmed PM instruction. `/login-password` and the rest of ADR-018 are unaffected |
| [ADR-020](ADR-020-revision-of-017-temporary-password-invite.md) | Admin-invited accounts get a temporary password | **PROPOSED** | `AccountService.create` now issues a bcrypt-hashed random temporary password and emails it; `account.must_change_password` gates every request but sign-in, `/auth/me` and `/auth/change-password` until it is replaced, enforced by `MustChangePasswordInterceptor`. Account creation stays `super_admin`-only — PM confirmed against the task's own request to widen it to `admin`. Revises ADR-017 |
| [ADR-021](ADR-021-revision-of-014-registration-email-otp.md) | Email OTP for registration; phone number field removed | **ACCEPTED** | Registration becomes three steps: submit → emailed 6-digit code → verify. New `registration_challenge` table (hashed code, mirrors `password_reset_token`); account is created only on verify, via unchanged `AccountService.register`/ADR-017 gate. Frontend's never-wired-up phone number field deleted. Revises ADR-014, ADR-017 |
| [ADR-022](ADR-022-revision-of-020-voluntary-change-password-requires-current-password.md) | Voluntary password change requires the current password | **ACCEPTED** | `/change-password` now requires and verifies `currentPassword` unless the caller is still under ADR-020's forced first-login gate, which skips it. New "My Profile"/Settings → Security self-service UI wired to the previously inert buttons there. Revises ADR-020 |
| [ADR-023](ADR-023-revision-of-011-account-deletion.md) | A super admin can delete an account | **PROPOSED** | `DELETE /api/v1/admin/accounts/{id}`, `super_admin` only. Deactivation stays the default and becomes reversible in the UI; deletion answers the typo'd invite, the duplicate and the record that should not outlive the engagement. The audit trail survives via `audit_log.actor_email`, denormalised in V1 for exactly this. V10 gives `account_role.granted_by` `on delete set null` — it had no ON DELETE action, which made every super admin who had ever granted a role undeletable. Revises ADR-011 |
| [ADR-024](ADR-024-revision-of-022-forced-first-login-also-verifies-temporary-password.md) | Forced first-login also verifies the temporary password | **ACCEPTED** | `/create-password` gains an old/temporary-password field; `SessionService.changeOwnPassword` drops the `mustChangePassword` exemption and now verifies `currentPassword` unconditionally for both the forced and voluntary flows. Adopts ADR-022's own rejected Alternative D, on direct PM request. Revises ADR-022 |
| [ADR-025](ADR-025-push-notifications.md) | Push notifications, starting with a new registration | **PROPOSED** | FCM to every active `super_admin` when an application reaches the queue. Published from `AccountRepository.insertApplication` — the one statement both registration doors pass through — and delivered `AFTER_COMMIT` and `@Async`, so a rolled-back registration announces nobody and a dead FCM cannot fail or delay a sign-up. `device_token` (V11) carries a platform from the start for the expected mobile app. Firebase is an optional bean, like the mailers. Extends ADR-017, ADR-021 |
| [ADR-026](ADR-026-self-uploaded-profile-photos.md) | Self-uploaded profile photos | **PROPOSED** | An account owner can upload their own photo to S3-compatible object storage; `avatar_uploaded_at` (V12) stops a Google sign-in overwriting it. Validated on size, an allow-list of types, and an actual image decode, because the declared content type is caller-supplied. Storage is an optional bean like the mailers. Recorded after the implementation shipped citing it. Revises ADR-013's assumption that a picture always comes from the provider |
| [ADR-027](ADR-027-new-device-sign-in-alerts.md) | New-device sign-in alerts | **PROPOSED** | An account owner is told when their account is signed in to from a browser/platform it has not been used on, and can end that session from the alert. `device_key`/`new_device` (V16) recorded at sign-in, computed once in `DeviceDescription` and never in SQL. Recipient is the owner alone — no administrator copy. Browser and platform only, never a version or an IP, so a Chrome update is not an alert. Both sign-in paths merged into one `issue()` first. Extends ADR-011, ADR-025 |
| [ADR-028](ADR-028-live-notification-stream.md) | A live stream for notifications | **PROPOSED** | Server-sent events at `/api/v1/notifications/stream`, written to wherever a push is sent, so the bell updates as things happen with no Firebase project and no granted permission — which is every machine here. SSE not WebSocket: the traffic is one-way and `EventSource` reconnects itself. The event is a type key, never the content, so the stream cannot become a source of truth that disagrees with the queue. The 60s poll stays as the floor under it. Revises ADR-025's assumption that FCM is the immediate path |
| [ADR-029](ADR-029-revision-of-018-forgot-password-covers-google-only-accounts.md) | `/forgot-password` also covers Google-only accounts | **PROPOSED** | Removes ADR-018 Decision 2's "only an account with a password_hash" eligibility check — every existing account now gets a token and an email, closing the gap ADR-030 left open (no unauthenticated path to a first password). ADR-019's `404`-for-"no account at all" carve-out is unchanged. `/reset-password` now distinguishes initial-set from genuine reset for its confirmation message/audit `detail.kind`, mirroring ADR-030's `changeOwnPassword` pattern. Revises ADR-018 Decision 2 |
| [ADR-030](ADR-030-revision-of-022-024-google-only-account-may-set-initial-password.md) | A Google-only account may set an initial password | **ACCEPTED** | `changeOwnPassword` gains a third branch: no existing `password_hash` means no current-password proof and no reuse check — only ADR-022's voluntary and ADR-024's forced-first-login branches still require one. `Account.hasPassword()` (derived, never the hash itself) exposed on `MeResponse` so `ChangePasswordForm` can omit the "Current Password" field rather than just relax it. Drafted and implemented as "ADR-027"; renumbered to 030 on pulling `dev`, whose own unrelated ADR-027 (new-device sign-in alerts) landed first — see this file's own Numbering section. Revises ADR-022, ADR-024 |
| [ADR-031](ADR-031-totp-second-factor-for-password-login.md) | TOTP (Google Authenticator) second factor for password login | **PROPOSED** | Opt-in per-account TOTP gating `/login-password` only (not Google/Keycloak). `account_totp` + `mfa_login_challenge` (V15), same hashed-challenge shape as ADR-021. Secret stored in plain text (ADR-007 N/A — no app-layer key management exists). `app.otp.enabled`/`app.otp.dev-code` read via `@Value` defaults so nothing is added to `application.yml`; `OtpDevModeGuard` refuses to start if the fake-code bypass is active outside `dev`/`test`. Fills in `SecurityTab`'s previously-mock 2FA toggle; enrollment requires an existing password, enforced both server-side and in the toggle's disabled state. Revises ADR-011's authentication pillar (additive). Drafted and implemented as "ADR-028"; renumbered to 031 on pulling `dev`, whose own unrelated ADR-028 (live notification stream) landed first — see the ADR's own Numbering section |
| [ADR-032](ADR-032-hrms-report-arrival-notifications.md) | Watching a mailbox for HRMS report arrivals | **PROPOSED** | The bell announces that the daily HRMS attendance mail landed. IMAP polling, because HRMS is a third party and `[DEFERRED]` hosting leaves no public URL for a webhook or Gmail Pub/Sub to reach. Records the subject, date and arrival time and **never the body** -- the report names ~60 colleagues and their working hours (NFR-SEC-PII), so parsing it in would be a new decision, not a refactor. Own table `hrms_notification` (V21), not `audit_log`: nobody in this system did it, and these rows must be deletable. Off by default, folder opened READ_ONLY, one sender. Extends ADR-025, ADR-028. Drafted and implemented as "ADR-029"; renumbered to 032 on resolving the merge with `dev`, whose own unrelated ADR-029 (`/forgot-password` covers Google-only accounts) landed first — see the ADR's own Numbering section |
| [ADR-033](ADR-033-overview-landing-tasks.md) | A dedicated post-login landing page, and a real task list | **PARTIALLY REVERTED** | `/overview` moved to its own `app/(landing)` route group (no sidebar/Topbar) with Viewer/Admin/Super Admin variants — reverted the same day on PM instruction; `/overview` is back on the shared `(shell)` sidebar. A minimal, real `task` table (title, due date, open/done) and its `/api/v1/admin/tasks/**` API were *not* reverted and remain in the schema/backend, unused by any current page. Drafted and implemented as "ADR-029"; renumbered to 033 on resolving the merge with `dev`, whose own unrelated ADR-029/030/031/032 landed first — see the ADR's own Numbering section |
| [ADR-034](ADR-034-notifications-as-rows.md) | Notifications become rows, not a view of live state | **PROPOSED** | A `notification` table (V20), one row per recipient per event, with `read_at` on the server instead of `localStorage`. The bell derived everything from live sources, so a new-device alert vanished when its session was revoked or expired — the case it exists for. Type + jsonb payload stored, wording rendered at read time, so improving a sentence applies to everything already sent. Swept at 90 days; `audit_log` stays the archive. Revises ADR-025 and ADR-027 decision 7 |
| [ADR-035](ADR-035-claude-usage-real-data.md) | Claude Usage becomes real data | **ACCEPTED** | Replaces `frontend/lib/mock/claude-usage.ts` with `claude_usage_member` + `claude_usage_daily` (V22) and a real `/api/v1/admin/claude-usage/**` API. Ingested via `POST /api/ingest`, guarded by one shared bearer secret (`app.claude-usage.ingest-secret`) — matches the shape `NFR-SEC-CHANNEL`/`TM-028` already anticipated, not a per-member token. Removing a member never deletes their usage history. Reverses `FR-USAGE-001`'s "Won't" on direct PM/developer instruction — see REQUIREMENTS-SPEC.md §7.6 |
| [ADR-036](ADR-036-revision-of-035-per-model-pricing.md) | Real per-model pricing | **ACCEPTED** | `ClaudeUsagePricing` prices each model at its own real Anthropic API rate (Opus/Sonnet/Haiku/Fable/Mythos), not ADR-035's flat $0.006/1K blended rate. `POST /api/ingest` gains an optional `byModel` breakdown to price from; no breakdown means $0 cost, never a guessed number. Historical rows keep their old flat-rate cost — not retroactively repriced. Revises ADR-035 decision 4 |
| [ADR-037](ADR-037-integrations.md) | Outgoing webhook integrations | **ACCEPTED** | Gives the Overview "Connect Integration" quick action a real backend: `integration` + `integration_delivery` tables, `super_admin`-gated connect/test/rotate/disconnect, AES-256-GCM signing secret at rest (this codebase's first encryption-at-rest primitive), async `AFTER_COMMIT` dispatch with explicit timeouts and no unbounded retry (`CODE-002`). Provider is a generic webhook (+ Slack payload preset), not a named OAuth SaaS integration — deliberately avoids an OAuth-client dependency or a third-party token-refresh lifecycle. New `FR-INTEG-001..006`, REQUIREMENTS-SPEC.md §7.7. **Revisits ADR-004 and ADR-007's recorded N/A triggers** — see their entries below |
| [ADR-038](ADR-038-capability-grants-ax-renewal.md) | Capability grants — a second, rank-independent authorization axis | **PROPOSED** | A new `capability`/`account_capability` table pair, deliberately independent of `app_role`/`account_role`/`role_permission` — a capability (starting with `developer`) is granted directly to an account and never touches the `app_role` Postgres enum that `page.min_role`/`nav_product.min_role` also depend on. Backs the new AX Renewal feature (`ax_renewal_*`, V25), whose confirm/start-implementation floor is deliberately `Super Admin OR developer capability`, not admin-or-above. Answers ADR-016 follow-up items #3 and #4. Revises/complements ADR-016 |
| [ADR-039](ADR-039-revision-of-038-ax-role-tech-lead-and-reviewer.md) | AX Role extended to Tech Lead, Developer, Reviewer | **PROPOSED** | Extends the `capability` catalog (V26) with `tech_lead` and `reviewer` alongside the existing `developer`, surfaced together in the account details screen as "AX Role". Reuses ADR-038's mechanism unchanged — no schema beyond two catalog rows, no new enum type, capabilities stay a non-exclusive set. Deliberately does **not** widen any `developer`-keyed authorization rule (`SecurityConfig`, `RequireSession.tsx`, `nav-config.ts`) to the two new values — left as an explicit PM follow-up decision. Revises ADR-038 |
| [ADR-040](ADR-040-reviewer-lead-roles.md) | Extend the role ladder with Reviewer and Lead — supersedes ADR-039, retires capability grants | **PROPOSED** | Two new real `app_role` values, strictly between User and Admin (`guest < user < reviewer < lead < admin < super_admin`; V28 extends the Postgres enum, V29 seeds `role`/`role_permission`, renumbering admin/super_admin's rank to make room). Deliberately does not add "Developer" a second time — it stays the ADR-037/038 capability, unduplicated. Both new roles grant only `content.read` today (same as `user`) since every `/api/v1/admin/**` route still floors at `hasRole(ADMIN)` regardless of `role_permission` — what, if anything, they unlock beyond that is left open. Extends ADR-016 |
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

**Note (ADR-037, 2026-09-18)**: this trigger has occurred for one channel —
`ADR-037` introduces HMAC-signed outbound webhook payloads. Message
integrity for every other channel (in particular `/api/ingest`) is
unaffected and remains as recorded above.

### ADR-007 — Key management · **N/A**
**Why**: The system holds no encryption keys of its own to manage. FR-AUTH-002 means **no passwords are stored**; ADR-005 uses provider-native encryption at rest, so key custody belongs to Supabase; and there is no application-layer column encryption to key.

What remains is *credential* management — database credentials, `INGEST_SECRET`, and the Keycloak client secret — which is environment-variable handling covered by ADR-008, ADR-011 and ADR-013, not a key-management architecture.

**Note (ADR-013, 2026-09-10)**: the **Google OAuth client secret is no longer held by the application** — it moves into Keycloak, which brokers Google on our behalf. That shrinks our secret surface by one, and is one of the few unambiguous security *gains* from introducing the broker.

**Revisit if**: ADR-005's deferred application-layer column encryption is ever adopted — that decision would require this ADR.

**Note (ADR-037, 2026-09-18)**: this trigger has now occurred — `ADR-037`
adopts application-layer AES-256-GCM encryption for a webhook signing
secret column. Whether this record should move from "Recorded N/A" into
"Written" (with `ADR-037` as its content) is left for the PM to decide,
per `CONST-PROC-01` — not changed unilaterally here.

### ADR-009 — Retry / idempotency · **N/A**
**Why**: There are no unreliable channels to retry against and no operation whose duplicate execution causes harm. Content writes are user-initiated, synchronous, and idempotent by construction — FR-CONT-013's optimistic locking on `version_no` means a repeated save either applies once or is refused as a conflict.

The one genuine idempotency case in the codebase — `/api/ingest` upserting on `(user_email, date)` — already exists, is unchanged in MVP, and is out of scope.

**Revisit if**: background jobs, queues or webhook receivers are added.

**Note (ADR-037, 2026-09-18)**: `ADR-037` adds the first webhook-shaped
outbound channel (bounded timeout, no unbounded retry) but is a webhook
*sender*, not a *receiver* — this record's trigger is only partially hit.
Idempotency for a future inbound webhook remains open and undecided.

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
