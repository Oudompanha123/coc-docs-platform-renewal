# ADR-030: A Google-only account may set an initial password from My Profile — revision of ADR-022/ADR-024

## Status
**ACCEPTED** — 2026-09-15

Revises [ADR-022](ADR-022-revision-of-020-voluntary-change-password-requires-current-password.md)
and [ADR-024](ADR-024-revision-of-022-forced-first-login-also-verifies-temporary-password.md) at
one point each: `SessionService.changeOwnPassword` gains a third branch, for an
account with no password hash at all, alongside the two those ADRs already
cover (forced first-login, voluntary change). Both ADRs' own decisions for
those two existing branches — unconditional current-password verification,
plain error message, session-revocation behaviour, one endpoint rather than
two — are unchanged.

- Deciders: User direction, given directly ("users who registered with Google
  should not be required to enter their current password, while users who
  registered with a password must enter their current password before
  changing it"), for the **My Profile → Change Password** screen.
- **Recorded here per this repo's process (an ADR is mandatory for a
  revision of an existing decision, and this one is also a genuine security
  decision) — not as a substitute for PM sign-off.**

---

## Context

`SessionService.changeOwnPassword` today refuses outright, before checking
anything else, when the caller's account holds no `password_hash`:
`"this account has no password set; sign in with Google instead"`. This is
not an oversight — `AccountRepository.updatePasswordHash`'s own javadoc
already flags the gap: "Also usable to give a Google-only account its first
password hash, but nothing in this codebase does that yet." The frontend
does not know the difference either: `ChangePasswordForm` always renders and
requires a "Current Password" field, for every caller, regardless of whether
the account has one — so a Google-only user sees a normal-looking form,
fills in something for "Current Password" because the field demands it, and
is refused with a message that only makes sense in hindsight.

The practical effect: an account that signed up with Google has no way,
anywhere in the product, to also gain a password credential — not through
this screen, not through `/forgot-password` (ADR-018 Decision 2 explicitly
declined to make that endpoint do it, as a *side effect* of a different
action nobody asked for), not through any other door. The PM has now asked
for the specific door this ADR opens: the self-service "Change Password"
screen should let a Google-only account set one, without pretending it has
a current password to prove.

## Decision

`SessionService.changeOwnPassword(caller, currentRawPassword, newRawPassword)`
now reads whether the account already holds a password hash and branches on
that fact, in addition to the `mustChangePassword` distinction ADR-022/024
already established:

- **No existing hash (this ADR).** Neither the current-password proof nor
  the reuse check runs — there is no stored hash for either to compare
  against. The new hash is written directly.
- **An existing hash, forced first-login (`mustChangePassword` = true,
  ADR-024).** Unchanged: `currentRawPassword` is required and verified
  against the temporary hash.
- **An existing hash, voluntary change (ADR-022).** Unchanged:
  `currentRawPassword` is required and verified against the real hash, and
  reuse is refused.

Making that branch possible required two smaller, mechanical changes:

- **`Account` gains `hasPassword()`.** An account-level fact, the same
  treatment `mustChangePassword` already has on this record (see its own
  javadoc: "not a secret the way the hash is") — derived in SQL as
  `password_hash is not null` in `AccountRepository`, so the hash itself
  still never leaves the two queries that already read it
  (`findCredentialByEmailIgnoreCase`, `findCredentialById`). Exposed on
  `MeResponse` so `ProfileModal`/`SecurityTab` can decide what to render
  before the caller ever opens the form — not just how the backend responds
  after the fact.
- **`ChangePasswordRequest.currentPassword` reverts to unconstrained at the
  DTO level** — ADR-024's `@NotBlank` assumed both callers always had a
  value to send, which stops being true for this third caller. Bean
  Validation cannot see account state, so "is a value required" moves back
  into the service, this time keyed on `hasPassword` rather than
  `mustChangePassword`.
- **The response message gains a third variant**, chosen in
  `AuthController.changePassword` from `caller.account().hasPassword()` —
  read *before* the call, the same technique ADR-022 already used with
  `mustChangePassword` — since the flag flips the moment the write
  succeeds and the controller needs to know what was true a moment earlier.
