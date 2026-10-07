# ADR-098: Admin-Managed Announcements, Delivered Through the Notification Bell

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-07
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"Implement an Announcement Management feature under the Administration sidebar, allowing Admins to create, publish, edit, delete, and manage announcements that will be displayed as notifications on the User Site."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Extends ADR-034 (stored per-recipient notifications) and ADR-041 (per-type opt-outs). Follows ADR-011 (one enforcement point in `SecurityConfig`) and ADR-025 decision 6 (nothing identifying on a lock screen). Borrows ADR-003's optimistic locking, not its draft/published row split.

---

## 1. Context

Admins had no way to tell every member something (maintenance, a new feature, a policy change) short of email. The user site already has a bell backed by the `notification` table (ADR-034), with read state, live updates over the stream and optional browser push.

The bell alone cannot hold an announcement:

- a `notification` row is a per-recipient copy, so an edit after publishing would need rewriting in every inbox, and a withdrawn announcement would linger in all of them;
- `notification` rows are purged after a retention window, but an admin needs the announcement list to outlive that.

## 2. Decision

1. **Storage** — `V69__announcement.sql` adds one table, `announcement`: `title` (≤150), `body` (plain text, ≤5000), `category` (`info` / `update` / `maintenance` / `important`), `status` (`draft` / `published` / `archived`), optional `expires_at`, `version_no`, and who/when for create, update and publish. It is one row per announcement, not ADR-003's draft and published rows: announcements are short-lived, have no history worth browsing, and an edit to a live one is meant to apply at once. **Expired is derived** (`published` and `expires_at <= now()`), never stored, so nothing has to run when one lapses.
2. **Lifecycle** — create → *draft* (nobody notified) → publish → *published* → unpublish → *archived* → publish again. Delete is allowed in any state. Edits are allowed in any state and require the `versionNo` the editor loaded; a stale one is a 409. Publish and unpublish are conditional updates (`where status in (...)`), so two admins publishing at once give one broadcast and one 409.
3. **Delivery** — publishing stores one `announcement.published` notification (new `NotificationType.ANNOUNCEMENT_PUBLISHED`) for every active, non-deactivated account except the publisher. ADR-041 opt-outs apply, and the type appears in Settings → Notifications like every other. The row's `target_id` is the announcement id and its payload carries the title for the bell. The **push carries only the fixed sentence "There is a new announcement"**, never the title (ADR-025 decision 6). The deep link is `/home?announcement=<id>`.
4. **The bell row is a pointer, kept in step** — editing a published announcement rewrites the title on every copy (read state untouched); unpublishing or deleting removes every copy. Opening a bell row fetches the current announcement; a withdrawn one shows "This announcement is no longer available."
5. **API and authorization** (ADR-011, enforced in `SecurityConfig` only):
   - `/api/v1/admin/announcements` (`GET` list/one, `POST`, `PUT /{id}`, `POST /{id}/publish`, `POST /{id}/unpublish`, `DELETE /{id}`): the existing `/api/v1/admin/**` **admin** floor. Writing an announcement is editorial work, like publishing a page.
   - `GET /api/v1/announcements` and `/{id}`: **user** floor. They return only published, unexpired announcements. Drafts, archived, expired and unknown ids are all the same 404, and readers never see status, version or editor names.
6. **Audit** — `announcement.create|update|publish|unpublish|delete`, target type `announcement`, with the title in the detail (and the recipient count on publish), so a deleted announcement is still accounted for. Each has an activity-feed sentence.
7. **UI** — Administration → **Announcements** (`/announcements`, admin and super_admin): a list with Live / Drafts / Expired / Unpublished filters and search; a create/edit dialog with "Save draft" and "Save & publish"; and confirmation dialogs for publish, unpublish and delete that say what happens to members' bells. On the user site (and in the admin topbar), announcement rows show a megaphone and open `AnnouncementModal`. The body renders as plain text with line breaks kept, never as HTML.

## 3. Consequences

- One new table and one index on `notification (type, target_id)`. No existing table changes shape.
- Publishing writes one row per active account, inside the publish transaction. That is fine at this team's size (tens of accounts). At thousands it would want a batched insert or fan-out on read.
- Republishing an archived announcement notifies everyone again. Its bell rows were removed when it was unpublished, so it is news again.
- The publisher gets no bell row for their own announcement, the same rule the AX Renewal notifications follow.
- There is no scheduled publishing: an announcement goes out when an admin presses Publish. `expires_at` covers the "take it down later" half without a job.
