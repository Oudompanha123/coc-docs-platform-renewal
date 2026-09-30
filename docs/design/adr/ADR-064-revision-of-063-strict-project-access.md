# ADR-064: Revision of ADR-063 — Strict Project-Level Access

> **Status**: ACCEPTED — implemented
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session: "Only the project creator and explicitly added or invited members can view and access that project. Users who are not project members must not be able to view the project, its details, plans, comments, or member list." Recorded here as a transcription of that explicit instruction, not a self-approval, the same way [ADR-060](ADR-060-ai-error-assistant-and-ui-customization.md) records its own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). The V59 cleanup (§2.3) and the non-removable creator (§2.2) were the implementer's reading of that instruction; set this back to PROPOSED if either needs a separate PM decision.
> **Related ADR**: **Revises** [ADR-063](ADR-063-ax-renewal-project-members.md): reverses its §2.1 "what stays open" row and adopts its own rejected Alternative C. **Supersedes in part** [ADR-062](ADR-062-resolution-of-039-040-ax-role-model-and-workspace-access.md) §2.2: Reviewer/Lead "read every project" becomes "read the projects they are members of".

---

## 1. Context

### 1.1 The report

A user created a project and invited nobody. Other users who were not invited could still see it in the project list and open it.

### 1.2 Root cause — by design, not a bug in V58

ADR-063 made membership gate **changing** a project only, and left **reading** open on purpose (its §2.1: "What stays open? Reading (every GET), adding/removing one's own comments, assistant chat, and explain-failure"). It listed "Membership also gates reading" as Alternative C and rejected it. The code did exactly that:

| Where | What it did |
|---|---|
| `AxRenewalService#list()` → `AxRenewalProjectRepository#list()` | Returned **every** project to every caller. The `member` flag only fed the picker's Mine/All *filter*, which was presentation. |
| `detail`, `findGeneratedChanges`, `runLocallyStatus`, `explainRunLocallyFailure`, `chat` | Took **no caller at all**: `requireProject` (exists?) only. |
| `addComment`, `deleteComment` | `requireProject` only, so any reader could comment. |
| `SecurityConfig` | `GET /api/v1/ax-renewal/**` at the `user` floor. That is a role floor, and it cannot see row data. |

**V58 was not the cause.** It creates the table and backfills it. A brand-new project gets exactly one member, its creator, from `AxRenewalService#create`. But V58's backfill **conflicts with the new rule** in a different way: it made everyone who had ever acted on an older project a member, although nobody invited them (§2.3).

## 2. Decision

> A project is visible only to its **creator**, the people **explicitly added** to it, and a **super admin** (whose any-project override is unchanged). Everyone else gets a **404** — identical to a project that does not exist — from every project-scoped route, reads included. The project list is scoped in the query. Role-based permissions *within* a project are unchanged.

### 2.1 Backend

