# ADR-115: Store Files in S3, Downloaded by Presigned URL

> **Status**: PROPOSED — implemented, awaiting PM approval
> **Date**: 2026-10-16
> **Author**: AI (Claude), on direct in-session instruction
> **Approver**: pending. The product owner asked for this in-session ("reuse the current S3 configuration for the Store; presigned URLs for downloads; up to 2 GB; keep local storage for development and tests"). Not recorded as approved here (CONST-PROC-01).
> **Related ADR**: Revises ADR-108 and ADR-111 (local-disk storage becomes one of two backends). Builds on ADR-026/ADR-101 (the S3 client and presigner for avatars) and CONST-TECH-08 (S3 API, path-style only).

---

## 1. Context

The Store kept every build and logo on the backend's local disk (ADR-108, ADR-111). The deployment runs on one EC2 instance in Docker, so that disk is the container's: files are lost when the container is recreated, grow the instance's volume, and every download is streamed through the backend and nginx. The deployment already has an S3 bucket (`S3_*`) used for avatars and content images.

## 2. Decision

1. **Two storage backends behind one interface (`StoreFiles`).** `StoreFileStorage` (local disk) is unchanged in behaviour; `S3StoreFiles` is new. `StoreService` talks only to the interface. Objects use the same relative key as the local path (`{platform}/{version}/{environment}/{appId}/{file}`, `logos/{appId}.{ext}`), which is what the database already stores, so **no migration and no rewritten rows**.
2. **An explicit switch, default local.** `COC_STORE_STORAGE` = `local` (default) or `s3`. It is never inferred from `S3_*` being present: a deployment that already has S3 for avatars must not have its Store silently move away from its existing local files on upgrade. `s3` without `S3_ENDPOINT`/`S3_BUCKET` is a startup failure.
3. **The existing S3 settings are reused, not duplicated.** `S3Clients` builds the client and presigner from `app.storage` (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`), path-style, exactly as before; `AvatarStorageConfig` now calls it, behaviour unchanged. Objects share the bucket; Store keys never collide with `avatars/` or content-image keys.
4. **Credentials.** Static keys from the environment still work. If both keys are blank, the AWS default credential chain is used, which on EC2 is the **instance IAM role** — the recommended end state (no secret on the box). Avatars and content images still require the keys (their `configured()` check is unchanged), so dropping the keys is a later, separate step.
5. **Uploads stream as multipart.** Up to 2 GB (`coc.store.max-file-bytes`) is read in 8 MiB parts and sent as an S3 multipart upload while the SHA-256 is computed; at most one part is in memory. A file of one part is a single `PutObject`. The cap is enforced while reading; a failed or oversized upload aborts the multipart upload. Publishing to Production and Development uploads once and `CopyObject`s the second key.
6. **Downloads use a short-lived presigned URL.** `GET /api/v1/store/builds/{id}/download-link` returns `{url, presigned, expiresAt}`. Access is decided **first**, exactly as before (404 for a removed build, or a private app's build unless admin; a visitor with no session reaches only public apps), and only then is a 5-minute (`coc.store.download-url-ttl-seconds`) `GET` URL signed, forced to `Content-Disposition: attachment`. The response is `Cache-Control: no-store`. `/download` stays: it streams for local storage and answers `302` to the presigned URL for S3. The object's existence is checked before signing, so a live row whose file is missing is a 404, not a dead link.
7. **Frontend.** The progress-tracking download asks for the link, then fetches it — without cookies when presigned (the signature is the authorisation; the session cookie must not go to S3).
8. **Removal** deletes the object after the database commit (unchanged ordering); a missing object is logged and skipped. The bucket needs a lifecycle rule to expire incomplete multipart uploads.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Interface with local and S3 backends, explicit switch | No data move for existing deployments; tests and development stay on disk | Two implementations | Adopted |
| B | S3 only | One path | Tests and development need S3 or a fake; breaks CONST-TECH-08's "MinIO locally" goal | Not adopted |
| C | Infer S3 whenever `S3_*` is set | No new setting | Silently orphans existing local builds on upgrade | Not adopted |
| D | Stream S3 downloads through the backend | Simple; no bucket CORS | Every byte through nginx and the JVM; a 2 GB build ties up a request thread | Not adopted (PM chose presigned URLs) |
| E | Redirect `/download` to the presigned URL only | No new route | `fetch` with credentials cannot follow a cross-origin redirect to S3, which loses the progress ring | Partly: kept as a fallback for plain links |
| F | S3 `TransferManager` | Handles multipart | Needs the CRT/async client — a new dependency for one feature | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- Build files survive container recreation and no longer use the instance disk.
- Downloads go straight from S3; the backend and nginx carry no download traffic.
- The IAM-role path removes the need for long-lived keys for the Store.

### 4.2 Negative Impacts / Costs to Accept
- The bucket needs a **CORS rule** allowing `GET` from the site's origin, or the browser's download (which reads the stream to show progress) is blocked.
- The browser holds the whole build in memory while downloading (the same as before; a limit of progress-tracking `fetch`).
- A presigned URL is a bearer credential for five minutes.
- Existing local builds are not moved automatically: see the deployment guide for the one-off copy.

### 4.3 Follow-up Work
- Move avatars and content images to the instance role too, then remove the `S3_*` keys.
- nginx's 10 MB body limit blocks build uploads at the edge; `infra/nginx/templates/default.conf.template` now carries a dedicated location for them.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Single/multipart upload, exact-multiple part, size cap and abort, empty file, both environments, copy failure cleanup, stale/existing key, presigned URL (host, path, 300 s, attachment, no secret), missing object, logo magic bytes | `S3StoreFilesTest` (13) | Every build | All pass |
| Backend choice, startup failures, no-keys instance role | `StoreFilesConfigTest` (5) | Every build | All pass |
| Local backend unchanged | `StoreFileStorageTest`, `StoreServiceTest` | Every build | All pass |
| Visitor reaches the link route; private/removed → 404; `/download` redirects | `SecurityRulesTest$StorePath` | Every build | All pass |
| Link-then-fetch, no cookies to S3, expired link message | `download.test.ts` | Every build | All pass |

## 6. References
- `backend/src/main/java/com/coc/docs/store/{StoreFiles,S3StoreFiles,StoreFileStorage,StoreFileRules,StoreFilesConfig}.java`
- `backend/src/main/java/com/coc/docs/storage/S3Clients.java`
- `docs/ops/DEPLOYMENT-REQUIREMENTS.md`, `infra/README.md`
- ADR-108, ADR-111, ADR-026, ADR-101
