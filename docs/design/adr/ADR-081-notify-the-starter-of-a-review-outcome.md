# ADR-081: Tell a Run's Starter How It Was Reviewed

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("please proceed with the Run Review Outcome Notification as described, including the backend, frontend, and tests") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Closes the loop [ADR-079](ADR-079-notify-when-a-run-is-ready-for-review.md) opens. The same delivery as [ADR-075](ADR-075-notify-when-added-to-a-project.md) and [ADR-080](ADR-080-notify-members-of-new-comments.md), on [ADR-034](ADR-034-notifications-as-rows.md) and [ADR-041](ADR-041-notification-preferences.md). Approve and Reject are [ADR-044](ADR-044-generate-and-apply-code-changes.md)'s.

---

## 1. Context

Since ADR-079, the team hears when a run is ready for review. Whoever started the run was never told the outcome: whether it was approved and applied, or rejected and needs another attempt. They had to keep reopening the project to find out.

## 2. Decision

> One new notification type, `ax-renewal.run-reviewed`, sent to the run's starter when somebody else approves or rejects it. Its body states the outcome. It uses the existing feed, opt-outs, stream and push. No migration and no new endpoint.

- **When:** `approveImplementation` publishes `AxRenewalRunReviewedEvent(projectId, runId, startedBy, reviewedBy, approved = true)` once the changes are written and the run is `applied`. `rejectImplementation` publishes `approved = false` once the run is `rejected`.
  - Nothing is published for an approve or reject that is refused (the run is not `awaiting_review`, or the destination is not set or not a filesystem path) or for an approve that fails to apply.
  - `AxRenewalRunReviewedNotifier` handles the event `@Async`, `AFTER_COMMIT`. Both actions are transactional, so a rollback tells nobody, and ADR-079's `fallbackExecution` isn't needed.
- **Who:** the starter (`startedBy`) only, and only when:
  - somebody else made the decision — nobody is told about their own;
  - the starter is still a member of the project, checked after the commit;
  - the starter is known (a null `startedBy` tells nobody).
- **What:** one type, so Settings has one opt-out, with one of two fixed sentences as the body:
  - "Your AX Renewal implementation run was approved and applied"
  - "Your AX Renewal implementation run was rejected"

  The body is replaced at send time, as `NEW_DEVICE_SIGN_IN` already does, because "reviewed" alone doesn't say whether anything is left to do. Neither the project's name nor the reviewer's goes on the lock screen (ADR-025 decision 6). The type's default body, "…was reviewed", is only a fallback for a row without one.
- **Click:** opens the project (`/ax-renewal?project=…`), where the run history (ADR-078) shows who reviewed it and when.
- **Frontend:**
  - the bell renders the type as "Run reviewed", with the stored outcome as its detail, and opens the project through the existing `onOpenProject`;
  - Settings → Notifications lists it, so it can be turned off.

## 3. Consequences

- **Positive:** the starter learns the outcome without polling, and a rejection prompts the next attempt.
- **Accepted:**
  - A revert (ADR-062) is not announced. It undoes an applied run rather than reviewing one; it could become a third outcome later if wanted.
  - A failed apply is not announced either. The reviewer sees that error on their own screen, and the run's status shows it.

## 4. Verification

| Item | Method |
|---|---|
| Approve publishes `approved = true` once applied, with starter and reviewer; reject publishes `false`; a failed apply and a refused approve or reject publish nothing | `AxRenewalRunReviewedEventTest` |
| The starter is told the right sentence for each outcome; only the starter; never for their own decision, a starter who has left, or an unknown starter; project target; no project or reviewer name; failures are contained; `@Async` + `AFTER_COMMIT` | `AxRenewalRunReviewedNotifierTest` |
| Deep link `/ax-renewal?project=…`; key, default body and both outcome sentences | `NotificationTypeTest` |
| Bell title and outcome detail, rejection included, and the empty-body fallback; opening goes to the project with no lookup | `useNotifications.runReviewed.test.ts` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Run review outcome notification, as described | ACCEPTED |
