# ADR-034: Notifications become rows, not a view of live state

## Status

**PROPOSED** — 2026-09-17

Revises [ADR-025](ADR-025-push-notifications.md) and
[ADR-027](ADR-027-new-device-sign-in-alerts.md) decision 7, both of which chose
to derive the bell from live sources rather than store notifications. Applies
to every type in the system, including ADR-032's HRMS arrivals and ADR-033's
activity feed.

- Deciders: PM (reported the symptom), architect.
- **`REQUIREMENTS-SPEC.md` §7 amendment for `FR-AUTH-008` is outstanding**, as
  it is for ADR-014/017/021/023/025/026/027.

---

## Context

The PM asked why this project has no notification table, with the example that
answers it: *"when someone login my account I see notify but next time I don't
see notify at list"*.

That is exactly right, and it is not a bug. A new-device sign-in alert is
derived on every read from the live session list:

```ts
sessionResult.value.filter((s) => s.newDevice && !s.current)
```

So the alert is a **view of which sessions exist**, not a record of an event.
It disappears when that session stops being live — the other browser signs out,
somebody signs in again there and replaces it (`revokeSuperseded`), or the
one-day TTL expires it. The case where the record matters most — someone signed
in, did something, and left — is precisely the case that leaves nothing behind.

Read state has the same shape: `localStorage`, per browser. Reading an alert on
a laptop leaves it unread on a phone, and clearing site data loses every mark.

### Why it was built this way, twice

ADR-025 named a server-side table as the honest fix and deferred it as "worth
building when the second notification type arrives". ADR-027 was that second
type and deferred it again, on the reasoning that both types already had a live
source of truth and a table would be a second copy that could drift.

That reasoning has expired. There are now four sources and three different
answers to read state:

| Source | Storage | Read state |
|---|---|---|
| Registration queue (ADR-017) | derived from `account` | `localStorage` |
| New-device sign-in (ADR-027) | derived from `app_session` | `localStorage` |
| Activity feed (ADR-033) | derived from `audit_log` | **none** |
| HRMS arrivals (ADR-032) | `hrms_notification` | none |

`NotificationFeedService` carries a constant stating the gap outright:
`"audit_log is append-only; read state would need its own table"`. Each type
solved the problem differently, and the security-relevant one is the one that
forgets.

## Decision

### 1. One `notification` table, one row per recipient per event

Not per event. A registration notifies every active `super_admin`, and they
read it at different times or not at all — so "read" is a property of the pair,
and one row each is what makes that expressible without a join table.