- **Frontend**: `ChangePasswordForm` takes a `hasPassword` prop and, when
  `false`, omits the "Current Password" field entirely — not merely makes it
  optional — and never sends `currentPassword` for that caller.
  `ProfileModal`/`SecurityTab` read "Set a password" rather than "Change
  password" in that state.

### Key Choices

1. **Branches on `hasPassword`, a server-read fact, not a client-asserted
   one.** The same reasoning `mustChangePassword` already established for
   this exact method: what is required is a fact about the account, decided
   server-side from the database, never something the request body could
   claim on the caller's behalf.
2. **`currentPassword` goes back to optional at the DTO layer**, rather than
   having the frontend send an empty string or other filler to keep it
   `@NotBlank`-satisfying. A field the wire format demands but the server
   ignores is a worse contract than an honestly optional one — precisely
   the shape ADR-022 used before ADR-024 tightened it for the two cases
   where it was safe to.
3. **One endpoint, now three branches, not a second endpoint.** Continues
   ADR-022's Key Choice 1: `/change-password` already carries the DTO,
   audit action, and session-revocation logic every one of these cases
   needs; a `/set-password` endpoint would duplicate all of it for a
   distinction the service can already tell apart.
4. **Does not reopen ADR-018 Decision 2.** That decision refused to let
   `/forgot-password` — unauthenticated, and about a different, unrelated
   action — silently provision a password as a side effect. This is the
   opposite shape: an authenticated caller, on the one screen whose entire
   purpose is credential management, choosing this deliberately. It is the
   door `AccountRepository.updatePasswordHash`'s javadoc already named as
   unbuilt, not a new one.
5. **No re-proof of the Google identity at the moment the password is set.**
   Considered and rejected as unrequested scope — the caller already holds a
   live, server-resolved session as this exact account, the same standing
   ADR-022 relies on to justify its plain (non-generic) error message.

## Alternatives Considered

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| A | Leave the backend refusal in place; have the frontend simply hide the "Change password" button for a Google-only account | Zero backend change | The server remains a wall behind a hidden door rather than the actual source of truth; does not give the PM what was asked for (the ability to set one) | Not adopted |
| B | A separate `/set-password` endpoint, reachable only when no hash exists, leaving `/change-password` and ADR-024's unconditional check completely untouched | Zero risk to the two existing, already-hardened branches | Near-total duplication of DTO shape, audit action, and session-revocation logic — the exact objection ADR-022's own Alternative B already raised and rejected | Not adopted |
| C | Extend `changeOwnPassword` with a third branch keyed on `credential.passwordHash() == null`; `currentPassword` returns to optional at the DTO level | Smallest change; reuses the one endpoint and one service method every adjacent branch already lives in; mirrors ADR-022's original shape for the branch that needs it | The contract now depends on two independent facts about the caller (`mustChangePassword`, `hasPassword`) instead of one — mitigated by javadoc on both | **Adopted** |
| D | Require re-authenticating with Google immediately before the set, as extra proof of control | Marginal defense-in-depth | Unrequested; the live session is already equivalent proof, and Google sign-in already happened once for it to exist | Not adopted |

## Consequences

### Positive
- Google-only accounts gain the password credential path the schema and
  `AccountRepository.updatePasswordHash`'s own javadoc already anticipated —
  closing a real, previously dead affordance rather than a hypothetical one.
- "Change Password" stops lying to a fraction of accounts: the field and the
  copy now match what will actually happen before the caller submits
  anything.

### Negative — stated plainly
- **`changeOwnPassword`'s contract now branches on two independent facts**
  (`mustChangePassword`, `hasPassword`) rather than one. A reader has to
  know both to predict whether `currentPassword` is required — documented on
  the DTO and the service method, same mitigation ADR-022 already used for
  the first axis.
- **`ChangePasswordRequest.currentPassword` becomes optional at the DTO
  level again**, partially undoing ADR-024's "required, full stop"
  simplification — that property now holds for the two pre-existing
  branches only, not universally.
