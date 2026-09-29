# ADR-057: Storing HRMS Attendance Rows — Revision of ADR-042

> **Status**: ACCEPTED (PM) — **HR agreement outstanding, see §4.3**
> **Date**: 2026-09-28
> **Author**: AI, at the PM's request, recording the decision before implementing it
> **Approver**: PM — **and HR, which `V21` names explicitly and this ADR does not substitute for**
> **Related ADR**: ADR-042 (HRMS attendance detail — read on demand, stored never), ADR-032 (report arrival notifications)

---

## 1. Context

`V21__hrms_notification.sql` stores that an HRMS attendance report arrived, and deliberately nothing else. Its own words, under **WHAT IS DELIBERATELY NOT STORED HERE**:

> The report body. The mail names ~60 colleagues with their check-in and check-out times, who was late and who missed a check-out. That is HR data about people who never agreed to it being in a documentation CMS, and NFR-SEC-PII confines identity data in this system to super_admin. Storing it would be a genuine expansion of what this database holds, **needing an ADR and HR's agreement** — not a side effect of wanting a bell icon to light up.
>
> **If this table is ever widened, that is the decision being made, and it should be made on purpose.**

ADR-042 then considered storage directly and rejected it — its alternative **B, "Parse and store the table"**: *"Exactly what V21 says needs HR's agreement first; puts colleagues' daily attendance under backup and retention; the row becomes a permanent record this platform has no business keeping."*

The PM has now asked for attendance rows to be persisted. **This ADR is the widening V21 asked to be made on purpose.** It is written before the migration exists, so that the decision is on record rather than inferred from a schema change.

**What has changed since ADR-042, and it is not nothing.** ADR-042's stated material cost was:

> Any signed-in user can read ~60 colleagues' attendance. That is the decision in §2, and it is the material cost of this ADR.

That is no longer true. `V47` added `account.hrms_name` and `HrmsNotificationService.reportFor` narrows the report to the caller's own row for every role below `admin`; an unlinked account sees nothing at all. The read surface ADR-042 accepted as its worst cost has since been closed. A revision therefore rests on a new fact, not on a change of mind.

**What has not changed**: the people in these reports are not users of this platform, did not agree to their attendance being here, and gain nothing from it being here. `V21`'s requirement of **HR's agreement** is about them, and nothing in §1 above satisfies it.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII, NFR-OPS-AUDIT
- **Related risks**: TM-025 (privilege escalation via self-selected scope) — addressed by V47 scoping, not by this ADR
- **Decision pressure**: none technical. The current design works. The pressure is product: reports are wanted as durable records rather than as a live view of a mailbox.

## 2. Decision

> Parsed attendance rows are persisted to a new table when the poller records a report, and `GET /api/v1/notifications/hrms/{id}` reads from that table instead of opening IMAP. Row-level scoping (ADR-042 §2 as revised by V47) is applied on read and is unchanged. **This decision is contingent on HR's agreement; it is not effective until that is obtained, and the migration must not be merged before it.**

### Key Choices

