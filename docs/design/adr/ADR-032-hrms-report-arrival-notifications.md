# ADR-032: Watching a mailbox for HRMS report arrivals

## Status

**PROPOSED** — 2026-09-16

Adds a third notification source to the feed
[ADR-028](ADR-028-live-notification-stream.md) and
[ADR-025](ADR-025-push-notifications.md) established, and the first one that
originates outside this system entirely.

- Deciders: PM (requested), architect.
- Depends on [ADR-012](ADR-012-revision-of-001-backend-stack.md) Decision 2
  (hosting `[DEFERRED]`), which is what removes two of the four possible
  designs before any of them are compared.
- **`REQUIREMENTS-SPEC.md` §7 amendment for `FR-OPS-001` is outstanding**, as
  it is for ADR-014/017/021/023/025/026/027.

---

## Context

HRMS KOSIGN (`noreply-hrms@wecambodia.com`) mails a daily attendance report to
around sixty people's personal inboxes each morning. The PM asked that its
arrival also light up the notification bell in this platform, so that the two
things a person checks in the morning are one thing.

Three facts about the situation decide most of what follows.

**HRMS is somebody else's system.** It is a third-party HR product at another
company's domain. It will not call an API of ours, and nobody on this project
can ask it to. Whatever this platform learns about it, it learns by looking.

**There is nowhere for it to call.** Backend hosting is `[DEFERRED]` (ADR-012
Decision 2), so this service has no public URL. Every design that depends on
something on the internet reaching `/api/v1/**` is not available today, and
choosing one would mean the feature ships when hosting is decided rather than
now.

**The mail's contents are other people's HR records.** The report names ~60
colleagues with their check-in and check-out times, who arrived late, and who
missed a check-out. `NFR-SEC-PII` confines identity data in this system to
`super_admin`, and none of those sixty people agreed to their working hours
being held in a documentation CMS.

## Decision

### 1. Poll the mailbox over IMAP

Four ways to learn that an email arrived, in the order they were considered:

| | Why not |
|---|---|
| **HRMS posts a webhook** | Not ours to change. Ruled out by the first fact above, not by preference. |
| **Gmail filter → inbound-mail service → our webhook** | Needs a public URL. Blocked by `[DEFERRED]` hosting. Also adds a third party (SendGrid Inbound Parse, Mailgun, CloudMailin) to the path of a notification. |
| **Gmail API + Pub/Sub push** | Real-time, and the most capable. Needs a GCP project, a Pub/Sub topic, OAuth with `gmail.readonly`, refresh-token storage, *and* a public URL. Blocked by the same thing, at greater cost. |
| **IMAP polling** | Chosen. Entirely outbound, so hosting is irrelevant. Reuses the Gmail App Password already needed for `spring.mail.*` (`docs/ops/EMAIL-DELIVERY.md` route 1). Uses the `jakarta.mail` implementation `spring-boot-starter-mail` already brings — no new dependency. |

The cost is latency: the default schedule is every 30 minutes, so a
notification may be up to half an hour late. For a report that arrives once a
day at 12:02 that is not a meaningful delay, and it is the right trade against
opening an IMAP connection to a person's mailbox 288 times a day.

**Revisit this if hosting is decided and the latency ever matters.** The Gmail
API route becomes available then, and `HrmsMailbox` is an interface so that
swapping the implementation is not a rewrite.

### 2. Record that a report arrived. Never what it said

`hrms_notification` (V21) holds a subject line, a parsed date, and an arrival
time. The body is never fetched — `HrmsImapMailbox` asks for envelopes only and
nothing in the codebase calls `getContent()`.

This was the PM's choice among three offered, and the reasoning is worth
recording because the cheap version is tempting. Parsing the table in would
make a better notification: "you were marked Late Check-In at 08:18" is
actionable in a way "a report arrived" is not. It would also put sixty
colleagues' attendance records into this database as a side effect of wanting a
bell icon to light up — expanding what this system holds, what a breach of it
would disclose, and what `NFR-SEC-PII` has to cover, none of which is a
documentation platform's business.

**If that changes, it is a decision, not a refactor:** a new ADR, HR's
agreement, and a revisit of the feed floor in Decision 6. The subject line
`Attendance on 08-Sep-2026` names nobody, which is what makes everything else
here simple.

### 3. Its own table, not `audit_log`

`NotificationFeedService` derives the bell feed from `audit_log`, so writing
these rows there would have cost no schema change and no new query. Rejected on
two grounds:

- `audit_log` answers "who did this" with an actor account. Nobody here did
  anything — a different company's server sent an email. A row claiming an
  actor would be false, and the audit trail is the one place in this system
  that has to be trustworthy without qualification (ADR-006).
- `audit_log` has `revoke update, delete ... from public` and is retained ≥ 1
  year. A mistake in a mail parser would be permanent. These rows are
  disposable, and `HrmsMailPollJob` prunes them on a 90-day window — which is
  only possible because they are not audit rows.

The feed merges the two sources and re-sorts by time. Feed ids gain an `hrms:`
prefix, because `audit_log.id` 41 and `hrms_notification.id` 41 are both
plausible on the same day and a client keyed on the id would collide.

