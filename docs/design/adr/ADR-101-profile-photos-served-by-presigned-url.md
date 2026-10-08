# ADR-101: Profile Photos Are Served by Presigned URL, Not from a Public Bucket

> **Status**: PROPOSED
> **Date**: 2026-10-08
> **Author**: AI, at the PM's request
> **Approver**: PM
> **Related ADR**: ADR-026 (self-uploaded profile photos), ADR-012 §2 (storage provider deferred), CONST-TECH-08

---

## 1. Context

ADR-026 added self-uploaded profile photos. `S3AvatarStorage.upload` stored the object and
returned `{endpoint}/{bucket}/{key}`, which was written to `account.avatar_url` and sent to the
browser as an `<img src>`.

That address only loads if **every object in the bucket is world-readable** — and a bucket with
"Block all public access" switched off is not merely readable, it is listable by anyone who finds
it. For staff photographs that is a larger exposure than the feature needs.

The provider had never actually been configured, so this had not been exercised: the first real
AWS upload was what surfaced it.

- **Related requirements**: FR-AUTH-005, NFR-SEC-PII
- **Related risks**: making a bucket public to serve an image
- **Decision pressure**: none technical — the public-bucket version works

## 2. Decision

> An uploaded photo is addressed by this API's own route, `GET /api/v1/avatars/{accountId}/{file}`,
> which verifies the account actually holds that object and redirects (302) to a **presigned S3
> URL valid for 15 minutes**. The bucket keeps "Block all public access" on. The identity
> provider's `picture` URL is passed through untouched.

### Key Choices

- **The route is unauthenticated, and that is a decision.** An `<img>` does not reliably carry the
  session cookie: the frontend and this API are different origins, and a cookie that crossed them
  would need `SameSite=None` — a worse trade than the one made here. The protection is the random
  UUID already in the object key.
- **Be honest about what that buys.** Anyone holding the URL can see the photo, exactly as with a
  public bucket. What is gained is that the bucket is not browsable, an object is never reachable
  directly, access dies when the photo is replaced or deleted, and the signature expires.
- **Nothing a client sends becomes an object key.** The key is rebuilt from a validated UUID and a
  filename matched against `^[0-9a-f-]{36}\.(png|jpg|jpeg|webp)$`, then checked against what that
  account actually holds. Without that check the route would sign a URL for any key matching the
  pattern, which is the difference between a photo route and a data leak.
- **Rewriting happens in the DTO layer, as string work.** `ApiDtos.avatarHref` turns a stored S3
  URL into the route path. Threading a storage bean through nine static factory methods to presign
  there would be a far larger change, and would sign a URL per row of every account listing whether
  or not the browser ever fetched it.
- **The redirect is cached for less than the signature's lifetime** (5 minutes against 15), so a
  browser never holds a cached redirect to an already-dead URL.
- **`account.avatar_url` still stores the S3 address.** The rewrite is at the edge, so nothing in
  the database changes and existing rows keep working.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Public bucket** (ADR-026 as built) | No code; fastest to serve | Requires public access on a bucket holding staff photographs; browsable if misconfigured | No |
| B | **Public bucket behind CloudFront** | CDN, no signing | Same exposure, plus a distribution to maintain | No |
| C | **Presigned redirect** (this ADR) | Bucket stays closed; access revocable; signatures expire | A redirect per image; the route is public | **Yes** |
| D | **Proxy the bytes through the backend** | Fully authenticated | Every avatar becomes backend traffic and memory; and the `<img>` cookie problem remains | No |

## 4. Consequences

### 4.1 Positive Impacts

- The bucket keeps "Block all public access" on.
- A leaked URL stops working when the photo changes, and expires regardless.
- Works unchanged against MinIO, which is what the path-style client exists for (ADR-012 §2).

### 4.2 Negative Impacts / Costs to Accept

- **The avatar route is public.** Unguessable, not private. Someone who obtains the URL — from a
  browser history, a shared screenshot of devtools — can load the photo until it is replaced.
- **One extra round trip per image**, and the redirect cannot be cached for long.
- **Presigning depends on the credentials remaining valid.** If they are rotated without updating
  configuration, photos stop rendering while uploads also fail — one misconfiguration, two
  symptoms.
- The `AvatarStorage` interface gained a method that only an S3 implementation can honour; the
  default returns empty so a future local-disk implementation is not forced to stub it.

### 4.3 Follow-up Work

- Serve through CloudFront with signed cookies if avatar traffic ever justifies it; that would
  also remove the per-image redirect.
- Revisit if the frontend and API ever share an origin — an authenticated route would then be
  possible without `SameSite=None`.

## 5. Verification / Monitoring

- Tests assert a stored S3 URL is rewritten and an identity-provider URL is not.
- A test asserts the rewrite is idempotent.
- A test asserts the API no longer returns the bucket address for an uploaded photo.
- The route returns 404 for a filename that does not match the expected shape, and for an object
  the named account does not hold.

## 6. References

- `ADR-026` — self-uploaded profile photos, whose storage this changes
- `backend/src/main/java/com/coc/docs/web/AvatarController.java`
- `backend/src/main/java/com/coc/docs/storage/S3AvatarStorage.java`
- `frontend/lib/account/avatarSrc.ts`
- FR-AUTH-005, NFR-SEC-PII, CONST-TECH-08

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-08 | 1.0 | Initial draft. Numbered 101 because 100 was taken by the super-admin pages decision while this was being written. | AI |
