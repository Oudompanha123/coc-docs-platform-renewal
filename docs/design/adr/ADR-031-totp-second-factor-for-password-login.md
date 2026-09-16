# ADR-031: TOTP (Google Authenticator) second factor for password login

> **Status**: PROPOSED
> **Date**: 2026-09-16
> **Author**: AI (implementing on direct PM/developer instruction — see note at end of file)
> **Approver**: PM — pending review, same provenance note as G1/G2 in `docs/.harness-state.yaml`
> **Related ADR**: [ADR-011](ADR-011-security-model.md) (security model, §Authentication pillar), [ADR-014](ADR-014-revision-of-008-password-registration.md) (password sign-in), [ADR-021](ADR-021-revision-of-014-registration-email-otp.md) (the challenge/token shape this reuses), [ADR-013](ADR-013-revision-of-008-identity-broker.md) (Keycloak/Google — explicitly untouched by this ADR)

> **Numbered 028 when written, and `V15__totp_mfa.sql` still says so.** ADR-028
> was taken by [ADR-028](ADR-028-live-notification-stream.md) before this
> branch merged, and the number that landed first keeps it. Every citation
> moved with this document except the ones inside that migration, and those
> stay where they are on purpose. Flyway checksums the whole file, comments
> included, so editing an applied migration stops the application booting for
> everybody whose database already ran it — which is exactly what happened when
> the renumbering first swept through it:
>
> ```
> Migration checksum mismatch for migration version 15
> -> Applied to database : 1673170774
> -> Resolved locally    : 1004200969
> ```
>
> A migration is immutable the moment it is applied anywhere. One confusing
> reference costs a reader a minute; editing it costs every developer a repair.
> This paragraph is the correction.

---

## 1. Context

The product has one first factor per sign-in path: a Google/Keycloak-issued
identity (ADR-013) or an email+password pair verified against a bcrypt hash
(ADR-014). Neither path has a second factor. The PM asked for TOTP
(Google-Authenticator-compatible) two-factor authentication on the login
page, with a guided setup wizard and a config-driven bypass so local/CI
testing doesn't require installing an authenticator app.

- **Background summary**: `frontend/components/settings/SecurityTab.tsx`
  already ships a "Two-factor authentication" toggle, documented in its own
  file as "local-state mock only, same fidelity as NotificationsCard" — the
  UI slot exists; nothing behind it does. This ADR fills it in rather than
  adding a second surface.
- **Related requirements**: `FR-AUTH-002` (password storage), `FR-AUTH-007`
  (sign-out/session invalidation), new `FR-AUTH-009` (this ADR — see
  `REQUIREMENTS-SPEC.md` change history), `NFR-SEC-AUTH`, `NFR-SEC-SESSION`.
- **Related risks**: the same unclosed "no rate limiting on `/login-password`"
  gap ADR-014/018/021 already accept applies here too — a TOTP code is
  6 digits, materially more guessable per-attempt than a bcrypt-protected
  password, which is exactly why replay/step-reuse protection (§2 Key
  Choice 4) and the existing password-proof-first gate matter more here than
  they would for a lower-value target.
- **Decision pressure**: PM request, direct instruction to implement; no
  gate is currently blocking this (G2 is approved for the current
  architecture baseline; this is additive Skill 4 implementation work, not a
  design-gate item), but ADR-011 is the CONST-SEC-01 security-model umbrella
  and a change to the authentication chain of custody is exactly the class
  of decision that ADR governs, hence a dedicated ADR rather than a silent
  change.

## 2. Decision

TOTP is an **opt-in second factor gating the password sign-in path only**
(`POST /api/v1/auth/login-password`). Google/Keycloak sign-in (ADR-013) is
unaffected — see Alternatives, below, for why that scope was chosen over
gating both paths.

> After a correct email/password, an account with a **confirmed** TOTP
> secret does not receive a session yet. It receives a short-lived, opaque,
> single-use challenge (mirroring the `registration_challenge` shape ADR-021
> established) via an `httpOnly` cookie, and must redeem it with a 6-digit
> code — real, RFC 6238 TOTP by default, or a fixed, developer-only code
> when `app.otp.enabled=false` — before a real session is issued.

### Key Choices

