# ADR-099: Users & Roles, Attendance, Claude Usage and Registration Notifications Are Super Admin Only

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-08
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"Implement role-based access for the Admin role: remove Users & Roles, Attendance, and Claude Usage from Administration, and hide the Activity icon. These items should be visible only to Super Admin."*, revised in the same session: *"Now please show the Activity icon for Admin, but only Super Admin should receive new user registration notifications. Admin should not see these notifications."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Narrows ADR-035/ADR-052 (Claude Usage team dashboard admitted admin and super_admin) and the Attendance page (admin floor via `/api/v1/admin/**`). Follows ADR-011 (one enforcement point in `SecurityConfig`) and FR-AUTH-008 (an admin publishes content; authority over other people is a super_admin's).

---

## 1. Context

The ADMINISTRATION sidebar showed an `admin` three items: Attendance, Claude Usage and Announcements. Users & Roles was already super_admin only (FR-AUTH-008). The admin topbar also showed every admin the Activity icon.

Attendance (the team's HRMS clock-ins) and Claude Usage (the team's roster, spend and per-member activity) are data about other people. They are the same kind of personal-data exposure as the accounts list, which already sits at the super_admin floor (NFR-SEC-PII). They are not editorial work.

## 2. Decision

1. **Sidebar** (`nav-config.ts`): Attendance and Claude Usage are listed for `super_admin` only, like Users & Roles. An admin's ADMINISTRATION section now holds just Announcements.
2. **Pages**: `/users-roles`, `/attendance` and `/claude-usage` each wrap themselves in `RequireSession allowRoles={SUPER_ADMIN_ROLES} deniedPath="/overview"`. An admin who types the URL goes back to the Overview. They are not sent to /welcome, because they still belong in the admin app. `RequireSession` gained the `deniedPath` prop for this.
3. **Activity icon and registration notifications**: the Activity icon stays visible to admins. (The first version of this decision hid it, and the same-session revision restored it.) An admin's feed lists only their own actions (`NotificationFeedService.feedFor`), so another person's registration never appears in it. Bell registration rows (`registration.pending`) are written only for accounts holding `super_admin` (`NotificationService.notifyApprovers`). `NotificationInboxService` now also leaves them out of the list and the unread count for any caller not holding `super_admin`. That covers an account that received them as a super_admin and was later demoted to admin.
4. **API floors** (`SecurityConfig`): `/api/v1/admin/attendance/**` and `/api/v1/admin/claude-usage/**` move from the generic admin floor to `hasRole(SUPER_ADMIN)`. They are stated ahead of the `/api/v1/admin/**` line.
5. **Team dashboard scope** (`ClaudeUsageService.dashboardFor`): `GET /api/v1/claude-usage` keeps its user floor, but only `super_admin` gets the whole team. Everyone else gets their own row, and that now includes an admin. Without this, the sidebar change would have been cosmetic.
6. **CLI sign-in landing** (`cliSignedInDestination`): only a super_admin is sent to `/claude-usage`. An admin goes to `/my-claude-usage`, the same as every other role.

## 3. Consequences

- An admin still sees their own Claude usage (Settings → Claude Usage) and their own attendance (Reports & Records). Only the team-wide views are withdrawn.
- `GET /api/v1/notifications` (the Activity feed) is unchanged. A non-super_admin's feed was already scoped to their own events.
- A demoted account's registration rows stay stored but unshown. "Read all" may still mark them read, which is harmless.
- Hiding links is presentation. The enforcement is items 4 and 5, which are covered by `SecurityRulesTest` (`AttendancePath`, `ClaudeUsagePath`) and `ClaudeUsageServiceTest`, and the inbox filter in item 3, which is covered by `NotificationInboxServiceTest`.
