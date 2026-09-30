# ADR-066: Deleting an AX Renewal Project Is Permanent — Database and Beyond

> **Status**: ACCEPTED — implemented
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("ensure the project is permanently deleted from the database, not soft-deleted or merely hidden from the UI") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Confirms and extends [ADR-051](ADR-051-revision-of-037-delete-project.md) (hard delete). Keeps [ADR-006](ADR-006-audit-logging.md)'s append-only audit trail.

---

## 1. Review findings

**The database delete was already permanent.** `DELETE /api/v1/ax-renewal/projects/{id}` → `AxRenewalService#delete` → `delete from ax_renewal_project where id = ?`. There is no `deleted_at`, archived flag, or list filter on the project. Every table holding a project's data references it `on delete cascade`: the ten V25 tables, `ax_renewal_project_member` (V58), and `ax_renewal_generated_change` through its implementation run (V42). No `ax_renewal_*` table holds a `project_id` outside that chain. The frontend re-fetches the list from the server after a delete rather than filtering it locally. A soft-deleted comment (ADR-045) is still a row, and it cascades away with the project like any other.

**What did outlive a deleted project** — outside the database:

| Where | What | Before |
|---|---|---|
| Backend memory (`AxRenewalLocalRunner`) | A finished or failed Run Locally's state and up to its last N captured log lines | Kept until the backend restarted |
| Backend disk (temp directory) | A Generate run's staging copy of generated code, if the backend stopped between creating and cleaning it | Normally removed on fail/cancel/approve/reject, and delete is refused while one is awaiting review, but a crash could orphan one |
| The deleting user's browser | The per-project source path saved in AI engine (`localStorage`) | Kept |

## 2. Decision

> Deleting a project removes it from the database (unchanged) **and**, once the delete has committed, everything else this application holds for it: the local runner's in-memory state (`AxRenewalLocalRunner#forget`), any leftover staging copy (`findStagingPaths` + a guarded delete), and the deleting browser's saved source path.

- **After commit, not before.** If the delete rolls back, the project still exists and its state still belongs to it.
- **Guarded disk delete.** A staging path comes back from the database. It is deleted only if it is a directory directly under the system temp directory whose name carries the generator's own prefix (`AxRenewalImplementationRunner.STAGING_PREFIX`). A value that had been changed in the database cannot point the recursive delete anywhere else.
- **`forget` never drops a live process.** Delete is refused while one runs, and forgetting a live one would orphan a process nobody could stop.

### Deliberately kept

- **The audit entry of the deletion** (`ax_renewal.project_delete`, with the project's name). `audit_log` is append-only and retained ≥ 1 year (ADR-006). It records the *fact* of the deletion and who did it, not the project. Earlier audit entries about the project also remain for the same reason.
- **The output destination** — the repository or folder Approve wrote renewed code into. That is the team's product, outside this application. Deleting a planning workspace is not a request to delete it.
- **Other browsers' saved source paths.** Only the deleting browser can be reached. Elsewhere the key is inert, because it can only be read by opening a project that no longer exists.

## 3. Verification

| Item | Method |
|---|---|
| Every table's rows for the project are gone, found both from an explicit list and from the schema catalogue (every `project_id` column), including generated changes and a soft-deleted comment; the deletion's audit entry remains | `AxRenewalProjectHardDeleteIntegrationTest` (real Postgres — **Docker required; skipped in the implementing session**) |
| Local runner state forgotten; leftover staging copy removed; a non-staging path never deleted; nothing cleaned when the delete is refused | `AxRenewalDeleteProjectTest` |
| `forget` drops a finished run's log, never a live process | `AxRenewalLocalRunnerTest` |
| The browser's saved source path is cleared on success, kept on a refused delete | `ProjectPicker.test.tsx` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Review of project deletion; out-of-database cleanup implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | Project deletion must be permanent, not soft-deleted or hidden | ACCEPTED |
