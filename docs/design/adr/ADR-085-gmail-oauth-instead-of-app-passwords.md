# ADR-085: Gmail Access Is Granted by OAuth at Sign-In, Not by a Stored App Password

> **Status**: PROPOSED
> **Date**: 2026-10-02
> **Author**: AI, at the PM's request
> **Approver**: PM
> **Supersedes**: ADR-063's choice of a stored App Password (its §4.3 named this as the replacement)
> **Related ADR**: ADR-063, ADR-077, ADR-084, ADR-014/ADR-019 (Google sign-in), ADR-007 (key management)

---

## 1. Context

ADR-063 had each account store a Google **App Password** so its attendance mail could be sent
from its own address; ADR-077 then reused that credential to read the account's own inbox. Both
ADRs recorded the same discomfort in their consequences: an App Password is not scoped. It
grants full read **and** send on the whole mailbox, it must be stored in reversible form, and it
is a secret each person has to generate by hand and paste into a form.

The PM asks that this require nothing typed — that signing in be what grants the access.

That is not achievable by capturing anything at sign-in:

| Sign-in route | Why it cannot yield a Gmail credential |
|---|---|
| Google (`POST /auth/google`) | Carries an **ID token**, never a password and never a refresh token. There is nothing to capture. |
| Email + password | The password is this platform's, not Google's — a different account on a different system. |
| Either, hypothetically | Google has refused plain passwords for IMAP and SMTP since May 2022. Only an App Password or OAuth is accepted. |
| Stored form | `password_hash` is bcrypt (`$2a$`), one-way by construction. |

What *is* achievable, and is what the PM is describing, is OAuth: ask Google for Gmail scopes at
the moment of signing in, and keep the refresh token Google returns.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII, NFR-SEC-CHANNEL
- **Related risks**: holding a long-lived refresh token; Google's verification requirement for
  sensitive scopes
- **Decision pressure**: none technical — App Passwords work today. This reduces what is held.

## 2. Decision

> An account grants Gmail access through Google's **authorization-code flow**, requesting
> `gmail.send` and `gmail.readonly`, offered immediately after Google sign-in. The backend
> exchanges the code for a **refresh token**, stores it encrypted, and mints short-lived access
> tokens to authenticate to SMTP and IMAP over **XOAUTH2**. The App Password path remains for
> accounts that already use one and for anyone who cannot complete OAuth.

### Key Choices

- **Authorization code, not the ID token.** The existing sign-in flow cannot be extended to
  produce a refresh token — an ID token is an assertion of identity, not a grant. This is a
  second, scoped exchange that happens alongside sign-in, not a replacement for it.
- **`gmail.send` and `gmail.readonly`, nothing wider.** `gmail.readonly` is still the whole
  mailbox for reading, which is the honest cost (§4.2) — but unlike an App Password it cannot
  delete, cannot change settings, is visible to the user in their Google account, and is
  revocable there without changing anything else.
- **The refresh token is encrypted under the same key** as App Passwords (`SecretBox`,
  `app.security.encryption-key`). It is reversible by necessity for the same reason, so ADR-007
  is no more discharged than before.
- **Both credential kinds coexist**, distinguished by a column. A deployment mid-migration has
  some accounts on each, and `PersonalMailSenderFactory` picks per account. Removing the App
  Password path before everyone has moved would strand people.
- **Access tokens are never stored.** They last an hour and are fetched on demand, cached in
  memory only. A stored access token is a stored secret with no compensating benefit.
- **Offered at sign-in, not forced.** Declining leaves the account exactly as it was. Attendance
  mail then comes from the shared sender, as it does for everyone with no credential.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Capture the login password and use it for Gmail** | What was asked for | Impossible four times over (table above), and storing a replayable login password would be a serious defect | No |
| B | **Keep App Passwords only** (ADR-063) | Already built and working | Each person generates and pastes a secret that grants their whole account; not revocable per-application | No |
| C | **OAuth at sign-in** (this ADR) | Nothing typed; scoped; revocable from the Google account; no password held | Google verification for sensitive scopes; refresh-token lifecycle; more moving parts | **Yes** |
| D | **Google Workspace domain-wide delegation** | No per-user consent at all | Requires a Workspace domain; every account here is consumer `@gmail.com` | No — unavailable |

## 4. Consequences

### 4.1 Positive Impacts

- Nobody generates or pastes a secret. Signing in and accepting one consent screen is the whole
  setup, which is what was asked for.
- **The stored secret stops being a master key.** A refresh token for two scopes cannot delete
  mail, cannot change account settings, and cannot be used to sign in anywhere.
- **Revocable by its owner**, from the Google account, per application, without affecting their
  password or any other service.
- Google shows the user what was granted and when it was last used.

### 4.2 Negative Impacts / Costs to Accept

- **`gmail.readonly` is still the entire mailbox for reading.** This narrows what the credential
  can *do*, not what it can *see*. Everything ADR-077 §4.2 says about scheduled, unattended
  reading of personal mail stands unchanged, and the consent copy must keep saying so.
- **Google verification is required for these scopes before unaffiliated users can consent.**
  Until then the app runs in testing mode: up to 100 named test users, each shown an "unverified
  app" warning. For a ten-person team that is workable; it is not a path to general availability
  without review.
- **A refresh token is long-lived.** It expires if unused for six months, if the user changes
  their password, or if they revoke it — each of which surfaces as a failure the person must fix,
  and none of which this system can distinguish today.
- **More to go wrong.** Token exchange, refresh, clock skew, and XOAUTH2 framing are four new
  failure modes replacing one. The App Password path stays partly because it is the simpler
  thing to fall back to.
- **`ADR-007` remains undischarged.** The key now protects refresh tokens as well as App
  Passwords. Rotation and custody are still undecided.

### 4.3 Follow-up Work

- **The PM must configure the Google Cloud Console**: add both scopes to the consent screen, add
  the team as test users, and confirm the OAuth client is a Web application with
  `GOOGLE_CLIENT_SECRET` available to the backend. Nothing here works until that is done, and
  nobody but the project owner can do it.
- Submit for verification if this is to reach anyone outside the test-user list.
- A visible per-account status ("granted, last used, last error"), still outstanding from
  ADR-077 §4.3.
- Retire the App Password path once every account has migrated, and drop the column.

## 5. Verification / Monitoring

- A test asserts an account with an OAuth grant authenticates with XOAUTH2 and never with a
  password.
- A test asserts an account with an App Password keeps working unchanged.
- A test asserts an access token is never written to the database.
- A test asserts a revoked or expired refresh token degrades to the shared sender rather than
  failing a person's attendance mail.

## 6. References

- `ADR-063` §4.3 — named OAuth as the replacement this carries out
- `ADR-077` §4.2 — the mailbox-reading cost, unchanged by this
- `ADR-084` — the shared mailbox made optional
- Google: OAuth 2.0 for Gmail, `https://developers.google.com/gmail/api/auth/scopes`
- FR-OPS-001, NFR-SEC-PII, NFR-SEC-CHANNEL

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-10-02 | 1.0 | Initial draft, recording why sign-in cannot supply a Gmail password and what replaces it. | AI |
