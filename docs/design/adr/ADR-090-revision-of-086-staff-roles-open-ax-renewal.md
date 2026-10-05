# ADR-090: Revision of ADR-086 — Developer, Reviewer and Lead Open AX Renewal Again

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-05
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session: "When a user with the developer, Reviewer, or Lead role logs in successfully, redirect them to /ax-renewal page." This was given in answer to being told that ADR-086 blocks those roles from AX Renewal, so a redirect alone would bounce them back. It is recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`). ADR-086 was itself a product-owner decision described as "final"; this revises it for one feature, on the user's instruction, and the product owner should confirm it at review.
> **Related ADR**: **Revises** [ADR-086](ADR-086-block-developer-and-user-from-the-admin-app.md) for AX Renewal only. It restores [ADR-040](ADR-040-reviewer-lead-roles.md)'s exact-Developer write floor and [ADR-068](ADR-068-resolution-of-039-040-ax-role-model-and-workspace-access.md)'s Reviewer/Lead read-and-comment access. [ADR-070](ADR-070-revision-of-069-strict-project-access.md)'s project membership is unchanged.

---

## 1. Context

ADR-086 (2026-09-29) closed the whole admin app, AX Renewal included, to everyone but `admin` and `super_admin`. Developer, Reviewer and Lead landed on `/welcome` and were refused on every AX Renewal page and API route.

The user now wants those three roles taken straight to `/ax-renewal` after signing in. Under ADR-086 that page and its API refuse them, so the redirect is only meaningful if AX Renewal admits them again.

## 2. Decision

> AX Renewal admits Developer, Reviewer and Lead again, with the permissions they had before ADR-086. The rest of the admin app stays as ADR-086 left it. All three land on the Member home (`/home`) after signing in, which now admits them.

| Role | AX Renewal, before (ADR-086) | AX Renewal, now | Rest of the admin app |
|---|---|---|---|
| Developer | Nothing | Opens it; reads and comments; **confirms, reopens, starts, approves, rejects, cancels, runs tests, reverts, Run Locally**, on projects they are a member of | Still blocked |
| Reviewer, Lead | Nothing | Opens it; reads and comments on projects they are a member of | Still blocked |
| Admin, Super Admin | Everything | Unchanged (Admin keeps the write actions ADR-086 gave it) | Unchanged |
| User, Guest | Nothing | Nothing | Unchanged |

- **Backend (`SecurityConfig`):**
  - `GET /api/v1/ax-renewal/**` and the comment routes floor at `DEVELOPER` by rank, which admits Developer, Reviewer, Lead, Admin and Super Admin, never User or Guest.
  - The twelve write routes admit `ROLE_ADMIN` (Admin and above) or `role.exact.developer`. That is ADR-040's exact-membership carve-out, plus the Admin ADR-086 added. They are confirm, reopen, implementation start/approve/reject/cancel, error-fix and UI-change start, run-tests, revert, and run-locally start/stop.
  - Reviewer and Lead out-rank Developer but do not hold it, so they stay read-and-comment.
  - Routes already at `ADMIN` — create, rename, delete, members, manifest, analysis, assistant chat, plan edits, database connect, destination, explain — are unchanged.
- **Frontend:**
  - `landingPathFor` sends `developer`, `reviewer` and `lead` (the highest role held) to the Member home, `/home`, as it does a plain user. Admin and Super Admin still land on `/overview`, and anyone on a temporary password on `/create-password` first.
  - `RequireMemberSession`, the Member area's gate, now admits these three as well as `user`, `admin` and `super_admin`. Without that, `/home` would send them on to `/welcome`. The Member area's API routes already floor at `USER` by rank, so the backend needs no change for it.
  - *First drafted as landing on `/ax-renewal`; changed to `/home` on the user's follow-up instruction ("make sure developer, lead, reviewer are redirected to /home after a successful login"), the same day.*
  - `RequireSession` takes an optional `allowRoles`, defaulting to ADR-086's `[admin, super_admin]`. Only `app/ax-renewal/layout.tsx` passes `AX_RENEWAL_ROLES`, so `/overview`, `/settings` and every other admin page still send these roles to `/welcome`.
  - `axRenewalPermissions.canConfirm` is now Admin-or-above or exactly Developer, matching the backend. Before this it still showed the pre-ADR-086 rule (Super Admin or Developer only), hiding from a plain Admin buttons the backend had allowed since ADR-086.
- **AX Renewal's documentation** (Products → AX Renewal, `/docs/ax-renewal-docs/*`) follows the same audience: `canViewProductDocs` admits `AX_RENEWAL_ROLES`.
  - A plain `user`, a `guest` and a signed-out visitor see "You don't have permission to access this page." with a link back to Products, instead of the pages. The product stays listed, so the message explains why it doesn't open.
  - Every other product is unchanged.
  - Presentation only: the docs content API stays public reading, as it is for every product, and the seed content ships in the frontend bundle. This governs what the site shows, not a security boundary.
- **Unchanged:** project membership. A role only says *what* someone may do; they still see only the projects they're a member of (ADR-070), and a Super Admin any project.

## 3. Consequences

- **Positive:** developers, reviewers and leads get the Member home on sign-in, and can open AX Renewal to do their part of the work.
- **Accepted:**
  - This reopens what ADR-086 closed, for one feature. The product owner should confirm at review.
  - A Developer, Reviewer or Lead who isn't a member of any project lands on an empty project list until an Admin adds them.
  - `AppRole.ADMIN_APP_ROLE_NAMES` remains the admin app's allow-list; AX Renewal's routes simply no longer use it.

## 4. Verification

| Item | Method |
|---|---|
| Read side: User and Guest refused; Developer, Reviewer and Lead admitted (project list, run history, progress, run-locally status) | `SecurityRulesTest$AxRenewalPath` |
| Comments: Developer, Reviewer and Lead admitted; a plain user refused | same |
| Exact Developer reaches all twelve write routes; User, Reviewer and Lead are refused on them; a plain Admin and a Super Admin still reach them | same |
| ADMIN-floored routes (create, rename, members, plan edits, chat) still refuse Developer, Reviewer and Lead | same (existing cases) |
| Landing: Developer, Reviewer and Lead go to `/home`; a temporary password still goes to `/create-password` first; the bare domain agrees | `landing.test.ts`, `app/page.test.tsx` |
| The Member area admits Developer, Reviewer and Lead; a guest is still sent to `/welcome`; a temporary password to `/create-password` | `RequireMemberSession.test.tsx` |
| Gate: those three are admitted to `/ax-renewal` but still refused on `/overview`, `/settings`, `/users-roles`, `/claude-usage` and `/attendance`; a plain user is refused at `/ax-renewal` | `RequireSession.test.tsx` |
| AX Renewal docs: a user, guest or signed-out visitor sees the permission message, not the pages; the five AX Renewal roles see the docs; nothing shows while the session loads; other products stay open without waiting | `product-access.test.ts`, `app/docs/[productKey]/layout.test.tsx` |
| Buttons: Admin and exact Developer may confirm; Reviewer and Lead may not; a non-member Developer gets nothing | `permissions.test.ts` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-05 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |
| 2026-10-05 | 1.1 | Landing changed from `/ax-renewal` to `/home`, and the Member area opened to the three roles, on the user's follow-up instruction | Claude Opus 5.5 |
| 2026-10-05 | 1.2 | AX Renewal's documentation withheld from user, guest and signed-out visitors, with a permission message, on the user's instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-05 | User (in-session, direct instruction) | Developer/Reviewer/Lead land on and use AX Renewal | ACCEPTED (product-owner confirmation requested at review) |
