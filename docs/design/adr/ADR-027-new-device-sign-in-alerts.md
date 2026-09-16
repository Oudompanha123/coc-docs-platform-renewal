# ADR-027: Telling an account owner when somebody signs in from a device they have not used

## Status

**PROPOSED** — 2026-09-16

Extends [ADR-011](ADR-011-session-and-authorization.md)'s session model and
[ADR-025](ADR-025-push-notifications.md)'s notification transport. Adds the
second notification type, which ADR-025 named as the moment to revisit its own
decisions.

- Deciders: PM (requested), architect.
- **`REQUIREMENTS-SPEC.md` §7 amendment for `FR-AUTH-007` is outstanding**, as
  it is for ADR-014/017/021/023/025/026.

---

## Context

Settings already lists every device an account is signed in on and offers to
end any of them (`FR-AUTH-007`, V7). Nothing announces that a new one appeared.

That gap is the whole protection. Somebody signing in as you from their own
browser is invisible until you happen to open the Security page and read a list
you have no reason to suspect — which is the one moment a person is least
likely to be looking. The control existed; the prompt to use it did not.

The PM reported it from the other side: signing in from a second browser
produced no notification at all. There was also nothing it could have produced.
`app_session` records a `user_agent` per row, but nothing asks whether an
account has been used from that kind of device before, and no notification in
the system had ever had a recipient other than "whoever holds a role".

## Decision

### 1. A device is its browser and its platform — never a version, never the IP

At sign-in, the user agent is distilled to a key: `Chrome on Windows`,
`Safari on iOS`. A session is announced when the account has no earlier session
carrying the same key.

The two rejected alternatives both fail the same way — by making the alert
unreadable — but from opposite ends:

- **The whole user agent** makes every Chrome update a device nobody
  recognises. An alert that fires on Patch Tuesday is one people learn to
  dismiss without reading, and it is then worth nothing on the day it is right.
- **Including the IP address** fires on every commute, every café, every time a
  phone drops to mobile data.

**The cost, stated plainly: two machines running the same browser on the same
operating system share a key.** A colleague signing in as you from an identical
Windows laptop is not announced. This is a recognition heuristic and not device
identity, and there is no version of it built from a user agent that would be.
What it buys is an alert that is silent when nothing happened, which is the
only property that makes anybody read the ones that fire.

### 2. Computed and stored at sign-in, not derived on read

`app_session.new_device` (V15) is written once, by the sign-in that created the
row. It cannot be derived later: a moment after the insert, the row is itself a
prior session from that device, and the query would answer no for ever after.

`device_key` is stored beside the untouched `user_agent`, in Java, by
`DeviceDescription`. Not in SQL — a second implementation of the browser rules
is a second thing to keep in step, and the two disagreeing is precisely how a
security alert turns into noise.

### 3. Rows written before V15 are not backfilled, and the first sign-in after it is quiet

There is no honest way to invent a key for a session written before the column
existed, and writing the browser rules a second time in SQL to guess one is the
thing decision 2 exists to avoid.

So the rule is two questions, not one: a device is new only if the account has
**some** device this system has a key for **and** this is not one of them.
Immediately after the migration an account has none, so its next sign-in is
recorded rather than announced. One quiet sign-in per account, once — in
exchange for not alerting every user about the machine they are sitting at on
the day this ships.

It falls out correctly for a brand-new account too: nobody is warned about the
first sign-in they ever make.

### 4. The recipient is the account owner, and nobody else

`NotificationService.notifyAccount` sends to one account's own devices.
`notifyApprovers` — the only pattern that existed — resolves recipients by
role, and that is wrong here in a way worth being explicit about: **who signed
in where is not something this product should let one person read about
another**, including a `super_admin`. There is deliberately no administrator
copy of this alert.

Every one of the owner's registered devices is sent to, including the one that
just signed in, because a device token and a session cannot be matched up.
Being asked "was this you?" on the device in your hand is a poor banner and a
harmless one; missing the other five would be the actual failure.

### 5. The banner says the device. The address and the time stay inside the app

ADR-025 decision 6 keeps identity out of push payloads because they render on
lock screens. A device is not identity — it names a browser and an operating
system, which is exactly what lets a reader answer "was that me" without
unlocking anything — so the body carries it and nothing else.

Where from and exactly when are shown in `NewSignInModal`, behind a session.
Anything describing where a person was belongs behind authentication.

### 6. The alert carries its own remedy

The dialog ends the session. An alert that reports something and leaves the
reader to find the Settings page and work out which row it meant is one people
dismiss rather than answer.

No confirmation step. The worst case is signing your own other browser out,
which costs one sign-in; somebody who has just been told their account may be
compromised should not have to read two dialogs.

### 7. The bell keeps its derived-list design, for now

