# ADR-117: Store Featured Banner — Latest App by Default, Admin Picture and Pin

> **Status**: PROPOSED — implemented, awaiting PM approval
> **Date**: 2026-10-16
> **Author**: AI (Claude), on direct in-session instruction
> **Approver**: pending. The product owner asked in-session for an App Store-style banner at the top of the Store ("the last created, uploaded or updated app should be downloadable here"), then "and admin can change banner too", and chose "both" when asked: an admin can upload a banner picture and can choose which app is featured. Not recorded as approved here (CONST-PROC-01).
> **Related ADR**: Builds on ADR-108/ADR-111 (Store apps and builds), ADR-115 (Store files on local disk or S3), ADR-101 (public picture routes).

---

## 1. Context

The Store listing opened with a heading and then the grid. The product owner wanted a featured banner first, like the App Store: one app, a wide picture, its name, and a Download button. By default it should be the app with the most recent upload or update. An admin should be able to change both the picture and which app it is.

Apps had only a square icon (`logo_path`), and nothing recorded a "featured" choice.

## 2. Decision

- **Which app**: the app an admin pinned (`store_settings.featured_app_id`, V87) when the reader can see it. Otherwise the app whose newest live, downloadable build or last edit is most recent (`featuredApp` in `lib/store/store-api.ts`). The automatic choice is computed in the browser from the list the page already loads, so no new query is needed.
- **The picture**: an optional `banner_path` / `banner_type` per app (V87), stored like the logo through `StoreFiles`. That is `banners/{appId}.{ext}`: PNG, JPEG or WebP, magic bytes checked, 5 MB. Logo and banner share one `storeImage` / `openImage` implementation, keyed by `StoreImageKind`. With no banner picture, the background is the app's icon, enlarged and blurred.
- **Routes**:
  - `PUT` / `DELETE /api/v1/admin/store/apps/{id}/banner` and `PUT /api/v1/admin/store/featured {appId|null}` sit under the admin floor.
  - `GET /api/v1/store/apps/{id}/banner` is public, like the logo.
  - `GET /api/v1/store/featured` is public. A pinned **private** app reads as `null` to anyone but an admin, so the banner never names an app the reader cannot open.
- **Single-row settings table**, not a flag on `store_app`, so there is exactly one featured app by construction. `on delete set null` returns to automatic when the pinned app is deleted.
- **Audited**: `store.banner_set`, `store.banner_remove`, `store.featured_set`.
- **Admin UI**: an "Edit banner" menu on the banner itself: add or change the picture, remove it, and a "Feature app" submenu (each app, plus "Latest upload (automatic)").

## 3. Considered Alternatives

| Option | Why not |
|---|---|
| A `featured boolean` column on `store_app` | Two rows could both be true; needs a partial unique index and a two-step update to move it. |
| Compute "latest" on the backend | The page already has every app and build; a second query adds latency for no new information. |
| A separate image service or generic media table | One more picture per app does not justify it; the logo's storage path already handles disk and S3. |

## 4. Consequences

### 4.1 Positive Impacts

- The newest app is downloadable from the top of the Store with no admin work.
- An admin can feature any app with a proper picture, and undo it in one click.

### 4.2 Negative Impacts / Costs to Accept

- Uploading or removing a banner picture bumps the app's `updated_at`, as a logo change does. On automatic mode that can move the app into the banner.
- Text over the picture is white on a dark gradient, so a very light picture is darkened at the bottom.

### 4.3 Follow-up Work

- Run the Testcontainers integration suite (V87 against real Postgres) before merging. Docker was not available when this was written.
- Optionally let admins upload the banner from "Edit App info" too.

## 5. Verification / Monitoring

- `StoreServiceTest`: banner upload, removal and audit; a no-op removal; banner deleted with its app; the pinned public and private visibility rules; unknown app 404; pin and unpin audited.
- `StoreFileStorageTest`: a banner stored beside the logo, and type-checked.
- `SecurityRulesTest`: the banner and featured routes are public; only an admin changes them.
- `store-api.test.ts`: the automatic choice, a pinned app winning, and the fallback when the pinned app is not visible.

## 6. References

- `backend/src/main/resources/db/migration/V87__store_banner_and_featured.sql`
- `backend/.../store/StoreImageKind.java`, `StoreService.java`, `web/AdminStoreFeaturedController.java`
- `frontend/components/store/FeaturedAppBanner.tsx`, `frontend/lib/store/store-api.ts`

## Change History

| Date | Change |
|---|---|
| 2026-10-16 | Created; implemented. |
