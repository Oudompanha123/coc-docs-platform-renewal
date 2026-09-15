# ADR-022: A voluntary password change must prove the current password — revision of ADR-020

## Status
**ACCEPTED** — 2026-09-15

Revises [ADR-020](ADR-020-revision-of-017-temporary-password-invite.md)
(admin-invited temporary passwords, still **PROPOSED**) at one point only:
`POST /api/v1/auth/change-password` gains a current-password check for the
case ADR-020 did not need one for. ADR-020's own decisions — the temporary-
password invite shape, `must_change_password`, `MustChangePasswordInterceptor`,
`updatePasswordHash` clearing the flag, no session-ending on success — are
all unchanged.

- Deciders: PM direction, given directly ("implement the Change Password
  feature... current password, new password, confirm new password"), for
  the "My Profile" self-service entry point this ADR wires up.
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision, and this one is also a genuine security
  decision) — not as a substitute for PM sign-off.**

---

## Context

`POST /change-password` already existed, built for exactly one caller: someone
who just signed in with a `super_admin`-issued temporary password and is
completing that first login. Its own javadoc already said it "is not
restricted to that case; any account holding a password credential can use
it" — but nothing about it actually required a *current* password. It only
ever asked for `newPassword`/`confirmPassword`, and rejected only one thing:
reusing the account's existing hash as the "new" one.

That gap was harmless while the endpoint was reachable only through the
narrow forced-first-login flow, immediately after `/login-password` had just
verified the temporary credential on this exact session. It stops being
harmless the moment a **voluntary** "My Profile → Change Password" entry
point exists: a session token alone — left live on a shared machine, or lifted
by an XSS the `httpOnly` cookie doesn't fully close off (ADR-011) — would then
be sufficient, by itself, to silently replace the account's password and lock
the real owner out. Building the self-service UI the PM asked for is what
makes this a real, not merely theoretical, gap.

## Decision

`SessionService.changeOwnPassword(caller, currentRawPassword, newRawPassword)`
now requires and verifies `currentRawPassword` against the stored hash —
**unless** `caller.account().mustChangePassword()` is `true`, in which case
the check is skipped entirely, because `/login-password` just performed the
equivalent proof, on this exact session, moments earlier.

- Wrong or missing current password (voluntary case only) → `400`, `"your
  current password is incorrect"`.
- `ChangePasswordRequest.currentPassword` is a new field, deliberately **not**
  `@NotBlank` — the forced-flow frontend (`/create-password`) sends none, and
  the DTO has no way to know which case a given request is until the service
  reads `mustChangePassword`.
- The response message now also depends on which case ran:
  `"Password created successfully. You can now access your account."` for the
  forced flow (unchanged), `"Your password has been changed."` for the
  voluntary one — the old message would otherwise tell someone who already
  had full access that they are only now getting it.
- New frontend surface: a `ChangePasswordForm` (current/new/confirm, shared
  component) wired into the previously inert "Change password" buttons on
  **My Profile** (`ProfileModal`) and, since it was sitting right next to it
  with the same dead button and stale "Google-only, no password" copy,
  **Settings → Security** (`SecurityTab`) as well.

### Key Choices

1. **One endpoint, branching on `mustChangePassword`, not two endpoints.**
   `mustChangePassword` already exists precisely to distinguish "still under
   the forced flow" from "normal, active account" everywhere else in this
   codebase (`MustChangePasswordInterceptor`, `RequireSession`). Reusing it
   here is the narrowest change; a second near-duplicate endpoint (same DTO
   shape minus one field, same audit action, same session-revocation
   behaviour) would be exactly the kind of duplication this codebase
   otherwise avoids (compare `AccountService.register` being reused by both
   the OTP-verified and — before ADR-021 — direct registration paths).
2. **Checked in the service, not the controller.** Every other business rule
   this method already enforces (Google-only refusal, reuse refusal) lives
   here, not in `AuthController`; the current-password check follows the
   same convention rather than inventing a controller-level special case.
3. **Reported plainly, not folded into a generic failure.** ADR-018 decision
   3's anti-enumeration genericism exists to stop an unauthenticated third
   party from learning facts about *someone else's* account. There is no
   such third party here: the caller already holds a live session as
   themselves, and telling them "your current password is incorrect"
   discloses nothing beyond what they just typed.