- **`requireMember` guards every project-scoped service method**, including the reads and comments that were open. The only exception is `create`, where there is no project yet. That is 30 public methods; a coverage check confirmed each one calls it.
- **404, not 403, and the same message as a missing project** (`"project not found"`). A 403 would confirm that the id is a real project. A project someone was not invited to should be as invisible to them as one that was never created. Under ADR-063 a non-member's refused *change* was a 403 with a "you can read and comment" message; both are gone, because reading and commenting are no longer open to them.
- **`list(actor)`**: `listForMember(accountId)` — an `exists` subquery against `ax_renewal_project_member`, so a project the caller is not on is never loaded for them — or `list()` for a super admin.
- Detail, generated changes, run status, explain and chat now take the caller (controller passes `@AuthenticationPrincipal`).
- **`SecurityConfig` is unchanged.** Role floors still decide what a *member* may do. Membership is row data and stays in the service (ADR-045's precedent).

### 2.2 Membership rules that follow

- **The creator cannot be removed** (409), however many other members remain. "The creator and the people they invite" makes the creator permanent. ADR-063's "last member cannot be removed" rule stays.
- Adding members is unchanged: Admin floor, must be on the project, by email, active account with a workspace role (ADR-063).

### 2.3 V59 — undoing V58's contributor backfill

V58 inserted a member row for every `*_by` column on each existing project. Under this ADR those rows grant visibility to accounts nobody invited, so **V59 deletes them, keeping the creator rows.** V58 is left as applied; Flyway checksums forbid editing it. They are identified exactly as the rows with `added_by = null` whose `added_at` is V58's single transaction timestamp: the earliest `added_at` of any null-`added_by` row. A later explicit add always records its adder, and even if that adder's account is later deleted (`on delete set null`) its `added_at` is a later instant, so it is not touched. V59 then re-inserts any missing creator row.

**Consequence:** anyone who was a member of an older project only through the backfill loses access to it, and must be added back explicitly if they should keep it. That is what "only explicitly added members" means, but it is a visible change on the shared dev database.

### 2.4 Frontend

- `AxRenewalNotFoundError`: a 404 is now its own error type. `useAxRenewalProject` turns it into "This project doesn't exist, or you're not a member of it. Ask one of its members to add you under Workspace → Members." It says both reasons, because the client cannot tell them apart either. A failed load also **clears the previous project's detail**, which the hook used to leave on screen under the new project's URL.
- **Mine / All** appears only when the served list contains projects the caller is not on, which means a super admin. For everyone else Mine and All would be the same list, so it is not shown.
- The ADR-063 non-member banner ("you can read it and comment") is gone, since that state no longer exists. In its place, a banner for a **super admin opening a project they are not on**, so that view is never mistaken for membership.
- Members panel and product docs now say only members can see a project.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Membership gates every project route; non-member gets the missing-project 404; list scoped in SQL | Nothing about an uninvited project leaks, not even its existence | A non-member can no longer ask to join in the project's own thread; they must ask a member directly | **Adopted** |
| B | Same, but 403 for non-members | Clearer "you lack access" signal | Confirms the project exists to anyone who holds or guesses an id | Not adopted |
| C | Filter the list only (UI/response), leave detail open | Smallest change | The reported problem remains for anyone with a link | Not adopted — explicitly ruled out ("not just by hiding projects in the UI") |
| D | Keep V58's contributor members | Nobody loses access to older projects | Contradicts "only explicitly added"; uninvited accounts stay able to see those projects | Not adopted — V59 |

## 4. Consequences

### 4.1 Positive
- The reported leak is closed at the API, not only in the UI: list, detail, plans, comments, member list, generated changes, run status, chat and explain all refuse a non-member.
- A non-member cannot distinguish "not invited" from "does not exist".

### 4.2 Negative / Costs to Accept
- **Access loss from V59** (§2.3) on existing projects for backfilled contributors.
- **Reviewers and Leads see fewer projects**: only those they are added to (revises ADR-062 §2.2).
- **No self-service "ask to join"**: a non-member cannot comment on a project they cannot see. They must reach a member outside the workspace.
- **API behaviour change:** a non-member's writes now get 404 instead of 403, and `GET /projects` returns fewer rows.

### 4.3 Follow-up Work
- [ ] Run the Testcontainers suite (`mvn -f backend/pom.xml verify`) with Docker to prove V58 + V59 against real Postgres — not run in the implementing session (no Docker).
- [ ] If "ask to join" is wanted: a request-access flow that does not reveal the project's contents.
- [ ] Carried over: `REQUIREMENTS-SPEC.md` FR-IDs for AX Renewal access control.

## 5. Verification

| Item | Method | Threshold |
|---|---|---|
| Every project read *and* change refuses a non-member with the missing-project 404 and touches nothing | `AxRenewalMembershipTest$WhoMayAccessAProject` (parameterised over 30 calls) | Must pass |
| Non-member's 404 is indistinguishable from a missing project's | `…a_non_member_cannot_tell_the_project_exists` | Must pass |
| Members read; super admin reads any project | `AxRenewalMembershipTest$WhoMayAccessAProject` | Must pass |
| List scoped in the query; super admin gets all | `AxRenewalMembershipTest$TheProjectList` | Must pass |
| Creator cannot be removed | `AxRenewalMembershipTest$RemovingAMember` | Must pass |
| Role floors unchanged | `SecurityRulesTest$AxRenewalPath` | Must pass |
| 404 surfaced as "doesn't exist, or you're not a member"; stale detail cleared | `useAxRenewalProject.test.ts`, `api.test.ts` | Must pass |
| Mine/All only where the list holds non-member projects | `ProjectSwitcher.test.tsx` | Must pass |
| V59 applies and removes exactly the backfilled contributor rows | Testcontainers (Docker required) | Before merge |

## 6. References

- `backend/src/main/resources/db/migration/V59__ax_renewal_member_backfill_creator_only.sql`
- `AxRenewalService` (`requireMember`, `list`, `removeMember`), `AxRenewalProjectRepository#listForMember`, `AxRenewalController`
- `frontend/lib/ax-renewal/api.ts` (`AxRenewalNotFoundError`), `useAxRenewalProject.ts`, `components/ax-renewal/ProjectSwitcher.tsx`, `MembersPanel.tsx`, `app/ax-renewal/page.tsx`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Initial version: root cause recorded, strict access implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | Strict project-level access: only the creator and explicitly added members; enforced in the backend APIs, not just the UI | ACCEPTED |
