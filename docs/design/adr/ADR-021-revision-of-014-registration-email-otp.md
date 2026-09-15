# ADR-021: Email OTP for registration, and removing the phone number field — revision of ADR-014/ADR-017

## Status
**ACCEPTED** — 2026-09-14

Revises [ADR-014](ADR-014-revision-of-008-password-registration.md) (password
self-registration) and [ADR-017](ADR-017-approval-gate.md) (the approval
gate). Neither is replaced: the approval gate (an application is
`pending`/`guest` until a `super_admin` approves it) is unchanged and still
runs, unmodified, at the end of this flow. This ADR only changes *how many
steps* self-registration takes and *what* it collects.

- Deciders: PM — Flow task QIW22 ("Register send OTP & Remove phone number
  from register") followed by explicit, fully-specified direction in the
  same working session (the three-step flow in "Decision" below is taken
  verbatim from that instruction).
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision) — not as a substitute for PM sign-off,
  which is the instruction this ADR transcribes.**

---

## Context

ADR-014 made `POST /register` a single call: email, display name, and
password in, a `pending`/`guest` account row out (ADR-017 gates it from
there). Nothing in that call ever confirmed the caller controls the email
address they typed — a typo, or someone else's address entered by mistake or
on purpose, produced an identical `pending` row waiting in the same
`super_admin` queue as a genuine applicant.

Separately, the registration form has carried a **Phone Number** field since
before ADR-014 existed, collected to match an approved visual mockup but
never sent to the backend — `register/page.tsx` says so explicitly, and
there has never been a `phone` column on `account` (confirmed against
`V1__initial_schema.sql` and every migration since). It has been dead UI
this whole time.

The PM asked for both fixes together: verify the email before an
application is created, and remove the field that was never wired up.

## Decision

Registration becomes three steps, exactly as specified:

1. **Submit the form** — full name, email, password, confirm password
   (client-side match check only, as today), agree to Terms — unchanged
   request shape (`RegisterRequest`: email, displayName, password). No
   account row is created here.
2. **A 6-digit code is emailed** to the address given. Nothing for the
   caller to do but check their inbox.
3. **The code is confirmed** and *that* is what creates the account — via
   the same `AccountService.register(email, displayName, passwordHash)`
   ADR-014/017 already established. The approval gate is reached exactly as
   before; this ADR only moves *when* that method is called, not what it
   does.

Concretely:

| Step | Endpoint | Creates a row? |
|---|---|---|
| 1 | `POST /api/v1/auth/register` | A `registration_challenge` row only — not an account |
| 2 | *(email delivery; no endpoint)* | — |
| 3 | `POST /api/v1/auth/register/verify` | The `account` row, `pending`/`guest`, via unchanged `AccountService.register` |
| *(resend)* | `POST /api/v1/auth/register/resend` | Replaces the challenge row with a fresh code |

The phone number field is deleted from `frontend/app/register/page.tsx` —
the input, its `PhoneIcon` import, its `useState`, and its validation. It
was never read past that file even before this change.

### Key Choices

