# ADR-096: Email the Applicant the Decision, and Let a Refused Applicant Register Again

> **Status**: ACCEPTED — implemented
> **Date**: 2026-10-06
> **Author**: AI (Claude Opus 5.5), on direct in-session instruction
> **Approver**: the user, in-session ("If an admin refuses a new user, send them an email notifying them that their registration was rejected and allow them to register again with the same email without a duplicate-email error. If an admin approves the user, also send an email notifying them that their account has been approved.") — recorded as a transcription of that instruction, not a self-approval (`CONST-PROC-01`).
> **Related ADR**: Extends [ADR-017](ADR-017-approval-gate.md)'s approval queue. Reuses [ADR-092](ADR-092-email-logo-embedded.md)'s embedded logo. Complements [ADR-095](ADR-095-pending-approval-on-password-sign-in.md).

---

## 1. Context

When an administrator approved or refused a registration in Users & Roles → Pending, the applicant was not told. An approved applicant had to keep trying to sign in. A refused applicant never learned the outcome.

A refusal was also permanent for that address. `reject` keeps the row as `rejected`, so the audit trail can answer "who applied, and who turned them down" (ADR-017). But registration refused any address that already had a row. A refused applicant who tried again, for example after a mistaken refusal, got "that email address is already registered" and had no way forward.

## 2. Decision

### 2.1 Decision emails

`AccountService.approve` and `reject` publish a `RegistrationDecidedEvent` after the decision is written. `RegistrationDecisionMailer` handles it **after commit** and **asynchronously**:

| Decision | Subject | Content |
|---|---|---|
| Approve | "Your account has been approved" | The account email, the role granted, and a **Log in** button (`/login?email=…`) |
| Refuse | "Your registration was not approved" | The account email, that they may register again with the same address, and a **Register again** button (`/register`) |

- **After commit:** a decision that rolls back emails nobody.
- **Async:** a slow SMTP relay never delays the administrator's Approve or Refuse click.
- **Failures:** logged and swallowed, as in `AccountInviteMailer`. The decision stands whether or not the email is delivered.
- **No SMTP configured:** the mailer logs a warning naming the email that was not sent. Neither email carries a credential.
- **Layout:** the logo is embedded as an inline `cid:` image (ADR-092).

### 2.2 Registering again after a refusal

The address of a **rejected** account is free to apply with again. Every other status (pending, active) still answers 409 "that email address is already registered".

- **The same row is reopened, not duplicated.** `AccountRepository.reopenApplication` sets the row back to `pending` and takes the newly entered name and password. It resets the roles to `guest`, the role every applicant holds. It also clears `must_change_password`, `deactivated_at` and `deactivation_scheduled_for`. Because the address is unique and the row is kept, the first application, its refusal and the new application all point at one account in the audit trail.
- **Race-safe:** the update is conditional on `status = 'rejected'`. If a concurrent request has already reopened the row, the update matches nothing, and the caller gets the usual 409.
- **The reapplication is audited** as `account.register` with `"reapplication": true`.
- **Admins are notified:** it publishes `AccountRegisteredEvent`, exactly as a first application does, so approvers are notified the same way.
- **Both checks were relaxed:**
  - `RegistrationOtpService.start`, which runs before the verification code is emailed;
  - `AccountService.register`, which runs when the code is verified.

  If only one were relaxed, the applicant would pass the first step and fail the second.

### 2.3 Not changed

- **Google sign-in by a refused address is still refused**, with the uniform refusal. Reapplying goes through the registration form, which requires choosing a new password and proving the inbox with a code.
- **Enumeration:** registration already answered 409 for any existing address, so the registration form reveals nothing it did not already. Password sign-in (ADR-095) is unaffected.
- **Frontend:** no change. The register flow is the same; it simply no longer receives a 409 for a refused address.

## 3. Consequences

- An administrator's refusal is no longer final. An applicant can apply again, and the application returns to the Pending queue for another decision. If repeated reapplication by one address becomes a problem, a cool-down or a "block this address" action would be a separate decision.
- **Tests:**
  - `RegistrationDecisionTest` (unit): the events, the reopen path, and the 409 for other statuses.
  - `RegistrationDecisionMailerTest` (unit): both emails, the logo, SMTP failure tolerance, and the after-commit/async annotations.
  - Two `ApprovalGateTest` cases (Testcontainers, real PostgreSQL) cover the reopen end to end. They need Docker.
  - The reopen SQL was also checked by hand against PostgreSQL 16 at V64.
