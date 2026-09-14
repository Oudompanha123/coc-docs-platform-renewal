# ADR-018: Self-service password reset — revision of ADR-014

## Status
**ACCEPTED** — 2026-09-11

Closes the gap ADR-014 recorded and deliberately left open:
[ADR-014](ADR-014-revision-of-008-password-registration.md) §"Required
follow-up" item 4 — *"Password reset: needs its own design (and likely its
own ADR, given it's a new security-sensitive flow) before it's promised to
users."* This is that design. Independent of, and does not change,
[ADR-013](ADR-013-revision-of-008-identity-broker.md) (Keycloak brokering
Google) — an account that only ever signs in via Google/Keycloak has no
password to reset, and this decision does not give it one (see Decision 2).

- Deciders: confirmed in-session by the developer implementing the flow, in
  direct response to a product request to build the forgot-password /
  reset-password screens and their backend.
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision, and for any new security-sensitive
  flow), not as a substitute for it.** PM sign-off assigning a `FR-AUTH-*`
  requirement ID in `REQUIREMENTS-SPEC.md` §7 is recommended before this is
  treated as final — the same way ADR-014 itself was recorded and the same
  way G1/G2/G3 gate status is never self-recorded (`CONST-PROC-01`).

---

## Context

ADR-014 added a password sign-in path but explicitly shipped without a
recovery path for it: *"a self-registered user who forgets their password
has no recovery path yet."* That gap is what this ADR closes. It touches
three things ADR-014 did not need to: a new unauthenticated write endpoint
(`/forgot-password`), a bearer credential delivered outside the HTTP
session model (a link in an email), and — for the first time in this
codebase — outbound email.

## Decision

### 1. The reset token follows the same shape as a session token, not a JWT

A reset token is 32 bytes of `SecureRandom`, base64url-encoded, carrying no
claims. Only its SHA-256 hash is persisted, in a new `password_reset_token`
table — the identical `token_hash bytea primary key` pattern `app_session`
already uses (ADR-011), for the identical reason: a leaked table row is not
a usable credential, and there is nothing in the token to verify a signature
against because it asserts nothing about itself.

A stateless, self-verifying token (a JWT) was the alternative and is
rejected for the same reason ADR-011 rejected one for sessions: it cannot be
revoked or marked single-use without a blocklist, which is this table with
extra steps and a signing key to manage besides.

The token is single-use (`used_at`) and short-lived — **30 minutes**, a
fixed system-wide value with no per-deployment variant, matching the
"one behaviour, not a knob" precedent `AppProperties.sessionTtl` and
`NonceService.TTL` already set. It is never returned in any API response;
it exists only in the email.

### 2. Eligible only for an account that already has a password

`POST /forgot-password` looks the address up and, only when
`account.password_hash is not null`, mints a token and emails the link.
A Google/Keycloak-only account — `password_hash` is null — gets no email.

**Rejected alternative**: treat "forgot password" as "set a password",
provisioning `password_hash` for a Google-only account that requests it.
The mailbox-ownership proof a reset link provides would make this safe
in isolation, but it silently adds a second sign-in path to an account
whose owner never asked for one and may not want one — a bigger change
than "reset" implies, and one ADR-014 §4's "role/status are never taken
from the request" discipline argues against making implicitly. If self-
service password *addition* for a Google account is ever wanted, it is
its own decision, not a side effect of this one.

### 3. The anti-enumeration property extends to this endpoint too

`POST /forgot-password` returns the same 200 with the same generic message
— *"If that email is registered, we've sent password reset instructions."*
— whether the address doesn't exist, exists but has no password credential,
or exists, has one, and really was just emailed. This is the same
`UC-004` E-3 principle ADR-014 §3 established for `login-password`, applied
to the one other place an email address can be checked against the account
table.

This does **not** extend to `POST /reset-password`. A rejected token there
(unknown, expired, or already used) is told plainly — *"this reset link is
invalid or has expired"* — because the caller already holds the token that
came from their own mailbox; refusing it discloses nothing about anyone
else's account, which is the same distinction ADR-014 §3 draws between
sign-in (an oracle risk) and an applicant checking their own attempt.

### 4. A successful reset revokes every live session for the account

Mirrors `AccountService.setActive`/`changeRole`: whatever the reason
authority over an account changed, a session that predates the change must
not outlive it. Here specifically — if the password was forgotten because
someone else has been using the account, their live session should not
survive the legitimate owner taking it back.

### 5. Email delivery is an optional bean, exactly like the Keycloak broker

`spring-boot-starter-mail`'s `JavaMailSender` autoconfigures only when
`spring.mail.host` is set; nothing here overrides that. The mailer depends
on it through an `ObjectProvider`, the identical shape `SessionService`
already uses for `KeycloakIdTokenService` — a deployment with no SMTP
configured boots exactly as it does today and serves every other route.

