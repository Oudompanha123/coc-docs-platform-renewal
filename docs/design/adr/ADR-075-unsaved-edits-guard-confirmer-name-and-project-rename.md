# ADR-075: Unsaved-Edits Warning, Who Confirmed, and Renaming a Project

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("start with 1, 2, and 3 together on one branch … follow the existing AX Renewal patterns, keep the changes small and low-risk, and do not introduce any database migration") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Extends [ADR-069](ADR-069-ax-renewal-project-members.md)/[ADR-070](ADR-070-revision-of-069-strict-project-access.md) (who may change a project) and [ADR-067](ADR-067-ax-renewal-stale-edit-protection.md) (plan revision). Uses [ADR-045](ADR-045-comment-soft-delete.md)'s display-name-only exposure.

---

## 1. Context

A review of the workspace found three small gaps on a team-facing flow:

1. **Unsaved Plan edits were lost silently.** Each Plan section keeps its edits in its own state until Save, and the workspace renders only the active section. Moving to another explorer item, tab or project unmounts it, and closing or reloading the browser tab does the same. Each section already knew it had unsaved changes, but used that only to block Confirm.
2. **A confirmation said when, not who.** "Confirmed 01/10/2026 09:30". On a team, who signed a section off is the question.
3. **A project could not be renamed**, nor its description changed. A typo in the name was permanent.

## 2. Decision

### 2.1 Warn before unsaved Plan edits are lost (frontend only)

`lib/ax-renewal/unsavedChanges.ts`:
- `useUnsavedChangesGuard(dirty, label)` — each Plan section (Stack move, Architecture, Pages, Database) registers while it has unsaved edits, and withdraws on save, reset or unmount.
- **Only the person's own edits count.** Stack move, Architecture and Pages can open showing an unsaved *suggestion* from analysis. That is unsaved, but nobody typed it. The guard fires only when the current value differs from both what is saved and what was first shown. Database opens from saved values only, so its unsaved state is always an edit.
- `useGuardedRouter()` — `useRouter()` with `push` asking first, swapped in where the workspace navigates: page, workspace header and tab bar, activity bar, Assistant panel, workspace bell. The sidebar's section links ask the same on click.
- The browser's own leave/reload prompt (`beforeunload`) is attached **only while something is unsaved**, so a page with nothing to lose never asks "leave site?".
- A native `confirm()`, on purpose: navigation here is a synchronous `router.push`, and the leave prompt is native anyway, so both warnings read the same. **Not covered:** the browser's Back button (App Router offers no navigation blocking), and the Assistant panel's typed `confirm <section>` command, which confirms the saved version and was already independent of the section's own unsaved check.

### 2.2 Show who confirmed each section

- `AxRenewalConfirmationRepository` joins the confirmer's `account.display_name` at read time (`left join`). `AxRenewalConfirmation` and its response DTO gain `confirmedByName`.
- `ConfirmationBar` reads **"Confirmed by Dara · 01/10/2026 09:30"** (· via Developer role when applicable). If the name is unknown it falls back to "Confirmed · <date>".
- **A display name, never an email** — the same exposure a comment's author already has (ADR-045), to the same audience: members of the project (ADR-070).

### 2.3 Rename a project and edit its description

- `PATCH /api/v1/ax-renewal/projects/{id}` `{ name, description }` → `AxRenewalService#updateDetails`.
- **Permissions, unchanged in shape:** `SecurityConfig` floors it at Admin, the same as creating or deleting a project. `requireMember` makes a non-member get the missing-project 404 (ADR-070), with Super Admin passing as everywhere else.
- **Validation:** name required (400 if blank), both trimmed; a blank description is stored as none.
- **Audit:** `ax_renewal.project_update` with `previousName`, `name`, `descriptionChanged`, so the trail recognises the project under either name. Saving the form unchanged writes and audits nothing.
- **Not revision-checked or bumped (ADR-067):** a name is not plan content, and bumping the revision would refuse a teammate's plan save as "changed by someone else" for a change they could not have overwritten.
- **Frontend:** "Edit details" next to "Delete project" in the picker, for the same people who may delete (Admin on the project, or Super Admin). It opens a popup in `DeleteProjectControl`'s style. The project's description now shows under the picker.

**No database migration** — the name and description columns already existed (V25), and the confirmer's name is a join.

## 3. Consequences

- **Positive:** typed plan edits are no longer lost without a word; sign-offs are attributable; project names can be corrected.
- **Accepted:** the Back button can still leave a section without asking; a native dialog rather than a styled one.

## 4. Verification

| Item | Method |
|---|---|
| Guard: asks naming the section; passes through when nothing is unsaved; `beforeunload` only while unsaved; registration withdrawn on save and unmount; guarded `push` blocked or allowed by the answer | `frontend/lib/ax-renewal/unsavedChanges.test.ts` |
| A section registers on a real edit, not on an untouched analysis suggestion | `PagesSection.test.tsx` |
| "Confirmed by <name> · <date>", Developer-role suffix, unknown-name fallback | `ConfirmationBar.test.tsx` |
| Confirmer name join and the rename `UPDATE … RETURNING` | Hand-run on a scratch PostgreSQL 16.15 cluster after V1–V59 |
| Rename: trims, clears a blank description, audits before/after, refuses a blank name, no-op when unchanged, never touches the plan revision | `AxRenewalUpdateProjectTest` |
| Rename refuses a non-member with the missing-project 404 and writes nothing | `AxRenewalMembershipTest` (added to the every-project-access list) |
| Rename route: refused below Admin, admitted for Admin, blank name 400 before the service | `SecurityRulesTest$AxRenewalPath` |
| Edit-details dialog: shown only to who may change the project, prefilled, saves trimmed, blank name refused locally, server refusal shown, Cancel backs out | `ProjectPicker.test.tsx` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Items 1–3: unsaved warning, confirmer name, rename/description; no migration | ACCEPTED |