The cost is stated plainly: five approvers means five rows. At this scale that
is nothing, and the alternative — an event table plus a receipts table — is two
writes and a join to answer the only question anybody asks ("what should I see,
and which have I seen").

### 2. The type and its facts are stored; the wording is not

A row holds `type` (the stable key already on `NotificationType`) and a small
`payload` jsonb with the specifics — the device for a sign-in, the applicant's
name for a registration. The title and body are rendered from those at read
time.

Storing rendered text would freeze today's wording into history, so improving a
message would leave every past notification phrased the old way and there would
be no way to re-render them. Rendering from facts means a better sentence
applies everywhere at once.

The reverse risk is real and accepted: change what a type *means* and old rows
re-render under the new meaning. That is a reason to add a type rather than
repurpose one, which is the same rule ADR-025 already set for the enum.

### 3. `payload` is jsonb, and deliberately small

Whatever a type needs to render and route, and nothing else. Not a copy of the
subject: an account's name lives on `account`, and duplicating it here would
give the row a second, staler answer to who somebody is.

**No personal data beyond what the notification must say.** `NFR-SEC-PII`
confines identity data to `super_admin`, and this table is readable by its
recipient. A device string is fine; a report body naming sixty colleagues is
not — exactly the line ADR-032 drew for `hrms_notification`, applied here as a
rule rather than a precedent.

### 4. Read state is `read_at`, per recipient, on the server

A nullable timestamp, not a boolean: it answers "when" for free and reads
correctly beside `created_at`. Marking read is an update to the caller's own
row and is expressible no other way — which is the whole point, because
`localStorage` could never be.

`localStorage` read marks are abandoned, not migrated. They are per browser and
mean nothing on any other device; carrying them across would preserve a wrong
answer.

### 5. The row is written first, in the same transaction as the event

`notifyApprovers` and `notifyAccount` persist before they send. Delivery —
stream, push, mail — stays best-effort afterwards, exactly as now: a failed
push must not lose the notification, and it no longer can, because the record
exists before anything is transmitted.

Both are already called from `AFTER_COMMIT` listeners (ADR-025, ADR-027), so a
rolled-back sign-in still notifies nobody.

### 6. Deriving stays where it is genuinely better

The pending queue remains the authority on who is waiting: approve somebody and
they leave the queue, and no stored notification can contradict that. The
activity feed stays derived from `audit_log`, which is the record.

What changes is that an **event** is now recorded as one. A queue is a state
and reads correctly as a view; a sign-in that happened at 3am is not a state,
and deriving it from whatever still exists an hour later is what produced the
symptom this ADR opens with.

### 7. Retention: 90 days, swept

`NotificationMaintenance` deletes rows older than 90 days, read or unread, on
the same schedule as the other sweeps in this package. A bell is not an archive
— `audit_log` is, retained a year and append-only — and an unbounded table
behind a badge count is a query that gets slower for ever.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Keep deriving from live state** | The symptom this ADR opens with. An alert that expires with the session it describes is missing exactly when it matters |
| **One row per event + a read-receipts table** | Two writes and a join to answer the only question asked. One row per recipient says the same thing in one table |
| **Store the rendered title and body** | Freezes today's wording into history. A better sentence would apply to nothing already sent |
| **Extend `audit_log` instead** | It records what this system did, with an actor behind every row, is append-only and retained a year. A notification is neither an action nor permanent — the same two reasons ADR-032 gave for not putting HRMS arrivals there |
| **Keep read state in `localStorage`** | Per browser. Reading on a laptop leaves it unread on a phone, and clearing site data loses everything |
| **A boolean `read` flag** | A timestamp answers "when" for free and costs the same |
| **No retention sweep** | An unbounded table behind a badge count gets slower for ever |

## Consequences

### Positive

- A sign-in alert outlives its session, which is the point.
- Read state follows the person, not the browser.
- One place to add a notification type: a row, a payload, a renderer.
- Delivery failure stops being data loss — the record exists before any
  transport is attempted.

### Negative — stated plainly

- **Fan-out is real rows.** Five approvers, five rows per registration. Fine at
  this scale, and a reason to keep the payload small.
- **Two sources for the bell during the change.** The pending queue still
  drives "who is waiting" and the table drives events. That is deliberate
  (decision 6) and it is still two queries a reader must reconcile.
- **Old rows re-render under a changed type.** Decision 2. Add a type rather
  than repurpose one.
- **90 days is a choice, not a law.** Long enough that nobody loses something
  they had not looked at, short enough to stay fast. If somebody needs a year,
  they need `audit_log`, which has one.
- **`localStorage` marks are dropped.** Everything shows unread once, on the
  first load after this ships.

### Required follow-up

1. Amend `REQUIREMENTS-SPEC.md` §7 for `FR-AUTH-008`.
2. Move `hrms_notification` onto this table, or state why it stays separate.
   ADR-032's reasons were about `audit_log`, not about this, and two
   notification tables is one more than the design wants.
3. Decide whether the activity feed should write rows for anything a person
   must act on, rather than staying purely derived.

## References

- Requirements: `FR-AUTH-008`, `NFR-SEC-PII`, `NFR-OPS-AUDIT`
- Revises: `ADR-025` (derive, defer the table), `ADR-027` decision 7
- Related: `ADR-017` (the queue), `ADR-028` (the live stream that delivers),
  `ADR-032` (HRMS arrivals), `ADR-033` (the activity feed)
- Code: `db/migration/V20__notification.sql`,
  `notify/Notification.java`, `notify/NotificationRepository.java`,
  `notify/NotificationService.java`, `notify/NotificationMaintenance.java`,
  `web/NotificationFeedController.java`,
  `frontend/lib/notify/useNotifications.ts`
- Tests: `NotificationPersistenceTest`, `NotificationRepositoryTest`,
  `useNotifications.test.ts`