- **Test churn**: `ChangeOwnPasswordIntegrationTest.refusesGoogleOnlyAccount`
  is replaced with a test asserting the opposite (the same direction of
  churn ADR-024 already recorded once); `AuthControllerTest.ChangePassword
  .rejectsMissingCurrentPasswordDuringForcedFirstLogin` no longer describes
  real behaviour — a missing `currentPassword` now reaches the (mocked)
  service instead of being stopped at the DTO boundary — and is removed,
  since the real rejection is already covered by
  `ChangeOwnPasswordIntegrationTest`'s forced-first-login cases against a
  real database; every direct `new Account(...)` call site
  (`TestCallers`, `AccountTest`, `AdminAccountControllerTest`,
  `NotificationServiceTest`, plus `AccountRepository` and
  `SessionService.refreshProfile` in production code) needed the new field
  added. Mechanical, not a sign the prior tests were wrong for their time.
- **No rate limiting on this endpoint**, still — the same gap ADR-018/019/020/022
  already carry forward, now also true of the initial-set branch. A live
  session is still required to reach it at all.

### Required follow-up
1. Shared with ADR-020/022/024's own open item: `docs/api/openapi.yaml`
   needs `ChangePasswordRequest.currentPassword` reverted to optional, and
   `MeResponse` needs `hasPassword` added.
2. Shared with ADR-020/022/024's own open item: `REQUIREMENTS-SPEC.md`
   still records no `FR-AUTH-*` requirement for the change-password
   screens — outstanding for all of them, not newly introduced here.
3. Rate limiting on `/change-password` (and its siblings) remains open —
   carried forward, not closed.

## References
- Revises: [ADR-022](ADR-022-revision-of-020-voluntary-change-password-requires-current-password.md)
  (adds a third branch alongside its voluntary-change one),
  [ADR-024](ADR-024-revision-of-022-forced-first-login-also-verifies-temporary-password.md)
  (`currentPassword` returns to optional at the DTO level; its own
  forced-first-login branch is otherwise untouched)
- Does not revise: [ADR-018](ADR-018-revision-of-014-password-reset.md)
  Decision 2 — different trigger (authenticated self-service vs. an
  unauthenticated recovery flow's side effect); see Key Choice 4
- Requirements: `FR-AUTH-002`, `FR-AUTH-005`, `FR-AUTH-007` (existing; no new
  REQ-ID assigned yet — see Required follow-up 2, shared with prior ADRs'
  identical gap)
- Code: `backend/src/main/java/com/coc/docs/account/Account.java`,
  `backend/src/main/java/com/coc/docs/account/AccountRepository.java`,
  `backend/src/main/java/com/coc/docs/auth/SessionService.java`
  (`changeOwnPassword`, `refreshProfile`),
  `backend/src/main/java/com/coc/docs/auth/dto/ChangePasswordRequest.java`,
  `backend/src/main/java/com/coc/docs/web/AuthController.java`,
  `backend/src/main/java/com/coc/docs/web/ApiDtos.java` (`MeResponse`),
  `backend/src/test/java/com/coc/docs/auth/ChangeOwnPasswordIntegrationTest.java`,
  `backend/src/test/java/com/coc/docs/auth/AuthControllerTest.java`,
  `backend/src/test/java/com/coc/docs/auth/TestCallers.java`,
  `frontend/components/auth/ChangePasswordForm.tsx`,
  `frontend/components/layout/ProfileModal.tsx`,
  `frontend/components/settings/SecurityTab.tsx`, `frontend/lib/auth/api.ts`

## Numbering

Drafted and implemented as "ADR-027" before `origin/dev` merged its own,
unrelated `ADR-027-new-device-sign-in-alerts.md` first. Renumbered to 030
on pulling `dev` to avoid a genuine collision — the same situation
[ADR-019](ADR-019-revision-of-018-forgot-password-reveals-existence.md)'s
own numbering note records; no decision in this document changed. 028 and
029 were taken in the same window by ADR-031 (TOTP second factor) and
ADR-029 (forgot-password covers Google-only accounts), both also awaiting
first review — 030 is the next number free of any of the three.
