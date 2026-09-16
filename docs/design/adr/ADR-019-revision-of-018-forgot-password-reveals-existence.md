# ADR-019: `/forgot-password` reveals whether an account exists — revision of ADR-018

## Status
**ACCEPTED** — 2026-09-14

Revises [ADR-018](ADR-018-revision-of-014-password-reset.md) (self-service
password reset — renumbered from ADR-017 on 2026-09-14, see that file's own
numbering note) Decision 3 only. Every other decision in ADR-018 — the token
shape, the 30-minute single-use TTL, eligibility limited to an account that
already holds a `password_hash`, the session-revocation-on-reset behaviour,
and email delivery being an optional bean — is unchanged.

- Deciders: PM, in direct, explicit instruction given twice in the same
  session after the anti-enumeration trade-off was explained in full both
  times.
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision, and ADR-018 itself asked for PM sign-off
  on changes to this flow) — not as a substitute for that sign-off.** The
  same `REQUIREMENTS-SPEC.md` §7 recording ADR-018 itself asked for is still
  outstanding for both.

---

## Context

ADR-018 Decision 3 made `POST /forgot-password` return the identical 200
response — *"If that email is registered, we've sent password reset
instructions."* — whether the address had no account, an account with no
password credential, or a genuine reset email. This mirrored ADR-014 §3's
rule for `/login-password`: never let an unauthenticated caller learn which
addresses are registered, because that is an oracle for building a target
list (phishing, credential-stuffing prioritisation, or simply learning who
uses this platform).

The product decision made here is different: **for this endpoint only**,
knowing immediately that a typo or wrong address was entered is worth more
than the anti-enumeration property it costs. The request was raised twice in
one session; both times the trade-off above was stated first, and both times
the answer was to proceed.

## Decision

`POST /forgot-password` now distinguishes **"no account exists for this
address"** from every other case:

- **No account at all** → `404`, body `"No account found with this email
  address."` (`ApiException`, not the 200 envelope `ForgotPasswordResponse`
  used to wrap every outcome).
- **Account exists, holds a password, eligible** → unchanged: `200`, token
  minted and emailed, generic message.
- **Account exists but is Google/Keycloak-only (no `password_hash`)** →
  unchanged: `200`, nothing emailed, generic message. **This case is
  deliberately not split out further** — the ask was specifically "no account
  found," not "tell me why an account can't reset," and further splitting
  would leak strictly more (which sign-in method an address uses) for no
  requested benefit.

`POST /reset-password` is untouched — it was never covered by the
anti-enumeration property to begin with (ADR-018 Decision 3 already
distinguished it: a rejected token there is reported plainly, because the
caller already holds a value that came from their own mailbox).

### Key Choices
- Split on `Optional<AccountCredential>` emptiness only, inside
  `PasswordResetService.requestReset` — the narrowest change that satisfies
  the request, not a redesign of eligibility.
- A distinct `404` + exact message, thrown as an `ApiException`, rather than
  a flag inside `ForgotPasswordResponse` — matches how every other
  deliberate rejection in this codebase is surfaced (`ApiExceptionHandler`
  already exists for exactly this).
- Frontend (`forgotPassword()` in `frontend/lib/auth/api.ts`) special-cases
  `404` the same way it already special-cases `409` on `/register` — a
  hardcoded client string kept in sync with the backend's, not a parse of
  the response body, matching this file's existing convention.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Keep ADR-018 Decision 3 as-is | No new enumeration surface | Does not satisfy the explicit, twice-repeated product request | Not adopted |
| B | Distinguish all three cases (no account / Google-only / eligible) | Most information to the caller | Leaks strictly more than asked for; no stated use case for "this address exists but can't reset this way" | Not adopted |
| C | Distinguish only "no account at all," leave the Google-only case folded into the generic 200 | Satisfies exactly what was asked; smallest additional enumeration surface | Still reopens enumeration for the "no account" case, which is the entire point of the change | **Adopted** |

## Consequences

### Positive
- Someone who mistypes their email, or never registered, is told so
  immediately instead of being left to wonder whether an email is coming.

### Negative — stated plainly
- **This endpoint can now be used to test arbitrary addresses against this
  platform's account table.** A 404 vs. 200 response is a working oracle:
  submit any address and learn whether Coc Docs Platform has an account for
  it. This is the exact risk ADR-018 Decision 3 and ADR-014 §3 were written
  to close, reopened here deliberately and only on this one endpoint.
- **This compounds with an existing, already-flagged gap**: ADR-018's
  consequences section already noted *"No rate limiting or CAPTCHA on
  `POST /forgot-password`."* Before, that gap meant an attacker could mail-bomb
  one address. Now it also means the same lack of rate limiting lets that
  oracle be queried without friction. This ADR does not close that gap either
  — it makes closing it more valuable than it already was.
- `/login-password` is **not** affected and keeps its own anti-enumeration
  behaviour (ADR-014 §3) — this decision is scoped to `/forgot-password`
  only, so the two endpoints now intentionally disagree on this property.

### Required follow-up
1. **PM/security sign-off**, per ADR-018's own ask for this flow — recorded
   here as still outstanding, the same way ADR-018 itself recorded it as
   outstanding for the flow as a whole.
2. **Rate limiting / abuse control** — already an open item on ADR-018;
   now more valuable for the reason stated above. Shared follow-up with
   ADR-014's identical gap on `/register` and `/login-password`.
3. **`REQUIREMENTS-SPEC.md` §7**: assign or amend an `FR-AUTH-*` requirement
   ID to reflect that `/forgot-password` no longer follows the anti-enumeration
   principle `/login-password` does — the two were previously described as
   held to the same standard, and that is no longer true.

## References
- Revises: [ADR-018](ADR-018-revision-of-014-password-reset.md) Decision 3
  only
- Requirements: `FR-AUTH-002`, `ADR-014` §3 (the anti-enumeration precedent
  this decision departs from, for `/login-password` only)
- Code: `backend/src/main/java/com/coc/docs/auth/PasswordResetService.java`,
  `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/main/java/com/coc/docs/auth/dto/ForgotPasswordResponse.java`,
  `frontend/lib/auth/api.ts`, `frontend/app/forgot-password/page.tsx`
- Numbering: this ADR was drafted as "018" before `ADR-018-revision-of-014-password-reset.md`'s
  own renumbering commit (`docs(adr): the password-reset ADR becomes 018,
  and the migration stays put`) landed on `dev` — that commit resolved a
  genuine, pre-existing ADR-017 collision between the approval-gate ADR and
  the password-reset ADR. This ADR was renumbered to 019 on rebase to avoid
  re-creating the same collision at 018; no decision changed.
