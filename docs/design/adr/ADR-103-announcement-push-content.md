# ADR-103: Announcement Pushes Carry Their Type, Title and Text

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-08
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"When posting an announcement, please include the logo and detailed announcement content in the push notification. And add an Announcement Type field with these options: Information, Update, Maintenance, and Important."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Revises ADR-098 decision 3 (the push carried only "There is a new announcement"). Narrows ADR-025 decision 6 (nothing identifying on a lock screen) for this one type. Builds on ADR-102 (Markdown bodies).

---

## 1. Context

ADR-098 made an announcement's push say only "There is a new announcement", with the title in the bell. That followed ADR-025 decision 6: a push renders on a lock screen, so it carries no names or details. The product owner wants the push itself to show the announcement and the logo, so members see what it is about without opening the site.

ADR-025's rule exists for notifications about a person or an account: who registered, which device signed in, which project you were added to. An announcement is different. It is written by the company for every member at once, to be read. Nothing in it is about the reader.

## 2. Decision

1. **The push banner** for `announcement.published` is built by `AnnouncementNotifier.banner`:
   - **title**: `<Type> · <announcement title>`, for example "Maintenance · System maintenance on Friday". The type names match the editor's (`info` → Information, `update` → Update, `maintenance` → Maintenance, `important` → Important).
   - **body**: the announcement's text with its Markdown removed (`AnnouncementText.plainText`), cut to 240 characters at a word with "…" (`AnnouncementText.BANNER_EXCERPT_LENGTH`).
   - **image**: none. The logo mark, `/notification-icon.png`, is the banner's icon. A first version also showed the full logo as the banner's large picture; the product owner had it removed, because it took over the top of the banner and pushed the announcement down.
2. **Every other type is unchanged.** It still pushes its fixed title and sentence. `PushSender.sendBanner` and the five-argument `NotificationService.notifyActiveAccounts` are opt-in; only the announcement notifier passes a `PushBanner`.
3. **All three banner paths show the same thing:** the service worker's background banner, the open-tab FCM handler (`lib/notify/push.ts`), and the banner an open tab raises from its inbox (`bannerFor` in `lib/notify/useNotifications.ts`). For the last one, the excerpt is also stored in the bell row's payload (`excerpt`). Editing a live announcement rewrites it on every copy, as the title and type already were.
3a. **One banner tag per announcement** (`announcement.published:<id>`), sent as the push's `tag` data and used by all three paths. Every announcement used to share the type's tag. A browser replaces a notification with the same tag without showing it, and Windows keeps old notifications in its Notification Center, so after the first announcement no later one popped up. The background and foreground copies of one announcement still share a tag and collapse into one banner. Other types keep the type as their tag.
4. **Announcement Type**: the four types already existed (ADR-098's `category`). The editor's field is now labelled "Announcement Type" and the admin list's column "Type". The stored values and API are unchanged.

## 3. Consequences

- Announcement content appears on lock screens and in notification centres. Admins should write announcements as if they may be read there, which matches how they are already distributed.
- Markdown is flattened server-side by a small Java mirror of the frontend's plain-text function. The two must stay in step for the same syntax. If they drift, the worst case is a stray marker in a banner, never markup: the banner is plain text on every platform.
- Covered by `AnnouncementTextTest`, `AnnouncementNotifierTest`, `NotificationServiceTest` (a caller's banner is sent as given), `AnnouncementServiceTest` (excerpt kept in step), `lib/notify/bannerFor.test.ts` and `AnnouncementFields.test.tsx`.