4. **`currentPassword` stays optional at the DTO level, required at the
   service level.** Making it unconditionally `@NotBlank` would break the
   already-shipped `/create-password` forced flow, which sends none. The
   alternative — updating that page to also collect and submit the temporary
   password — was considered and rejected as unnecessary scope: the forced
   flow's security property (proof of the credential, on this session,
   moments earlier via `/login-password`) is already equivalent.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Leave `/change-password` exactly as ADR-020 shipped it; build the voluntary UI on top of a check-free endpoint | No backend change | Ships a real, discoverable "steal a session, lock out the owner" path | Not adopted |
| B | A second, separate endpoint (e.g. `/change-password-voluntary`) only for the self-service case, leaving ADR-020's endpoint untouched | Zero risk to the forced flow; fully independent | Near-total duplication of DTO, audit action, and session-revocation logic for a distinction (`mustChangePassword`) the codebase already has a field for | Not adopted |
| C | Extend the existing endpoint/service with an optional `currentPassword`, required and verified only when `mustChangePassword` is false | Smallest change; reuses the flag every adjacent piece of logic already keys off; one endpoint stays one endpoint | The contract now branches on account state — a reader must know why the field is sometimes optional (mitigated by javadoc on both the DTO and the service method) | **Adopted** |
| D | Also update `/create-password` to collect and resend the temporary password, making the check unconditional everywhere | Simpler DTO (`currentPassword` could become always-required); marginal defense-in-depth for the forced flow too | Unrequested rework of an already-shipped, already-tested screen; the forced flow's proof-of-credential is already equivalent via `/login-password` | Not adopted |

## Consequences

### Positive
- Closes a real "session alone ⇒ full account takeover" gap before it became
  reachable through a discoverable, documented UI entry point.
- `ProfileModal` and `SecurityTab` lose their long-standing dead "Change
  password" buttons and factually stale "Google-only, no password to manage"
  copy — both now do exactly what they say.

### Negative — stated plainly
- **The endpoint's contract now depends on account state** in a way it did
  not before: whether `currentPassword` is required is a fact about the
  caller, not about the request shape alone. Documented on the DTO and the
  service method specifically so a future reader isn't left to reverse this
  from behaviour.
- **No rate limiting on repeated wrong-current-password guesses** — the same
  "no rate limiting yet" gap ADR-018/ADR-019/ADR-020 already carry forward,
  now also true of this check. A live session is still needed to attempt it
  at all, which bounds the exposure somewhat, but does not close the gap.
- **Test churn in `AuthControllerTest$ChangePassword`**: every existing case
  needed its mock-verification arity updated for the new
  `(caller, currentPassword, newPassword)` signature, and the "changes the
  password" test's expected message changed (it exercises the voluntary
  case, since its test caller defaults `mustChangePassword` to `false`).
  Mechanical, not a sign the tests were wrong before.

### Required follow-up
1. Shared with ADR-020's own list, now also covering this field: `docs/api/openapi.yaml`
   needs `currentPassword` added to `ChangePasswordRequest`'s schema.
2. Shared with ADR-020 item 3: `REQUIREMENTS-SPEC.md` still records no
   `FR-AUTH-*` requirement for either the temporary-password invite flow or
   this voluntary change-password screen. Outstanding for both, not newly
   introduced here.
3. Rate limiting on `/change-password` (and its siblings) remains open —
   carried forward, not closed.

## References
- Revises: [ADR-020](ADR-020-revision-of-017-temporary-password-invite.md)
  (current-password check only; every other decision unchanged)
- Precedent followed: [ADR-018](ADR-018-revision-of-014-password-reset.md)
  decision 3 (a rejected value the caller already holds is reported
  plainly, not folded into a generic failure)
- Requirements: `FR-AUTH-002`, `FR-AUTH-007` (existing; no new REQ-ID
  assigned yet — see Required follow-up 2, shared with ADR-020's own
  identical gap)
- Code: `backend/src/main/java/com/coc/docs/auth/dto/ChangePasswordRequest.java`,
  `backend/src/main/java/com/coc/docs/auth/SessionService.java`
  (`changeOwnPassword`), `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/test/java/com/coc/docs/auth/ChangeOwnPasswordIntegrationTest.java`,
  `frontend/components/auth/ChangePasswordForm.tsx`,
  `frontend/components/layout/ProfileModal.tsx`,
  `frontend/components/settings/SecurityTab.tsx`, `frontend/lib/auth/api.ts`
