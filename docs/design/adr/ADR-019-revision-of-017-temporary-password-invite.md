# ADR-019: Admin-Invited Accounts Get a Temporary Password, Not Just a Google Match

> **Status**: PROPOSED
> **Date**: 2026-09-14
> **Author**: `backend-developer` (implemented per PM task brief, phase 2)
> **Approver**: PM (pending)
> **Revises**: [ADR-017](ADR-017-approval-gate.md) — `AccountService.create` (the `super_admin` "Add User" path) previously created a Google-only row with no credential of its own. Reuses the password-hash column and sign-in path ADR-014/ADR-018 already built; does not reopen ADR-017's approval gate for self-registration or Google sign-in, and does not touch [FR-AUTH-008](../../requirements/REQUIREMENTS-SPEC.md) — account creation stays `super_admin`-only, confirmed explicitly by the PM against this task's own request to widen it to `admin` as well.
> **Affects**: `FR-AUTH-002` (password storage), `FR-AUTH-003` (account creation), `FR-AUTH-007` (session revocation)

---

## 1. Context

`AccountService.create` — the "Add User" button on the Users & Roles screen — created an account with no password at all. Its owner had to already have signed in with the matching Google identity, or wait to sign in with Google for the first time and land on the row a `super_admin` had prepared. There was no way to hand someone working credentials directly, and no way to onboard anyone who does not (or cannot yet) use Google sign-in.

The task brief asks for the shape most admin tools use instead: generate a temporary password, email it with a login URL, and force the new owner to replace it before they can do anything else. The password self-registration path (ADR-014) and password reset (ADR-018) already built almost everything this needs — `account.password_hash`, bcrypt via `PasswordEncoder`, the `/login-password` sign-in path, `PasswordResetMailer`'s no-SMTP-configured fallback pattern — so this is mostly composition, not new machinery.

**The one genuinely new state**: an account can now be *active and holding a password* but *not yet allowed to use it for anything except replacing itself*. Nothing in the schema or the session model expressed that before.

## 2. Decision

> A `super_admin`-created account gets an active row, a bcrypt-hashed random temporary password, and `must_change_password = true`. Signing in with that password succeeds — the credential is genuine — but every other request is refused until the owner calls `POST /api/v1/auth/change-password` and replaces it.

### Key Choices