`useNotifications` builds items from the live session list and the approval
queue on every read, with read marks in `localStorage`.

ADR-025 said the honest fix was a server-side notification table, "worth
building when the second notification type arrives". The second type has
arrived and this still does not build one, which is a deliberate call rather
than an oversight:

- Both types have a live source of truth already — a queue and a session list —
  and a table would be a second copy of both, with the drift that implies.
- The action this alert offers is *ending a live session*. A notification that
  outlives its session is a button with nothing behind it.

What is given up is stated in Consequences, and the table is still the
follow-up.

### 8. Both sign-in paths were merged into one method first

The Google path had its own copy of the insert and the audit entry; only the
password path went through `issue()`. Adding device recognition to the shared
method would have left it absent from the path most people use.

This is the third time this project has been bitten by a duplicated write path,
and the fix each time has been the same: publish from the one statement both
doors pass through.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Match on the full user agent** | Every browser update becomes a new device. The alert fires monthly for no reason and is dead within a quarter |
| **Include IP or geolocation in the key** | Fires on every commute and every café. Mobile data alone would make it constant |
| **Derive `new_device` on read** | Only answerable at the instant of sign-in. A moment later the row is its own precedent |
| **Backfill `device_key` in SQL** | A second implementation of the browser rules. Where the two disagree, everybody is alerted about their own machine on rollout day |
| **Alert super admins too** | Makes one account's sign-in history readable by another person. Nothing in this product needs that, and `NFR-SEC-PII` argues against it |
| **Put the IP in the push body** | Renders on a lock screen, in public. The device alone is enough to make somebody look |
| **A server-side notification table now** | Decision 7. Both sources are already authoritative, and the action this alert offers is ending a live session |
| **Confirmation dialog before ending a session** | The cost of being wrong is one sign-in. The cost of hesitating is not |

## Consequences

### Positive

- The control that already existed now has something that points at it.
- Every account gets this, not only approvers — the bell was previously empty
  for anyone but a `super_admin`.
- One description of a device, composed server-side, shared by the session
  list, the push banner and the audit entry. The frontend copy of the
  user-agent rules is deleted.
- `audit_log` now records `device` and `newDevice` on every sign-in, whether or
  not anybody was notified.

### Negative — stated plainly

- **An identical browser on an identical platform is not announced.** Decision
  1. This is a prompt to look, not a detection system.
- **Read marks are still per-browser.** Dismissing the alert on a laptop leaves
  it unread on a phone. A second notification type now has that problem.
- **The alert lives only as long as the session.** Somebody who signs in and
  signs out within the hour leaves nothing in the bell. `audit_log` has it;
  nothing surfaces that to the account owner.
- **A shared account looks like an intrusion.** Two people deliberately using
  one login will alert each other. This product has per-person accounts and a
  registration queue, so a shared login is already outside its model — but this
  alert will be the thing that says so.
- **One quiet sign-in per account on rollout.** Decision 3.
- **No location.** The IP is shown raw. Turning it into a city needs either a
  bundled GeoIP database or sending user IP addresses to a third party, which
  is a privacy decision of its own and not one to make as a side effect.

### Required follow-up

1. Amend `REQUIREMENTS-SPEC.md` §7 for `FR-AUTH-007`.
2. A server-side notification table, so read state is per person rather than
   per browser, and so an alert can outlive the session it describes.
3. Decide whether sign-in location is wanted, and if so by what means. An
   offline GeoIP database keeps user addresses inside the system; a lookup API
   does not.
4. Confirm `ip_address` is the client address and not a proxy address once a
   hosting target exists (ADR-012 §2 is still `[DEFERRED]`). A load balancer in
   front of this would make every session read as the same address, which would
   not break the alert — the key does not use the IP — but would make the
   detail useless.

## References

- Requirements: `FR-AUTH-007`, `NFR-SEC-SESSION`, `NFR-SEC-PII`, `FR-OPS-002`
- Extends: `ADR-011` (sessions), `ADR-025` (push transport, optional Firebase)
- Related: `ADR-012` (service split), `ADR-017` (the other notification type)
- Code: `backend/src/main/java/com/coc/docs/auth/DeviceDescription.java`,
  `NewDeviceSignInEvent.java`, `SessionService.issue`,
  `SessionRepository.hasDevice`, `notify/SignInNotifier.java`,
  `notify/NotificationService.notifyAccount`,
  `db/migration/V15__session_device.sql`,
  `frontend/components/layout/NewSignInModal.tsx`,
  `frontend/lib/notify/useNotifications.ts`
- Tests: `DeviceDescriptionTest`, `NewDeviceSignInTest`, `NotificationTypeTest`,
  `NewSignInModal.test.tsx`, `useNotifications.test.ts`
