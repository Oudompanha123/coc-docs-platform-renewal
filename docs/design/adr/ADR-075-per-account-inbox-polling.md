# ADR-075: Each Account's Attendance Report Is Read From That Account's Own Inbox

> **Status**: PROPOSED
> **Date**: 2026-10-01
> **Author**: AI, at the PM's explicit request, recording the decision before implementing it
> **Approver**: PM
> **Related ADR**: ADR-063 (per-account send credentials — **this reuses them for reading**), ADR-042 (read-on-demand bodies), ADR-057 (storing attendance rows), ADR-007 (key management — still owed)

---

## 1. Context

The platform polls exactly one IMAP mailbox, named by `app.hrms.username`. Every HRMS
report the system has ever seen came from that single inbox, and that inbox happens to
belong to one developer.

That design assumed one departmental report serves everybody. It does not. Measured on
the live schema on 2026-09-30:

| | |
|---|---|
| Distinct people named across all stored reports | 26 |
| Active platform accounts | 10 |
| Accounts matching any report row | **0** |

The reports in the polled inbox cover `COOCON Department` (5–9 rows) and `BeplePay
Department` (18 rows). Not one of the ten accounts appears on either sheet — including
the inbox's own owner. So per-person scoping, which ADR-057 and the `role = user` path
already implement correctly, returns nothing for everyone, and
`AttendanceMailService.sendPersonalReports` matches nobody and sends zero mail.

The PM states that HRMS already delivers each employee their own report to their own
personal Gmail. If that is so, the matching problem is an artefact of reading the wrong
mailbox, not of the matching rule: **a report sitting in someone's inbox is theirs by
definition**, with no name to spell, no `hrms_name` to maintain, and no email-key
permutation to get right.

ADR-063 already has each account optionally storing its own Gmail App Password. An App
Password grants full mailbox **read and send**. The read half has been held so far and
is what this ADR spends.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII, NFR-OPS-AUDIT
- **Related risks**: the application acquires scheduled, unattended read access to the
  entire personal mailbox of every account that opts in
- **Decision pressure**: the feature currently produces nothing for anybody

## 2. Decision

> When an account has stored a credential (ADR-063), the poller additionally logs into
> **that account's own inbox** and records the HRMS reports it finds there as belonging
> to that account. A report owned by an account is visible **only to that account**,
> regardless of role. The shared `app.hrms.*` inbox continues to be polled exactly as
> before, and its reports keep today's role-based scoping.

### Key Choices

- **Opt-in, and the credential is the opt-in.** No stored credential means no inbox is
  read. Storing one for sending (ADR-063) now also grants reading; §4.2 records that
  this widens what that one action means, and the API copy must say so.
- **Owner-scoped, above role.** A row with an `owner_account_id` is readable by that
  account alone. A `super_admin` cannot read it. This is the one place in this codebase
  where role does not win, and deliberately so: the row was extracted from a colleague's
  private mailbox, and "administrators may read anything" must not quietly extend to
  other people's email.
- **The shared inbox keeps its current behaviour.** Existing rows have no owner, stay
  role-scoped, and nothing regresses.
- **Dedupe becomes per-owner.** `hrms_notification.message_id` is unique globally today.
  One HRMS email addressed to several people carries **one** Message-ID, so under the
  current index the first inbox polled would win and every other recipient's copy would
  be silently discarded. The index must become `(owner_account_id, message_id)` with
  `NULLS NOT DISTINCT`, or this feature cannot work at all.
- **Bodies are still read on demand only** (ADR-042), now from the owner's mailbox
  rather than the shared one. Polling still fetches envelopes.