1. **A new table, not a new `account` status.** `registration_challenge`
   holds the would-be account's email, display name, and *already-hashed*
   password alongside the hashed code, entirely separate from `account`.
   The alternative — inserting the account row at step 1 with some
   `unverified` status — was rejected: it would mean two different
   "not really registered yet" states in the same table
   (`unverified` and ADR-017's `pending`), a second thing for the
   `super_admin` queue (`AccountService.listPending`) to have to filter
   out, and abandoned/never-verified rows permanently occupying the
   `account.email` unique constraint. Keeping the pending application out
   of `account` entirely until it is real is the narrower change.

2. **Hashed at rest, mirroring `password_reset_token`.** Only
   `SHA-256(code)` is stored (`SessionService.hash`, the same helper
   ADR-018 already reuses) — a dumped table row is not a usable code, same
   property `password_reset_token` already has. The pre-hashed
   **password** is stored as given to this table for the same reason
   `AccountService.register`'s javadoc already states for `account.password_hash`
   itself: hashing is the web layer's job, done once, before either table
   ever sees the plaintext.

3. **One live challenge per email, replaced rather than extended.** A
   unique index on `lower(email)` means a second `/register` submission for
   an address already mid-verification, or an explicit `/resend`, deletes
   the old row and inserts a completely fresh one — new code, new 10-minute
   window, `resend_count` incremented. This was chosen over "extend the
   existing expiry": a fresh code is a fresh secret, and reusing a code the
   caller has already seen (and may have mistyped, or which someone
   watching over their shoulder saw) provides no security. It has one
   effect worth naming plainly: resubmitting the full form for an address
   already mid-verification is indistinguishable from calling `/resend` —
   both reset the attempt counter. See Consequences for why that is not the
   brute-force hole it looks like.

4. **6 digits, 10-minute TTL, 5 wrong-code attempts, 60-second resend
   cooldown** — all fixed, system-wide constants
   (`RegistrationOtpService`), the same "one behaviour, not a knob"
   precedent `AppProperties`'s session TTL and ADR-018's 30-minute reset
   window already set. 10 minutes rather than ADR-018's 30: this code is
   meant to be typed back in immediately after arriving, not saved for
   later the way a reset link sometimes is.

5. **Expired and wrong-code are reported distinctly**, unlike the
   anti-enumeration genericism `/login-password` and (mostly)
   `/forgot-password` use. That genericism exists to stop an
   unauthenticated caller from learning facts about *someone else's*
   account. There is no equivalent third party here: by the time someone
   calls `/verify`, they are the one who supplied this exact email to
   `/register` in their own browser a moment earlier. Telling them plainly
   "expired, request a new one" versus "wrong code" follows ADR-018's
   `/reset-password` precedent (Decision 3: a rejected value the caller
   already holds is reported plainly) rather than `/forgot-password`'s.

6. **Delivery reuses the `PasswordResetMailer` shape exactly** —
   `RegistrationOtpMailer` takes `JavaMailSender` through the same
   `ObjectProvider`, autoconfigured only when `spring.mail.host` is set,
   and falls back to logging the code when it is not (local development
   only; see that class's javadoc for why this cannot be closed from code
   under `SEC-001`/`SEC-003`). No new configuration key — it reuses
   `app.mail.from`.

7. **Phone removal is the frontend UI only.** There was never a backend
   field, DTO property, or column to remove.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Keep single-step `/register`, verify email *after* the account is already `pending` (send the code, but let it sit `pending` either way) | Smallest code change | Does not satisfy the request — an unverified email still produces a queued application indistinguishable from a real one | Not adopted |
| B | Create the `account` row at step 1 with a new `unverified` status, promote to `pending` on verify | Reuses `account` as the single source of truth; no second table | Two "not really in" states to reason about everywhere `AccountStatus` is switched on; abandoned attempts permanently claim the email's unique constraint; the approval queue (`listPending`) needs a second filter | Not adopted |
| C | Separate `registration_challenge` table; account created only on verify, via the existing `AccountService.register` | Keeps `account` meaning exactly what it means today; an abandoned attempt self-expires and frees the email; smallest change to ADR-017's approval gate (none) | A second table to maintain and purge | **Adopted** |
| D | SMS OTP to a phone number | Matches the literal words "send OTP" without also implying email | Contradicts the same instruction's second half (remove the phone field); no telephony provider exists anywhere in this stack; the task's own step 2 says "to the user's email" | Not adopted |

## Consequences

### Positive
- An account application can no longer be queued for an email address the
  applicant does not control.
- The dead phone number field — collected, validated client-side, then
  silently dropped — is gone; the form now only asks for what is actually
  used.
- `AccountService.register` and everything downstream of it (ADR-017's
  gate, the audit entry, the approval queue) are **untouched** — this ADR
  is additive in front of that method, not a rewrite of it.

### Negative — stated plainly
- **No IP-based or account-wide rate limiting.** The 60-second resend
  cooldown and 5-attempt cap bound abuse of any *one* email address, but
  nothing stops a script from calling `/register` for many different
  addresses in a tight loop, each one triggering a real email send. This is
  the same gap ADR-018 already recorded for `/forgot-password` and
  `/register`, carried forward rather than closed here.
- **Resubmitting the form resets the attempt counter**, same as an
  explicit `/resend` (Key Choice 3). This is deliberately not a brute-force
  hole — each reset also mints a brand-new, independent 6-digit secret, so
  five wrong guesses against code *A* teach nothing about code *B* — but it
  does mean the 5-attempt cap is a per-code budget, not a per-email one. An
  attacker who does not need the account (only wants to see whether they
  can eventually guess right) can keep resetting and keep trying, bounded
  only by the 60-second cooldown: roughly 5 guesses/minute against a
  1-in-1,000,000 secret, forever. Slow, but not zero, and it compounds with
  the rate-limiting gap above.
- **A `registration_challenge` row briefly holds a bcrypt password hash for
  an account that does not exist yet.** Same sensitivity as
  `account.password_hash` — a bcrypt hash, not plaintext — but it is now
  readable from a second table for up to 10 minutes (or longer if never
  verified, until the scheduled purge; see Required follow-up).
- **The logged-code fallback is the same production hazard
  `PasswordResetMailer` already carries**, restated here for the new
  class: a deployment with no `spring.mail.host` writes a live,
  usable-right-now registration code to its log stream. Configuring
  `spring.mail.*` before going live remains required follow-up this class
  cannot complete on its own (`application.yml` is off-limits to the AI
  that wrote it, per `SEC-001`/`SEC-003`).

### Required follow-up
1. **Scheduled purge** (`RegistrationOtpMaintenance`, mirroring
   `PasswordResetTokenMaintenance`) removes expired, never-verified
   challenge rows — implemented alongside this ADR, not deferred, but
   listed here because its *cadence* (hourly, offset from the other two
   sweeps) is a judgment call worth someone reviewing.
2. **Rate limiting / abuse control** — already an open item shared with
   ADR-014 and ADR-018's identical gaps on `/register`,
   `/login-password`, and `/forgot-password`. This ADR adds `/register`,
   `/register/verify`, and `/register/resend` to that same list rather than
   closing it.
3. **`REQUIREMENTS-SPEC.md` §7** — assign or amend an `FR-AUTH-*`
   requirement ID for email verification at registration; none exists
   today (`FR-AUTH-002`/`003` cover password storage and admin
   approval/deactivation only). Same outstanding-documentation gap
   ADR-019 already recorded for its own change and has not yet closed.
4. **SMS/phone OTP was raised and explicitly rejected** (Alternative D) —
   recorded so a future "why not phone" question has an answer rather than
   forcing this decision to be re-litigated from nothing.

## References
- Revises: [ADR-014](ADR-014-revision-of-008-password-registration.md),
  [ADR-017](ADR-017-approval-gate.md) (both unchanged in substance — this
  ADR runs in front of them)
- Precedent followed: [ADR-018](ADR-018-revision-of-014-password-reset.md)
  (hashed single-use token shape, optional mailer with dev fallback),
  [ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md)
  (plainly-reported rejection for a value the caller already holds)
- Requirements: `FR-AUTH-002`, `FR-AUTH-003` (existing; no new REQ-ID
  assigned yet — see Required follow-up 3)
- Code: `backend/src/main/resources/db/migration/V9__registration_otp.sql`,
  `backend/src/main/java/com/coc/docs/auth/RegistrationChallenge.java`,
  `backend/src/main/java/com/coc/docs/auth/RegistrationChallengeRepository.java`,
  `backend/src/main/java/com/coc/docs/auth/RegistrationOtpService.java`,
  `backend/src/main/java/com/coc/docs/auth/RegistrationOtpMailer.java`,
  `backend/src/main/java/com/coc/docs/auth/RegistrationOtpMaintenance.java`,
  `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/main/java/com/coc/docs/config/SecurityConfig.java`,
  `frontend/app/register/page.tsx`, `frontend/lib/auth/api.ts`
- Numbering: this ADR was drafted and implemented as "020" before
  `ADR-020-revision-of-017-temporary-password-invite.md` (a concurrent,
  unrelated change — the admin-invite temporary-password flow) merged into
  `dev` under that same number first. Renumbered to 021 on rebase to avoid
  a genuine collision, the same situation ADR-019's own numbering note
  records; no decision here changed.
