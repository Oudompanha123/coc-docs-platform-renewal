# ADR-013: Keycloak as Identity Broker — revision of ADR-008

## Status
**ACCEPTED** — 2026-09-10

Revises the identity-provider decision in [ADR-008](ADR-008-channel-auth.md), the authentication pillar of [ADR-011](ADR-011-security-model.md), and Decision 4 of [ADR-012](ADR-012-revision-of-001-backend-stack.md).

- Deciders: PM (Socheat-Hun), `architect`
- **Does not change any requirement.** `FR-AUTH-001` … `FR-AUTH-008` all hold as written.

---

## Context

ADR-008 and ADR-012 Decision 4 had the backend verifying **Google ID tokens directly**: signature, audience, issuer and nonce checked against Google's JWK set, with `issuer-uri` pointing at `accounts.google.com`. That is what `auth/GoogleIdTokenVerifier.java` implements today.

The PM has since chosen **Keycloak**, already running locally. In a bank this is usually an institutional expectation rather than a preference — centralised identity, MFA policy, audit, and the ability to federate LDAP/AD later without touching application code.

The question is not whether Keycloak is reasonable. It is **how much of the security model it changes**, because two of the three ways to adopt it would have quietly destroyed decisions that are load-bearing.

---

## Decision

### 1. Keycloak brokers Google — it does not replace it

Keycloak is configured with Google as an upstream identity provider. Users still click **"Sign in with Google"** and see the ordinary Google consent flow; Keycloak sits in the middle and issues the token our backend verifies.

```
User → Google  (authenticates)
     → Keycloak  (brokers, issues its own token)
     → Backend   (verifies Keycloak token, looks up the account, issues our session)
```

**No local Keycloak accounts, no Keycloak passwords.** `FR-AUTH-002` — "the system stores no passwords" — remains literally true: neither our database nor Keycloak's holds one.

### 2. Roles stay in **our** `account` table — Keycloak proves identity only

> **Keycloak answers *"who is this?"*. Our database answers *"what may they do here?"*.**

Keycloak realm roles are **not** used for application authorisation. The backend continues to read `account.role` server-side on **every request**, exactly as it does now.

**This is the decision that preserves everything else**, and the reason is `TM-003` — the highest-scored threat on the project at **9.8**. A role carried in a token is a claim frozen at issue time. Signed, so not forgeable — but stale by construction:

| | Roles in our DB | Roles in the Keycloak token |
|---|---|---|
| Promote a user | effective next request | not until the token expires |
| Demote a user | effective next request | **still `admin` until expiry** |
| Deactivate an account (`FR-AUTH-003`) | immediate | **retains full access until expiry** |

The middle and right columns are the same failure `TM-003` describes, reintroduced through a different door. Rejected on that basis.

### 3. The session design is unchanged — and the reason is XSS, not revocation

The backend exchanges a verified Keycloak token for its **own opaque, server-side session** (`app_session`, `V2__session.sql`), delivered as an `httpOnly` cookie: SHA-256 of the token stored, never the token; 1-day TTL; revocable by deleting a row.

Keycloak issues JWTs, and accepting them directly as bearer tokens is the *native* Spring pattern — `spring-boot-starter-oauth2-resource-server` is already in the pom, and it would delete five classes, a migration and a cleanup job. It deserves a straight answer rather than a dismissal.

**An earlier draft rejected it because "a JWT cannot be revoked". That reasoning was wrong and is corrected here**, because a wrong rationale in an ADR is worse than none — it invites someone to find the hole and reopen a settled decision on bad terms.

Once Decision 2 puts roles in our database, a JWT would carry **identity only**. And because the backend reads the account row on every request regardless, it can check `deactivated_at` on that same read. So:

| Requirement | Bearer JWT | Verdict |
|---|---|---|
| `FR-AUTH-003` immediate deactivation | ✅ checked on the per-request account read | **not a differentiator** |
| `FR-AUTH-005` role changes take effect | ✅ role comes from the database | **not a differentiator** |
| `TM-003` no client-supplied role claim | ✅ the token carries no role | **not a differentiator** |
| `FR-AUTH-007` sign-out is real invalidation | ⚠️ solvable — short TTL plus refresh, or a `tokens_valid_after` check | **a cost, not a blocker** |

**A JWT could meet every requirement.** The decision rests on something else.

#### The actual reason: this system's XSS posture

| | Bearer JWT | `httpOnly` session cookie |
|---|---|---|
| CSRF | **eliminated** — no cookie is sent automatically | real; mitigated by `SameSite` + origin check (ADR-011 §2.5) |
| **XSS → credential theft** | **exposed** — JavaScript must read the token to send it | **resistant** — JavaScript cannot read the cookie |

This product is a CMS in which **non-technical people author content that is rendered to other users**. The entire content model exists to eliminate XSS structurally — no raw-HTML block type (ADR-010 §3), a closed embed registry, sanitisation at write time. `TM-010` is scored 8.0.

**Storing the session credential where JavaScript can read it works directly against that design.** If an XSS ever lands despite the block model, a bearer token in browser storage hands over the session; an `httpOnly` cookie does not.

Between the two, **CSRF is the more tractable problem** — `SameSite=Lax` across sibling subdomains plus an origin check, already decided. XSS-driven token theft has no comparable clean mitigation.

Accepted costs: we keep five classes and a cleanup job that Keycloak could otherwise handle, and CSRF remains a live concern requiring the ADR-011 §2.5 controls to be implemented correctly rather than assumed.

