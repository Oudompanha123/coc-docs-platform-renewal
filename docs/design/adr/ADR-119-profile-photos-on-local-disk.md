# ADR-119: Profile Photos on the Backend's Disk When No Object Storage Is Configured

> **Status**: PROPOSED — implemented, awaiting PM approval
> **Date**: 2026-11-14
> **Author**: AI (Claude), on direct in-session instruction
> **Approver**: pending. A developer, seeing "Photo upload is not available on this deployment yet." on a deployment with no S3 settings, asked for the profile photo upload to work "like I told" for the AX Renewal source (ADR-118): the file in `file.server-path`, its name as text in the column, the request a `PATCH`. Not recorded as approved here (CONST-PROC-01).
> **Related ADR**: Extends ADR-026 (self-uploaded photo) and ADR-101 (photo route). Follows ADR-118. Departs from CONST-TECH-08 in the same way ADR-118 does.

---

## 1. Context

`AvatarStorage` had one implementation, S3. A deployment with no `app.storage` settings registered none, and the upload answered 400. `AvatarStorage`'s own Javadoc already anticipated "a local-disk one".

## 2. Decision

- **`LocalAvatarStorage`**, used by `AvatarStorageConfig` only when object storage is **not** configured and `file.server-path` is. S3 still wins when both are set, so a deployment whose photos are in a bucket does not silently move.
- **Stored value**: `account.avatar_url` holds the file **name** only (`<uuid>.png|jpg|webp`), chosen by the server. No schema change — the column is already text.
- **Same validation as S3**: 2 MB, PNG/JPEG/WebP, bytes must decode as an image.
- **Serving**: `GET /api/v1/image/{fileName}` (`ImageController`), public for the reason ADR-101 gives. Only the exact file-name shape the uploader writes is looked up. `ApiDtos.avatarHref` maps a stored name to that path; the frontend's `avatarSrc` already prefixes `/api/` paths with the backend URL.
- **Method**: the web app sends `PATCH /api/v1/auth/me/avatar` with `FormData`. `POST` is still accepted so a frontend deployed earlier keeps working.

## 3. Considered Alternatives

| | Option | For | Against | |
|---|---|---|---|---|
| A | Local implementation behind the existing interface, S3 preferred | No change for S3 deployments; nothing else in `SessionService` changes | Local disk (see §4) | Adopted |
| B | Replace S3 with local disk | One path | Breaks deployments whose photos are in a bucket | Not adopted |
| C | Store a full URL (`base-url` + name) in the column | Nothing to map on read | A changed host or port would break every stored photo | Not adopted |

## 4. Consequences

- **Departure from CONST-TECH-08**, as ADR-118: on a host whose disk is recreated on deploy, uploaded photos are lost and the account shows initials until the next upload. Needs the PM's decision, or a mounted volume, before production use.
- A photo is readable by anyone holding its URL, as under ADR-101; unlike ADR-101 the URL does not expire, but it stops working when the photo is replaced or removed.
- A few responses pass `avatar_url` through without `avatarHref` (`AccountSummary`, the Claude Usage scan log). They already returned a raw S3 URL in S3 mode; in local mode they return a bare file name, which a browser cannot load.
