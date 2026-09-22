# ADR-042: HRMS Attendance Detail — Read On Demand, Stored Never, Visible To All Roles

> **Status**: PROPOSED — implemented in-session per PM instruction; formal PM sign-off not yet recorded (`CONST-PROC-01`).
> **Date**: 2026-09-22
> **Author**: AI, implementing a decision the PM took explicitly after being shown the constraint it overrides.
> **Related ADR**: Revises [ADR-032](ADR-032-hrms-report-arrival-notifications.md) (HRMS report arrival notifications) and the rule written into `V21__hrms_notification.sql`. Touches `NFR-SEC-PII`. Does not touch ADR-011 (one enforcement point) — the new route is declared in `SecurityConfig` like every other.

## Context

`V21__hrms_notification.sql` records that an HRMS attendance report arrived, and deliberately nothing else. Its own words, under **WHAT IS DELIBERATELY NOT STORED HERE**:

> The report body. The mail names ~60 colleagues with their check-in and check-out times, who was late and who missed a check-out. That is HR data about people who never agreed to it being in a documentation CMS, and NFR-SEC-PII confines identity data in this system to super_admin. Storing it would be a genuine expansion of what this database holds, **needing an ADR and HR's agreement** — not a side effect of wanting a bell icon to light up.
>
> So: a subject line, a date, and when it landed. Enough to say "it arrived, go read it in Gmail" and nothing more. **If this table is ever widened, that is the decision being made, and it should be made on purpose.**

`NotificationFeedService.hrmsItemsFor` put those feed rows at `admin` and above, and said why the floor was safe:

> It is not a confidentiality boundary: a subject line says a report arrived on a date and names nobody, which is the whole reason the body was never stored. **If that ever stops being true, this rule is no longer sufficient and the floor has to move to `super_admin`.**

The PM asked for the feed row to open a popup showing the attendance table itself, rendered like the email. That makes the content name people, which is precisely the condition both notes anticipated. This ADR is the decision being made on purpose, as V21 asked for.

## Decision

**1. The body is fetched on demand and never stored.**

`GET /api/v1/notifications/hrms/{id}` opens IMAP, fetches the one message by `Message-ID`, parses it, serialises it to the caller and drops it. No column, no table, no cache, no log line. `hrms_notification` still holds a subject, a date and an arrival time, exactly as V21 specifies — **V21's rule is respected, not overridden.** The poller still reads envelopes only; `HrmsMailbox.htmlBodyOf` is called from nothing scheduled.

**2. Every signed-in role may open it.**

This part *does* override the written rule, and in the opposite direction to the one `NotificationFeedService` predicted. The floor on HRMS feed rows is removed, and the new route sits at `hasRole(USER)`.

The PM was shown the constraint, the quoted notes, and the recommendation (`super_admin` only), and chose all roles. It is their company's own attendance data and their call to make. It is recorded here rather than absorbed silently, because the next person to read `NotificationFeedService` will find a comment predicting the opposite outcome and needs to know it was overruled rather than missed.

**3. HRMS's own wording is passed through, not re-modelled.**

Statuses ("Normal", "Late Check-In", "Missed Check-Out") stay strings rather than becoming an enum, and times stay strings rather than becoming `LocalTime`. A status this build has never seen still reaches the screen; `00:00`, which HRMS writes for "this never happened", is not silently rendered as midnight.

## Alternatives considered

| # | Option | For | Against | Chosen |
|---|---|---|---|---|
| A | **Fetch on click, store nothing** | Gives the popup without widening the database; V21's objection is specifically about storage, so its rule survives intact | One IMAP round trip per open; needs the mailbox reachable; the data is still *shown* more widely than before | **Yes** |
| B | Parse and store the table | Fast popup, works with the mailbox down, enables history and trends | Exactly what V21 says needs HR's agreement first; puts colleagues' daily attendance under backup and retention; the row becomes a permanent record this platform has no business keeping | No |
| C | Link out to Gmail | No PII enters the platform at all; cheapest and safest | Not the feature asked for — the reader wanted the table in the app | No |

## Consequences

**Positive**

- The popup exists without widening the schema. V21's specific prohibition is untouched, and a future reader of that migration will find it still true.
- The report is never at rest in this system, so it is outside backups, outside retention, and outside the blast radius of a database disclosure.
- The parser fails to an explicit "could not read it" rather than to a confident empty table, so an HRMS template change cannot silently imply nobody was late.

**Negative, and accepted**

- **Any signed-in user can read ~60 colleagues' attendance.** That is the decision in §2, and it is the material cost of this ADR. The people in the report are not users of this system and did not agree to this.
- One IMAP connection per open. Acceptable because a person clicking is deliberate; it is why nothing calls this on a schedule.
- Regex parsing is tied to the sender's template. Mitigated by failing visibly, and by tests over a synthetic fixture in the real shape.

## Follow-ups

- [ ] **PM to confirm §2 in writing**, and to consider whether HR should be told the data is now visible platform-wide. The PM decided this in-session; this file is not a substitute for that record.
- [ ] Revisit if the platform is ever hosted outside the company network — "all signed-in roles" is a different proposition on a public deployment than on `localhost`.
- [ ] `REQUIREMENTS-SPEC.md` has no FR-ID for the attendance detail view; the route is filed under FR-OPS-001 with the rest of the HRMS work.

## Revision history

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-09-22 | 1.0 | Written alongside the implementation. Status PROPOSED. | AI (backend-developer / frontend-developer) |
