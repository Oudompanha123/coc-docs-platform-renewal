# ADR-063: AX Renewal Project Members

> **Status**: ACCEPTED — **REVISED by [ADR-064](ADR-064-revision-of-063-strict-project-access.md)** (2026-09-30)
>
> **Read this first.** ADR-064 reverses this document's "what stays open"
> row (§2.1): membership now gates *reading* too, and a non-member gets a
> 404 identical to a missing project's instead of a 403. Its rejected
> Alternative C is now the design. V58's contributor backfill (§2.2) is
> undone by V59 (creator rows kept), and a project's creator can no longer
> be removed. Everything else here — the member table, adding by email,
> the last-member rule, roles still deciding *what* — stands.
>
> **Previous status**: ACCEPTED — implemented
> **Date**: 2026-09-30
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("Keep Project Members as a separate Phase 2 item" → "Okay now please implement Phase 2"), against the Phase 2 scope recommended earlier in the same session — recorded here as a transcription of that instruction, not a self-approval, the same way [ADR-060](ADR-060-ai-error-assistant-and-ui-customization.md) records its own (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3). The detailed choices in §2 (backfill scope, who may manage members, comments staying open) were made by the implementer within that scope; set this back to PROPOSED if any of them needs a separate PM decision.
> **Related ADR**: Extends ADR-037 (AX Renewal, filed in code as "ADR-037") and [ADR-062](ADR-062-resolution-of-039-040-ax-role-model-and-workspace-access.md) (who may open the workspace). Reuses [ADR-045](ADR-045-comment-soft-delete.md)'s "row data decides who" pattern and its display-name-only exposure of account identities. Builds on [ADR-061](ADR-061-ax-renewal-stale-edit-protection.md)'s project row lock.

---

## 1. Context

After ADR-061 (stale-edit protection) and ADR-062 (Reviewer/Lead workspace access), one team-collaboration gap was left: **nothing recorded who is working on which project.** Every project was changeable by anyone holding the right role anywhere, so any Admin could edit any team's plan and any Developer could confirm or build any project. The only person tied to a project was `created_by`. There was no "my projects" view and no team list.

Constraints this had to fit:

- **No new authorization mechanism.** ADR-062 had just consolidated roles to one `app_role` ladder. Per-project roles would reintroduce a second axis of *what*.
- **NFR-SEC-PII.** Account emails reach only a super admin (`/api/v1/admin/accounts/**`, the notification feed). Nobody below super admin can list accounts to pick a teammate from.
- **Existing work must not break.** Teams are already mid-plan on existing projects.

## 2. Decision

> Each project has a member list (`ax_renewal_project_member`, V58). **Membership decides which projects a caller may change; the caller's role still decides what they may do there.** Reading a project and commenting on it stay open to everyone who could already do so. A super admin may change any project. `SecurityConfig`'s existing rules are unchanged; two matchers are added for the new member routes.

### 2.1 Rules

