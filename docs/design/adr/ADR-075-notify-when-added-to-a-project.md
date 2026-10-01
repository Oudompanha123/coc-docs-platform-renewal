# ADR-075: Notify People When They Are Added to an AX Renewal Project

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("Notify people when they are added to a project. Please reuse the existing notification feed and keep the change small and low-risk") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Adds a type to [ADR-025](ADR-025-push-notifications.md)'s notification model, using [ADR-034](ADR-034-notifications-as-rows.md)'s stored inbox and [ADR-041](ADR-041-notification-preferences.md)'s per-type opt-out unchanged. Follows [ADR-069](ADR-069-ax-renewal-project-members.md)/[ADR-070](ADR-070-revision-of-069-strict-project-access.md) (members, strict access).

---

## 1. Context

Since ADR-070 a project is visible only to its members, and adding a member is the only way in. But nobody was told when they were added: the project silently appeared in their list, and until someone mentioned it on another channel they had no reason to look.

The platform already has a complete notification path, used by two types (`registration.pending`, `auth.new-device`). A publisher fires an event; a notifier reacts after commit, off the request thread; `NotificationService.notifyAccount` checks the recipient's opt-out, stores the bell row, streams to open tabs, sends push, and prunes dead device tokens.

## 2. Decision

> One new `NotificationType`, `AX_RENEWAL_MEMBER_ADDED` (`ax-renewal.member-added`), delivered through the existing path exactly the way the new-device sign-in alert is. No new table, transport or delivery code.

- **Trigger:** `AxRenewalService#addMember` publishes `AxRenewalMemberAddedEvent(projectId, accountId)`, **only for a real add**: `members.add` reports a new row, and the account added is not the caller. A repeat add of an existing member, an add of oneself (e.g. a super admin joining a project), a refused add, and the creator's own membership on create notify nobody.
- **Delivery:** `AxRenewalMemberNotifier` handles it with `@Async` + `@TransactionalEventListener(AFTER_COMMIT)`, the same as `SignInNotifier`. A rolled-back add tells nobody, and a slow push service never sits in the adder's request. Failures are logged, never rethrown.
- **Recipient:** the account added, and nobody else.
- **What it says:** the type's fixed sentence, "You were added to an AX Renewal project", **never the project's name**. A project's name says which legacy system a team is replacing, and push renders on lock screens (ADR-025 decision 6). The bell row's payload is that same sentence; the project is one authenticated click away.
- **Where it leads:** deep link `/ax-renewal?project=<id>`, the query parameter the workspace already reads. In the admin shell's bell (`Topbar`), opening it opens the workspace in a new tab, as the sidebar's AX Renewal link does. If the project has since been deleted, or the reader removed, the workspace shows its existing "doesn't exist, or you're not a member" message. Nothing is looked up or revealed first.
- **Opt-out:** automatic. The preference list is `NotificationType.values()`, so the type appears in Settings → Notifications with its own toggle (ADR-041).

## 3. Consequences

- **Positive:** people learn they have access to a project when they get it, through every channel the platform already has (bell, open tab, push).
- **Accepted:** the bell row cannot say *which* project until opened. That is the price of a lock-screen-safe sentence, and it matches how the sign-in alert keeps detail behind the session.
- **No schema change, no new endpoint.** `AxRenewalService` gains a constructor parameter (`ApplicationEventPublisher`); every test constructing it passes a no-op or a recording publisher.
- **The AX Renewal workspace now has a bell (v1.1).** Manual testing found no browser banner while the recipient worked in the workspace. Cause: the workspace has its own layout without the admin shell's `Topbar`, and its bell component (`AxRenewalNotificationsBell`, added in the IDE restyle) had never been mounted, so no `useNotifications` ran there. Nothing listened to the stream, polled the inbox, or raised a banner. It is now mounted in `AxRenewalTopbar`; opening the notification there switches project in place. This affected every notification type in the workspace, not only this one.
- **When a banner appears, by design:** an in-tab banner is raised only for a notification that arrives *while a tab with a bell is open*, and only where that browser has granted permission *and* enabled it in Settings → Push notifications (`isNotificationsEnabled`). The first inbox load after opening a page seeds silently, so old items never pop up. A banner with no tab open needs Firebase push configured on both backend and frontend; without it the backend logs `push not configured; would have sent ax-renewal.member-added …`.

## 4. Verification

| Item | Method |
|---|---|
| Event published for a real add; not for a repeat, a self-add, or a refused add | `AxRenewalMembershipTest$AddingAMember` |
| Notifier tells exactly the added account, targets the project, uses the fixed sentence, swallows failures, runs async after commit | `AxRenewalMemberNotifierTest` |
| Deep link is `/ax-renewal?project=<id>`; body and key fixed | `NotificationTypeTest` |
| Bell sentence, body-less fallback, open → `onOpenProject(id)` with no lookup, other types unaffected | `frontend/lib/notify/useNotifications.memberAdded.test.ts` |
| The workspace header mounts the bell (with or without an open project); opening the notification there switches project in place | `AxRenewalTopbar.test.tsx`, `AxRenewalNotificationsBell.test.tsx` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |
| 2026-10-01 | 1.1 | Mounted the AX Renewal workspace's bell, which had never been rendered — the cause of no browser banner while working in the workspace; documented when banners appear by design | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Notify on add; reuse the existing feed; small and low-risk | ACCEPTED |