1. **A dedicated challenge table for the login gate, not a JWT or a
   Spring-Security-authenticated "partial" principal.** `mfa_login_challenge`
   (opaque token, hashed at rest, 5-minute TTL, single-use, purged hourly)
   is the same pattern `password_reset_token` and `registration_challenge`
   already use in this codebase. Rejected: encoding "first factor passed"
   into a signed JWT — this project's session credential is deliberately
   opaque and stateful precisely so a revocation is real (ADR-011 §Session
   management), and a second, JWT-shaped credential for the MFA gate would
   be a second philosophy to defend, not a smaller version of the first.

2. **The secret is stored in plain text (base32) in `account_totp.secret`,
   not encrypted at the application layer.** Unlike `account.password_hash`
   (one-way bcrypt — the server never needs the plaintext back), a TOTP
   secret must be reversible to compute the expected code, so hashing it is
   not an option. `ADR-007` (key management) is recorded **N/A** for this
   project precisely because no application-layer encryption key exists
   anywhere in this codebase — introducing one solely for this column would
   be a key-management architecture built for a single field, and this
   project's stated posture (ADR-011 §Team-scale note) is "use what the
   platform already gives you, not a bespoke system for a 6-person team."
   The secret therefore sits in the same trust boundary as the database
   connection string and any other credential Postgres already holds — a
   real, stated limitation, not a hidden one. See Consequences.

