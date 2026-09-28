# ADR-050: An AX Renewal Project Can Be Deleted, Outright

> **Status**: PROPOSED
> **Date**: 2026-09-28
> **Author**: backend/frontend (paired)
> **Approver**: PM (pending) — `CONST-PROC-01`
> **Related ADR**: Revises [ADR-037](ADR-037-integrations.md)'s project model. Deliberately the opposite choice from [ADR-045](ADR-045-comment-soft-delete.md)'s soft comment delete — see §2.

---

## 1. Context

`AxRenewalController`/`AxRenewalService`/`AxRenewalProjectRepository` had a
full create/read/update surface for a project — attach a manifest, run
analysis, edit every Plan section, set a destination, start implementation —
and no delete. Not soft, not hard: there was no `DELETE` route at all, no
client function, no button. A project created by mistake, a duplicate, or a
finished migration nobody wants cluttering the picker had no way to be
removed short of an operator editing the database by hand.

That gap was never a decision anyone recorded — the same shape ADR-045 found
for comments, on a heavier resource. A project is a whole workspace: its
manifest, its analysis, four Plan sections, a destination, every comment on
it, and its implementation history (including, per ADR-044/048/049, a
disposable staging copy on disk and possibly a live local dev server
process).

- Related requirements: FR-AXR (AX Renewal workspace)
- Related risks: an implementation run or a local dev server left running
  against a project whose row just disappeared out from under it

## 2. Decision

> **A project can be deleted outright by an `admin` or above. The delete is
> hard — the row and everything that references it are gone — and refused
> while an implementation run or a local dev server is still active for it.**

### Key Choices

- **Hard, not soft.** Unlike a comment (ADR-045), there is no lighter
  reading of "delete project" to preserve: a workspace nobody can even
  reach through the picker is not meaningfully different from one that still
  exists, hidden, and this feature is asked for by the name "delete", not
  "archive" or "hide". Every child table already cascades from
  `ax_renewal_project` (`on delete cascade`, V25) — the schema was built for
  this from the start, so no migration is needed.
- **Same floor as creating one.** `POST /projects` sits at `admin`;
  `DELETE /projects/{id}` sits there too — the symmetric lifecycle action,
  not a higher bar reserved for `super_admin`. Every other project-shaping
  route (manifest, analysis, plan, destination) already floors at `admin`;
  deletion joins that set rather than inventing a new one.
- **Refused while something is still running.** An implementation run at
  `running`/`generating`/`awaiting_review`/`applying`, or a live local dev
  server (ADR-048) for the project, blocks the delete with a 409 — the same
  "one active thing" shape `startImplementation` already uses. This method
  does not cancel the run or stop the server on the caller's behalf: nothing
  outside the project's own rows is silently torn down by a click meant only
  to remove a workspace. Cancel or resolve first, same as any other
  conflicting state in this feature.
- **Audited before the row is gone.** Same order as `AccountService#delete`:
  the audit entry is written first, carrying the project's name in `detail`,
  because `target_id` keeps pointing at a row that will no longer exist to
  look up.
