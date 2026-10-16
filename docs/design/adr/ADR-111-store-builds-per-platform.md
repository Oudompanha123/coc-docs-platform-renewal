# ADR-111: Store Builds Return; an App Spans Platforms

> **Status**: ACCEPTED — implemented (in-session instruction)
> **Date**: 2026-10-14
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction with three reference screenshots ("Add New App", an app page with iOS / Android tabs, "Update Next Version"): *"Add App: … a popup with fields to enter the app name and upload an app icon. App Details: … navigate to a new page (e.g., /store-394). Upload Next Version: … clicking 'Next Version' should open a popup where users can upload their app file (e.g., an APK file)."* Follow-up answers in the same session: one app spans platforms, the platform coming from each file; the admin types the version; ticking both server types publishes the same file to both. Recorded here as a transcription of those instructions, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Supersedes ADR-110 (builds removed). Revises ADR-108: an app is no longer tied to one platform. ADR-108's URLs, visibility rules, logo handling, local-disk storage and its CONST-TECH-08 deviation stand.

---

## 1. Context

ADR-110 removed builds from the Store. The product owner then asked for builds back, in the shape of their reference design: "Add New App" takes a name and an icon only (no platform); the app page has a tab per platform (iOS, Android); "Update Next Version" uploads one file, with a "Server Type" of Production and/or Development and a "What's new" note of up to 1500 characters.

## 2. Decision

1. **An app spans platforms.** V85 drops `store_app.platform`. Apps, their `app_no`, names, icons and visibility are kept. An app's name is unique across the Store (409, in the service), since there is no platform left to tell two same-named apps apart.
2. **A build carries its platform, taken from its file type.** `.apk`/`.aab` Android, `.ipa` iOS, `.exe`/`.msi`/`.msix`/`.appx` Windows, `.dmg`/`.pkg` macOS. `.zip` is not accepted — it would fit two platforms. New table `store_build` (V85) — not a re-creation of V82's `store_app_release`, which V84 dropped; V82–V84 are left as they are, since any of them may already be applied.
3. **The admin types the version**, pre-filled with the next one for the file's platform (`1.2.1` → `1.2.2`; `1.0.0` for a platform's first build). At most one live build per (app, platform, version, environment): a partial unique index; the same version on another platform is fine.
4. **Server Type: Production, Development, or both.** Both stores the same file once per environment folder (hard link where the file system allows, copy otherwise), so each build owns its path and is removed on its own.
5. **Removing a build keeps its row** (`removed_at`): the history shows "Removed"; the file is deleted; the version can be uploaded again.
6. **Upload body.** `POST /api/v1/admin/store/apps/{id}/builds`, body = 4-byte big-endian length + UTF-8 JSON `{version, environments, notes, fileName}` + the file. "What's new" runs to 1500 characters, which percent-encoded Korean or Khmer would push past the request-line limit; multipart would put the file under the deployment-wide multipart limit. The file still streams to disk under `coc.store.max-file-bytes` (default 2 GiB, restored).
7. **Download** `GET /api/v1/store/builds/{id}/download` (user floor; 404 for a removed build, or a private app's build unless admin). **Remove** `DELETE /api/v1/admin/store/apps/{id}/builds/{buildId}`. Audit: `store.build_upload`, `store.build_remove` against the app.
8. **Visibility** stays as ADR-110 left it: a user sees every public app, builds or not; an app with no builds shows "No Data".
9. **UI.** Listing `/store`: tabs All / Mobile / PC — an app is under Mobile or PC when it has a live build for that kind of device — with platform chips and search; "Add App" opens the Add New App popup (icon tile, App Name, optional description, visibility). App page `/store-<n>`: App's Information (icon, name, Edit App info, Next version, Delete) and Version Control (a tab per platform with builds — iOS / Android when there are none — each listing versions highest first with Production / Development cells: download, "Removed" or "N/A", and age; expanding shows file, size, SHA-256, what's new, Remove). "Next version" opens Update Next Version (icon, app name, file + Select, detected platform, version, Server Type checkboxes, What's new with a 0/1500 counter). Production green, Development blue (ADR-104 status colours).

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | App spans platforms; platform from the file | Matches the reference; one app, one page | Name must be unique Store-wide | Adopted |
| B | Keep one platform per app | No schema change to `store_app` | Add App needs a platform field; no per-platform tabs | Not adopted (PM choice) |
| C | Read the version from the file | Exact | Parsing APK/IPA metadata on the backend; not possible for .exe/.dmg | Not adopted (PM chose typed) |
| D | Notes as a second request, or multipart | Conventional | Two requests can half-fail; multipart limit is deployment-wide | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- One app per product, with every platform's builds on one page.

### 4.2 Negative Impacts / Costs to Accept
- Builds are on local disk again: the deployment needs a persistent volume at `coc.store.root`, and nginx's `client_max_body_size 10M` (`infra/nginx/templates/default.conf.template`) must be raised for `/api/v1/admin/store/apps/*/builds` before real installers can be uploaded through it.
- Each app's former single platform is not kept (V85); none of those apps had builds after V84.

### 4.3 Follow-up Work
- The nginx upload limit above. An S3 storage option (see the earlier deployment notes) remains open.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Upload, duplicates per platform/environment, removal, visibility, audit | `StoreServiceTest` (14) | Every build | All pass |
| Disk layout, both-environment upload, overwrite refusal, size cap, platform from file type | `StoreFileStorageTest` (11) | Every build | All pass |
| Route floors; the framed upload body end to end through the controller (Korean notes); malformed headers | `SecurityRulesTest$StorePath` (9) | Every build | All pass |
| Version order, per-platform rows, next version, tabs, the upload body the browser sends | `store-api.test.ts` | Every build | All pass |
| V85 | V1–V84 then V85 on a scratch PostgreSQL 16 cluster with existing apps: apps kept, column dropped, constraints and live-unique index enforced, re-upload after removal, cascade | On change | As expected |

## 6. References
- `backend/src/main/resources/db/migration/V85__store_builds.sql`
- ADR-108, ADR-110

## Change History

| Date | Change |
|---|---|
| 2026-10-14 | Created |
