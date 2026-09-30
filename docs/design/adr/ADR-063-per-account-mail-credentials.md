# ADR-063: Each Account May Send Its Own Attendance Mail, Using Its Own Gmail Credential

> **Status**: PROPOSED
> **Date**: 2026-09-30
> **Author**: AI, at the PM's repeated and explicit request, recording the decision before implementing it
> **Approver**: PM
> **Related ADR**: ADR-007 (key management — **recorded N/A, reopened by this**), ADR-057 (storing attendance rows), ADR-032, ADR-037 (reverted; its `SecretBox` is reinstated here)

---

## 1. Context

`AttendanceMailService` (ADR-057 follow-on) mails each person their own attendance row. Every message is sent by the one account in `MAIL_USERNAME` — today a developer's personal Gmail — because Gmail's SMTP will not let a sender forge a `From`: it rewrites anything that is not the authenticated account or a verified alias of it.

The PM asked, repeatedly, that each person's attendance mail be sent **using that person's own credential** rather than one shared account. Three routes exist and only one is available here:

- **Google Workspace domain-wide delegation** — the clean answer, and unavailable: every account is a consumer `@gmail.com`, not a Workspace domain.
- **OAuth 2.0 per user, `gmail.send`** — the legitimate mechanism, needing a consent screen, a refresh token per account, Google's verification review for a sensitive scope, and revocation handling.
- **A per-account Gmail App Password**, supplied by its owner and stored by this application. Smallest to build; largest in what it holds.

This ADR adopts the third, on explicit instruction, after the cost below was put to the PM more than once.

- **Related requirements**: FR-OPS-001, NFR-SEC-PII, NFR-SEC-CHANNEL
- **Related risks**: a stored App Password grants **full mailbox read and send**, not merely "send attendance"
- **Decision pressure**: none technical. The shared-sender version works today.

## 2. Decision

> An account may optionally store its own Gmail address and App Password. When present, that account's attendance mail is sent through its own SMTP session; when absent, the shared `MAIL_*` sender is used exactly as now. The credential is encrypted at rest with AES-256-GCM under `app.security.encryption-key`, is never returned by any endpoint, and is set only by its own owner.

### Key Choices

- **Opt-in, never required.** No credential means the existing shared sender. The feature adds a path; it removes none.
- **Owner-only.** The route resolves the account from the session. A `super_admin` cannot set, read or test another account's credential — an administrator who could would be an administrator who can send mail as any colleague.
- **Write-only over the wire.** The API accepts a credential and reports whether one exists. There is no read path, so a compromised session cannot exfiltrate what is stored, only overwrite it.
- **Encrypted, not hashed.** A hash cannot authenticate to Gmail, so this is reversible by construction — which is precisely what makes it different from `password_hash` and why it needs a key.
- **The key lives in the environment**, beside `DB_PASSWORD`. That is honest rather than ideal: anyone holding the environment file holds both the key and the database it protects.

## 3. Considered Alternatives

| | Option | Pros | Cons | Chosen |
|---|---|---|---|---|
| A | **Keep the shared sender** | Nothing stored; works today | Mail comes from one person's address | No — the PM asked for per-account |
| B | **A neutral `noreply@` mailbox** | One config line, no code, no stored secret; the normal way notification mail works | Still one sender for everybody | No — chosen in an earlier exchange, then superseded by this request |
| C | **Per-account App Password** (this ADR) | Sends genuinely as each person; small to build | Holds a credential granting full mailbox read+send per user; reopens ADR-007; most users will decline to supply one | **Yes, on instruction** |
| D | **OAuth per user, `gmail.send`** | Scoped to sending only; revocable by the user; no password held | Weeks of work; Google verification for a sensitive scope; consent, refresh and revocation machinery | No — the right answer if this outlives the request |

## 4. Consequences

### 4.1 Positive Impacts

- Attendance mail is sent by the person it concerns, from an address their colleagues recognise.
- Nothing changes for an account that supplies no credential.

### 4.2 Negative Impacts / Costs to Accept

- **The database holds credentials that open whole mailboxes.** An App Password is not scoped to sending; it reads everything too. The blast radius of this table is every supplier's entire Gmail account, not their attendance.
- **`ADR-007` stops being N/A.** Its recorded rationale — *"there is no application-layer column encryption to key"* — is false from this migration onward. Key rotation, key custody and re-encryption are now real questions this project has no answer to. **That follow-up is owed, not optional.**
- **The key sits next to the data it protects.** `app.security.encryption-key` is an environment variable on the same host as the database credentials. Encryption at rest here defends against a stolen dump, not against a compromised host.
- **Most people will not supply one**, so in practice mail continues to come from the shared sender for nearly everybody — the cost above is paid whether or not the benefit arrives.
- Reinstates the `SecretBox` primitive the ADR-037 revert deliberately removed.

### 4.3 Follow-up Work

- **Move `ADR-007` out of "Recorded N/A"**, with key rotation and custody actually decided. This ADR creates the obligation and does not discharge it.
- Prefer **D (OAuth)** if per-account sending survives past this request; it is strictly better and this decision should be revisited rather than entrenched.
- A revocation path: removing a credential should be as easy as adding one, and should be offered when an account is deactivated.

## 5. Verification / Monitoring

- Tests assert a credential is never returned by any endpoint, and that one account cannot set another's.
- Tests assert the shared sender is used when no credential is stored.
- The stored value is asserted to be unreadable without the key.

## 6. References

- `ADR-057` — storing attendance rows, and the mail this sends
- `ADR-007` — key management, N/A, reopened here
- `ADR-037` — reverted; its AES-256-GCM `SecretBox` is the primitive reinstated
- `backend/src/main/java/com/coc/docs/notify/AttendanceMailService.java`
- NFR-SEC-PII, NFR-SEC-CHANNEL, `docs/requirements/REQUIREMENTS-SPEC.md`

## Change History

| Date | Version | Change | Author |
|---|---|---|---|
| 2026-09-30 | 1.0 | Initial draft, written before implementation at the PM's instruction after the cost in §4.2 was raised and re-raised. | AI |
