# ADR-014: Password self-registration with admin approval — revision of ADR-008

## Status
**ACCEPTED** — 2026-09-10

Revises `FR-AUTH-002` and `FR-AUTH-003` as recorded in
[`REQUIREMENTS-SPEC.md`](../../requirements/REQUIREMENTS-SPEC.md) §2.5, and the
"Google OIDC only, no passwords, admin-provisioned only" decision in
[ADR-008](ADR-008-channel-auth.md) / [ADR-011](ADR-011-security-model.md).
Independent of, and does not change, [ADR-013](ADR-013-revision-of-008-identity-broker.md)
(Keycloak brokering Google) — that flow is untouched by this decision.

- Deciders: confirmed in-session by the developer implementing the login/
  registration slice, in direct response to product direction to wire up the
  Register page's existing password fields (`frontend/app/register/page.tsx`,
  built earlier "per explicit product direction to match the approved mockup
  pixel-for-pixel" while explicitly flagging that a real backend for it would
  need this exact ADR — see that file's own header comment).
- **Recorded here per this repo's process (an ADR is mandatory for a revision
  of an existing decision), not as a substitute for it.** `FR-AUTH-002` and
  `FR-AUTH-003` are both `Must`-priority requirements; formal PM sign-off in
  `REQUIREMENTS-SPEC.md`'s change history (§7) is recommended before this is
  treated as final, the same way G1/G2/G3 gate status is never self-recorded.

---

## Context

Two requirements said, without qualification:
- `FR-AUTH-002`: "The system stores **no passwords**."
- `FR-AUTH-003`: "A `super admin` can create... accounts" (i.e. no self-registration).

`ADR-008`/`ADR-011` made Google OIDC (now Keycloak-brokered, ADR-013) the
**sole** human-facing authentication mechanism specifically to make those two
requirements true by construction. The Register page's password fields have
existed since the mockup was implemented, deliberately wired to a stub, with
this exact tension flagged in its own header comment.

The product direction is now to make that form real: a visitor can create
their own account with a password, but — since `FR-AUTH-003`'s "accounts are
provisioned by a super admin" principle is worth keeping even here — the
account cannot sign in until a `super_admin` approves it.

## Decision

### 1. Password authentication is added as a second, parallel sign-in path

Google/Keycloak OIDC is not replaced or weakened. A `POST /api/auth/register`
+ `POST /api/auth/login-password` pair exists alongside the unchanged
`POST /api/auth/nonce` + `POST /api/auth/login` (Keycloak) pair. Both paths
end at the same session issuance (`SessionService`, the `coc_session` cookie)
— ADR-013's "one session model regardless of how identity was proven"
principle extends naturally to a second identity-proving method.

Passwords are hashed with bcrypt (`PasswordEncoder`/`BCryptPasswordEncoder`,
already transitively available via `spring-boot-starter-security`) before
they ever reach the database; the raw password exists only for the duration
of the request that hashes or verifies it.

### 2. Self-registration is gated by a `status` lifecycle, not auto-activated

```
pending --(super_admin approves)--> active
pending --(super_admin rejects)---> rejected
```

Only an `active` account may sign in, by **either** path — a
Google/Keycloak-provisioned account is unaffected in practice (existing rows
default to `active`), but a self-registered account cannot sign in until a
`super_admin` acts on it. This keeps the substance of `FR-AUTH-003`
("a super admin provisions accounts") even though the mechanism is no longer
exclusively "a super admin creates the row before anyone signs in" — now
"a super admin approves the row before anyone signs in with it."

`status` is deliberately independent of the existing `deactivated_at` column:
`status` answers "was this registration ever approved to sign in at all";
`deactivated_at` answers "was an approved account later turned off." An
approved-then-deactivated account and a rejected registration both end up
unable to sign in, but they are different histories worth keeping distinct
in the data (and, per `UC-004` E-3, indistinguishable from outside — see §3).

### 3. The generic-401 anti-enumeration property (`UC-004` E-3) extends to the new reasons

`pending_approval`, `rejected`, and the existing `deactivated`/`no_account`
all produce the same fixed `401 {"message": "Sign-in failed"}` body via
`GlobalExceptionHandler`; only `audit_log.detail` records which one actually
happened. A wrong password on the password path is likewise indistinguishable
from "this account only has a Google identity, no password_hash at all" —
both are `AuthenticationFailedException("bad_credentials")`.