### 4. Production hosting: Google Cloud, alongside the backend

Keycloak runs as a container on GCP with its own PostgreSQL instance, separate from the application database.

---

## What actually changes

| | Before | After |
|---|---|---|
| Token issuer verified | `accounts.google.com` | Keycloak realm |
| `issuer-uri` / audience config | Google | Keycloak |
| `auth/GoogleIdTokenVerifier` | verifies Google ID tokens | **renamed and repointed** to verify Keycloak tokens |
| Google credentials | in our config | **move into Keycloak** — the app no longer holds a Google client secret |
| Deployables | 2 | **3** (frontend, backend, Keycloak) |
| Databases | 1 | **2** (app, Keycloak) |

## What does not change

- Every requirement `FR-AUTH-001` … `FR-AUTH-008`
- The session model, TTL, and revocation behaviour
- `TM-003` and its mitigation — role read from the database per request
- Default-deny authorisation in the service layer (`CONST-TECH-07`)
- The `account` table, and `super_admin`-only provisioning (`FR-AUTH-003`)

**One class is repointed. Nothing else in the auth design moves.** That is the direct consequence of Decisions 1 and 2 — the two other adoption paths would each have invalidated a requirement.

---

## Alternatives Considered

| Option | Why not |
|---|---|
| **Direct Google verification** (ADR-008, superseded) | Fewer moving parts and one less thing to operate — genuinely simpler. Superseded because it offers no central place for MFA policy, audit, or later LDAP/AD federation, which a bank generally requires eventually. |
| **Keycloak as the role authority** | Single administrative surface for users *and* permissions, which is Keycloak's usual selling point. **Rejected**: reintroduces `TM-003` (9.8) and breaks `FR-AUTH-003`'s immediate deactivation. |
| **Keycloak replacing Google with local accounts** | Works offline and removes the Google dependency. **Rejected**: puts passwords into Keycloak's database, which reverses `FR-AUTH-002` and brings password policy, reset flows and lockout back into scope. |
| **Accept Keycloak JWTs directly as bearer tokens** | The native Keycloak/Spring pattern; deletes five classes, a migration and a cleanup job; eliminates CSRF outright. **Genuinely close** — see §3. Rejected on XSS exposure: a bearer token must be readable by JavaScript, and this is a CMS rendering user-authored content whose whole content model exists to prevent XSS. Not rejected on revocation — that objection was wrong and is corrected in §3. |
| **Keycloak JWT stored in an `httpOnly` cookie** | Standard OAuth2 validation *and* XSS resistance — the apparent best of both. Rejected as the least-travelled path: CSRF returns because it is still a cookie, refresh flows become awkward, and it is uncommon enough that a six-person team would be debugging it without much documentation to lean on. Worth revisiting if the session layer ever becomes a maintenance burden. |

---

## Consequences

### Positive
- Identity is centralised where a bank expects it; MFA and federation become configuration rather than code.
- **The application no longer holds a Google client secret** — that credential moves into Keycloak, shrinking our secret surface.
- Swapping or adding an identity source later is a Keycloak change, not an application change.

### Negative — stated plainly
- **A third deployable and a second database.** Both need operating, backing up and patching. Keycloak is security infrastructure: an unpatched instance is a serious problem, not a deferred chore.
- **Availability gets worse, and the failure is now ours.** Previously, Google being unreachable meant nobody could sign in — an outage owned by Google (`RISK-014`). Now Keycloak being unreachable has the same effect, and we operate it. Same symptom, worse ownership.
- **A new component in the trust path.** Keycloak issues the token the backend trusts, so compromising Keycloak compromises authentication for the whole system.
- One more thing that must exist before a developer can run the stack locally.

### Required follow-up, **before** the auth code is written
1. **Threat model**: `TB-2` currently describes browser ↔ Google. It must be re-drawn for browser ↔ Keycloak ↔ Google, with Keycloak as a trusted component and STRIDE applied to it. New threats expected around realm/client misconfiguration, token audience validation, and the broker's own admin console.
2. **`ADR-011`**: authentication pillar repointed at Keycloak; session and role sections unchanged.
3. **`ADR-008`**: marked superseded by this ADR on the identity-provider question.
4. **`risk-register`**: `RISK-014` re-scored — the outage risk did not disappear, it changed owner. New risk for Keycloak patching.
5. **Local setup**: `CONTRIBUTING.md` and `scripts/install-hooks.sh` need the Keycloak requirement, or five developers will clone the repo and be unable to sign in.

### G2 implication
G2 was approved on 2026-09-09 against a design with direct Google verification. This ADR changes the authentication architecture and adds a deployable **after** that gate.

**Assessment: this is an amendment, not a premise change, and does not warrant reverting G2.** No requirement moved, no other ADR's decision is invalidated, and the design documents remain accurate apart from the identity provider itself. That is materially different from the two-service split, which invalidated six documents and correctly forced a revert.

**But the threat model must be updated before implementation, not after.** A new trusted component in the authentication path is exactly the kind of change the threat model exists to catch, and writing the code first would make the analysis a formality.

---

## References
- Requirements: FR-AUTH-001 … FR-AUTH-008, NFR-SEC-AUTH, NFR-SEC-SESSION, NFR-SEC-CHANNEL, CONST-TECH-07
- Threats: TM-003 (9.8), TM-001
- Supersedes in part: ADR-008; amends ADR-011 §auth, ADR-012 Decision 4
- Code: `backend/src/main/java/com/coc/docs/auth/`, `V2__session.sql`
