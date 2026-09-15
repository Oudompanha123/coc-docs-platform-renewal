# ADR-024: The forced first-login flow also verifies the temporary password — revision of ADR-022

## Status
**ACCEPTED** — 2026-09-15

Revises [ADR-022](ADR-022-revision-of-020-voluntary-change-password-requires-current-password.md)
Decision and Alternative D specifically. Every other ADR-022 decision —
one endpoint branching on account state, checked in the service not the
controller, plain (non-generic) error message, session-revocation
behaviour — is unchanged.

- Deciders: PM direction, given directly ("on page create-password I want
  add field input old password").
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision, and this is also a security decision)
  — not as a substitute for PM sign-off.**

---

## Context

ADR-022 deliberately left `/create-password` (the forced first-login
completion) sending no `currentPassword` at all, reasoning that
`/login-password` had already verified the equivalent proof — the
temporary password — moments earlier on this exact session, and asking
again would be "asking twice for a credential the caller is about to
replace anyway." `SessionService.changeOwnPassword` skipped the
current-password check entirely whenever `caller.account().mustChangePassword()`
was `true`. ADR-022's own Alternatives table recorded this exact change —
"Also update `/create-password` to collect and resend the temporary
password, making the check unconditional everywhere" — as Alternative D,
**not adopted**, calling it "unrequested rework."

The PM has now requested it directly: an old-password field on
`/create-password`. That request is exactly Alternative D, now adopted.

## Decision

`SessionService.changeOwnPassword(caller, currentRawPassword, newRawPassword)`
now requires and verifies `currentRawPassword` against the stored hash
**unconditionally** — the `mustChangePassword` branch that used to skip
the check is removed. Both entry points now behave identically:

- `ChangePasswordRequest.currentPassword` becomes `@NotBlank` — no longer
  the "optional at the DTO level, required at the service level" shape
  ADR-022 introduced, since both callers now always have a value to send.
- Wrong or missing current password → `400`, `"your current password is
  incorrect"`, same message and reasoning as before (ADR-022's plain,
  non-generic report — the caller already holds a live session as
  themselves).
- `/create-password` gains a "Temporary Password" field (`frontend/app/create-password/page.tsx`),
  validated client-side the same way `ChangePasswordForm`'s "Current
  Password" field already is, and sent as `currentPassword`.
- `changePassword()` in `frontend/lib/auth/api.ts` takes `currentPassword`
  as a required parameter for both callers now, not optional.
- The response-message branch on `wasForcedFirstLogin` in
  `AuthController.changePassword` is unchanged — which message comes back
  still depends on which flow this was, only whether the check itself
  runs no longer does.

### Key Choices

1. **Unconditional check, not a second optional field kept around.**
   Once both callers always send a value, keeping the field optional and
   branching on `mustChangePassword` would just be dead complexity ADR-022
   introduced for a caller that no longer exists in that shape. Removing
   the branch is the smaller diff and the more honest contract: the field
   is now required, full stop.
2. **Same verification, same error message, same place in the code.**
   No new failure mode is introduced — the forced flow now hits the exact
   `passwordEncoder.matches(...)` check the voluntary flow already used;
   this ADR only removes the condition that used to exempt it.
3. **`/login-password` is not weakened or replaced.** The temporary
   password is still verified there to establish the session in the first
   place; this adds a second proof of the same credential immediately
   before it is retired, matching what the PM asked for, not a substitute
   for sign-in.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Leave ADR-022 as shipped (forced flow exempt) | No further change | Does not satisfy the PM's explicit request for an old-password field on this page | Not adopted |
| B | Add the field to the frontend only, collect it, but don't send/verify it server-side | Smallest change | A field the backend ignores is misleading — it would look like it does something and doesn't | Not adopted |
| C | Make `currentPassword` unconditionally required and verified for both flows; retire the `mustChangePassword` skip branch | One consistent rule; smallest change once both callers send a value; no dead branch left behind | The forced flow now asks for the temporary password twice in one continuous journey (once to sign in, once here) — judged acceptable since it is what was explicitly requested | **Adopted** |

## Consequences

### Positive
- Satisfies the PM's explicit request without inventing a parallel or
  special-cased endpoint.
- Removes a branch (`mustChangePassword` exemption) ADR-022 itself flagged
  as a contract that "depends on account state" — the rule is now uniform.

### Negative — stated plainly
- **A just-invited user now retypes the same temporary password twice in
  one sitting** (once at `/login-password`, once at `/create-password`).
  This is the direct, requested trade — a small added friction versus the
  extra confirmation of not fat-fingering the wrong thing into the
  new-password field.
- **Test churn**: `ChangeOwnPasswordIntegrationTest.forcedFirstLoginSkipsTheCheck`
  no longer describes real behaviour and is replaced by a test asserting
  the opposite; `AuthControllerTest.ChangePassword.changesPasswordDuringForcedFirstLogin`
  and `frontend/app/create-password/page.test.tsx` needed corresponding
  updates. Mechanical, not a sign the prior tests were wrong for their
  time.

### Required follow-up
1. `docs/api/openapi.yaml` — `ChangePasswordRequest.currentPassword` moves
   from optional to required in the schema (shared with ADR-022's own
   still-open item 1).
2. `REQUIREMENTS-SPEC.md` still records no `FR-AUTH-*` requirement for the
   change-password screens — outstanding, carried forward from ADR-020/022,
   not newly introduced here.

## References
- Revises: [ADR-022](ADR-022-revision-of-020-voluntary-change-password-requires-current-password.md)
  (removes the `mustChangePassword` exemption only; adopts its own
  Alternative D)
- Code: `backend/src/main/java/com/coc/docs/auth/dto/ChangePasswordRequest.java`,
  `backend/src/main/java/com/coc/docs/auth/SessionService.java`
  (`changeOwnPassword`), `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/test/java/com/coc/docs/auth/ChangeOwnPasswordIntegrationTest.java`,
  `backend/src/test/java/com/coc/docs/auth/AuthControllerTest.java`,
  `frontend/app/create-password/page.tsx`, `frontend/lib/auth/api.ts`
