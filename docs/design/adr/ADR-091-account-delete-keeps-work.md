# ADR-091: Deleting an Account Keeps the Work It Did

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-05
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("I cannot delete a user … Please find the root cause and fix the user deletion logic") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Applies [ADR-023](ADR-023-revision-of-011-account-deletion.md)'s rule (the trail and the content outlive the person) to every reference, as V10 did for `account_role.granted_by`.

---

## 1. Context

Deleting some accounts on Users & Roles failed with "An unexpected error occurred."

`AccountService.delete` issues one `delete from account` and relies on the schema to say what each reference does. Fifteen references to `account(id)` said nothing, so PostgreSQL treated them as `NO ACTION` and refused the delete for any account that had ever touched them. The resulting `DataIntegrityViolationException` reached `ApiExceptionHandler`'s catch-all as a 500.

Confirmed on a scratch PostgreSQL 16 at V63: `update or delete on table "account" violates foreign key constraint "docs_content_updated_by_fkey"`.

| Added by | Column(s) | Was |
|---|---|---|
| V13 | `docs_content.updated_by` | NO ACTION |
| V22 | `claude_usage_member.invited_by` | NO ACTION |
| V25 | `ax_renewal_project.created_by`, `.manifest_attached_by`; `ax_renewal_analysis.analyzed_by`; `ax_renewal_stack_layer/architecture_plan/page_mapping/db_change/destination.updated_by`; `ax_renewal_db_connection.connected_by`; `ax_renewal_confirmation.confirmed_by`; `ax_renewal_implementation_run.started_by`; `ax_renewal_comment.author_id` | NO ACTION |
| V45 | `ax_renewal_comment.deleted_by` | NO ACTION |

Five of these were `NOT NULL`: project `created_by`, `analyzed_by`, `confirmed_by`, `started_by` and `author_id`.

## 2. Decision

> Every one of these becomes `ON DELETE SET NULL`. The work stays and the name on it goes, as ADR-023 already decided for the audit trail and page versions.

- **`V64__account_delete_keeps_work.sql`** drops `NOT NULL` from the five, then re-creates all fifteen constraints with `ON DELETE SET NULL`.
  - Not `CASCADE`: deleting the person who created an AX Renewal project would otherwise delete the project, its plan, its runs, and everyone else's comments.
  - Who did the work is still answered by `audit_log.actor_email`, which survives the account by design (V1).
- **Readers:** they already treat these IDs as optional, except one. The comment thread used an inner join on the author, which would have dropped a deleted author's comments. It's now a left join and shows the author as "Deleted account".
- **`AccountService.delete`** turns any refusal the schema still makes into a 409, "… is still referenced by other records and cannot be deleted; deactivate the account instead", never the bare 500 again. The audit entry written just before is rolled back with it.
- **Regression guard:** `AccountDeletionTest` asserts that no foreign key to `account` has `NO ACTION` or `RESTRICT`. This is the check V10 and V64 both lacked: a later table with a bare `references account` fails CI instead of production.

## 3. Consequences

- **Positive:** any account can be deleted again, whatever it worked on, and the team's work stays intact.
- **Accepted:** the work keeps no live link to a deleted person. Names come only from the audit trail, and the comment thread shows "Deleted account". This is ADR-023's existing trade-off, now applied everywhere.

## 4. Verification

| Item | Method |
|---|---|
| V63: deleting an account with AX Renewal and docs work is refused (`docs_content_updated_by_fkey`) | Hand-run on a scratch PostgreSQL 16.15 cluster |
| V64 applies cleanly on top of V1–V63; afterwards the same delete succeeds, and the project, comment, confirmation, run and docs row remain with their attribution null; no foreign key to `account` is still `NO ACTION`/`RESTRICT` (15 before) | Same scratch cluster, then removed |
| A deleted author's comment stays in the thread as "Deleted account" | Same, hand-run; `AccountDeletionTest` (Testcontainers, runs in CI) |
| Any remaining refusal is a 409 naming deactivation, without the constraint name | `AccountDeleteRefusalTest` |
| No foreign key to `account` lacks a delete action, now or in future migrations | `AccountDeletionTest.everyReferenceToAccountSaysWhatHappensOnDelete` (CI) |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-05 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-05 | User (in-session, direct instruction) | Fix user deletion | ACCEPTED |
