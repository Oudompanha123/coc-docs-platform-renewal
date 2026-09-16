# ADR-026: Profile photos an account owner uploads, kept in object storage

## Status

**PROPOSED** — 2026-09-15

Revises [ADR-013](ADR-013-revision-of-008-identity-broker.md)'s assumption that
a profile picture always comes from the identity provider, and extends V5's
`account.avatar_url`. Introduces the first use of object storage in this
system (`CONST-TECH-08`).

- Deciders: PM (requested), architect.
- **Recorded after the fact.** `eaab241` shipped the implementation and eight
  files cite `ADR-026` in their `// req:` lines, but the ADR itself was never
  written. This is that document, describing what was built rather than
  proposing it — the repo requires an ADR for a new external dependency and for
  anything that accepts a file from a caller, and eight dangling citations are
  worse than a late document.
- **`REQUIREMENTS-SPEC.md` §7 amendment for `FR-AUTH-005` is outstanding**, as
  it is for ADR-014/017/021/023/025.

---

## Context

Until now `account.avatar_url` held whatever Google supplied through Keycloak,
refreshed on every sign-in, or null for anybody who registered with a password.
That leaves two groups with no way to have a face in the interface: password
registrants, who never had one, and Google users who simply want a different
photo here from the one on their Google account.

The picture also has to survive. `SessionService.refreshProfile` rewrites
`avatar_url` from the provider's `picture` claim at every Google sign-in, so
anything stored there would be silently replaced on the owner's next login.

## Decision

### 1. Object storage behind the S3 API, not the database

`CONST-TECH-08` already requires the S3-compatible API and no provider-specific
feature, because the hosting target is `[DEFERRED]` (ADR-012). Photos go to a
bucket; `avatar_url` holds the resulting URL.

Not bytes in PostgreSQL. A 2 MB blob per account is survivable, but it puts
image traffic through the connection pool that also serves every page read, and
it makes the row the thing you cannot stream.

Addressing is **path-style** (`host/bucket/key`), not virtual-hosted
(`bucket.host/key`). Every S3-compatible provider supports path-style, MinIO
included; virtual-hosted needs DNS per bucket and is not universal. With the
provider still undecided, the addressing scheme that always works is the only
defensible choice.

### 2. `avatar_uploaded_at` distinguishes the owner's photo from the provider's

One nullable timestamp (V12), and it carries the whole rule:

- **Non-null** — the account owner set this photo deliberately.
  `refreshProfile` must not overwrite it with the provider's `picture` claim.
- **Null** — the original behaviour, unchanged: the provider's picture if there
  is one, initials if not.

A boolean would have done, but the timestamp answers "when" for free and reads
correctly beside `created_at` and `updated_at`.

### 3. The upload is validated on three axes, and the file is decoded

A route that accepts a file from an authenticated caller is a route that will
be handed something unexpected, so:

- **Size** — 2 MB. Rejected before anything is read.
- **Declared type** — an allow-list: `image/png`, `image/jpeg`, `image/webp`.
  Not a deny-list, which is a promise to have thought of everything.
- **Actual content** — the bytes are decoded as an image. A caller controls the
  `Content-Type` header entirely, so the declared type is a hint and never a
  fact. A file that claims to be a PNG and does not decode is refused.

Only the first two are cheap. The decode is the one that matters, because it is
the only check the caller cannot simply lie their way past.

### 4. Storage is optional, and its absence is a supported state

`AvatarStorageConfig.avatarStorage` returns `null` when the S3 settings are
absent, which registers no bean at all, and `SessionService` takes it through
an `ObjectProvider`. Without credentials the application starts normally and
upload is unavailable; everything else works.

The same shape as `PasswordResetMailer`, `AccountInviteMailer` and
`PushSender` (ADR-025). Six developers run this locally and most will never
hold storage credentials; a component that refused to boot without them would
make the application undevelopable for everybody but its author.

### 5. Access is the caller's own account only

`POST /api/v1/auth/me/avatar` and `DELETE /api/v1/auth/me/avatar`. The account
is resolved from the session, never from the request, exactly as `PATCH
/auth/me` already is. There is no endpoint for setting somebody else's photo,
and a `super_admin` wanting to remove an inappropriate one does it by
deactivating or deleting the account (ADR-023), not by editing their picture.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Bytes in PostgreSQL** | Puts image traffic through the pool that serves page reads, and makes the row unstreamable. Survivable at six users, wrong at the first hundred |
| **Provider picture only** | Leaves password registrants with no photo at all, and gives Google users no say in which one appears here |
| **A separate `avatar` table** | One nullable timestamp answers the only question being asked. A table is the answer when there is a history to keep, and there is not |
| **Trusting `Content-Type`** | It is a caller-supplied header. The decode is the only check that cannot be lied past |
| **Virtual-hosted S3 addressing** | Needs DNS per bucket and is not universal. Path-style works everywhere, which is what an undecided provider requires |

## Consequences

### Positive

- Everybody can have a face in the interface, not just Google users.
- An owner's chosen photo survives their next Google sign-in.
- Storage stays optional, so nobody is blocked from running the application.

### Negative — stated plainly

- **A new external dependency and two new secrets.** The AWS S3 SDK joins the
  build, and `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` join the secret surface
  ADR-007 tracks.
- **Deleting an account does not delete its photo.** `ADR-023` removes the row
  and cascades every database reference, but the object in the bucket is
  outside the database and outlives it. A tidy-up job is required follow-up
  below, and until it exists the bucket accumulates orphans.
- **Uploaded photos are served from wherever the bucket is public.** Nothing
  here signs URLs or checks who is asking for an image. A photo URL is
  effectively public to anyone who has it — acceptable for a profile picture,
  and stated so it is not mistaken for a protected asset.
- **No image re-encoding.** The bytes are decoded to prove they are an image
  and then stored as they arrived, metadata included. A photo may carry EXIF
  location data from the phone that took it.

### Required follow-up

1. Amend `REQUIREMENTS-SPEC.md` §7 for `FR-AUTH-005`.
2. Delete the stored object when an account is deleted (ADR-023) or its photo
   replaced, or the bucket grows without bound.
3. Strip EXIF on upload, or re-encode. The location data in an unmodified phone
   photo is exactly the kind of thing `NFR-SEC-PII` exists for.
4. Decide whether uploaded photos should be served through the application
   rather than directly from the bucket.

## References

- Requirements: `FR-AUTH-005`, `NFR-SEC-PII`, `CONST-TECH-08`
- Revises: `ADR-013` (provider-supplied picture), V5's `account.avatar_url`
- Related: `ADR-007` (secret surface), `ADR-011` (upload validation),
  `ADR-023` (deletion), `ADR-025` (the optional-bean precedent)
- Code: `backend/src/main/java/com/coc/docs/storage/S3AvatarStorage.java`,
  `AvatarStorageConfig.java`, `account/AvatarStorage.java`,
  `db/migration/V12__account_avatar_upload.sql`,
  `frontend/components/layout/ProfileModal.tsx`
- Tests: `S3AvatarStorageTest`, `ProfileModal.test.tsx`
