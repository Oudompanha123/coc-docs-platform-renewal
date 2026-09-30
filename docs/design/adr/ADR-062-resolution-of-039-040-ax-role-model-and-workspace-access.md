# ADR-062: Resolution of ADR-039 / ADR-040 — the AX Role Model as Built, and Reviewer/Lead Workspace Access

> **Status**: ACCEPTED — implemented; §2.2 **superseded in part by [ADR-064](ADR-064-revision-of-063-strict-project-access.md)** (2026-09-30)
>
> Reviewers and Leads still open the workspace and still read and comment
> — but only on the projects they are members of, not every project
> (ADR-063 introduced membership; ADR-064 made it gate reading). The role
> model and every `SecurityConfig` floor below are unchanged.
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("resolve the ADR-039/ADR-040 conflict before making access-control changes … allow Reviewer and Lead to access the AX Renewal workspace while preserving the existing role permissions") — recorded here as a transcription of that explicit instruction, not a self-approval, the same way [ADR-060](ADR-060-ai-error-assistant-and-ui-customization.md) records its own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). If a separate PM sign-off is required, set this back to PROPOSED.
> **Related ADR**: **Supersedes** [ADR-039](ADR-039-revision-of-038-ax-role-tech-lead-and-reviewer.md). **Supersedes in part** [ADR-040](ADR-040-reviewer-lead-roles.md) (§2.1 and the §2.2 ladder; §2.3 stands). Records the decision behind V30–V32, which no ADR describes. Extends ADR-037 (AX Renewal, filed in code as "ADR-037") and [ADR-016](ADR-016-roles-and-permissions.md). Companion to [ADR-061](ADR-061-ax-renewal-stale-edit-protection.md).

---

## 1. Context

### 1.1 The conflict

ADR-039 and ADR-040 were written on separate branches for the same PM request (add Tech Lead / Reviewer / Lead to the account screen). Both are PROPOSED, and each says the other's survival is the PM's call:

- **ADR-039** keeps ADR-038's rank-independent `capability`/`account_capability` tables and adds `tech_lead` and `reviewer` capabilities (V26).
- **ADR-040** makes Reviewer and Lead real `app_role` values (V28, V29) — and explicitly keeps Developer a **capability**, listing "Developer as a role" as a rejected alternative.

### 1.2 What the code actually does — neither

The merged migrations went further than either document:

| Migration | Effect |
|---|---|
| V26 | `tech_lead`, `reviewer` capability rows (ADR-039) |
| V28, V29 | `reviewer`, `lead` added to `app_role`; seeded with `content.read` only (ADR-040) |
| V30 | `developer` added to `app_role` as well |
| V31 | Every `developer` capability grant copied to the `developer` role, then **`account_capability` and `capability` dropped** |
| V32 | `ax_renewal_confirmation.confirmed_via` value renamed `developer_capability` → `developer_role` |

So the live model is: **one mechanism (`app_role`), seven roles**, `AppRole` declaration order `guest < user < developer < reviewer < lead < admin < super_admin`. There is no capability mechanism left for ADR-039 to extend, and ADR-040's §2.1 ("Developer stays a capability") is contradicted by V30–V32. V30/V31 cite "ADR-039", but their content is neither document; the Developer-as-role decision was never written down.

Applied Flyway migrations are immutable, and reverting V30–V32 would mean re-creating a dropped authorization mechanism. So the conflict is resolved by recording what was built.

### 1.3 The access gap this unblocks

ADR-039 §4.3 and ADR-040 §3 both left one follow-up open: Reviewer and Lead are assignable but grant nothing, and an account holding only one of them **cannot even open `/ax-renewal`** — `RequireSession.tsx` and `nav-config.ts` admit `developer` specifically. The backend already lets them read and comment: `GET /api/v1/ax-renewal/**` and the comment routes sit at `hasRole(USER)`, which is rank-based, and both roles out-rank `user`. So the gate is frontend-only.

## 2. Decision

> **(1)** ADR-039 is superseded. ADR-040 is superseded in part. The authoritative AX role model is the single `app_role` ladder as built by V28–V32. **(2)** An account holding `reviewer` or `lead` may open the AX Renewal workspace, read every project, and add or remove its own comments — nothing more. Every other AX Renewal rule in `SecurityConfig` is unchanged, including the confirm / implementation floor of **Super Admin or exactly Developer**. Lead is deliberately **not** given confirm.

### 2.1 The role model (resolves the conflict)

| Role | Ladder position | What it is |
|---|---|---|
| `developer` | above `user` | A real role (V30/V31), not a capability. Satisfies AX Renewal's confirm/implementation floor **by exact membership** (`AppRole.DEVELOPER.exactAuthority()`), never by rank. |
| `reviewer` | above `developer` | A real role (V28/V29), `content.read` only. |
| `lead` | above `reviewer` | A real role (V28/V29), `content.read` only. ADR-040's Lead > Reviewer rank order stands. |

- **ADR-039 → SUPERSEDED.** Its mechanism no longer exists (dropped in V31).
- **ADR-040 → SUPERSEDED IN PART.** §2.1 (Developer stays a capability) and the §2.2 ladder diagram (which omits Developer) are replaced by §2.1 of this ADR. §2.3 still stands: Reviewer and Lead grant `content.read`, and nothing under `/api/v1/admin/**`. §2.4 (two-migration split) is historical fact.
- **Why rank position does not leak authority.** Developer, Reviewer and Lead all sit below `admin`, so rank-based `hasRole(ADMIN)` rules are unaffected. The one rule that must *not* be satisfied by rank — AX Renewal confirm/implementation — already uses `exactAuthority()`, so Reviewer and Lead do not pass it just because they out-rank Developer.

