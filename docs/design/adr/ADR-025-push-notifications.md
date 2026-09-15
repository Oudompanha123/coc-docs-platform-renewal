# ADR-025: Push notifications, starting with a new registration reaching a super admin

## Status

**PROPOSED** — 2026-09-15

Extends [ADR-017](ADR-017-approval-gate.md) (the approval gate this notifies
about) and [ADR-021](ADR-021-revision-of-014-registration-email-otp.md) (which
changed when an application row appears). Adds one external dependency, one
table, and one outbound channel; changes no existing behaviour.

- Deciders: PM (requested directly, and answered the three scoping questions
  below), architect.
- **`REQUIREMENTS-SPEC.md` §7 amendment is outstanding**, as it is for
  ADR-014/017/021/023.

---

## Context

A registration lands silently. ADR-017 made a first arrival an *application* —
`pending`, at a role that grants nothing, waiting for a super admin. What it
did not do is tell the super admin. The queue is only discovered when somebody
happens to open Users and roles, so an applicant who registers on Friday
afternoon can wait until Monday for a decision that takes four seconds to make.

Three scoping answers shape what follows:

1. **A mobile app is expected later.** So the transport is FCM rather than
   anything web-only, and the device table carries a platform from day one
   rather than being migrated once Android exists.
2. **Email is a separate concern.** Not folded in here. `PasswordResetMailer`
   and `AccountInviteMailer` already exist and an email on this event would be
   a handful of lines, but the PM wants the two channels kept apart rather than
   one class that does both.
3. **More notification types will follow.** So this is not a
   `NewRegistrationPushSender`. The type is data, and adding the next one
   should be adding a constant and a publisher, not rewiring a delivery path.

## Decision

### 1. Delivery is triggered by a domain event, published after commit

Not by a call inside the registration path. Two reasons, and the first is not
hypothetical:

**A rollback must not announce an applicant who no longer exists.** On
2026-09-14 a `@Transactional` sign-in created an application row and then
reported "awaiting approval" by throwing, which rolled the row back — the
applicant was told to wait for approval of a record that had been deleted, and
the queue stayed empty however many people applied. A notification sent inline
would have announced those ghosts to every super admin.
`@TransactionalEventListener(phase = AFTER_COMMIT)` cannot fire for a
transaction that did not commit.

**A dead FCM must not fail a registration.** After commit, the applicant is
already saved. The worst outcome of an outage is a missed notification, not a
500 for somebody signing up.

### 2. It listens on *both* registration doors

A `pending` account row is created in two places:

- `AccountService.register` — the password path, reached from
  `RegistrationOtpService.verify` once the emailed code is confirmed (ADR-021)
- `SessionService` — the Google path, where a first Google sign-in creates the
  application directly

Hooking only one is the failure mode this project has already had once: the
approval gate had to be fixed in both doors for the same reason. The event is
published from the one place both paths pass through, so a third door added
later inherits it.

Note the timing difference ADR-021 introduced, which is correct and deliberate:
the password path notifies only **after the OTP is verified**, because that is
when the account row exists. An abandoned or mistyped registration never
reaches an admin's lock screen.

### 3. `device_token` (V11) carries a platform from the start

```
token        text        primary key   -- the FCM registration token
account_id   uuid        not null references account(id) on delete cascade
platform     text        not null      -- 'web' | 'android' | 'ios'
user_agent   text                      -- so a person can recognise a device
created_at   timestamptz not null
last_seen_at timestamptz not null
```

The token is the primary key because FCM issues one per app-instance and it is
already unique; a surrogate id would add a column and buy nothing.
`on delete cascade` matches every other per-account table and means ADR-023's
deletion carries the tokens away with the account.

**Tokens rotate and die, and both must be handled.** FCM replaces a token
without asking, and reports `UNREGISTERED` / `INVALID_ARGUMENT` when one is
dead. A row is deleted on that response and on sign-out. Without that the table
grows forever and every send wastes work on addresses nobody is listening to.

### 4. The type is data, not a class

One `NotificationType` constant carries the title, the body and the deep link
target. Adding "a page was published" later is adding a constant and publishing
an event, not touching delivery. The alternative — a sender per notification —
is the shape that makes the fifth one a rewrite.

