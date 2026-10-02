# ADR-086: Block "user" and "developer" From the Admin App Entirely

> **Status**: ACCEPTED — implemented. Drafted and implemented as "ADR-074", then renumbered to "ADR-078" when `dev`'s own unrelated ADR-074 (Claude usage activity detail) landed first; renumbered again to 084 on a later pull, whose own unrelated ADR-078..083 (AX Renewal run history and notifications) had landed in the meantime — see `ADR-INDEX.md`'s own Numbering convention.
> **Date**: 2026-09-29
> **Author**: AI (Claude Sonnet 5), on direct in-session instruction
> **Approver**: the user (product owner), in-session: "Roles user and developer must NOT access any admin page or any admin API. This includes /overview, /settings, /ax-renewal, and every other admin page. Only super_admin and admin can access the admin app. This decision is final." Recorded here as a transcription of that explicit instruction, not a self-approval, the same way [ADR-070](ADR-070-revision-of-069-strict-project-access.md) and [ADR-071](ADR-071-staff-roles-open-the-overview-dashboard.md) record their own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). Two follow-up implementation choices were made on direct instruction too, not left to the implementer: Reviewer and Lead lose their AX Renewal read/comment access alongside Developer (not just Developer, which the original request did not mention by name), and a plain Admin without the Developer role gains the write actions Developer's retired `exactAuthority()` carve-out used to reserve for Super Admin or Developer only.
> **Related ADR**: **Supersedes** [ADR-040](ADR-040-reviewer-lead-roles.md)'s confirm/reopen/start-implementation `exactAuthority()` floor, [ADR-068](ADR-068-resolution-of-039-040-ax-role-model-and-workspace-access.md)'s Reviewer/Lead AX Renewal workspace access, and [ADR-071](ADR-071-staff-roles-open-the-overview-dashboard.md) in full (its Overview/Settings carve-out no longer exists for any of the three roles).

---

## 1. Context

Developer, Reviewer and Lead sit strictly between `USER` and `ADMIN` in the role ladder (`AppRole.java`, ADR-040). ADR-068 and ADR-071 progressively opened `/overview`, `/settings` and `/ax-renewal` to all three, and ADR-040 gave Developer specifically (checked by exact role membership, not rank) the ability to confirm plans and start/approve/reject/cancel AX Renewal implementation runs even without holding Admin.

The product owner decided this is no longer wanted: `developer` (and `user`, who already had no such access) must be refused everywhere in the admin app, the same as a signed-out visitor who happens to be signed in. Only `admin` and `super_admin` may use the admin app at all.

## 2. Decision

Every admin-app route — including AX Renewal, which previously had its own rank-independent carve-outs — now checks a single allow-list rather than a rank floor: `[admin, super_admin]`. Backend: `AppRole.ADMIN_APP_ROLE_NAMES`. Frontend: `ADMIN_APP_ROLES` in `lib/auth/landing.ts`, read by `RequireSession` and `landingPathFor`.

An allow-list rather than widening the rank floor, because `AppRole.isAtLeast()` cannot express "refuse everyone between USER and ADMIN" — Developer, Reviewer and Lead all occupy exactly that band, and the ladder itself is unchanged (not reordered, not removed).

### 2.1 Two scope decisions made during implementation, on explicit confirmation

- **Reviewer and Lead are blocked too**, not just Developer. The original instruction named only "user" and "developer," but Reviewer and Lead shared the exact same `USER`-floored AX Renewal routes and the same `RequireSession` carve-out as Developer — there was no way to block Developer there without also touching the routes Reviewer/Lead relied on. Asked and confirmed: block all three, matching "only super_admin and admin" literally.
- **A plain Admin now gains AX Renewal's write actions** (confirm, reopen, start/approve/reject/cancel implementation, error-fix/UI-change start, run-tests, revert, run-locally start/stop) that previously required Super Admin or exactly Developer. Since Developer can no longer reach AX Renewal at all, keeping that carve-out would have meant no non-super-admin could do these actions at all. Asked and confirmed: widen to the same `[admin, super_admin]` allow-list as everything else in the feature, rather than restrict to Super Admin only.

## 3. Consequences

### 3.1 What changes for each role

| Role | Before | After |
|---|---|---|
| Super Admin | Full admin app | Unchanged |
| Admin | Full admin app except AX Renewal's confirm/start/approve/reject/cancel/run-tests/revert/run-locally actions (needed Developer too) | Full admin app, **including** those AX Renewal actions |
| Developer | `/overview`, `/settings`, `/ax-renewal` (read/comment via rank, write via exact role) | **Nothing** — lands on `/welcome` like a signed-in `user` with no other role |
| Reviewer | `/overview`, `/settings`, `/ax-renewal` (read/comment only) | **Nothing** |
| Lead | `/overview`, `/settings`, `/ax-renewal` (read/comment only) | **Nothing** |
| User | `/welcome` (no admin access; already correct) | Unchanged |

### 3.2 What does not change

- The role ladder itself (`GUEST < USER < DEVELOPER < REVIEWER < LEAD < ADMIN < SUPER_ADMIN`) — not reordered, not removed, per explicit instruction.
- `AppRole.exactAuthority()` and the `SessionAuthenticationFilter`/`TestCallers` infrastructure that grants it — kept, even though no current route reads it, the same as any other capability mechanism a future feature might need.
- Every route already floored at `ADMIN` or above (`/api/v1/admin/**`, project create/delete, members, manifest, analysis, plan edits, destination, assistant chat) — these already excluded Developer/Reviewer/Lead by rank and needed no change.
- Self-service and whole-app-read routes used outside the admin app (`/api/v1/auth/**` self-service, `/api/v1/me/**`, notifications, `/api/v1/claude-usage` (self-scoped), `/api/v1/admin/tasks` GET, `/api/v1/sections/**`, `/api/v1/pages/**`) — none of these are admin-app surfaces, so none were touched.

## 4. Follow-up

The `"DEVELOPER"`-labelled sidebar section (`nav-config.ts`) now shows only to `admin`/`super_admin` — the same two roles that already see the `ADMINISTRATION` section above it. The label is a naming leftover, not a functional issue; renaming it (or folding AX Renewal into `ADMINISTRATION`) was left undone since it wasn't requested.

## 5. References

- `backend/src/main/java/com/coc/docs/account/AppRole.java` — `ADMIN_APP_ROLE_NAMES`
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` — every `/api/v1/ax-renewal/**` matcher
- `backend/src/test/java/com/coc/docs/web/SecurityRulesTest.java` — `AxRenewalPath` (60 cases)
- `frontend/lib/auth/landing.ts` — `ADMIN_APP_ROLES`, `landingPathFor`
- `frontend/components/layout/RequireSession.tsx`
- `frontend/components/layout/nav-config.ts`
