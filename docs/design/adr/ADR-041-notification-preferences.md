# ADR-041: Real per-account notification preferences

## Status

**PROPOSED** — 2026-09-21

The scope decision below (which preferences exist, opt-out semantics,
sign-in alert toggleable) was made by the PM in conversation on this date.
Recorded here as PROPOSED rather than ACCEPTED pending the PM's formal
sign-off in this file's Approval table — this AI does not self-approve gates
or ADRs (`CONST-PROC-01`).

Related: [ADR-025](ADR-025-push-notifications.md) (defines `NotificationType`),
[ADR-034](ADR-034-notifications-as-rows.md) (the `notification` table this
preference gates delivery into).

- Deciders: PM (requested the Settings page be made real; chose the
  preference scope below), architect.

---

## Context

`components/settings/NotificationsCard.tsx` has shipped for a while as a
deliberate, documented placeholder: two disabled "Coming soon" switches, seeded
from `lib/mock/settings.ts`, that store nothing and that nothing reads. Its own
doc comment states why it was left that way rather than wired up as a plain
refactor:

- The two mock rows — "Notifications" and "Messages" — don't correspond to
  anything the backend can actually send. `NotificationType` (ADR-025) has
  exactly two real members: `NEW_REGISTRATION` and `NEW_DEVICE_SIGN_IN`.
  "Messages" in particular maps to the topbar's activity feed
  (`useActivityFeed.ts`), which is explicitly *not* a notification — it's
  audit-log-derived history, already renamed away from "Messages" elsewhere in
  this codebase for that exact reason.
- Picking the real preference list back then was called out as "a product
  decision, not a refactor."

The PM has now made that decision (below), so this ADR records it and the
schema it needs.

## Decision

> One `notification_preference` row per (account, type), opt-out by absence —
> a missing row means enabled. Every real `NotificationType` gets exactly one
> toggle; there is no third category invented for "Messages", and the
> new-device sign-in alert is toggleable like any other type rather than
> locked on.

### Key choices

- **Opt-out, not opt-in.** No row for a type means enabled. This means every
  existing account is unaffected on the day this ships — nobody's alerts go
  silent because a preferences table appeared — and a row only needs to exist
  for the type(s) somebody has actually turned off.
- **One toggle per real `NotificationType` member, nothing invented.** The
  preference list is `NotificationType.values()`, not a hand-maintained
  parallel list — adding a notification type in Java means it appears here for
  free, the same reasoning ADR-025 already applies to the enum itself.
- **The new-device sign-in alert is toggleable.** `NotificationsCard`'s
  original doc comment flagged that this alert is a security notice and "an
  account that has switched it off is an account nobody can warn." The PM's
  call is to treat it like any other preference rather than lock it on. This
  ADR records the trade-off rather than silently reversing it: turning this
  off means genuinely not being warned about a new-device sign-in.
- **Disabling a type suppresses the stored row, not just delivery.** Per
  ADR-034, the `notification` table *is* the bell. A preference that only
  muted the push but still filled the bell and the badge would not match what
  "turn this off" means to somebody reading the Settings page — so
  `NotificationService.notifyApprovers`/`notifyAccount` check the preference
  before `NotificationRepository.insertFor`, not after.
- **Table shape mirrors `notification`'s own conventions** (ADR-034 decision
  2): `type` is `text` holding `NotificationType.key()`, not an enum column,
  so adding a type is a Java constant plus nothing here to migrate.

## Alternatives Considered

| # | Alternative | Why not |
|---|---|---|
| A | Keep "Notifications"/"Messages" as the two categories, back them with *some* real signal | There is no real signal behind "Messages" to back it with — it would still be inventing a mapping the backend doesn't have. Rejected in the original component's own doc comment. |
| B | Opt-in (no row = disabled) | Would silently mute every existing account's alerts the moment this migration runs, including the new-device sign-in security alert. Opt-out is the only choice that ships without changing anyone's current behavior. |
| C | Lock `NEW_DEVICE_SIGN_IN` as always-on, only `NEW_REGISTRATION` toggleable | Offered to the PM as the safer option; declined in favor of uniform toggleability (adopted, see Key Choices). |

## Consequences

### Positive
- `NotificationsCard` stops lying — the switches move, persist, and actually
  gate delivery.
- No backfill needed; opt-out by absence means a zero-row migration is a
  no-op in effect.
- New notification types need no schema change to gain a preference row.

### Negative / accepted cost
- A super_admin (or any account) can now turn off the new-device sign-in
  alert for themselves, which is the one alert whose whole purpose is warning
  someone about access to their own account. Accepted per the PM's explicit
  choice of Alternative not-C.

### Follow-up
- [ ] `REQUIREMENTS-SPEC.md` amendment for the preference-gated delivery
      behavior, same outstanding-amendment pattern ADR-034 already carries for
      `FR-AUTH-008`.

## References

- Requirements: `FR-AUTH-008`
- Related: `ADR-025` (defines `NotificationType`), `ADR-034` (the `notification`
  table this gates delivery into)
- Code: `db/migration/V33__notification_preference.sql`,
  `notify/NotificationPreferenceRepository.java`,
  `notify/NotificationPreferenceService.java`,
  `web/NotificationPreferenceController.java`,
  `frontend/lib/notify/notification-preferences-api.ts`,
  `frontend/components/settings/NotificationsCard.tsx`
