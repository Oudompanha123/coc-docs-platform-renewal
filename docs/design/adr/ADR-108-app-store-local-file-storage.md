# ADR-108: App Store Page with Builds Stored on the Backend's Local Disk

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-14
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"Create a Store page at /store-1 … Support Android, iOS, Windows, and macOS apps, organized into Mobile and PC tabs. Allow admins to add apps with a name, logo, platform, version, environment (Production or Development), download file, and public/private status. Store files in local folders organized by platform, version, and environment. Let users view and download only public apps, with separate Production and Development download options."* Revised by a second in-session instruction (2026-10-14): *"Rename the database migration from V81__app_store.sql to V82__app_store.sql … Change the Store listing page URL from /store-1 to /store. Use dynamic URLs for app details based on each app's ID: /store-1, /store-2, /store-3 … When an admin adds an app, use the app name as the display name. For example, COC-Workbench-Setup-1.2.1.exe should appear as the app name."* Recorded here as a transcription of those instructions, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Departs from ADR-012 §2 / `CONST-TECH-08` (object storage through the S3 API) for this one feature — see §4.2. Reuses ADR-011 (single enforcement point in `SecurityConfig`) and ADR-101 (public image route).

---

## 1. Context

The team ships Android, iOS, Windows and macOS builds and had no place inside the platform to hand them out. Members land on `/home`; the request was a Store page reachable from there, with admins managing apps and builds and everyone else downloading the public ones.

The instruction names local folders organised by platform, version and environment as the storage. Every other file in this product (avatars, content images) goes to S3-compatible object storage under `CONST-TECH-08`.

## 2. Decision

1. **Two tables (V82 — renumbered from V81, which another change took).** `store_app` (an identity `app_no` for the page URL, name, description, platform, public/private, logo) and `store_app_release` (version, environment, notes, file name, relative path, size, SHA-256). At most one release per (app, version, environment); a duplicate upload is refused with 409 rather than replacing a file someone may already have.
2. **Files on local disk** under `coc.store.root` (default `store-files`, relative to the working directory):
   `{platform}/{version}/{environment}/{app id}/{file name}` for builds and `logos/{app id}.{png|jpg|webp}` for logos. The app-id level stops two apps on the same platform and version from sharing a folder. The database stores the path relative to the root, so the root can move.
