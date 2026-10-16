# ADR-110: The Store's Build Feature Is Removed

> **Status**: **SUPERSEDED by ADR-111** (builds returned, per platform, the same day). V84 stays: it may already be applied.
> **Date**: 2026-10-14
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user (product owner), in-session task instruction: *"Please completely remove the Build feature from the Store functionality across the entire codebase, including the frontend, backend APIs, services, database schema, migrations, and tests … This is a complete removal of the Build feature from the frontend, backend API, and database—not a UI-only change."* Recorded here as a transcription of that instruction, not a self-approval (`CONST-PROC-01`, HARNESS-PROCESS-STANDARD §4.8 CQ3).
> **Related ADR**: Supersedes ADR-108 decisions 2, 3, 6, 7, 11 and 12 and the build parts of 1, 4, 5, 8, 9 and 10. ADR-108's app model, URLs (`/store`, `/store-<n>`), visibility rules, logo handling and audit of app changes stand.

---

## 1. Context

ADR-108 built the Store around **builds**: install files uploaded per app, version and environment (Production / Development), downloaded by users, kept in a version history and removable ("Removed", V83). The product owner decided the Store should not hold builds at all.

## 2. Decision

The build feature is removed from every layer. An app is now its **name, logo, description, platform and visibility** — nothing else.

| Layer | Removed | Kept |
|---|---|---|
| Database | `store_app_release` (V84 drops it, with its primary key, indexes `store_app_release_app_idx` and `store_app_release_live_key`, five check constraints, and foreign keys to `store_app` and `account`) | `store_app` unchanged, every row and `app_no` included |
| Migrations | — (V82 and V83 are **not** edited or deleted: either may already be applied, and Flyway refuses an applied migration whose content changed or whose file is missing) | V82, V83; new V84 |
| API | `GET /api/v1/store/releases/{id}/download`, `POST /api/v1/admin/store/apps/{id}/releases`, `DELETE /api/v1/admin/store/apps/{id}/releases/{releaseId}`; `releases` in every app response | App list, app page by number, logo, admin create / edit / delete / logo |
| Backend code | `StoreRelease`, `StoreEnvironment`; build storage, versioning, file-name and size validation in `StoreFileStorage`; build queries in `StoreRepository`; `StorePlatform`'s install-file extensions; audit actions `store.release_upload` / `store.release_delete`; config `coc.store.max-file-bytes` | Logo storage under `coc.store.root`; one-app-per-name-per-platform (409); audit of app create / update / delete |
| Frontend | `ReleaseFields`, download buttons, environment badges, version history, latest-per-environment, upload form and progress, "New version" link, `?upload=1`, file-name → name/version suggestion, and their helpers and types | Listing (tabs, platform filter, search), app page, add / edit / delete app, logo, visibility |

**Visibility changes as a consequence.** A user used to see a public app only if it had at least one build; with no builds that rule would hide everything, so a user now sees **every public app**. Private apps stay admin-only, on the list and on the app page (404).

**Audit history is kept.** `audit_log` is append-only; rows already written as `store.release_upload` / `store.release_delete` stay, readable as their raw action text. Only the constants that wrote them are gone.

**Files on disk are not deleted by the code change.** A migration does not reach the file system, and removing someone's uploaded installers is not something to do implicitly. Build files that were uploaded sit under the store root as `{platform}/{version}/{environment}/{app id}/{file}`; nothing reads them any more and they can be deleted by hand. Logos (`logos/{app id}.{ext}`) are still in use.

The listing and app pages were also moved onto the design-system tokens (ADR-104) — neutral primary, `surface-border`, `muted-surface` — as the build UI they carried was taken out.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Remove builds from every layer; drop the table in a new migration | What was asked; no dead schema or endpoints | Build metadata in the table is lost (installers on disk remain until deleted by hand) | Adopted |
| B | Hide the build UI only | Reversible | Explicitly ruled out ("not a UI-only change"); leaves live endpoints and schema | Not adopted |
| C | Delete V82/V83 instead of adding V84 | Shorter history | Breaks startup on any database that already applied them | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- No install files pass through the backend: the nginx upload-size and persistent-volume concerns ADR-108 raised for builds no longer apply. The only Store files are logos (2 MB each).

### 4.2 Negative Impacts / Costs to Accept
- The Store no longer offers downloads. Restoring builds would be a new feature with a new migration.
- Logos still live on local disk under `coc.store.root`, so ADR-108's CONST-TECH-08 deviation remains, for logos only.

### 4.3 Follow-up Work
- Delete leftover build files under the store root by hand once no one needs them.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Build routes gone for every role | `SecurityRulesTest$StorePath.the_build_routes_are_gone` (404 as admin) | Every build | All pass |
| Remaining Store behaviour | `StoreServiceTest` (13), `StoreFileStorageTest` (6), `store-api.test.ts` | Every build | All pass |
| V84 | V1–V83 applied with sample apps, builds and a build audit row on a scratch PostgreSQL 16 cluster, then V84: table, 3 indexes, 9 constraints gone; `store_app` rows, constraints and the audit row intact | On change | As expected |

## 6. References
- `backend/src/main/resources/db/migration/V84__drop_store_builds.sql`
- ADR-108

## Change History

| Date | Change |
|---|---|
| 2026-10-14 | Created |