Where no mail sender is configured, the reset link is logged at `WARN`
instead of emailed, so local development and demos stay usable without
standing up SMTP. **Stated plainly, the way ADR-014's own consequences
section states its gaps**: this is acceptable for local development only.
A production deployment that reaches this state is writing a live
password-reset credential to its log stream, and must configure
`spring.mail.*` before going live. This repo's operating constraints
(`CONST-OPS-01` context; `application.yml` is off-limits to the AI per the
user's own `SEC-001`/`SEC-003` rules) mean that configuration is an ops
action, not something this ADR or its implementation can complete —
recorded as required follow-up below, the same way ADR-014 left its own
SMTP-shaped gaps (rate limiting, CAPTCHA) for later attention rather than
solved.

## Alternatives Considered

| Option | Why not |
|---|---|
| **JWT-shaped reset token** | Cannot be revoked or made single-use without a blocklist — this table with extra steps, plus a signing key to manage. Same reasoning ADR-011 used for sessions. |
| **Store the raw token, not its hash** | A leaked table row becomes a live credential immediately. No corresponding benefit — the hash is looked up by exact match either way. |
| **Let "forgot password" provision a password for a Google-only account** | Adds a sign-in path nobody asked for as a side effect of a different action. See Decision 2. |
| **Auto-sign-in after a successful reset** | Register doesn't sign the caller in either (ADR-014); reset following the same shape means one fewer inconsistency between the two credential-lifecycle endpoints, at the cost of one extra login step the user just proved they can complete. |

## Consequences

### Positive
- The one gap ADR-014 named and explicitly left open is closed: a
  self-registered user who forgets their password now has a way back in.
- No new anti-enumeration surface: `/forgot-password` is held to the exact
  standard `/login-password` already is.

### Negative — stated plainly
- **Outbound email is a new capability this system did not have.**
  `spring-boot-starter-mail` is a new dependency, and a real deployment now
  needs an SMTP credential to manage — a new secret, on top of the ones
  ADR-007's N/A rationale already had to caveat for the Keycloak client
  secret.
- **No rate limiting or CAPTCHA on `POST /forgot-password`**, same
  unresolved class of gap ADR-014 already flagged for `/register` and
  `/login-password`. This endpoint can be used to mail-bomb an arbitrary
  address by submitting it repeatedly; nothing here prevents that yet.
- **The logged-link fallback is a footgun if it reaches production.** It
  is deliberately how a not-yet-configured deployment behaves rather than
  failing closed, because failing closed would also break local development
  entirely. Whoever deploys this has to know to configure SMTP first.

### Required follow-up
1. **PM sign-off**: assign a `FR-AUTH-*` requirement ID and record it in
   `REQUIREMENTS-SPEC.md` §7, the same way every prior amendment there is a
   recorded PM decision.
2. **SMTP configuration**: an ops/PM decision on a provider, then the
   `spring.mail.*` keys in `application.yml` — the AI implementing this
   cannot make or apply that change itself (`SEC-001`/`SEC-003`).
3. **Rate limiting / abuse control**: shared follow-up with ADR-014's
   identical gap on `/register` and `/login-password`; ideally solved once,
   for all three.
4. **Scheduled purge**: `PasswordResetTokenMaintenance` sweeps expired/used
   rows hourly, mirroring `SessionMaintenance` — not a security control,
   just table hygiene, noted here so it isn't mistaken for one.

## References
- Requirements: `FR-AUTH-002` (no passwords are stored *unhashed*; unchanged
  in spirit — the reset token is hashed the same way), `ADR-014`
- Supersedes in part: `ADR-014`'s "no password reset flow exists" gap
- Affects: `ADR-007` (another credential — an SMTP secret — enters the
  system's secret surface; its N/A rationale may need the same re-examination
  ADR-014 already asked for)
- Code: `backend/src/main/java/com/coc/docs/auth/PasswordResetService.java`,
  `PasswordResetTokenRepository.java`, `PasswordResetMailer.java`,
  `PasswordResetTokenMaintenance.java`, `V6__password_reset_token.sql`,
  `frontend/app/forgot-password/page.tsx`, `frontend/app/reset-password/page.tsx`

## Numbering note

This ADR was first written and merged as **ADR-017**, in parallel with
[ADR-017](ADR-017-approval-gate.md), which was authored and merged a few hours
earlier the same day. Two branches picked the same next number without seeing
each other. This one moved to 018 because the other landed on `dev` first; no
decision here changed.

`V6__password_reset_token.sql` still names ADR-017 in its header comment and
in the table's `comment on table`. That is deliberate. Flyway checksums a
migration by its bytes, and V6 is already applied in more than one schema, so
correcting the reference would turn every existing database into a checksum
mismatch on next startup — a real outage to fix a stale citation. The file
stays as applied; this note is the correction.