3. **Uploads are the raw request body**, not multipart, with metadata in the query string. The body streams to a temp file in the target folder (with the SHA-256 computed on the way) and is moved into place only after the checks pass. This bypasses the deployment-wide multipart limit, which is sized for avatars. The Store's own cap is `coc.store.max-file-bytes` (default 2 GiB → 413). Release notes are capped at 500 characters to keep the request line short.
4. **Every path is built server-side from validated parts.** Versions must match `^[0-9A-Za-z]([0-9A-Za-z._+-]{0,62}[0-9A-Za-z])?$` (in Java and as a DB check). File names are reduced to one safe name. `StoreFileStorage.resolve` refuses anything that normalises outside the root. Each platform accepts only its install extensions (`.apk/.aab`, `.ipa`, `.exe/.msi/.msix/.appx/.zip`, `.dmg/.pkg/.zip`).
5. **Access.** `GET /api/v1/store/**` sits at the `user` floor. The service lists public apps that have at least one build, serves one app's page (`GET /api/v1/store/apps/{number}`) under the same rule — 404 for a private app or one with no builds, so a number cannot be probed — and answers 404 for a private app's build unless the caller is an admin. Writes go under `/api/v1/admin/store/apps` at the existing admin floor. Logos (`GET /api/v1/store/apps/*/logo`) are public for the ADR-101 `<img>` reason. They are raster only, with the type checked against the magic bytes, and no SVG.
6. **Downloads** are always `Content-Disposition: attachment` (APKs are labelled `application/vnd.android.package-archive` so Android will install them) with `no-store`, served as plain links so the session cookie rides on the top-level navigation.
7. **Order, not a shared transaction, keeps disk and database in step.** A file is written before its row is inserted and deleted after its row is deleted. A failure in between leaves an unreferenced file, never a download button pointing at nothing.
8. **Audit.** `store.app_create/app_update/app_delete/release_upload/release_delete` against target `store_app`, with the version, environment, size and hash in the detail.
9. **UI and URLs.** The listing is `/store`; each app has its own page at `/store-<app_no>` (`/store-1`, `/store-2`, ...). A Next.js segment cannot be half literal, half dynamic, and a bare top-level `[x]` would collide with `(shell)/[productKey]`, so the page lives at `app/(member)/store/[number]` and `middleware.ts` **rewrites** `/store-<n>` to it before any product-key lookup (the URL stays `/store-<n>`). The internal `/store/<n>` 308-redirects to `/store-<n>`, so each app has one address. `app_no` is used rather than the uuid because it is readable; it is never reused, and the public logo route keeps the uuid so logos cannot be found by counting. Both pages sit in the member route group (admins, users and ADR-090 staff roles). The listing has Mobile/PC tabs, platform chips, search and cards with separate Production and Development download buttons that link to the app page. The app page has its details, the latest build per environment with a download button each, and the full version history. Admins see private apps too, add apps on the listing (choosing the install file fills the name with the file name exactly as uploaded, e.g. `COC-Workbench-Setup-1.2.1.exe`, and the version with `1.2.1`, both editable), and upload, delete or edit on the app page. "Store" is linked from the `/home` header nav and from the footer, which is how phones reach it because the header nav is hidden below `md`. `store` and every `store-<digits>` key are reserved as product keys on both sides; `store-front` and the like stay available.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Local disk, raw-body streaming upload | What was asked for; no storage credentials needed; streams large files without buffering | Not portable across instances; departs from CONST-TECH-08 | Adopted |
| B | S3-compatible object storage, same folder layout as keys | Satisfies CONST-TECH-08; survives redeploys and scales out | Contradicts the explicit instruction; needs the (deferred) storage provider configured before the feature works at all | Not adopted |
| C | Multipart upload | Single request for metadata + file | Bound by the deployment-wide multipart limit set for avatars; raising it widens every multipart route | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- Works on a developer machine and any single-instance deployment with no extra configuration.
- Large installers stream to disk, with a SHA-256 recorded for each build and shown in the UI.

### 4.2 Negative Impacts / Costs to Accept
- **Departure from `CONST-TECH-08` for this feature. The PM should confirm or reverse it.** Files live on one machine's disk: a container redeploy without a persistent volume loses them, and more than one backend instance would each see different files. Because hosting is still `[DEFERRED]`, the deployment must mount a persistent volume at `coc.store.root` or this feature must move to option B.
- Reverse proxies in front of the backend (nginx `client_max_body_size`, etc.) must allow request bodies as large as the biggest build.
- Backups of the database no longer cover everything the Store serves; the store root needs its own backup.

### 4.3 Follow-up Work
- If hosting lands on a multi-instance or ephemeral platform, put `StoreFileStorage` behind an interface with an S3 implementation, keeping the same relative keys.
- Add Testcontainers coverage for `StoreService` (upload → list → download → delete) when Docker is available.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Path safety, size cap, logo sniffing, cleanup | `StoreFileStorageTest` (9 cases) | Every build | All pass |
| Route floors | `SecurityRulesTest$StorePath` (6 cases) | Every build | All pass |
| App page visibility (user vs admin, private, no builds) | `StoreServiceTest` (5 cases) | Every build | All pass |
| `/store-<n>` rewrite, `/store/<n>` redirect, no product-key collision | `middleware.test.ts` Store cases; `NavServiceTest.refusesStoreRoutes` | Every build | All pass |
| Schema constraints | V82 applied to a scratch PostgreSQL 16 cluster; duplicate/invalid rows rejected, cascade verified | On change | All rejected as expected |

## 6. References
- `backend/src/main/resources/db/migration/V82__app_store.sql`
- `backend/src/main/java/com/coc/docs/store/*`, `web/StoreController.java`, `web/AdminStoreController.java`
- `frontend/app/(member)/store/page.tsx`, `frontend/app/(member)/store/[number]/page.tsx`, `frontend/middleware.ts`, `frontend/components/store/*`, `frontend/lib/store/store-api.ts`

## Change History

| Date | Change |
|---|---|
| 2026-10-14 | Created |
| 2026-10-14 | Migration renumbered V81 → V82; listing moved to `/store`, app pages at `/store-<app_no>` via middleware rewrite; detail dialog became a page; Add app fills name/version from the install file name |
