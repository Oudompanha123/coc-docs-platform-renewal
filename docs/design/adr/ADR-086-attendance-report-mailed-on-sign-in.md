# ADR-086: The Attendance Report Is Mailed When Somebody Signs In

> **Status**: PROPOSED
> **Date**: 2026-10-02
> **Author**: AI, at the PM's request
> **Approver**: PM
> **Related ADR**: ADR-057 (storing attendance rows), ADR-063 / ADR-085 (per-account credentials), ADR-077 / ADR-084 (per-account inbox polling), ADR-017 (the shared sender this reuses)

---

## 1. Context

Getting an attendance report into somebody's real inbox has been attempted three ways, and each
left a gap:

| Route | Gap |
|---|---|
| Mail on arrival (ADR-057) | Fires only when a report is first polled. Anyone who joined afterwards, or whose mail failed once, never gets one. |
| Send as the person (ADR-063) | Needs an App Password they must generate and paste first. |
| Read their own inbox (ADR-077/084) | Same credential, plus Google consent. Nobody had supplied one, so nothing was read at all. |

Meanwhile the registration OTP mail has worked throughout, from the shared `MAIL_*` sender. The
delivery path was never the problem — the *trigger* and the *credential* were.

The PM asks for the report to be mailed on successful sign-in, "like the OTP mail". That removes
both problems at once: signing in needs nothing configured, it happens when the person is already
paying attention, and the shared sender is already proven to arrive.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII
- **Related risks**: mailing the same report repeatedly; slowing or failing sign-in
- **Decision pressure**: the feature currently delivers nothing to anybody

## 2. Decision

> On every successful sign-in, the newest attendance report that account may see is scoped the
> way the screen scopes it and mailed to that account's address by the **shared sender** — the
> same one that sends the registration OTP. At most one mail per person per report, enforced by a
> row in `attendance_report_sent`. Nothing in this path may delay or fail signing in.

### Key Choices

- **A new `SignInEvent`, not `NewDeviceSignInEvent`.** The existing event is a security alert and
  is rare by design. Widening it to fire on every sign-in would turn a warning into routine
  traffic, which is how a warning stops being read.
- **The shared sender, not the person's own credential.** This is the point: it works with no
  configuration. An account that *has* supplied a credential still sends its own poll-time mail
  through it (ADR-063); this path deliberately does not depend on one.
- **One mail per (account, report)**, claimed by an insert rather than checked by a select.
  Two sign-ins racing — a phone and a laptop — would both pass a select-then-insert and both send.
- **The claim is released when a send fails**, so a relay that was briefly down costs a retry
  rather than that day's report.
- **No mail when the person has no rows in it.** An empty table under "here is your attendance"
  reads as a broken system rather than as not being on that department's sheet.
- **Scoped by role, exactly as the screen is.** `ADMIN` and above get the whole report; everyone
  else gets only their own rows. A mail that showed more than the screen would be a quiet
  widening of who sees HR data.
- **`@Async` + `AFTER_COMMIT`.** Off the request thread so nobody waits on SMTP, after the commit
  so a rolled-back session never produces mail, and every failure swallowed.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep mailing only on arrival** | Already built | Misses everyone who was not there at the moment it arrived | No |
| B | **A daily digest job** | Predictable; one mail a day | Another scheduled job, and it mails people who never open the app | No |
| C | **Mail on sign-in** (this ADR) | Needs nothing configured; arrives when they are looking | Sign-in is frequent, so it depends entirely on the dedupe being right | **Yes** |
| D | **Show it in the app only** | No mail at all | The PM asked for it to reach a real inbox | No |

## 4. Consequences

### 4.1 Positive Impacts

- A report reaches a real inbox with **no credential, no consent screen and no configuration** —
  the first route here that does.
- Someone who joins later gets the current report on their first sign-in, rather than nothing
  until the next one arrives.
- Independent of ADR-063/085: it works whether or not anyone connects their Gmail.

### 4.2 Negative Impacts / Costs to Accept

- **It is sent by the shared address, not by the person.** Which is what ADR-063 set out to
  change. Both now exist: the poll sends as the person when they have a credential, and this
  sends from the shared sender regardless. That is a real inconsistency in who a report appears
  to come from, accepted because the alternative is nobody receiving anything.
- **Sign-in is frequent, so the dedupe is load-bearing.** If `attendance_report_sent` is ever
  truncated, everybody gets their current report again on next sign-in.
- **It still depends on the person matching a row**, which for this deployment is the unresolved
  problem: zero of ten accounts appear in any stored report, so in practice this sends nothing
  until either HRMS sends the team's own department or `hrms_name` is filled in. **This ADR does
  not fix that**, and should not be mistaken for fixing it.
- Mail volume is now coupled to sign-in frequency rather than to report arrival, which is harder
  to predict.

### 4.3 Follow-up Work

- Resolve the matching gap — the report HRMS sends must actually name the people with accounts.
  Everything built across ADR-057, 063, 077, 084, 085 and this one is blocked behind it.
- Let people turn this off. It is a notification and there is a preferences screen; it should
  appear there rather than being unconditional.
- Reconcile who a report comes from, once per-account credentials are in general use.

## 5. Verification / Monitoring

- A test asserts the first sign-in sends and a second does not.
- A test asserts nothing is sent when the person has no rows in the report.
- A test asserts the claim is released when the send fails, so it is retried.
- A test asserts an admin is scoped to the whole report and a user to their own rows.
- A test asserts the listener never throws, so signing in cannot be affected.

## 6. References

- `ADR-017` — the shared sender and the OTP mail this copies
- `ADR-057` — the stored rows this reads
- `ADR-063`, `ADR-085` — per-account sending, which this deliberately does not require
- `V63__attendance_report_sent.sql`
- FR-OPS-001, NFR-SEC-PII

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-02 | 1.0 | Initial draft. | AI |