- **Still no raw body stored** beyond the parsed rows ADR-057 already permits.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep one shared inbox; fix matching** | No new access; no schema change | There is nothing to fix — no account appears in any report; the data is for other departments | No |
| B | **Set `hrms_name` per account** | Smallest possible change | Only helps if the person is on a sheet we already receive. None are. | No — tried, does not apply |
| C | **Subscribe the shared inbox to the team's own department** | No new mailbox access at all; one HRMS-side change; everything already built then works | Depends on HRMS being willing and on such a report existing | **Preferred if available** — see §4.3 |
| D | **Poll each account's own inbox** (this ADR) | Removes name matching entirely; each person provably gets their own report | Scheduled full-mailbox read access per user; new owner column and scoping rules; a credential outage per user to diagnose | **Yes, on instruction** |

## 4. Consequences

### 4.1 Positive Impacts

- Each person sees the report HRMS actually sent them, with no name matching anywhere in
  the path.
- The 26-names-versus-10-accounts mismatch stops mattering.
- Accounts without a credential are unaffected; the shared inbox behaves as today.

### 4.2 Negative Impacts / Costs to Accept

- **The application gains scheduled, unattended read access to whole personal
  mailboxes.** The poll runs every 30 minutes and logs in as the user. The IMAP search
  is filtered to `app.hrms.sender`, but that filter is a line of code, not a permission:
  the credential can read everything, and a future change — or a mistake — reaches the
  rest of the mailbox with no further barrier.
- **ADR-063's bargain changes meaning.** Someone who stored a password so their own
  attendance mail would come from their own address did not thereby agree to the
  platform reading their inbox on a timer. **The consent text on
  `/api/v1/me/mail-credential` must be updated to say both**, and existing credential
  holders must be told. This is a condition of the decision, not a nicety.
- **An ordinary personal inbox is now in scope for whatever this system's logs, errors
  and backups capture.** Subjects from a personal mailbox reach `hrms_notification`.
- **`ADR-007` is more overdue, not less.** One key now protects credentials that read
  mailboxes. Rotation and custody remain undecided.
- **Per-user failure modes.** A revoked App Password, a Google security block, or 2FA
  changes become a per-person support burden with no UI to diagnose them.
- **An owned report whose body failed to store at poll time cannot be re-fetched.**
  The on-demand fallback in `HrmsNotificationService.report` still opens the configured
  mailbox, which does not contain that message, so it returns empty rather than reading
  the owner's inbox a second time. This is a deliberate degradation, not an oversight:
  the alternative is re-decrypting a credential on a page view, and failing closed is the
  right direction for a path that reaches into someone's mail. Owned reports therefore
  depend on the stored body (V49, ADR-057), which the poll writes with the correct
  credential at the moment the report is first seen.

### 4.3 Follow-up Work

- **Ask HRMS for the team's own departmental report first (option C).** If one exists
  and can be sent to the shared inbox, everything already built works, and this ADR's
  access cost is never paid. This should be attempted before the PM accepts this ADR.
- Update the credential endpoint's wording and notify existing holders (blocking, §4.2).
- Prefer OAuth with a read scope narrowed to a label or query if Google permits, over a
  full App Password — the same replacement ADR-063 §4.3 already recommends for sending.
- A visible per-account status ("last polled, last error") so a dead credential is
  diagnosable without reading server logs.

## 5. Verification / Monitoring

- Tests assert an owner-scoped report is refused to a `super_admin` who does not own it.
- Tests assert two accounts receiving the same Message-ID each get their own row.
- Tests assert an account with no credential causes no login attempt.
- Tests assert the shared inbox's rows keep role-based scoping.
- The poll logs one line per account polled, with a count, and never the credential.

## 6. References

- `ADR-063` — per-account mail credentials; the stored secret this reuses
- `ADR-042` — bodies read on demand, never stored
- `ADR-057` — storing parsed attendance rows
- `V21__hrms_notification.sql` — the global `message_id` unique index this supersedes
- `backend/src/main/java/com/coc/docs/notify/HrmsImapMailbox.java`
- FR-OPS-001, NFR-SEC-PII, NFR-OPS-AUDIT, `docs/requirements/REQUIREMENTS-SPEC.md`

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-01 | 1.0 | Initial draft, written before implementation, recording the mailbox-read cost in §4.2 and the preferred cheaper alternative in §4.3. | AI |