| Question | Answer |
|---|---|
| What does membership gate? | Every service method that changes a project — 21 of them: delete, attach, run analysis, the six plan edits, confirm, reopen, start/error-fix/UI-change implementation, approve, reject, cancel, run tests, revert, Run Locally start/stop — plus adding and removing members. Enforced in `AxRenewalService#requireMember`, not `SecurityConfig`, because it is row data (same reason as ADR-045's comment authorship). |
| What stays open? | Reading (every `GET`), adding/removing one's own comments, assistant chat, and explain-failure. Chat and explain only read. The comment thread is where a non-member asks to be added. |
| Error for a non-member | **403**, whose message says what they *can* do (read, comment) and how to get added (a member with the Admin role, Workspace → Members). A missing project is still a **404**, checked first. |
| Super admin | Passes the membership check on every project — the same override ADR-045 gives over anyone's comment, and the only way back into a project whose whole team has left. |
| Who may add/remove members? | Route floor **Admin** (same as creating a project), **and** a member of that project (or a super admin). An Admin cannot put themselves onto another team's project from outside it. |
| How is someone added? | **By email**, because nobody below super admin can list accounts. The account must be **active** and hold a role that can open AX Renewal (developer, reviewer, lead, admin, super_admin — ADR-062); otherwise **400**. An unknown email is **404**. Adding an existing member is a no-op, not an error. |
| Removing | Anyone, including oneself — **except the last member (409)**. The project row is locked first (ADR-061's `lockRevision`) so two concurrent removals cannot both see one other member and leave none. |
| What do readers see about members? | `accountId`, `displayName`, `addedAt` — **never the email**, the same as a comment's author (ADR-045). |
| Creation | The creator becomes the first member in the same transaction. |
| Audit | `ax_renewal.member_add` / `ax_renewal.member_remove`, `detail.accountId`, shown in the feed as "Added/Removed a member …". |

### 2.2 Backfill (V58)

Everyone who has already *acted on* a project becomes its member — every `*_by` column V25 records: creator, manifest attach, analysis, each plan section's last editor, database connection, destination, section confirmations, implementation runs. Commenting is deliberately not counted: the thread is open to every reader, so having commented says nothing about being on the team. `added_by` is null for backfilled rows, and the column's comment says so rather than guessing.

### 2.3 Frontend

- `lib/ax-renewal/permissions.ts` — one `axRenewalPermissions(user, project)` used by both the page and the Assistant panel, which previously each held their own copy of `canEdit`/`canConfirm`. It adds membership to both: `canEdit = Admin && onProject`, `canConfirm = (Super Admin || exactly Developer) && onProject`, `onProject = Super Admin || project.member`. Creating a project stays role-only.
- **Workspace → Members** panel: lists members (display name, "you", date added) for every reader; add-by-email and two-press remove only for a caller who can manage the team; no Remove on the last member.
- **Non-member banner** on the project page (`role="status"`), explaining read/comment-only and how to get added.
- **Mine / All** in the project switcher. It opens on Mine for anyone on at least one project, otherwise All. It only filters, and the trigger still names the open project when the filter hides it.
- A 403 now surfaces the backend's own message (it used to be replaced by a generic "You don't have access to AX Renewal."), so a non-member sees why and what to do.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Membership gates changes; role still decides what; reads/comments open | One new table, no new authorization axis, `SecurityConfig` rules unchanged | A member list to keep up to date | **Adopted** |
| B | Per-project roles (e.g. "lead on this project") | Finer-grained | A second authorization model beside `app_role`, exactly what ADR-062 just removed | Not adopted |
| C | Membership also gates reading | Stronger isolation between teams | Hides who to ask; breaks ADR-062's "Reviewers and Leads follow along" | Not adopted |
| D | Backfill only `created_by` | Simplest | Locks active teammates out of projects they are in the middle of | Not adopted |
| E | Pick members from an account list | Friendlier UI | Exposes every account's identity below super admin (NFR-SEC-PII) | Not adopted — by email instead |

## 4. Consequences

### 4.1 Positive Impacts
- A team's plan can only be changed by that team (plus super admin).
- "Who is on this" has an answer, visible to everyone who can open the project.
- The page and the Assistant panel can no longer disagree about what the caller may do.

### 4.2 Negative Impacts / Costs to Accept
- **Behaviour change for existing users:** an Admin or Developer who never acted on a project (so was not backfilled) can no longer change it until a member adds them. That is the point of the feature, but it will be noticed.
- **API change:** `GET /projects` items and the detail's `project` gain `member`; the detail gains `members`. Additive only.
- **Email enumeration at the Admin floor:** add-member answers 404 for an unknown email. An Admin could use it to test whether an address has an account. That is accepted because it takes the Admin role *and* project membership, and an Admin can already see who signs in to their own projects. Revisit if the Admin population grows beyond trusted staff.
- The 403 for a non-member reuses the route-floor status code, so a client can only tell the two apart by the message. The frontend shows the message verbatim, which is enough today.

### 4.3 Follow-up Work
- [ ] Run the Testcontainers suite (`mvn -f backend/pom.xml verify`) on a machine with Docker to prove V58 (including its backfill `union`) applies against real Postgres — not run in the implementing session (no Docker).
- [ ] Carried over: `REQUIREMENTS-SPEC.md` has no FR-IDs for the AX Renewal workflow, roles, or membership.
- [ ] If teams want it: a notification to someone when they are added to a project.

## 5. Verification

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Every project-changing method refuses a non-member (403) and writes nothing; missing project is 404 | `AxRenewalMembershipTest$WhoMayChangeAProject` (parameterised over all 23 gated calls) | Every build | Must pass |
| Super admin bypass; members pass; non-members may still comment; creator becomes first member | `AxRenewalMembershipTest$WhoMayChangeAProject` | Every build | Must pass |
| Add: active + workspace role only; unknown email 404; idempotent, audited once | `AxRenewalMembershipTest$AddingAMember` | Every build | Must pass |
| Remove: not the last member (409); row locked first; audited | `AxRenewalMembershipTest$RemovingAMember` | Every build | Must pass |
| Member routes floor at Admin | `SecurityRulesTest$AxRenewalPath` | Every build | Must pass |
| UI never offers what the backend would refuse | `permissions.test.ts`, `MembersPanel.test.tsx`, `ProjectSwitcher.test.tsx`, `explorerGroups.test.ts`, `api.test.ts` | Every build | Must pass |
| V58 applies cleanly with backfill | Testcontainers integration suite (Docker required) | Before merge | Must pass |

## 6. References

- `backend/src/main/resources/db/migration/V58__ax_renewal_project_member.sql`
- `backend/src/main/java/com/coc/docs/axrenewal/AxRenewalMember.java`, `AxRenewalMemberRepository.java`, `AxRenewalService.java` (`requireMember`, `addMember`, `removeMember`)
- `backend/src/main/java/com/coc/docs/web/AxRenewalController.java`, `ApiDtos.java`, `config/SecurityConfig.java`
- `frontend/lib/ax-renewal/permissions.ts`, `frontend/components/ax-renewal/MembersPanel.tsx`, `ProjectSwitcher.tsx`, `frontend/app/ax-renewal/page.tsx`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-30 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |
| 2026-09-30 | 1.1 | Status note: revised by ADR-064 (reads gated too; 404 for non-members; V59 undoes the contributor backfill; creator not removable). Body left as written. | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-30 | User (in-session, direct instruction) | "Okay now please implement Phase 2" (Project Members, as scoped earlier in the session) | ACCEPTED |
