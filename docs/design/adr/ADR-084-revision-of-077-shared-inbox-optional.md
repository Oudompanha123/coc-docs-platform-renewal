# ADR-084: The Shared HRMS Mailbox Becomes Optional — Revision of ADR-077

> **Status**: PROPOSED
> **Date**: 2026-10-02
> **Author**: AI, at the PM's explicit request
> **Approver**: PM
> **Supersedes**: ADR-077 §2's "the shared `app.hrms.*` inbox continues to be polled exactly as before"
> **Related ADR**: ADR-077 (per-account inbox polling), ADR-063 (per-account send credentials), ADR-042, ADR-057, ADR-007 (key management — still owed)

---

## 1. Context

ADR-077 added per-account inbox polling alongside the single configured mailbox, and kept the
shared one mandatory: `HrmsMailProperties.usable()` required `app.hrms.username` and
`app.hrms.password`, and every poll and every on-demand body fetch was gated on it.

That made a credential for one person's mailbox a precondition for the whole feature. In this
deployment that person is a developer, and the mailbox the platform logs into is their personal
Gmail. The PM asks that the shared credential be removed from configuration entirely, so that
each account's own stored credential (ADR-063) is the only thing that opens any mailbox.

The practical trigger: `APP_HRMS_USERNAME` and `APP_HRMS_PASSWORD` were removed from
`backend/.env.local`, and the whole feature silently stopped — not only the shared poll, but
the per-account poll and the on-read backfill too, because all three were behind the same flag.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII, NFR-OPS-AUDIT
- **Related risks**: a blank shared credential being *used* rather than skipped, producing a
  Google authentication failure every thirty minutes
- **Decision pressure**: none technical; this narrows what the deployment holds

## 2. Decision

> `app.hrms.username` and `app.hrms.password` become optional. The feature is active when it is
> enabled and `app.hrms.sender` is set; the shared mailbox is polled only when a shared
> credential is also present. With none, the only inboxes read are those of accounts that stored
> their own credential, and a report's body is always fetched with the credential of whoever
> owns that report.

### Key Choices

- **One flag became two.** `sharedInboxUsable()` is the old `usable()` — enabled, sender, *and*
  a shared username and password. `active()` is enabled and a sender. Nine call sites were
  reassigned one at a time rather than redefining `usable()` in place, because silently changing
  what an existing predicate means is how a security gate gets widened by accident.
- **`app.hrms.sender` stays mandatory.** It is the filter that keeps an IMAP search to the HRMS
  mail and out of the rest of a mailbox. A blank sender disables the feature rather than widening
  the search, which is the only safe direction for that particular blank.
- **A blank shared credential is never used.** `poll()` skips the shared block entirely instead
  of calling into it, so no connection is attempted with an empty username.
- **Bodies follow ownership.** `bodyFor` resolves a row's owner and fetches with that account's
  credential, falling back to the shared mailbox only for rows that came from it. There is no
  cross-credential fallback: reading one person's report with another's credential would either
  find nothing or find the wrong message, and the second is far worse than failing.
- **"No shared mailbox" is logged at INFO, not WARN.** It is now a legitimate — indeed the
  preferable — configuration. It is still logged, because "the bell never lights up" and "nobody
  has stored a credential yet" look identical from outside and have different fixes.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep ADR-077 as written** | No change | A developer's personal credential stays a precondition for everyone | No — the PM asked for its removal |
| B | **Fall back to `spring.mail.*`** when `app.hrms.*` is blank | One fewer variable | Silently reads the *sending* account's mailbox, which nobody asked it to read | No — a surprising read of a real mailbox |
| C | **Shared mailbox optional** (this ADR) | The shared credential disappears; every read is the reader's own | A deployment with no stored credentials reads nothing at all, which looks like a fault | **Yes** |
| D | **Remove shared polling entirely** | Simplest model | Strands the rows already recorded from the shared mailbox and forces every deployment onto per-account credentials at once | No — kept as an optional path for migration |

## 4. Consequences

### 4.1 Positive Impacts

- No credential for anybody's mailbox needs to live in deployment configuration.
- **Lifts the limitation recorded in ADR-077 §4.2**: an owned report whose body failed to store
  at poll time can now be re-fetched, because the read path opens the owner's mailbox rather than
  the shared one.
- A deployment can adopt per-account credentials without an administrator configuring anything.

### 4.2 Negative Impacts / Costs to Accept

- **With no shared credential and no stored ones, the feature reads nothing and looks broken.**
  That is the honest consequence of making every read somebody's own: until a person opts in,
  there is no mailbox to read. The startup log says so explicitly, which is the mitigation.
- **Rows already recorded from the shared mailbox keep a null owner.** If the shared credential
  is removed, their bodies can no longer be re-fetched — the mailbox that held them is no longer
  one this system can open. In this deployment those are the same Gmail account as one platform
  account, so polling that account's own inbox re-records the same messages as *new, owned* rows
  rather than healing the old ones. The old rows remain as subject-only entries.
- **Everything ADR-077 §4.2 says still stands**, unchanged and undischarged: scheduled read
  access to whole personal mailboxes, the consent wording on `/api/v1/me/mail-credential` still
  describing sending only, and ADR-007's key management still owed. This ADR narrows what
  *configuration* holds; it does not reduce what a stored credential grants.

### 4.3 Follow-up Work

- **Update the consent wording** on `/api/v1/me/mail-credential` before anyone besides the
  original developer stores a credential. Carried forward from ADR-077 §4.3 and still blocking.
- Remove `APP_HRMS_USERNAME` / `APP_HRMS_PASSWORD` from `infra/.env.example` and the compose
  file once no deployment relies on a shared inbox.
- A visible per-account status ("last polled, last error"), still outstanding from ADR-077.

## 5. Verification / Monitoring

- A test asserts a blank shared credential is a valid configuration (`active()` true,
  `sharedInboxUsable()` false).
- A test asserts `poll()` never calls the shared `arrivalsSince(Instant)` when no shared
  credential is set — the regression that would otherwise authenticate with an empty username.
- A test asserts a personal inbox is still read in that configuration.
- A test asserts a blank `sender` switches the whole feature off and touches no mailbox.

## 6. References

- `ADR-077` — per-account inbox polling, revised here
- `ADR-063` — the stored credential this now relies on exclusively
- `backend/src/main/java/com/coc/docs/notify/HrmsMailProperties.java`
- FR-OPS-001, NFR-SEC-PII, NFR-OPS-AUDIT

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-02 | 1.0 | Initial draft, revising ADR-077 §2 so the shared mailbox is optional. | AI |