### 4. Off by default, read-only, and one sender

Everything else in the `notify` package degrades to logging when unconfigured.
This one reads a person's inbox, so the defaults are stricter:

- **`app.hrms.enabled` is false.** No mailbox is opened until somebody turns it
  on deliberately. Enabled-but-incomplete is treated as off and warned about at
  startup, because an IMAP connect with a blank password is a failed
  authentication against a real account every 30 minutes, which is how a
  mailbox gets locked.
- **The folder is opened `READ_ONLY`.** The platform cannot mark the report
  `\Seen`, move it, or delete it. The owner of the mailbox will not find their
  mail already read by something they did not do, and that property is
  structural rather than a matter of this code's intentions.
- **`app.hrms.sender` is the only `From` recorded.** Everything else in the
  folder is ignored.

**The cost, stated plainly: an IMAP credential is not scoped to one sender.**
It opens the whole mailbox, and the sender filter is a courtesy this code
performs on data the server has already agreed to hand it. Anyone who can
change `app.hrms.sender` — or the code — can read that mailbox. That is the
real boundary, and it is why this is a personal decision by the mailbox's owner
and not a deployment default.

### 5. Dedupe on `Message-ID`; the poller keeps no bookmark

Each run re-reads an overlapping window (`app.hrms.lookback`, 7 days) and
relies on a unique index plus `insert ... on conflict do nothing`. No "last
seen" column anywhere.

That is deliberate. A bookmark is state that can be wrong — advanced past a
message that failed to save, lost on a restore, disagreed about by two
replicas. The constraint cannot be wrong, holds if the job runs twice
concurrently, and makes two replicas a matter of duplicate *work* rather than
duplicate *notifications*. The window is anchored to the newest arrival already
recorded rather than to now, so an outage longer than the window does not skip
the reports sent during it.

### 6. The feed floor is `admin`

An operational notice about a watched mailbox is not editorial activity, and an
editor has no use for it — the same reasoning that puts the digest route above
the rest of `/admin`.

This is a usefulness rule, **not** a confidentiality boundary, and it is only
sufficient because of Decision 2: a subject line naming a date discloses
nothing. If the body is ever stored, this floor is no longer adequate and has
to move to `super_admin`.

## Consequences

**A subject-line parser depends on wording this project does not control.** The
date is matched anywhere in the subject rather than against a fixed phrase, so
HRMS adding a prefix or rewording around it costs nothing. If the date *format*
changes, `report_date` goes null and the notification still appears with the
new subject shown verbatim — degraded, never dropped. A run of nulls in that
column is the signal that the wording moved.

The parser is pinned to `Locale.ENGLISH` and `ResolverStyle.STRICT`. Both are
load-bearing: the default locale on this project's machines is Korean (the
setting behind `CONST-OPS-01`), under which `Sep` does not parse at all; and
the default SMART resolver silently clamps `31-Feb-2026` to 28 February rather
than rejecting it. A test asserts each, because both failures are invisible.

**One mailbox, not one per person.** This watches the account named in
`app.hrms.username`. Every admin sees a notification derived from that one
inbox. Per-user mail access would mean per-user OAuth and sixty consent
screens, which is a different feature.

**No leader election, as with the digest** (ADR-025, ADR-028). Two replicas
poll twice. Here the consequence is mild: both race on the unique index,
exactly one wins, and the loser records nothing.

**This is the first thing in the platform that reaches outside it on a
schedule.** The blast radius is bounded by Decision 4, but the direction is new
and worth naming: a documentation CMS now has a credential for someone's email
account. That is the part of this decision most worth re-reading in six months.

## Alternatives rejected

**Forwarding the HRMS mail to a shared platform mailbox.** Clean — no personal
credential, no private inbox — and it needs a mailbox on a domain this project
controls, which does not exist while hosting is `[DEFERRED]`. Worth revisiting
the moment one does; it is strictly better than Decision 4's trade.

**Storing the report as an attachment or raw MIME for later parsing.** Keeps
the option open at the price of holding exactly the data Decision 2 declines to
hold, with none of the benefit. "We are not parsing it yet" is not a privacy
property.

**A `NotificationType` constant and a push.** Rejected for now. Push exists for
things needing attention away from the desk (ADR-025); a report that is read
when convenient is not one, and the bell is enough.

---

## Numbering

Drafted and implemented as "ADR-029" before `origin/dev` merged its own,
unrelated
[ADR-029](ADR-029-revision-of-018-forgot-password-covers-google-only-accounts.md)
first. Renumbered to 032 on resolving that merge — the same situation
[ADR-030](ADR-030-revision-of-022-024-google-only-account-may-set-initial-password.md)'s
and
[ADR-031](ADR-031-totp-second-factor-for-password-login.md)'s
own numbering notes already record for this branch — and no decision in this
document changed.

`V21__hrms_notification.sql` is untouched by the renumbering: it never cited
the number, and an applied migration is immutable regardless (see ADR-031's
note on the Flyway checksum mismatch the last renumbering caused).