### 5. Recipients are resolved at send time

Every active `super_admin`, as the PM specified. Resolved by a query at send
time rather than a stored subscriber list, so promoting somebody is enough to
start notifying them and nothing can drift out of step.

Deliberately one method. ADR-016 exists so that "who may approve" might one day
be a permission rather than a role, and when that happens this is the single
place to change.

### 6. No identifying detail in the payload

*"1 new registration awaiting approval"*, deep-linked to the Pending tab. Not
the applicant's name or address.

A push notification renders on a lock screen, on a device that may be in a
meeting room or on a train, and it is delivered through Google's infrastructure
to a browser this application does not control. The admin is one tap from the
queue, where the identity is shown to somebody who has authenticated.

### 7. Firebase is an optional bean, exactly like the mailers

`AccountInviteMailer` and `PasswordResetMailer` take their sender through an
`ObjectProvider` so that a developer without SMTP credentials gets a log line
rather than a broken application. This follows that precedent rather than
inventing a third convention: no Firebase credentials, no push, a warning at
startup, everything else works.

This matters more than it sounds. Six developers run this locally against their
own schema; a component that refuses to boot without a Google service account
would make the whole application undevelopable for anyone who had not been
given one.

## Alternatives Considered

| Option | Why not |
|---|---|
| **SSE or WebSocket** | Reaches only an admin who already has the app open — which is the case where they can see the badge anyway. FCM reaches a closed tab. Rejected for *this*, still the right answer for live-updating an open Pending tab, which is separate work |
| **Email on this event** | Reaches people regardless of whether any browser is running, and the mailer already exists. PM's decision is to keep channels separate; the event published here makes adding it later a listener, not a redesign |
| **Call FCM inside the registration transaction** | Announces applicants that a rollback then deletes, and turns an FCM outage into a failed registration |
| **A stored subscriber list** | Another thing to keep in step with roles. Resolving at send time cannot drift |
| **Notification rows in the database** | An in-app inbox is a different feature with its own read/unread state. Not needed to put a message on a lock screen, and premature until the second notification type exists |
| **Web Push (VAPID) without Firebase** | No vendor dependency, but no mobile path — and mobile is expected. Two transports later is worse than one now |

## Consequences

### Positive

- A super admin learns about an application without going to look for it.
- The event and recipient rule are shared, so email or an in-app inbox later is
  a listener rather than a redesign.
- The device table already fits Android and iOS.

### Negative — stated plainly

- **Web push only reaches a running browser.** Close Chrome and the
  notification waits. On six desktops that is a real gap, and it is the gap
  email would close. Accepted knowingly, pending the mobile app.
- **A new external dependency and a new secret.** A Google service account
  key joins the secret surface that ADR-007 tracks, and delivery now depends on
  a Google service being reachable.
- **Browser permission is granted once and refused permanently.** A denied
  prompt cannot be re-asked programmatically; the person has to change it in
  browser settings. The prompt must therefore come from a deliberate control,
  never on page load.
- **Delivery is not guaranteed and not acknowledged.** FCM is best-effort.
  Nothing here is a system of record, and the Pending tab remains the only
  authority on who is waiting.

### Required follow-up

1. Amend `REQUIREMENTS-SPEC.md` §7.
2. Add the device-token endpoints to `docs/api/openapi.yaml`.
3. Decide on batching. Five registrations in a minute currently means five
   notifications; a digest is easy to add at the listener and awkward to
   retrofit once people expect one message per event.
4. Revisit recipients if "who may approve" becomes a permission (ADR-016).

## References

- Requirements: `FR-AUTH-003`, `FR-AUTH-008`, `NFR-OPS-AUDIT`
- Extends: `ADR-017` (approval gate), `ADR-021` (OTP timing)
- Related: `ADR-007` (secret surface), `ADR-016` (roles), `ADR-023` (deletion
  cascades the tokens)
- Code: `backend/src/main/java/com/coc/docs/notify/`,
  `db/migration/V11__device_token.sql`,
  `frontend/public/firebase-messaging-sw.js`
