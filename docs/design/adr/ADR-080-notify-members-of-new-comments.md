# ADR-080: Notify Project Members of New Comments

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("start the comment notification feature on a new branch … recommend the best option for the notification click behavior") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: The third use of [ADR-075](ADR-075-notify-when-added-to-a-project.md)'s delivery (after [ADR-079](ADR-079-notify-when-a-run-is-ready-for-review.md)), on [ADR-034](ADR-034-notifications-as-rows.md) and [ADR-041](ADR-041-notification-preferences.md). The comments are the project's one thread (removal: [ADR-045](ADR-045-comment-soft-delete.md)); the recipients are [ADR-069](ADR-069-ax-renewal-project-members.md)'s members.

---

## 1. Context

A project has one comment thread, shown in the AX Assistant column. Posting to it told nobody. A question for a Reviewer or Lead stayed unseen until someone happened to open the project.

## 2. Decision

> One new notification type, `ax-renewal.comment-added`, sent to every project member except the author when a comment is posted. It uses the existing feed, opt-outs, stream and push. No migration and no new endpoint.

- **When:** `AxRenewalService#addComment` publishes `AxRenewalCommentAddedEvent(projectId, commentId, authorId)` after the comment row and its audit entry are written.
  - `AxRenewalCommentNotifier` handles it `@Async`, `AFTER_COMMIT`, so a comment that rolls back tells nobody.
  - Posting is always transactional, so ADR-079's `fallbackExecution` isn't needed here.
  - A refused comment (blank, or from a non-member) publishes nothing.
- **Who:** the project's members minus the author, read after the commit. A super admin commenting on a project they aren't on is not a member, so they aren't told about anything either.
- **What:** a fixed sentence, "Someone commented on an AX Renewal project". It contains neither the comment's text nor the project's name, because it renders on a lock screen (ADR-025 decision 6).
- **Click behaviour: open the project** (`/ax-renewal?project=…`), the same deep link as the other two AX Renewal types. This was chosen over a dedicated "open the comments" link because:
  - the thread is project-wide, not per section, and lives in the AX Assistant column of the workspace layout. That column is on screen on every section, in thread view by default, so opening the project already shows the comment;
  - a dedicated link would add a URL parameter and a second code path in the bell for no visible difference.
  - **Accepted:** on a narrow screen the column stacks below the main content, so the reader scrolls to it.
- **Frontend:**
  - the bell renders the type as "New comment" and opens the project through the existing `onOpenProject`;
  - Settings → Notifications lists it, so it can be turned off, with the mail icon.

## 3. Consequences

- **Positive:** a comment reaches the people it's meant for without them polling the project.
- **Accepted:**
  - Every comment notifies every other member. A busy thread may be noisy; each member can turn the type off. @mentions (notify only those named) remain a possible later refinement.
  - Typing anything into the AX Assistant that isn't a command records it as a comment, so that is notified too. That is what a comment is there.

## 4. Verification

| Item | Method |
|---|---|
| A member's comment publishes exactly one event, ids only; a blank comment publishes nothing; no refused (non-member) call publishes anything | `AxRenewalMembershipTest` |
| Every member but the author told; nobody when the author is alone; only members; project target; fixed body; one failure doesn't stop the rest; a member-read failure is contained; `@Async` + `AFTER_COMMIT` | `AxRenewalCommentNotifierTest` |
| Deep link `/ax-renewal?project=…`; key and body | `NotificationTypeTest` |
| Bell wording and empty-body fallback; opening goes to the project with no lookup | `useNotifications.commentAdded.test.ts` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Comment notifications; click opens the project | ACCEPTED |