- **One boolean, not a new status.** `must_change_password` sits beside `status` and `deactivated_at` on `account`, independent of both — it answers "may this credential still be used for anything but replacing itself", which is a different question from "may this account sign in at all". Modelled on `Account`'s existing javadoc distinction between those two kinds of gate.
- **A new column on `Account` itself, not on `AccountCredential`.** The password hash lives on `AccountCredential` specifically so it never rides along into responses and audit entries `Account` is passed to freely (see that record's own javadoc). `must_change_password` is not a secret in that sense — it is a fact the frontend has to see (to redirect) and the admin screen has to see (to show "invited, awaiting first login"), so it belongs on `Account` the same way `status` does.
- **Enforced twice, on purpose.** The frontend (`RequireSession`, `SessionProvider`) redirects to `/create-password` the moment `/auth/me` reports the flag — that is the whole UX. `MustChangePasswordInterceptor` is the same rule enforced server-side, because ADR-011's whole argument for middleware enforcement over per-route checks is that a client-side redirect is a courtesy, not a control. It allowlists exactly `GET /auth/me`, `POST /auth/change-password`, `POST /auth/logout` — checked by request method as well as path, because `GET /auth/me` (must stay reachable) and `PATCH /auth/me` (must not — it would let a caller rename their own account while dodging the gate) share a path, and a path-pattern exclusion cannot tell them apart.
- **`updatePasswordHash` always clears the flag.** Whichever path lands a new hash on the row — this feature's `/change-password`, or the unrelated `/reset-password` — the temporary credential it was guarding against has just been replaced. One clearing point, at the write, rather than three call sites each remembering to clear it.
- **The change endpoint does not end the caller's own session.** Unlike a reset (which follows an emailed link opened outside any session, so there is never a current session to spare), the caller here is inside the very session they are about to keep using. `SessionRepository.revokeAllForExcept` ends every *other* live session and leaves this one, so "create your password, then you're in" is one continuous session rather than a forced re-login.
- **No new authentication system.** The temporary password sign-in is the existing `/login-password` path with an existing account row; `/change-password` reuses `PasswordEncoder`, `AccountRepository.updatePasswordHash`, and the audit/session-revocation shapes `PasswordResetService` already established.
- **Access stays `super_admin`-only.** The task brief that requested this feature also asked for `admin` to be able to invite users, which would revise `FR-AUTH-008` — a `Must`-priority requirement with its own dedicated negative security test (`AdminAccountControllerTest$AdminIsBlocked`, `SecurityRulesTest$AccountManagement`). Put to the PM directly rather than assumed; the PM's decision was to leave the floor exactly where ADR-011/ADR-017 already put it.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|---|---|---|---|
| 1 | Keep the Google-only invite; add temporary passwords as a second, separate invite mode the admin picks | Preserves the old path unchanged | Two invite flows to explain and maintain for one screen; the task asked for one | No |
| 2 | Model the gate as a third `account_status` value instead of a boolean | Reuses the existing status column | Conflates "was this registration ever approved" with "is this specific credential still temporary" — the two questions `Account`'s own javadoc already keeps apart | No |
| 3 | Enforce the gate only in the frontend | Smaller change; matches how some admin tools do it | Contradicts ADR-011's stated reason for middleware enforcement: a client redirect is not a control | No |
| 4 | **Boolean flag on `account`, enforced by a request interceptor, reusing the password sign-in stack** | Smallest schema change; reuses working machinery; one enforcement point per ADR-011's philosophy | A new interceptor to maintain; a method-aware allowlist is slightly more code than a path-only exclusion | **Yes** |

## 4. Consequences

### 4.1 Positive Impacts

- An admin can onboard someone who has no Google account yet, or who should not use one for this system.
- The plaintext temporary password exists only in `AccountService.create`'s local variable and inside `AccountInviteMailer` — never logged (outside the same local-development fallback `PasswordResetMailer` already documents), never returned in the API response, never in the audit trail.
- The forced-change gate is enforced at the one chokepoint the security model already uses, not scattered across individual endpoints.

### 4.2 Negative Impacts / Costs to Accept

- **A second thing "no SMTP configured" can silently log a credential for**, in local development only — the same accepted trade-off `PasswordResetMailer` already carries, now duplicated in `AccountInviteMailer`. Configuring `spring.mail.*` before any real deployment remains required follow-up neither mailer can complete on its own (`application.yml` is off-limits to the AI writing this code, per this project's own `SEC-001`/`SEC-003`).
- **`Account` gained a tenth field.** Every existing constructor call site needed updating — a one-time mechanical cost, paid in this change (`SessionService`, `AccountRepository`, and every test fixture that built an `Account` directly).
- **No rate limiting on `/change-password`**, matching the gap ADR-018 already accepted and stated for `/forgot-password` and `/reset-password`.

### 4.3 Follow-up Work

| # | Item | Owner |
|---|---|---|
| 1 | Configure `spring.mail.*` before any production deployment — both this mailer and `PasswordResetMailer` depend on it | Ops / PM |
| 2 | `docs/api/openapi.yaml` — add `POST /api/v1/auth/change-password`, and `mustChangePassword` on `MeResponse`/`AccountResponse` | `docs-writer` |
| 3 | Amend `REQUIREMENTS-SPEC.md` to record the temporary-password invite path under `FR-AUTH-002`/`FR-AUTH-003`, matching how ADR-014/ADR-017's amendments were recorded | `docs-writer` + PM |
| 4 | Consider whether the admin screen should surface `mustChangePassword` as a visible "invited, awaiting first login" state on the account row (the field is already returned; no UI reads it yet) | PM |

## 5. Verification / Monitoring

- `AccountServiceTest`/`ApprovalGateTest` — an admin-created account is active immediately and can sign in (existing coverage; unaffected).
- `AuthControllerTest$ChangePassword` — changes the password and confirms; rejects a mismatched confirmation and a too-short password without reaching the session layer; refuses an anonymous caller; reports reusing the current password plainly, as 400.
- `AuthControllerTest$MustChangePasswordGate` — blocks `PATCH /auth/me` for a caller still under the gate; does not block `GET /auth/me`, `POST /auth/change-password`, or `POST /auth/logout`.
- Frontend: `AddAccountModal.test.tsx` (email/role validation on the invite form), `create-password/page.test.tsx` (anonymous → `/login`; already-changed → `/overview`; validation; success + redirect; server refusal shown plainly), `login/page.test.tsx` (a `mustChangePassword` caller is sent to `/create-password` instead of `/overview`).
- **Not yet verified against a real database**: the `must_change_password` column's default and the interaction with the last-active-super-admin trigger — covered by `V8__temp_password.sql` but exercised only by tests that require Docker, which did not run in this environment (no Docker available) and must run in CI before this ships.

## 6. References

- `backend/src/main/resources/db/migration/V8__temp_password.sql`
- `backend/src/main/java/com/coc/docs/account/{Account,AccountService,AccountRepository}.java`
- `backend/src/main/java/com/coc/docs/auth/{SessionService,AccountInviteMailer,MustChangePasswordInterceptor}.java`
- `backend/src/main/java/com/coc/docs/config/WebMvcConfig.java`
- `frontend/app/create-password/page.tsx`, `frontend/components/layout/RequireSession.tsx`
- ADR-011 (security model), ADR-014 (password registration), ADR-017 (approval gate), ADR-018 (password reset)

---

## Change History

| Date | Change |
|---|---|
| 2026-09-14 | Written. Status PROPOSED — implemented per the PM's explicit decision to keep account creation `super_admin`-only rather than widen it to `admin` as the originating task brief requested. |
