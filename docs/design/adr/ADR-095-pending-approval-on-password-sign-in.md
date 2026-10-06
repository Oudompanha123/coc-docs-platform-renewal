# ADR-095: Tell an Applicant With the Right Password That Their Account Is Pending

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-06
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("if the admin has not approved the account yet and the user tries to log in, show a clear message such as 'Your account is pending admin approval.'") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Narrows [ADR-014](ADR-014-revision-of-008-password-registration.md)'s "every password sign-in failure looks the same" for one case. It matches what Google sign-in already does for a pending registration.

---

## 1. Context

After registering, a person waits for an administrator's approval. If they tried to sign in with their password meanwhile, they got the same refusal as for a wrong password, "Invalid Login email, or password.", and had no way to tell that their account existed and was simply waiting.

That uniform refusal is deliberate. If the endpoint told an unknown address apart from a pending one, anyone could probe it for who has applied. Google sign-in, though, already answers a pending registration with a specific 403 ("this registration is awaiting approval"), because Google has first proved who the caller is.

## 2. Decision

> When the password is right and the registration is still pending, refuse with 403, "this registration is awaiting approval". The frontend shows "Your account is pending admin approval." as a notice. Every other refusal is unchanged.

| Password | Account | Response | Shown |
|---|---|---|---|
| wrong (or no account) | any | 401, uniform | "Invalid Login email, or password." |
| right | pending | **403** | **"Your account is pending admin approval."** (amber notice) |
| right | rejected, or deactivated | 401, uniform | "Invalid Login email, or password." |

- **Why this is safe:** the right password proves ownership as well as Google's verification does, so only the applicant learns their account is waiting. Without the password, a pending account is indistinguishable from an unknown address.
- **Timing:** unchanged. The password is still compared, or a dummy comparison runs for an unknown address, before any branch.
- **`SessionService.signInWithPassword`:** throws `ApiException.forbidden(...)` in that one case. The audit reason is `password_sign_in_pending_approval`, so it can be told apart from `password_sign_in_refused`. `@Transactional` now lists `ApiException` in `noRollbackFor`, so the audit entry survives the 403 as it does the 401.
- **Frontend:**
  - `loginWithPassword` maps 403 to `RegistrationPendingError` with `PENDING_APPROVAL_MESSAGE`, the same error type the Google path uses;
  - the login form shows it as the amber "pending" notice, not the red error.

## 3. Consequences

- **Positive:** an applicant knows their account is waiting instead of doubting their password.
- **Accepted:**
  - Someone who already holds an applicant's password can learn that the account is pending. They could equally have signed in as them once it was approved, so they gain nothing new.
  - Rejected applicants still see the uniform refusal; telling them would be a separate decision.

## 4. Verification

| Item | Method |
|---|---|
| Right password + pending → 403 with the awaiting-approval message, audited as pending; wrong password + pending, an unknown address, and right password + rejected → the uniform 401; the audit entry survives the 403 | `PasswordSignInPendingTest` (unit; runs without Docker) |
| 403 → `RegistrationPendingError` with "Your account is pending admin approval."; 401 and 5xx unchanged | `lib/auth/api.test.ts` |
| The login form shows it as the amber pending notice and does not redirect | `app/login/page.test.tsx` |

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-10-06 | 1.0 | Initial version, implemented on direct in-session instruction | Claude Opus 5.5 |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-10-06 | User (in-session, direct instruction) | Pending-approval message on password sign-in | ACCEPTED |
