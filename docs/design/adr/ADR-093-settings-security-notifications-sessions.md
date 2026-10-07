# ADR-093: Real Security, Notifications, and Sessions on `/account/settings`

> **Status**: ACCEPTED — implemented (PM decision, direct in-session instruction)
> **Date**: 2026-10-02
> **Author**: AI (Claude Sonnet 5), on direct in-session instruction
> **Approver**: the user (product owner) — "Decision (product owner): build all 3 for real — no Coming soon for these." Recorded here as a transcription of that explicit instruction, not a self-approval, the same way ADR-070/ADR-071 record their own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Extends ADR-041 (notification preferences), ADR-027 (device/session description), ADR-006 (audit logging). Supersedes nothing — the two previous Settings-page ADRs (schema/editor work) left Security absent and Notifications/Sessions as placeholders; this is the follow-up that fills them in. Drafted and implemented as "ADR-085", then renumbered to "ADR-090" on merging `dev` once (whose own unrelated ADR-084..089 landed first), then to 093 on merging `dev` again — a second, parallel branch had independently claimed 090/091/092 for its own staff-roles/account-delete/email-logo work by the time this one reached `dev`.

---

## 1. Context

`/account/settings` (its own earlier ADR covers the page itself) shipped with Profile, Appearance, and Connected Accounts real, and Notifications/Sessions as bare placeholders pending backend work. The product owner asked for all three of Security, Notifications, and Sessions to be genuinely real — no further `Coming soon` chips for them — including two sub-features with no existing foundation at all: a per-doc "follow" notification and a daily attendance-missed-log alert.

Investigation (this ADR's own Step 1) found:
- Sessions are already real and server-side (`app_session` table, not JWT) — `GET/DELETE /api/v1/auth/sessions[/{id}]` already exist and are already scoped to the caller. Only a bulk "sign out all other devices" action is missing.
- The sign-in audit row (`SessionService.issue`) captures a browser/OS string (`DeviceDescription.describe`) but **never a raw IP address at all** — there is nothing to mask for a sign-in history list. Confirmed with the product owner: the Security card's history omits IP entirely, rather than starting to capture it now (that would touch a write path, `SessionService.issue`, outside this task's own allow-list).
- "Document updates" (notify when a product doc you follow is updated) has no existing foundation whatsoever — no follow/subscribe concept, no save-time event hook in `DocsContentService`. Confirmed with the product owner: build it in full, as a genuinely new feature (follow table, a follow control on the real docs page, a save-time hook, a new notification type) rather than scaling it back.
- A migration (`V63__attendance_report_sent.sql`) existed locally, untracked, with no corresponding code in this branch at the time — it looked orphaned. It was not: merging `dev` confirmed it is real, already-merged work from a separate branch (`feature/gmail-oauth-per-account`, ADR-089, backed by `AttendanceReportSentRepository`/`AttendanceSignInMailer`), mailing the attendance report on sign-in. It is unrelated to this ADR's own "Attendance alerts" feature (a missed-log check, not a mailed report) and keyed differently (one row per `hrms_notification.id`, not per date+check-type) — the two coexist rather than one building on the other.

## 2. Decision

Build all three real, each reusing existing infrastructure wherever one already fits, and inventing new schema only where nothing does.

### 2.1 Security card

`GET /api/v1/me/security` (new, `USER` floor, caller resolved from session) returns the Google sign-in method (static — this app has only ever had Google sign-in) plus the caller's own last 10 sign-in/sign-out events via a new `AuditRepository.recentSignInsForActor` query over the *existing* `audit_log` table (no new table). Each entry carries the action, `occurredAt`, and the same `device` string already stored in `detail` at sign-in time — no IP, per the decision above.

### 2.2 Notifications

- `Document updates` and `Attendance alerts` become two new `NotificationType` enum constants, stored in the *existing* `notification_preference` table (ADR-041) — no migration, since that table already supports an arbitrary type key and "opt-out by absence" (both default **on**, matching that table's existing semantics).
- `Email notifications` does **not** fit that table's semantics: it must default **off**, where every existing row in that table defaults to enabled-by-absence. Modeling it as a third preference row there would mean one row in the same table meaning the opposite of the other two on absence — a trap for the next reader. It is instead a new `account.email_notifications_enabled boolean not null default false` column (new migration), read once by the shared notification-dispatch path before deciding whether to also email a notification it already decided to send.
- `Document updates`: a new `docs_content_follow(account_id, product_key, slug)` table; a real "Follow this page" control added to the public docs page (`ProductDocsPage`); `DocsContentService.save()` publishes a new `DocsContentUpdatedEvent` after committing, handled by a new `DocsContentUpdateNotifier` (same `@TransactionalEventListener(AFTER_COMMIT)` + `@Async` shape every other notifier in this codebase already uses) that notifies followers, honoring their preference.
- `Attendance alerts`: a new server-side "missed" check (the existing bucketing logic is client-side only today) and a new daily `@Scheduled` job, gated on the account actually being HRMS-linked (toggle disabled with a hint otherwise). Dedup via a new `attendance_alert_sent(account_id, report_date, check_type)` table — deliberately not `V63`'s `attendance_report_sent` table, whose shape (keyed to one `hrms_notification.id`) backs a different, already-shipped feature (ADR-089's mailed report) and doesn't fit a date+type dedup key.

### 2.3 Sessions

A new `SessionService.revokeAllExceptCurrent(caller)` plus `DELETE /api/v1/auth/sessions` (bulk, current session explicitly excluded) alongside the two existing single-session routes.

## 3. Consequences

- Two new tables (`docs_content_follow`, `attendance_alert_sent`) and one new column (`account.email_notifications_enabled`), each in its own new migration, nothing existing edited.
- Two new `NotificationType` values join the six that exist today.
- `/docs/[productKey]/[slug]` (a page outside `/account/settings`'s own prior scope) gains a small, real UI addition (a Follow toggle) — the minimum needed for "a product doc you follow" to mean anything at all.
- The Security card's "Recent sign-ins" will never show an IP address, by design, for every account, past and future — not a gap to close later without a separate decision to start capturing it.

## 4. References

- `backend/src/main/java/com/coc/docs/audit/AuditRepository.java` — `recentSignInsForActor`
- `backend/src/main/java/com/coc/docs/notify/NotificationType.java`
- `backend/src/main/java/com/coc/docs/notify/NotificationPreferenceService.java` (ADR-041)
- `backend/src/main/java/com/coc/docs/docscontent/DocsContentService.java`
- `backend/src/main/java/com/coc/docs/auth/SessionService.java`
- `frontend/components/account/` (SecurityCard, NotificationsCard, SessionsCard)
- `frontend/components/docs/ProductDocsPage.tsx`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-02 | 1.0 | Initial draft, written alongside Step 2 (Security card) | AI (Claude Sonnet 5) |
| 2026-10-06 | 1.1 | Renumbered 085 → 090 → 093 across two `dev` merges; no content change | AI (Claude Sonnet 5) |