- **Two presses, the second inside a real popup.** The frontend control reads
  *Delete project*, opening a modal — `role="dialog"`, `aria-modal`, closes on
  Escape or a backdrop click — with *Cancel*/*Yes, delete*, the same
  `bg-black/40` overlay and `rounded-[10px] border-border bg-white shadow-xl`
  card, and the same solid `bg-danger` confirm button, that `DeleteModal`
  (Users & Roles) already uses for its own irreversible account delete. A
  first draft of this ADR used `DangerZoneCard`'s in-place panel instead
  (still ADR-045's convention for a lighter, reversible action); PM review
  asked for a clearer, harder-to-miss popup given how much a project delete
  actually destroys, so this revises that choice — see Change History.

### On success

The delete itself, and telling the caller what happened, are two different
moments. Once `DELETE /projects/{id}` returns, the frontend:

1. Shows a plain, dismissible **"Project deleted successfully"** message —
   `role="status"`, clearing itself after 4 seconds (the same window
   `TopProgressBar` already uses for its own auto-hide), not `role="alert"`,
   since this is not an interruption.
2. Re-fetches the project list from the server (`GET /projects`) rather than
   locally filtering the deleted id out of what the browser already had —
   the picker's source of truth after a delete is the server's, the same
   reasoning `ProjectPicker`'s create path already gives the created row
   (`AxRenewalProjectResponse`) instead of trusting whatever the form typed.
3. Clears the `project=` query param, which lets `useAxRenewalProject`'s
   existing fallback (`projectIdParam ?? projects[0]?.id ?? null`) land on
   another remaining project, or the landing screen if none are left — no
   new navigation logic, reusing what create already relies on.

The message is kept on `ProjectPicker`, not on the modal itself: the modal
(and the button that opened it) unmounts the instant the refreshed list no
longer contains this project, which happens before the message would ever
be read if it lived there instead.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Hard delete, `admin` floor, refused while active (this ADR) | Matches what "delete" is asked for; schema already supports it with no migration; consistent with the rest of this feature's `admin` floor | Genuinely irreversible — no history survives, unlike every other delete in this feature | **Adopted** |
| B | Soft delete (`deleted_at` on `ax_renewal_project`, filtered from `list`/`findById`) | Reversible; matches ADR-045's comment pattern | A project is not a comment — its whole point is to disappear from the picker and stop being counted, and "soft" would mean every child row (including other people's comments) also silently outlives a delete nobody asked to make partial. New columns and a filter everywhere `list`/`findById` is called, for a resource whose read side already has no per-account scoping (ADR-037) to build a permission model around | Not adopted |
| C | `super_admin`-only floor | Matches the weight of `DELETE /admin/accounts/{id}` | Inconsistent with every other project-shaping route already sitting at `admin`; nothing about this action is closer to account-authority than creating the same project was | Not adopted |
| D | Silently cancel/stop an active run or local server before deleting | One click always works; no 409 to explain | Kills a real background process (and, per ADR-044, discards a staged Generate result) as a side effect of a button whose label says nothing about that — the same silent-cascade concern ADR-045 raised about hard-deleting a commented-on project, now happening to a live process instead of a row | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts

- A mistaken or finished project can actually be removed, by the same role
  that can create one, without an operator touching the database.
- No migration required — the cascade chain V25 already built is exactly
  what a hard delete needs.
- The audit log gains a durable record of who deleted what and when, the
  same guarantee `ACCOUNT_DELETE`/`PAGE_DELETE` already give other
  hard-deleted resources.

### 4.2 Negative Impacts / Costs to Accept

- **Genuinely irreversible.** Every comment (including ones ADR-045 protects
  from casual removal), every confirmed Plan section, every implementation
  run's before/after report — gone, with only the audit entry's `name` field
  left to say the project ever existed. There is no undo, and no recycle
  bin.
- A caller who wants to delete a project mid-build has to separately cancel
  the run (or stop the local server) first — one more step than a single
  click, in exchange for never silently killing a background process.

### 4.3 Follow-up Work

- [ ] PM decision: should a deleted project's name/id be retained anywhere
      more discoverable than the raw audit log (e.g. a "recently deleted"
      admin view)? Out of scope here — this ADR only adds the delete path
      itself.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Only `admin` or above may delete | `SecurityRulesTest$AxRenewalPath` | Every build | A plain `user`/`developer` is refused with 403 |
| Refused while an implementation run is active | `AxRenewalDeleteProjectTest` | Every build | 409, row not deleted, no audit entry written |
| Refused while a local run is live | `AxRenewalDeleteProjectTest` | Every build | 409, row not deleted, no audit entry written |
| The audit entry carries the name before the row is gone | `AxRenewalDeleteProjectTest` | Every build | `detail.name` matches; entry precedes the delete call |
| The frontend takes two presses, the second inside a real popup | `ProjectPicker.test.tsx` | Every build | `deleteProject` not called on the first press; a `role="dialog"` is shown |
| The popup closes on Cancel, Escape, or a backdrop click, without deleting | `ProjectPicker.test.tsx` | Every build | `deleteProject` not called; no `dialog` role left in the document |
| A success message appears and clears itself | `ProjectPicker.test.tsx` | Every build | `role="status"` text "Project deleted successfully"; gone after the auto-dismiss window |
| A missing project is a 404, not a silent no-op | `AxRenewalDeleteProjectTest` | Every build | `ApiException` thrown, repository `delete` never called |

## 6. References

- Related code: `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalProjectRepository.java#delete`,
  `AxRenewalService#delete`, `web/AxRenewalController#delete`,
  `config/SecurityConfig` (the `DELETE` matcher),
  `audit/AuditAction#AX_RENEWAL_PROJECT_DELETE`,
  `frontend/components/ax-renewal/ProjectPicker.tsx`,
  `frontend/lib/ax-renewal/api.ts#deleteProject`
- Related ADR: ADR-037 (AX Renewal), ADR-044/048/049 (what an active run/local
  server is), ADR-045 (the soft-delete alternative this ADR deliberately
  does not take)

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-28 | 1.0 | Initial draft | backend/frontend |
| 2026-09-28 | 1.1 | Confirmation moved from `DangerZoneCard`'s in-place panel to a real popup (`DeleteModal`'s overlay/card/button convention), on review feedback. Added the "On success" subsection: a `role="status"` confirmation message and a server re-fetch of the project list, in place of a local array filter | backend/frontend |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| | PM | | PENDING |