Registration's duplicate-email check is **not** held to the same standard:
`EmailAlreadyRegisteredException` states plainly that the email is already
registered. This is the applicant checking their own attempt, not a caller
probing a third party's account state — a different situation from sign-in,
where UC-004 E-3 exists specifically to stop that kind of probing.

### 4. Role is never taken from the registration request

A self-registered account is created with `role = 'user'` (the schema
column's existing default) exactly like any other account — `FR-AUTH-005`'s
role ladder and `FR-AUTH-008`'s "an `admin` may not access account
management" hold unchanged. Approving a registration changes only `status`,
never `role`.

## Alternatives Considered

| Option | Why not |
|---|---|
| **Auto-activate on registration** (`status` column without a gate) | Reopens exactly what `FR-AUTH-003` existed to prevent: anyone reaching the API can grant themselves access. Rejected. |
| **Reuse `deactivated_at` as the gate** (leave new accounts "deactivated" until approved) | Conflates two different histories — "never yet approved" and "was active, later turned off" — into one column and one meaning, and every future query that means one has to remember to also exclude the other. A dedicated `status` column keeps them distinct at essentially no cost, per the two-tier-validation precedent already set for content (`ADR-012` Decision 3). |
| **A separate `pending_registration` staging table**, only inserted into `account` on approval | Keeps `account` "clean" of unapproved rows, but means the approval step is an insert-and-delete across two tables instead of one `update`, and email-uniqueness has to be checked against two tables instead of one. Not worth it at this scale. |

## Consequences

### Positive
- The Register page's existing UI (already built, per explicit product
  direction, to match the approved mockup) now has a real backend behind it.
- `FR-AUTH-003`'s substance (a super admin decides who gets an account)
  survives in spirit even though a visitor can now initiate the request.

### Negative — stated plainly
- **The application now holds credentials it previously, deliberately, did
  not.** `ADR-007` (key management) was recorded **N/A** specifically because
  "`FR-AUTH-002` means no passwords are stored"; that clause of its rationale
  no longer holds region-wide (it still holds for the Google/Keycloak path).
  `ADR-INDEX.md`'s N/A record for `ADR-007` needs the architect/PM's
  attention — not changed here, since that index explicitly records a PM
  decision (2026-09-08) and shouldn't be silently edited alongside this.
- **A new class of threats this project's threat model has not yet priced
  in**: credential stuffing / brute force against `/api/auth/login-password`
  (no rate limiting exists yet at this layer), password reuse, and a
  registration endpoint as a new unauthenticated write surface (email
  enumeration via the duplicate-check response, by design per §3 above, and
  a new target for automated bulk registration/spam — no CAPTCHA or rate
  limit exists here yet either).
- **Two authentication code paths to keep in sync going forward.** Any future
  change to session issuance, audit logging, or the sign-in failure model
  has to be applied to both `login` and `login-password` — mitigated here by
  routing both through one shared `completeSignIn(...)` helper in
  `AuthController`, but that discipline has to hold for whoever touches this
  next too.
- **No password reset flow exists.** Out of scope for this change; a
  self-registered user who forgets their password has no recovery path yet.

### Required follow-up
1. **PM sign-off** in `REQUIREMENTS-SPEC.md` §7 amending `FR-AUTH-002`/
   `FR-AUTH-003`, the same way every prior amendment there is recorded as a
   PM decision.
2. **Threat model**: rate limiting / brute-force protection on
   `/api/auth/login-password` and `/api/auth/register`; a decision on whether
   registration needs a CAPTCHA or similar abuse control.
3. **`ADR-007`**: re-examine its N/A status now that the system does hold
   credentials (hashes) for one of its two auth paths.
4. **Password reset**: needs its own design (and likely its own ADR, given
   it's a new security-sensitive flow) before it's promised to users.
5. **Admin UI**: `POST /api/admin/accounts/{id}/approve|reject` and
   `GET /api/admin/accounts/pending` exist as an API; no frontend screen
   consumes them yet.

## References
- Requirements: `FR-AUTH-002`, `FR-AUTH-003`, `FR-AUTH-005`, `FR-AUTH-008`
- Supersedes in part: `ADR-008` (the "sole mechanism" and "admin-provisioned
  only" clauses); does not touch `ADR-013`
- Affects: `ADR-007` (N/A rationale no longer fully holds), `ADR-011`
  (session model extended to a second identity-proving method)
- Code: `backend/src/main/java/com/coc/docs/auth/`,
  `backend/src/main/java/com/coc/docs/account/`,
  `backend/src/main/java/com/coc/docs/web/AdminAccountController.java`,
  `V3__account_registration.sql`