- **Stored at ingest, not on first view.** The poller already fetches envelopes; it will fetch and parse the body once, at arrival. A cache-on-first-view design would make the stored set depend on who happened to click, which is a worse thing to explain to HR than "we store every report we receive."
- **A separate table, not a widened `hrms_notification`.** `V21`'s narrow shape is load-bearing documentation. Leaving it as-is and adding `hrms_attendance_row` beside it keeps V21's rule literally true and makes the widening visible as its own object rather than as extra columns.
- **Retention is bounded and short.** Rows are pruned on the same schedule as `hrms_notification` (`app.hrms.retention`, default 90 days). Attendance is operational, not historical; an unbounded record is the part that most deserves HR's objection.
- **Reads stay scoped.** Persistence changes where the rows come from, not who may see them. `reportFor` keeps narrowing below `admin`, and the `super_admin` floor question ADR-042 §2 raised is re-answered in §4.2 below.
- **Never logged, never audited by content.** The existing rule holds: no row content in `audit_log`, no log line, no cache header.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep ADR-042: fetch on click, store nothing** | No widening; V21 intact; nothing to agree with HR | Every view is an IMAP round-trip; a deleted mail loses the report; no history | No — the PM asked for durable records |
| B | **Store every parsed row** (this ADR) | Durable, fast, survives a mailbox outage, enables history | The widening V21 names; ~60 non-users' attendance under backup and retention | **Yes, subject to HR** |
| C | **Store only rows matching an `account.hrms_name`** | ~10 people instead of ~60, all of them users of this system; far easier case to HR | A person linked later has no history before their link; the admin view stops being the whole department, which is what admins actually use it for | No — but see §4.3 |
| D | **Short-lived in-memory cache** | Addresses speed with no schema change, no ADR needed | Does not survive a restart or a deleted mail; not durable records | No |

## 4. Consequences

### 4.1 Positive Impacts

- A report survives deletion from the mailbox, an IMAP outage, and a credential rotation.
- One IMAP fetch per report instead of one per view.
- The `HrmsReportModal` stops depending on network reachability at click time.

### 4.2 Negative Impacts / Costs to Accept

- **~60 people's daily attendance becomes a stored record in a documentation CMS.** They are not users, did not agree, and cannot see or correct it. This is the cost, stated plainly, and it does not go away because the read path is scoped.
- **It enters backup and restore.** Any database dump now contains HR data; anyone with a backup has it, including copies taken before this ADR is revisited.
- **The `super_admin` floor question is live again.** ADR-042 §2 wrote: *"If that ever stops being true, this rule is no longer sufficient and the floor has to move to `super_admin`."* It stopped being true when the popup began naming people, and ADR-042 accepted that with the reasoning that nothing was stored. **With storage, that reasoning is spent.** This ADR does not move the floor — scoping now does the work the floor was protecting — but the next person to widen the read path must revisit it rather than assume it was settled.
- **Deletion is now a question this platform owns.** "Remove me from that table" has no answer today beyond waiting for retention.

### 4.3 Follow-up Work

- **HR's agreement, in writing, before the migration merges.** This is the condition on §2, not a nice-to-have.
- Decide whether alternative **C** (store only linked people) is preferable once real usage is known — it is strictly less data and may turn out to serve every actual use.
- A deletion path for a named person, if HR asks for one.
- Revisit retention: 90 days is inherited from arrival records, not chosen for attendance content.

## 5. Verification / Monitoring

- Tests assert that a stored report read by a plain `user` yields only their own row, by the same `ReportScope` cases that cover the on-demand path today.
- A test asserts pruning actually deletes rows at the retention boundary — the bound is the mitigation, so an unpruned table is a defect, not untidiness.
- `audit_log` is asserted to contain no attendance content.

## 6. References

- `backend/src/main/resources/db/migration/V21__hrms_notification.sql` — the rule this revises
- `ADR-042-hrms-attendance-detail-on-demand.md` — the decision this revises, especially its alternative B
- `backend/src/main/resources/db/migration/V47__account_hrms_name.sql` — the scoping key that changed the calculus
- `backend/src/main/java/com/coc/docs/notify/HrmsNotificationService.java` — `reportFor`, the scoping this preserves
- NFR-SEC-PII, `docs/requirements/REQUIREMENTS-SPEC.md`

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-09-28 | 1.0 | Initial draft. PROPOSED, pending PM approval and HR agreement. | AI |
| 2026-09-28 | 1.1 | PM directed implementation after being shown this ADR and the HR condition; built as `V49__hrms_report_content.sql`. Renumbered from ADR-054, which collided with `ADR-054-revision-of-043-per-run-source-path` on `dev`. **HR's agreement is still not obtained** — §4.3's first item stands, and the sequence (build first, agree after) was the PM's explicit choice, recorded here rather than left to be inferred. | AI |