### 2.2 AX Renewal access, after this change

| Action | Who | Changed? |
|---|---|---|
| Open the workspace (`RequireSession`), see it in the nav (`nav-config`) | admin, super_admin, developer, **reviewer, lead** | **Yes — reviewer, lead added** |
| Read projects, plan, analysis, run status (`GET`) | `user`-floor rank (unchanged) | No |
| Add a comment; remove one's own | `user`-floor rank (unchanged) | No |
| Create/delete project, attach, run analysis, assistant chat, edit plan, database connect, destination, explain failure | `admin` or above | No |
| Confirm/reopen a section, start/approve/reject/cancel/revert implementation, error-fix, UI change, run tests, Run Locally start/stop | Super Admin, or **exactly** Developer | No |

`SecurityConfig` is **not modified**. The only backend change is test coverage proving these rows hold for Reviewer and Lead.

### 2.3 Presentation-only follow-ons in the same change

- **Chat is offered only to callers who can use it.** The Assistant panel's Chat mode calls `/assistant/chat`, which sits at `admin`. It used to be offered to any caller whenever a model was connected, so a Developer-only user got a 403 when they tried it, and Reviewers and Leads would now hit the same thing. It is now offered only when the caller can edit (`admin`/`super_admin`). This hides a control that could only fail; it grants and removes nothing.
- The AX Renewal product docs (`frontend/lib/docs/content-store.ts`) now say Reviewers and Leads can open the workspace to follow along and comment.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Record the as-built model; widen only the frontend entry gate | No authorization rule changes; matches what the backend already allows | Reviewer/Lead get no action of their own yet | **Adopted** |
| B | Accept ADR-039 as written | — | Its tables were dropped (V31); would mean rebuilding a retired mechanism | Not adopted |
| C | Accept ADR-040 as written | — | Its §2.1 contradicts V30–V32; accepting it would mean reverting Developer to a capability | Not adopted |
| D | Also let Lead confirm/reopen sections | Gives Lead a role-specific action | Changes a sign-off floor; the instruction was to preserve existing permissions | Not adopted — open item §4.3 |

## 4. Consequences

### 4.1 Positive Impacts
- One authorization mechanism, documented. There is no longer an ADR describing a table that does not exist.
- Reviewers and Leads can follow a renewal project and discuss it in the thread, which is what "review" needs today.

### 4.2 Negative Impacts / Costs to Accept
- **Tech Lead / Reviewer capability grants did not survive V31.** V31 migrated only `developer` capability grants to the role before dropping the tables. Any account that had been granted `tech_lead` or `reviewer` under ADR-039/V26 lost that grant and got no matching role. The data is gone and the migration is immutable, so affected accounts must be given the `lead`/`reviewer` role again in Users & Roles by hand. Note that `tech_lead` (capability) and `lead` (role) were never the same name.
- Reviewer and Lead still have no action that belongs to them specifically (read and comment are available to every `user`-floor caller at the API).
- V30/V31/V32's `// req: ADR-039` citations are left as they are (applied migrations are immutable). This ADR is where that citation now resolves.

### 4.3 Follow-up Work
- [ ] PM decision: should Lead also satisfy confirm/reopen (Alternative D)? That would be one `hasAnyAuthority` entry per matcher plus the mirrored `canConfirm` check in `page.tsx`/`AxAssistantPanel.tsx`. Deliberately not done here.
- [ ] Carried over from ADR-038/039/040: `REQUIREMENTS-SPEC.md` has no FR-IDs for the AX Renewal workflow or the Developer/Reviewer/Lead roles.
- [ ] Project Members (a per-project team list, and "my projects") — scheduled as a separate Phase 2 item, not part of this change.

## 5. Verification

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Reviewer and Lead can read and comment, and are refused every edit/confirm/implementation route | `SecurityRulesTest$AxRenewalPath` (reviewer/lead cases) | Every build | Must pass |
| Existing Developer/Admin/Super Admin rules unchanged | Existing `SecurityRulesTest$AxRenewalPath` cases, unchanged | Every build | Must pass |
| Reviewer/Lead admitted to `/ax-renewal` only, not the rest of the admin shell | `RequireSession.test.tsx` | Every build | Must pass |
| AX Renewal nav item shown to Reviewer/Lead without exposing admin items | `nav-config.test.ts` | Every build | Must pass |
| Chat not offered to a caller below `admin` | `AxAssistantPanel.test.tsx` | Every build | Must pass |

## 6. References

- `backend/src/main/java/com/coc/docs/account/AppRole.java`; migrations V26, V28–V32
- `backend/src/main/java/com/coc/docs/config/SecurityConfig.java` (unchanged)
- `frontend/components/layout/RequireSession.tsx`, `frontend/components/layout/nav-config.ts`, `frontend/components/ax-renewal/AxAssistantPanel.tsx`, `frontend/lib/docs/content-store.ts`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Initial version: conflict resolved against the as-built migrations; Reviewer/Lead workspace access implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | Resolve ADR-039/040 first; admit Reviewer and Lead to the workspace; preserve existing role permissions (so Lead gets no confirm) | ACCEPTED |
