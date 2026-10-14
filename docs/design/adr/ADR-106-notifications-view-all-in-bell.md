# ADR-106: "View All Notifications" Expands the Bell with Infinite Scroll

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-09
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"When the user clicks 'View All Notifications', do not navigate to a separate Notifications page. Display all notifications in the existing notification panel/dropdown. Initially show the latest 10 … automatically load the next 10 … Use backend pagination."* This replaced an earlier in-session choice of a separate `/notifications` page, which was built, never committed, and removed. Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Builds on ADR-034 (stored notifications, read state on the server) and ADR-100 (registration rows are super_admin only).

---

## 1. Context

The admin Topbar's bell showed a "View all" link only when the list held a pending registration, and the link went to `/users-roles?tab=pending`. Nothing showed the whole inbox. `GET /api/v1/notifications/inbox` returns the newest 30 rows plus every unread row. That suits the dropdown, but it cannot page through older history.

## 2. Decision

1. **New endpoint** `GET /api/v1/notifications/inbox/history?limit=&before=&beforeId=&unread=`, which returns `{ items, hasMore, unreadCount }`. It sits under the existing `/api/v1/notifications/inbox/**` rule, so any signed-in account can call it, and it is scoped to the caller in the SQL.
2. **Keyset paging on `(created_at, id)`**, not offset paging. The client sends the last row it holds. A notification that arrives while someone is scrolling then neither repeats a row nor skips one. `id` breaks ties between rows with the same timestamp. One extra row is read to answer `hasMore`, so no count query is needed. `limit` is clamped to 1–100.
3. **Filters run in the query.** The Unread tab and the ADR-100 exclusion of registration rows are part of the `where` clause, so a page is never short because rows were dropped after fetching.
4. **The bell expands in place.** The collapsed panel shows the latest 10 rows of the current tab. When there is more to see, a "View all notifications" button appears. It is a button, not a link, so the person stays on their page. Clicking it switches the list to `useNotificationHistory`: the first 10 rows from the endpoint, then 10 more each time the list is scrolled to within a row of its bottom.
5. **Requests are guarded.** One request is in flight at a time, rows are de-duplicated by id, and an answer for a list that was closed or re-filtered is dropped. A spinner shows while a page loads. "You're all caught up." shows once `hasMore` is false.
6. **Existing behaviour is kept.** Rows keep the same design, read/unread styling and click behaviour, and open the same dialogs. Clicking an older row marks it read on the server, then refreshes the bell's own list and badge. "Read all" also clears the expanded rows. Reopening the bell collapses it to the latest 10 again.

## 3. Alternatives

| Alternative | Why not |
|---|---|
| A separate `/notifications` page | Built first, then replaced at the product owner's request. People should stay on their current page. |
| Add `before` to the existing inbox endpoint | That endpoint merges "newest N" with "every unread" for the bell. Paging that merged list has no stable order. |
| Offset paging (`?page=2`) | New rows shift every offset, so infinite scroll would repeat rows. |
| Load the whole inbox once | Explicitly ruled out ("fetch additional notifications on demand"). It also grows with retention. |

## 4. Consequences

- History covers only what retention keeps. `deleteOlderThan` still prunes old rows, because the bell is not an archive (`audit_log` is).
- The expanded list does not live-update. A new notification appears in the collapsed list, which is polled and streamed, and in the expanded list the next time it is opened.
- Infinite scroll uses the list's own `onScroll`, with no `IntersectionObserver`. Ten rows overflow the panel's `max-h-80`, so the first scroll is always possible.
- The AX Renewal app's bell (`AxRenewalNotificationsBell`) and the member header are unchanged.
- `findPage`'s SQL is covered by `NotificationRepositoryPageIntegrationTest` (Testcontainers), which needs Docker and is skipped without it.

## 5. Files

`backend/.../notify/NotificationRepository.java` (`findPage`), `notify/NotificationInboxService.java` (`pageFor`, `Page`), `web/NotificationInboxController.java` (`/history`), `web/ApiDtos.java` (`NotificationPageResponse`); `frontend/components/layout/Topbar.tsx`, `lib/notify/useNotificationHistory.ts`, `lib/notify/inbox-api.ts` (`fetchInboxPage`), `lib/notify/useNotifications.ts` (`toNotificationItem` exported).
