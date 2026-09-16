# ADR-028: A live stream for notifications, because push reaches almost nobody

## Status

**PROPOSED** — 2026-09-16

Revises [ADR-025](ADR-025-push-notifications.md)'s assumption that Firebase
Cloud Messaging is the immediate delivery path. Applies to both notification
types: the approval queue (ADR-017) and new-device sign-in (ADR-027).

- Deciders: PM (reported), architect.

---

## Context

ADR-025 built push on FCM and made Firebase an optional bean, so that the five
developers without credentials could still run the application. That decision
was right and is unchanged. What it did not follow through on is what those
people actually get.

With Firebase absent, `PushSender` logs `push not configured` and returns. The
only remaining mechanism was the bell polling every sixty seconds. So for
almost everyone — every developer machine, and any deployment before a Firebase
project exists — nothing was immediate, and the honest description of the
feature was "the badge updates within a minute, sometimes".

The PM reported it as two things in one sentence: notifications are not
real-time, and you have to refresh. Both are the same gap.

A minute is not a small delay here. It is long enough that a person watching
the screen concludes nothing happened and reloads the page — which is exactly
what was reported, and which makes the polling interval worse than useless: it
teaches people the feature is broken.

## Decision

### 1. Server-sent events, as a transport alongside push and polling

`GET /api/v1/notifications/stream` returns a `text/event-stream` that stays
open. `NotificationService` writes to it in the same place it sends a push, for
both notification types.

This needs no third party, no credentials, no service worker and no build
configuration. It is an HTTP response, authenticated by the session cookie
every other call already sends, over the CORS rule that already exists.

### 2. SSE rather than WebSocket

Everything here travels one way, to a client that only reacts. A WebSocket
would add a protocol upgrade, a second authentication surface and its own
reconnection logic to carry the same one-way message.

SSE also gets reconnection for free and does it better than a hand-written
loop would: `EventSource` retries with its own backoff and resumes when a
laptop wakes. The server closes each connection after thirty minutes so that a
connection cannot leak indefinitely, and the browser reopens it unprompted.

### 3. The event is a nudge, not the notification

The payload is a type key. The client re-reads the pending queue and the
session list — the same two sources the bell has always derived from.

Sending the content would make the stream a third source of truth, able to
disagree with the two that are authoritative, and would put the only copy of
something in a channel a sleeping tab can miss entirely. A nudge cannot be
wrong for long: the next read corrects it.

### 4. Polling stays, at sixty seconds, as the floor

Not removed. A stream can be cut by a proxy that buffers responses, a corporate
middlebox, or a tab the operating system froze — and none of those announce
themselves to either end. A minute late is a poor experience; never is a bug.

### 5. Per account, not per session, and never shared

Connections are held in a map keyed by account id, with a queue per account
because two tabs are two connections and replacing one with the other leaves a
tab silently dead.

The account comes from the resolved session; there is no parameter on the
endpoint. A caller can only ever open a stream for themselves, which is the
same rule `/auth/sessions` and `DeviceTokenController` already follow
(NFR-SEC-PII). It matters more here than for either: ADR-027's alert is the one
notification whose recipient is its subject.

### 6. A heartbeat every twenty seconds, which is also how dead tabs are reaped

An SSE comment, invisible to the client. Two jobs:

- A connection carrying nothing for a minute or two gets closed by proxies and
  by sleeping laptops, and neither end is told.
- It is the only thing that discovers a tab closed without the server noticing.
  The write fails, and the connection is removed. Without it the registry grows
  for as long as the process runs.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Leave it at FCM plus polling** | FCM is absent on every machine here. "Real-time, if you have a Firebase project" is a feature almost nobody has |
| **Poll every few seconds instead** | A request per tab per few seconds, for a thing that changes a few times a day. Still not immediate, and worse under load |
| **WebSocket** | A protocol upgrade, a second auth surface and hand-written reconnection, for traffic that only goes one way |
| **Send the notification content in the event** | A third source of truth that can disagree with the queue and the session list, in the one channel a sleeping tab can miss |
| **Drop polling now that there is a stream** | A stream can be cut silently by a proxy or a frozen tab. A minute late beats never |
| **One emitter per account** | Two tabs on a machine are two connections. Replacing one leaves it dead with nothing to show it |

## Consequences

### Positive

- The bell updates as things happen, on every machine, with no Firebase project
  and no granted browser permission.
- The transport is nothing but an HTTP response — no new dependency, no new
  secret, nothing added to ADR-007's secret surface.
- Both notification types get it at once, because it lives in
  `NotificationService` rather than in either publisher.

### Negative — stated plainly

- **A held-open connection per tab.** Cheap on Tomcat's async handling at this
  scale and not free at a larger one. Thirty-minute expiry and the heartbeat
  reaper bound it; a deployment behind a connection-limited proxy should know
  it exists.
- **Some infrastructure buffers `text/event-stream`.** Where it does, events
  arrive in batches or not at all, and the sixty-second poll is what is
  actually delivering. Worth checking once a hosting target exists (ADR-012 §2
  is still `[DEFERRED]`).
- **Nothing is queued for a tab that is closed.** The stream is for people
  looking at the screen. Somebody who was away learns about it from the bell on
  their next load, or from a push if they have one.
- **In-memory, so it does not survive a restart or span instances.** More than
  one backend instance means a tab connected to A hears nothing about an event
  raised on B. The follow-up below is the fix, and it is not needed until there
  is a second instance.

### Required follow-up

1. Verify SSE is not buffered by whatever sits in front of the backend, once
   that is decided.
2. If the backend is ever run as more than one instance, connections must be
   fanned out between them — a shared bus, or sticky routing. Until then a
   single instance is the assumption, and it is stated here rather than
   discovered.

## References

- Requirements: `FR-AUTH-007`, `FR-AUTH-008`, `NFR-SEC-PII`, `NFR-SEC-CHANNEL`
- Revises: `ADR-025` (FCM as the immediate path)
- Related: `ADR-012` (service split, CORS), `ADR-017`, `ADR-027`
- Code: `backend/src/main/java/com/coc/docs/notify/NotificationStream.java`,
  `web/NotificationStreamController.java`, `notify/NotificationService.java`,
  `config/SecurityConfig.java`,
  `frontend/lib/notify/stream.ts`, `frontend/lib/notify/useNotifications.ts`
- Tests: `NotificationStreamTest`, `SecurityRulesTest`, `useNotifications.test.ts`