3. **Replay protection via `last_used_step`.** A TOTP code is valid for a
   ±1 step (30s) window (matching Google Authenticator's own tolerance), so
   without tracking which step was last accepted, the same code could be
   replayed within that window. `account_totp.last_used_step` is checked and
   updated atomically on every successful real-code verification; the
   developer fake-code path (Key Choice 5) has no step to track and is not
   subject to this check, since it isn't a real TOTP code at all.

4. **`app.otp.enabled` / `app.otp.dev-code`, read via `@Value(...:default)`,
   not `@ConfigurationProperties` — and never written into
   `application.yml` by this change.** `application.yml` is off-limits to
   the AI implementing this, per this repo's own `SEC-001`/`SEC-003`
   convention — the exact wall ADR-021 already documented hitting for
   `spring.mail.host`. Unlike a required `@ConfigurationProperties` block
   (which would need the key to exist to bind predictably), a `@Value`
   default means the feature is fully functional with **zero** lines added
   to `application.yml`: `app.otp.enabled` defaults to `true` (real TOTP
   required — the secure default if a deployment never configures this at
   all) and `app.otp.dev-code` defaults to `123456`. A human who wants the
   dev bypass adds two lines to their own `application.yml` (or the
   equivalent environment variables) — this ADR does not do that for them.

5. **`OtpDevModeGuard` fails application startup, not a login attempt, if
   the fake-code bypass is active outside a `dev`/`test` Spring profile.**
   Mirrors `KeycloakIdTokenService`'s existing constructor-time check
   (`backend/src/main/java/com/coc/docs/auth/KeycloakIdTokenService.java:51-63`)
   almost exactly: both exist because a security control that is silently
   permissive is worse than one that is loud and broken. Denying by default
   (require `dev` or `test` explicitly, rather than merely "not `prod`") is
   the same default-deny posture `SecurityConfig`'s `anyRequest()` rule
   already uses — an environment nobody bothered to name is treated as
   production, not as safe.

6. **Setup requires an existing session; the login page carries no mention
   of it at all.** A TOTP secret is created for a specific account, and
   there is no account context on an unauthenticated login page. The
   wizard (QR, manual secret, confirmation code, success state) lives
   entirely behind the existing Settings → Security toggle, which already
   requires a session to reach. An earlier iteration of this ADR added a
   "Set up two-factor authentication" disclosure link to the login page
   (sign in first, then go to Settings) — removed on direct PM/developer
   instruction (2026-09-16) before this ADR's first approval, since the
   login page has nothing it can actually do with the click; discoverability
   of the Settings → Security toggle is left to Settings' own navigation.

7. **Disabling requires re-proving the current password first**, the same
   reasoning `SessionService.changeOwnPassword` already applies to any
   security-lowering self-service action (ADR-022): a session alone — left
   open on a shared machine, or lifted by an XSS the `httpOnly` cookie
   doesn't fully close (ADR-011) — must not be sufficient to silently turn
   off the account's own second factor.

8. **Enrollment requires an existing password, enforced in both places
   (added 2026-09-16, on direct PM/developer instruction, before this
   ADR's first approval).** Since TOTP only ever gates `/login-password`
   (Alternative A1, below), a Google-only account has no password sign-in
   for a second factor to protect — `TotpService.startSetup` refuses with
   a plain message, and `SecurityTab`'s toggle is disabled (not hidden,
   matching the Password row's own existing convention) with the same
   explanation. This is a product-clarity rule, not a security control:
   enrolling TOTP on a password-less account isn't unsafe, it's just a
   control that would do nothing until they also set a password (ADR-029,
   ADR-030) — but per `CONST-TECH-07`, that distinction is still enforced
   backend-side, not left as something only the frontend happens to hide.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A1 | Gate password login only | Smaller, more targeted change; matches the PM's literal "user enters username and password" framing | An account's Google/Keycloak sign-in path remains single-factor even after enrolling TOTP | **Adopted** (PM-confirmed) |
| A2 | Gate both password and Google/Keycloak sign-in | One second factor genuinely protects the whole account | Touches `SessionService.signIn` (the Google path) and its Keycloak-brokered nonce flow (ADR-013) too — materially larger, more security-sensitive surface for this change | Not adopted now — reasonable follow-up, not done here |
| B1 | Store the TOTP secret as a plain column (Key Choice 2) | No new key-management system for a single field, consistent with ADR-007's N/A rationale and the team-scale note in ADR-011 | Secret is readable by anyone with database access, same as the DB credentials it already sits alongside | **Adopted** |
| B2 | Application-layer envelope encryption of the secret column | Defense in depth if the database alone is compromised | Requires a key-management architecture (key storage, rotation, access control) this project has explicitly declared out of scope everywhere else (ADR-007 N/A) — introducing one bespoke to this column is disproportionate | Not adopted |
| C1 | Recovery via `super_admin` disabling a locked-out account's TOTP (existing admin capability class: deactivate, reset temp password) | No new mechanism; reuses the existing super_admin-floor account-management surface | A locked-out user depends on an administrator being reachable | **Adopted** |
| C2 | One-time backup/recovery codes, generated at setup | Self-service recovery, industry-standard pattern | A second secret-bearing artifact to generate, store (hashed), and display exactly once — real added scope not requested by the PM | Not adopted now — recorded as a follow-up |
| D1 | `@Value`-defaulted config, nothing added to `application.yml` (Key Choice 4) | Works correctly with zero file changes under `SEC-001`/`SEC-003`; secure default if never configured | The dev bypass is invisible in `application.yml` until someone reads this ADR or the class Javadoc | **Adopted** |
| D2 | Required `@ConfigurationProperties` block (matches `AppProperties`'s existing style) | More discoverable, consistent with `AppProperties` | Requires the key to exist in `application.yml`, which this change cannot add under the same constraint that stopped `RegistrationOtpMailer`/`spring.mail.host` from being pre-configured | Not adopted |

## 4. Consequences

### 4.1 Positive Impacts
- Fills in a UI element (`SecurityTab`'s 2FA toggle) that has been visibly
  present and non-functional since it was built.
- Reuses three already-battle-tested patterns (challenge/token table,
  hashed-at-rest, hourly purge; fail-fast startup guard; narrow per-endpoint
  DTOs) rather than introducing new ones, keeping review surface small
  relative to the feature's size.
- A stolen or guessed password alone no longer signs in to an account that
  has enrolled TOTP.

### 4.2 Negative Impacts / Costs to Accept
- **The TOTP secret is not encrypted at the application layer** (Key Choice
  2) — stated plainly above, not a silent gap.
- **Google/Keycloak sign-in remains single-factor** even for an account that
  has enrolled TOTP (Alternative A1) — an account compromised via a stolen
  Google session bypasses this control entirely. Accepted scope boundary,
  not an oversight.
- **No recovery codes** (Alternative C2) — losing the authenticator device
  means asking a `super_admin` to disable TOTP on the account, the same
  operational dependency ADR-020's temporary-password invite already
  accepts for "I forgot my password."
- **No new rate limiting on the TOTP code itself** — same accepted, already-
  recorded gap as `/login-password`, `/forgot-password`, and `/register`
  (ADR-014/018/021), now extended to `/mfa/verify`. `last_used_step`
  prevents replay of one captured code, not brute force of the whole
  6-digit space.

### 4.3 Follow-up Work
- [ ] Extend MFA to the Google/Keycloak sign-in path (Alternative A2) if the
      PM decides single-factor Google sign-in on an MFA-enrolled account is
      an unacceptable gap.
- [ ] Recovery/backup codes (Alternative C2), if administrator-mediated
      recovery proves too slow in practice.
- [ ] IP- or account-level rate limiting for `/login-password` and
      `/mfa/verify` together — the same open item ADR-014/018/021 already
      carry forward.
- [ ] Confirm with the PM whether `app.otp.enabled=false` should be wired
      into a CI-only profile explicitly, rather than relying on `dev`/`test`
      already being the profiles used there.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|---|---|---|---|
| Real TOTP code required by default | Integration test: fresh deployment, no `app.otp.*` config, enrolled account, correct password + wrong/no code → refused | Per release | 100% refusal without a valid code |
| Dev fake-code path disabled outside `dev`/`test` | `OtpDevModeGuardTest`: context refuses to start with `app.otp.enabled=false` and no `dev`/`test` profile active | Per release | Always throws |
| Replay of a spent TOTP code is refused | `TotpServiceIntegrationTest`: same code presented twice within its validity window → second refused | Per release | 100% refusal on reuse |
| Secret never returned after setup completes | API test: `GET /mfa/status` and every other authenticated response shape checked for the absence of a `secret`/`qrCodeDataUri` field once `confirmed_at` is set | Per release | Never present post-confirmation |
| Disable requires current password | Security test (negative): `/mfa/disable` without/with wrong `currentPassword` is refused | Per release | 100% refusal |

## 6. References

- Related code: `backend/src/main/resources/db/migration/V15__totp_mfa.sql`,
  `backend/src/main/java/com/coc/docs/auth/TotpService.java`,
  `backend/src/main/java/com/coc/docs/auth/AccountTotpRepository.java`,
  `backend/src/main/java/com/coc/docs/auth/MfaLoginChallengeRepository.java`,
  `backend/src/main/java/com/coc/docs/config/OtpProperties.java`,
  `backend/src/main/java/com/coc/docs/config/OtpDevModeGuard.java`,
  `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `frontend/components/settings/SecurityTab.tsx`,
  `frontend/components/settings/TotpSetupForm.tsx`, `frontend/app/login/page.tsx`
- Related requirements: `FR-AUTH-002`, `FR-AUTH-007`, `FR-AUTH-009` (new),
  `NFR-SEC-AUTH`, `NFR-SEC-SESSION`
- Related ADR: ADR-011 (security model, revised authentication pillar
  narrative — TOTP is a second factor layered on top of, not a replacement
  for, its existing chain of custody), ADR-014 (password sign-in, the path
  this gates), ADR-021 (the challenge/token shape this reuses), ADR-013
  (Keycloak/Google — explicitly out of scope, Alternative A1), ADR-007
  (key management, N/A — cited directly by Key Choice 2), ADR-022 (current-
  password-required-for-sensitive-self-service-actions precedent, Key
  Choice 7)

## Numbering

Drafted and implemented as "ADR-028" before `origin/dev` merged its own,
unrelated `ADR-028-live-notification-stream.md` first. Renumbered to 031 on
pulling `dev` a second time, the same situation
[ADR-030](ADR-030-revision-of-022-024-google-only-account-may-set-initial-password.md)'s
own numbering note already records for this branch (and, before that,
[ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md)'s)
— no decision in this document changed.

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-16 | 1.0 | Initial draft, implemented alongside the code it describes | AI, on direct PM/developer instruction |
| 2026-09-16 | 1.1 | Key Choice 6 revised: removed the login page's "Set up two-factor authentication" disclosure link, on direct PM/developer instruction, before this ADR's first approval — `frontend/app/login/page.tsx` no longer mentions TOTP setup at all | AI, on direct PM/developer instruction |
| 2026-09-16 | 1.2 | New Key Choice 8: enrollment now requires an existing password, enforced in `TotpService.startSetup` and mirrored (disabled, not hidden) in `SecurityTab` — on direct PM/developer instruction, before this ADR's first approval | AI, on direct PM/developer instruction |
| 2026-09-16 | 1.3 | Renumbered from ADR-028 to ADR-031 on pulling `dev` a second time, whose own unrelated ADR-028 (live notification stream) landed first — see this file's own Numbering section. No decision changed | AI, on direct PM/developer instruction |

---

**Approval**
| Date | Approver | Comments | Status |
|---|---|---|---|
| 2026-09-16 | — | Recorded per this repo's process (an ADR is mandatory for a new authentication-chain decision, `CONST-SEC-01`/ADR-011 umbrella) — not a substitute for PM sign-off, which this file transcribes rather than grants. Gate status (`docs/.harness-state.yaml`) is untouched by this ADR; only a human records gate approval (`CONST-PROC-01`). | **PENDING** |
