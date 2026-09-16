# ADR-029: `/forgot-password` also covers Google-only accounts — revision of ADR-018

## Status
**PROPOSED**

Revises [ADR-018](ADR-018-revision-of-014-password-reset.md) (self-service
password reset) Decision 2 only. Every other decision in ADR-018 — the
token shape, the 30-minute single-use TTL, the session-revocation-on-reset
behaviour, and email delivery being an optional bean — is unchanged. Also
touches [ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md)'s
Context/Decision prose, which described the Google-only case this ADR now
changes — ADR-019's own decision (the `404` split for "no account at all")
is **not** revised; that carve-out is explicitly preserved below.

- Deciders: PM/developer, direct instruction in-session.
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision) — not as a substitute for PM sign-off,
  which this file transcribes rather than grants.**

---

## Context

ADR-018 Decision 2 limited `/forgot-password` to accounts that already hold
a `password_hash`: an account that has only ever signed in via Google/Keycloak
gets the identical generic response, but nothing is minted or emailed. That
was deliberate at the time — "there is no password to reset" — but it leaves
a real gap ADR-030 already recognised from the other side: **a Google-only
account has no self-service way to get a password credential except by
successfully signing in with Google first**, going to Settings → Security,
and clicking "Set password" (ADR-030). If Google sign-in is ever unavailable
to them, forgotten, or simply not how they want to sign in that day, there
was no path at all — not even an unauthenticated one — to add a password to
their own account.

- **Related requirements**: `FR-AUTH-002`, `FR-AUTH-007`
- **Related ADRs**: ADR-018 (the flow this revises), ADR-019 (the `404`
  carve-out this does not touch), ADR-030 (the authenticated "set an initial
  password" path this adds an unauthenticated parallel to)
- **Decision pressure**: direct PM/developer request; no gate blocks this
  (Skill 4 implementation work).

## Decision

`POST /forgot-password` now mints a token and emails a link for **every**
account that exists, regardless of whether it already holds a password —
Decision 2's eligibility restriction is removed. `POST /reset-password`
needed no eligibility change (it already just sets whatever password is
submitted, and always did), but now distinguishes *which* case it completed
for its confirmation message and audit entry.

> The one case `/forgot-password` still refuses outright is unchanged from
> ADR-019: **no account exists for this address at all** → `404`. Every
> account that exists — password-holding or Google-only alike — now gets
> the same treatment: a token, an email, and the same generic `200` message.

### Key Choices

1. **Removes the `passwordHash() == null` early return in
   `PasswordResetService.requestReset`, rather than adding a third response
   shape.** The Google-only branch previously logged an audit entry
   (`emailed: false, reason: no_password_credential`) and returned before
   minting anything. That branch is deleted outright; the method now has one
   path for every existing account.

2. **This *improves* the anti-enumeration property ADR-019 left standing,
   as a side effect, not just a feature add.** Before this change, the API
   response for "Google-only" and "genuine reset" was already identical
   (ADR-018 Decision 3), but the two cases were still distinguishable by a
   side channel: whether an email actually arrived. Now both cases really do
   send the identical class of email, closing that side channel too — for
   every case *except* "no account at all," which ADR-019 already,
   deliberately, does not hide.

3. **`resetPassword` now looks up the account's credential *before* writing
   the new hash**, the same "read the old state before it changes" shape
   `SessionService.changeOwnPassword` already uses for its own
   initial-set-vs-change distinction (ADR-030) — `settingInitialPassword =
   credential.passwordHash() == null`. This is purely for the confirmation
   message and audit `detail.kind`; the actual write
   (`accounts.updatePasswordHash`) was already unconditional and needed no
   change — an account with no existing hash was never special-cased there.

4. **The emailed message's wording differs ("Set your password" vs. "Reset
   your password") based on the same flag, and this is safe** — unlike the
   API response, which an attacker can query for any address, an email
   only ever reaches the inbox of whoever controls that address. Wording it
   accurately for the actual account owner costs nothing here that Decision
   3's anti-enumeration property depends on.

5. **`sessions.revokeAllFor(accountId)` still runs unconditionally** on
   completion, same as before — for a Google-only account this is typically
   a no-op (no password-authenticated sessions exist to revoke), but Google/
   Keycloak-issued sessions are also `app_session` rows and get the same
   "start clean after a credential change" treatment as anyone else's.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Keep ADR-018 Decision 2 as-is; Google-only accounts must sign in with Google once to set a password (ADR-030) | No change; smaller surface | Leaves the exact gap this ADR closes — no self-service path if Google sign-in isn't available or wanted | Not adopted |
| B | Add a third, distinct response for the Google-only case (e.g., a different message pointing at "sign in with Google instead") | Most informative to the caller | Reopens the account-type enumeration ADR-019 explicitly declined to add ("further splitting would leak strictly more... for no requested benefit") | Not adopted |
| C | Treat every existing account identically: mint + email + same generic message, differing only in the emailed content itself (which only the owner sees) | Satisfies the request; closes rather than reopens an enumeration side-channel; smallest change to `requestReset` | An operator reading `audit_log` needs the new `hadPasswordAlready`/`kind` fields to tell the two cases apart after the fact, rather than a dedicated audit action | **Adopted** |

## Consequences

### Positive
- A Google-only account now has a genuine, unauthenticated, email-gated path
  to get a password credential — the same security property (proof of inbox
  control) every other password-reset grant already relies on.
- Closes the "does an email actually arrive" side-channel ADR-019 left open
  between the Google-only and genuine-reset cases, without reopening
  anything ADR-019 deliberately decided to keep closed.

### Negative — stated plainly
- **No new rate limiting or abuse control** — same accepted, already-recorded
  gap ADR-018/019 carry forward; this ADR does not change that gap's shape
  (if anything, it removes one case that previously short-circuited before
  minting a token, marginally increasing the number of real tokens/emails a
  script could trigger against a single address it already knows exists).
- **The confirmation message on `/reset-password` now depends on account
  state at redemption time**, not just the token's validity — a very minor
  increase in that method's surface, mirroring a pattern
  (`changeOwnPassword`) already established elsewhere in this codebase.

### Required follow-up
1. **PM sign-off**, same outstanding item ADR-018/019 already carry.
2. **`REQUIREMENTS-SPEC.md` §7**: amend `FR-AUTH-002`'s note (already amended
   twice, by ADR-014 and effectively touched by ADR-018/019) to reflect that
   `/forgot-password` no longer distinguishes "has a password" from
   "Google-only" in any observable way.

## References
- Revises: [ADR-018](ADR-018-revision-of-014-password-reset.md) Decision 2
  only
- Touches (prose only, no decision change): [ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md)
- Precedent followed: [ADR-030](ADR-030-revision-of-022-024-google-only-account-may-set-initial-password.md)
  (`hasPassword`/`settingInitialPassword` shape, read-before-write)
- Requirements: `FR-AUTH-002`, `FR-AUTH-007`
- Code: `backend/src/main/java/com/coc/docs/auth/PasswordResetService.java`,
  `backend/src/main/java/com/coc/docs/auth/PasswordResetMailer.java`,
  `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/main/java/com/coc/docs/auth/dto/ResetPasswordResponse.java`

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-16 | 1.0 | Initial draft, implemented alongside the code it describes | AI, on direct PM/developer instruction |

---

**Approval**
| Date | Approver | Comments | Status |
|---|---|---|---|
| 2026-09-16 | — | Recorded per this repo's process (an ADR is mandatory for a revision of an existing decision) — not a substitute for PM sign-off, which this file transcribes rather than grants. | **PENDING** |
