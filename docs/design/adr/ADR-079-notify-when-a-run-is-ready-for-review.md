# ADR-079: Notify Project Members When an Implementation Run Is Ready for Review

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-01
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("please proceed with the implementation-run-ready notification feature as proposed") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: The same delivery as [ADR-075](ADR-075-notify-when-added-to-a-project.md) (member added), on [ADR-034](ADR-034-notifications-as-rows.md) (the bell's rows) and [ADR-041](ADR-041-notification-preferences.md) (opt-outs). Recipients are [ADR-069](ADR-069-ax-renewal-project-members.md)'s members. Triggered by [ADR-073](ADR-073-recover-interrupted-implementation-runs.md)'s compare-and-set into `awaiting_review`.

---

## 1. Context

Generating an implementation run takes minutes. The run then waits at `awaiting_review` until somebody approves or rejects it. While it waits, the project can start no other run and cannot be deleted. Nothing told anyone it was there: the starter had to keep the tab open, and a Reviewer or Lead found out only by opening the project.

## 2. Decision

> One new notification type, `ax-renewal.run-ready`, sent to the project's members when a run reaches `awaiting_review`. It uses the existing feed, opt-outs, stream and push. No migration and no new endpoint.

- **When:** only once the run is really there.
  - **A generated run** is announced by `AxRenewalImplementationRunner`, after its `generating → awaiting_review` compare-and-set succeeds.
  - **Never announced:** a run that failed, was cancelled, or was closed while it generated, including one whose result was discarded.
  - **A replay** ([ADR-056](ADR-056-rebuild-replays-the-applied-result.md)) is created directly in `awaiting_review` and is announced from `replayAppliedRun`.
- **Who:** every member of the project, read after the commit so that a member removed meanwhile is not told.
  - **The starter of a generated run is included**, because they have been waiting minutes for it.
  - **The starter of a replay is not included.** They clicked it and are looking at it already.
  - **No role-based or super-admin recipients**: the member list is the audience.
- **What:** a fixed sentence, "An AX Renewal implementation run is ready for review", with no project name, because it renders on a lock screen (ADR-025 decision 6). The target is the project, so a click opens `/ax-renewal?project=…`.
- **How:**
  - an `AxRenewalRunReadyEvent(projectId, runId, skipAccountId)`, handled by `AxRenewalRunReadyNotifier`, which is `@Async` and `@TransactionalEventListener(AFTER_COMMIT, fallbackExecution = true)`;
  - **the fallback is required**: the runner's transition is one auto-committed update on its own thread with no transaction, and without the fallback Spring silently drops an event published there;
  - **the replay's event** is published inside `startImplementation`'s transaction and still waits for its commit;
  - **failures stay contained**: one recipient's failed delivery is logged and does not stop the others, and nothing is rethrown.
- **Frontend:**
  - the bell renders the type as "Ready for review" and opens the project through the existing `onOpenProject`;
  - Settings → Notifications lists it (the opt-out comes from `NotificationType.values()`) with a check icon.

## 3. Consequences

- **Positive:** a run waiting for review is announced to the people who can act on it, and the starter can leave the tab.
- **Accepted:**
  - A member who cannot approve (below the approve floor) is told as well. They can still open and read the run, and filtering by role would make the audience depend on more than membership.
  - A busy project's members get one notification per run. Anyone who doesn't want them can opt out per type.

## 4. Verification

| Item | Method |
|---|---|
| Announced after a successful `generating → awaiting_review`, starter included; never for a discarded result or a failed run | `AxRenewalImplementationRunnerTest` |
| A replay announces itself, skipping its actor; a fresh generate does not announce at start | `AxRenewalRebuildReplayTest` |
| Every member told; the skipped one is not; only members; project target; fixed body; one failure doesn't stop the rest; a member-read failure is contained; `@Async`, `AFTER_COMMIT`, `fallbackExecution` | `AxRenewalRunReadyNotifierTest` |
| Deep link `/ax-renewal?project=…`; key and body | `NotificationTypeTest` |
| Bell wording and empty-body fallback; opening goes to the project with no lookup | `useNotifications.runReady.test.ts` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-01 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-01 | User (in-session, direct instruction) | Implementation-run-ready notification, as proposed | ACCEPTED |
