# ADR-037: Outgoing webhook integrations — connect / test / disconnect, with an encrypted signing secret at rest

## Status

Accepted. Implemented directly on PM/developer instruction in-session (same
class of decision as REQUIREMENTS-SPEC.md §7.3–§7.6) — **formal PM sign-off
recommended, not yet recorded**, same caveat as every other in-session
amendment in that document's history.

Both open implementation choices this ADR originally left for Skill 4 were
decided during implementation rather than left pending, so §5 and §6 below
now read as decisions made, not options awaiting one — see each section and
"Required follow-up" for what changed.

## Context

The Overview dashboard's "Quick Actions" grid (`frontend/app/(shell)/overview/page.tsx`)
carried four cards from marketing mock data (`frontend/lib/mock/overview.ts`)
with no `onClick`/`href` at all. Three map cleanly onto real features already
in this codebase (writing content, inviting a teammate, the Claude Usage
dashboard). The fourth, "Connect Integration," maps onto nothing — there is no
integrations/webhooks/API-key concept anywhere in this codebase. The
PM/developer asked for this to become a real, backend-supported feature
rather than a disabled or removed card.

Before designing it, the existing architecture was inspected end to end:

- **No tenant/workspace/organization model.** This is a single-tenant
  deployment; every team-wide table (`claude_usage_member`, `account_role`,
  `audit_log`) is platform-wide, not scoped to an organization. A new feature
  does not need a tenant column.
- **Persistence is hand-written `JdbcClient` repositories over Flyway
  migrations, never JPA.** Every existing repository (`AccountRepository`,
  `AuditRepository`, `PageRepository`, `ClaudeUsageMemberRepository`, …)
  follows this shape.
- **`SecurityConfig` is the single authorisation chokepoint** (its own
  Javadoc's words), default-deny (`anyRequest().hasRole(SUPER_ADMIN)`).
  `/api/v1/admin/**` defaults to `admin`; the accounts/roles/audit prefixes are
  carved out at `super_admin` specifically because they touch credentials or
  another account's identity.
- **Every existing external service is deploy-time environment
  configuration, never a runtime, admin-managed, database-stored credential.**
  Mail, Firebase, S3/avatar storage, Keycloak, Google sign-in, and the Claude
  Usage ingest secret are all the same pattern: an env var, read into an
  unvalidated `@ConfigurationProperties` record with a `configured()` escape
  hatch, so the application boots cleanly with it unset
  (`AvatarStorageConfig`, `FirebaseConfig`, `ClaudeUsageProperties`). None of
  them are stored in Postgres, and **no encryption-at-rest utility exists
  anywhere in this codebase** — confirmed by grep (`Cipher`/`AES`/`encrypt`:
  no matches). `AccountCredential.passwordHash` is a one-way bcrypt hash,
  which cannot be decrypted back into a usable secret and is therefore not a
  model for a credential this system must present to a third party.
- **No OAuth-client library is present.** `pom.xml` carries
  `spring-boot-starter-oauth2-resource-server` (verifying inbound Keycloak
  tokens) but not `spring-boot-starter-oauth2-client` — there is no existing
  capability to act as an OAuth client against a third-party service.
- **No requirement for this exists.** `REQUIREMENTS-SPEC.md` has no
  `FR-INTEG-*` family. This is new scope, not an implementation detail of
  something already approved.

Most tellingly, `docs/design/adr/ADR-INDEX.md` already recorded three §8
areas as **N/A**, each with a stated trigger condition that this feature hits
directly:

| ADR | Recorded N/A because | Its own stated revisit trigger | Hit by this feature? |
|---|---|---|---|
| ADR-007 (Key management) | "no encryption keys of its own to manage" | "if ADR-005's deferred application-layer column encryption is ever adopted" | **Yes** — a webhook signing secret stored encrypted in Postgres is exactly that |
| ADR-004 (Message integrity) | "no message-passing architecture" | "if an asynchronous or queued integration is introduced" | **Yes** — outbound, asynchronous event dispatch |
| ADR-009 (Retry / idempotency) | "no unreliable channels to retry against" | "if background jobs, queues or webhook receivers are added" | **Partially** — this ADR adds a webhook *sender*, not a receiver; a future inbound webhook still needs its own idempotency decision |

This ADR is that decision, and formally revises all three.

Constraints this feature must fit rather than reopen:

- **CONST-TECH-08 (ADR-012)**: object storage stays S3-API-only, never a
  provider SDK — the same "one abstraction, not a vendor SDK" reasoning
  applies below to why this ships as a generic webhook, not a named OAuth
  integration.
- **ADR-011 "middleware enforcement"**: a route not explicitly declared in
  `SecurityConfig` is denied to everyone but `super_admin` by construction —
  new routes are new, deliberate lines in that file.
- **CODE-002** (`CLAUDE.md`, global): no missing timeouts, no infinite retry
  loops on external API calls. Nothing in this codebase currently hand-rolls
  a timeout for an arbitrary third-party HTTP target, so this ADR establishes
  that pattern for the first time.

## Decision

### 1. Provider: a generic outgoing webhook, not a named OAuth SaaS integration

The only supported `provider` values at launch are `webhook` (plain JSON
POST) and `slack` (same mechanism, Slack's `{"text": "..."}` payload shape).
Neither requires OAuth. Rejected: a real Slack App / Google Drive / GitHub
OAuth integration — see Alternatives Considered.

### 2. Schema: two platform-wide tables, no tenant column

```sql
create table integration (
  id                        uuid primary key default gen_random_uuid(),
  provider                  text not null,
  name                      text not null,
  target_url                text not null,
  signing_secret_ciphertext bytea,              -- AES-256-GCM(iv || ciphertext || tag); null once disconnected
  encryption_key_version    smallint not null,
  events                    text[] not null default '{}',
  status                    text not null default 'connected', -- connected | disabled | error
  last_tested_at            timestamptz,
  last_test_status          text,
  created_by                uuid references account(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),

  constraint integration_provider_check check (provider in ('webhook', 'slack')),
  constraint integration_status_check check (status in ('connected', 'disabled', 'error'))
);

create table integration_delivery (        -- append-only, same convention as audit_log
  id             bigint generated always as identity primary key,
  integration_id uuid not null references integration(id) on delete cascade,
  event_type     text not null,            -- includes the synthetic 'integration.test'
  http_status    int,
  success        boolean not null,
  error          text,
  latency_ms     int,
  attempted_at   timestamptz not null default now()
);
```

`DELETE /integrations/{id}` (disconnect) sets `status = 'disabled'` **and
nulls `signing_secret_ciphertext`** — the credential material is
cryptographically gone, not merely flagged, while `integration_delivery`
history survives for audit purposes. This mirrors `claude_usage_member`'s
"removing never deletes history" shape, applied to something that is
genuinely a secret rather than a roster entry.

Illustrative only — the actual migration file (next free `V`-number at
implementation time; `V22` is the highest that exists today) is written
during Skill 4, not by this ADR.

### 3. Encryption at rest: AES-256-GCM, a new primitive

No encryption utility exists in this codebase today (see Context). This ADR
adds one: a small `SecretBox` component — `encrypt(plaintext) -> (iv,
ciphertext)`, `decrypt(iv, ciphertext) -> plaintext` — using AES-256-GCM
(authenticated encryption; tampering is detected, not just confidentiality
protected), a random 96-bit IV per row.

The key is a new environment variable, `app.integrations.encryption-key`
(base64, 32 bytes), read the same "absent = feature cleanly unavailable" way
`ClaudeUsageProperties.ingestSecret` already is: `POST /integrations` refuses
with 503 when it is unset, rather than the application failing to boot or —
the alternative this ADR explicitly rejects — silently storing the secret in
plaintext.

The secret is never returned by any `GET` response, never logged. It is
shown to the caller exactly once, at creation and at rotation, matching how
`AppProperties.Storage.secretAccessKey` is already documented ("never logged,
never returned in any response").

### 4. Permission floor: `super_admin` for every mutation, `admin` for read

Every write (`POST`/`PATCH`/`DELETE`/`.../test`/`.../rotate-secret`) sits at
`super_admin` — the same floor as `/accounts/**` and `/roles/**`, because
this feature stores and rotates credential material and makes outbound calls
to admin-supplied URLs (a mild SSRF-relevant capability), which is the
"touches credentials or grants authority" class of action in this system, not
the plain editorial `admin` floor `/claude-usage/**` sits at. `GET` (list)
stays at `admin`, matching the read/write split `SecurityConfig` already
applies to `/admin/tasks`. A new `Permission.INTEGRATION_MANAGE` constant is
added for parity with the existing enum's stated philosophy ("permissions are
the extension point"), even though enforcement stays coarse-grained (by role)
like every other route today.

### 5. Connect / test / disconnect flow

- **Connect** (`POST /api/v1/admin/integrations`): admin supplies provider,
  name, target URL, subscribed events. Backend generates a random 256-bit
  signing secret, encrypts it, stores the row, and returns the secret **once**
  — same UX `InviteTeammateModal` already uses for its one-time ingest-config
  reveal.
- **Test** (`POST /api/v1/admin/integrations/{id}/test`): fires an immediate,
  synchronous, HMAC-signed synthetic payload (`event: "integration.test"`)
  with a hard timeout — **3s connect / 5s read, no retry** — satisfying
  CODE-002 directly. Result (status, latency, error) returns to the caller
  and is recorded in `integration_delivery`.
- **Real delivery**: a `@TransactionalEventListener(phase = AFTER_COMMIT)`
  (`IntegrationRegisteredListener`) calling an `@Async` method
  (`IntegrationService.dispatchEvent`) — the same shape ADR-025 already uses
  for FCM push — fans out to every `status = 'connected'` integration
  subscribed to the fired event type, off the request thread, so a slow or
  dead third party can never block the action that triggered it. **Decided
  at implementation time**: `PageService` publishes no domain event today,
  and adding one (`PagePublishedEvent`) was out of scope for this change —
  v1 ships wired only to `AccountRegisteredEvent` (event type
  `account.registered`, `IntegrationEvents.ACCOUNT_REGISTERED`), the one
  domain event this backend already publishes. `page.published` remains a
  real follow-up, not added here.
- **Disconnect** (`DELETE /api/v1/admin/integrations/{id}`): see schema
  section above. Audit-logged (`AuditRepository.append(..., "integration.disconnected", ...)`),
  same as every other admin mutation in this system.
- **Reconnect** (`POST /api/v1/admin/integrations/{id}/reconnect`, added
  2026-09-22): re-activates a disconnected row in place — same `id`, provider,
  name, target URL, events and delivery history — rather than requiring a
  fresh `POST /integrations` (which would leave the disconnected row behind
  as an orphaned duplicate). Reuses connect's own machinery verbatim: a new
  256-bit secret is generated and encrypted the same way (the old one was
  nulled at disconnect time and cannot be recovered), the response shape is
  the same one-time-reveal `IntegrationSecretResponse`, and it is
  audit-logged as `integration.reconnect`. No new decision is made here —
  same trust floor (`super_admin`), same encryption-at-rest and SSRF-at-connect-time
  posture as already decided above — so this is recorded as an addition to
  this ADR rather than a new one.

### 6. SSRF posture — decided, not merely recommended

`target_url` is admin-supplied and this whole surface sits at `super_admin`,
which is already this system's highest-trust role — but a compromised
`super_admin` session should not gain a free pivot into internal
infrastructure. **Decided at implementation time**: `IntegrationService`
resolves the target host once, at connect/rotate/test time, and refuses a
loopback, link-local, site-local (RFC1918), or wildcard address
(`InetAddress.isLoopbackAddress()`/`isLinkLocalAddress()`/
`isSiteLocalAddress()`/`isAnyLocalAddress()`). No `dev`-profile override was
added — local testing against a local receiver needs a publicly-resolvable
tunnel (e.g. a webhook-testing relay), the same constraint a real deployment
would have anyway.

### 7. This revises ADR-004, ADR-007 and ADR-009

- **ADR-007 (Key management)**: its own recorded trigger — "ADR-005's
  deferred application-layer column encryption is ever adopted" — has now
  occurred, for this one column. `docs/design/adr/ADR-INDEX.md` is updated
  with a dated note pointing here rather than rewritten wholesale; whether
  ADR-007 should move out of "Recorded N/A" entirely is left to the PM,
  consistent with `CONST-PROC-01` (gate/status judgments are recorded by a
  human, not by the agent that proposed the change).
- **ADR-004 (Message integrity)**: its trigger — "an asynchronous or queued
  integration is introduced" — has occurred for this one channel (HMAC-signed
  webhook payloads). Message integrity for every other channel in this system
  (in particular `/api/ingest`) is unaffected and remains as ADR-004
  originally recorded.
- **ADR-009 (Retry / idempotency)**: its trigger names both "background jobs"
  and "webhook receivers." This ADR addresses the first (bounded timeout, no
  unbounded retry, stated above) but this feature is a webhook *sender*, not
  a *receiver* — idempotency for a future inbound webhook remains open and
  undecided.

## Requirements Amendment

New `FR-INTEG-001..006` (§2.9) in `REQUIREMENTS-SPEC.md`, recorded as v1.7,
§7.7 of that document. See that document for the exact requirement text.

## Alternatives Considered

| # | Alternative | Rejected because |
|---|---|---|
| A | Named OAuth SaaS integration (Slack App, Google Drive, GitHub, …) | Requires adding `spring-boot-starter-oauth2-client`, registering an OAuth app per provider, and building a token-refresh/expiry lifecycle this system has never needed. A materially larger surface than the feature currently calling for it justifies. |
| B | Broker third-party integrations through Keycloak, the way Google sign-in already is | Conflates two different trust relationships: Keycloak brokers *who is signing in to this platform*; a "Connect Integration" is *this platform calling out to a third party on the team's behalf*. Folding the second into the identity broker would make Keycloak configuration a dependency of an unrelated feature. |
| C | Store the credential in plaintext | No precedent in this codebase supports it (every other secret is either hashed one-way or lives outside the database entirely), and it is the kind of decision `CONST-PROC-01`/security-decision ADR rules exist to force into the open rather than let happen by default. |
| D | Reuse the Claude Usage `/api/ingest` shared-bearer-secret shape | That shape is *inbound*, a third party calling us, authorized by one secret shared team-wide, explicitly documented as "not a template for editorial write paths" (`NFR-SEC-CHANNEL`). This feature is *outbound*, per-integration, admin-managed — a different shape entirely. |
| E (adopted) | Generic outgoing webhook, own encrypted signing secret, `super_admin`-gated | See Decision §§1–4. |

## Consequences

### Positive

- Gives "Connect Integration" a real destination without adding a second
  identity-broker-shaped subsystem next to Keycloak/Google sign-in.
- The only secret this system now custodies for a third party is one it
  generated itself (for signing outbound requests), never a third party's
  OAuth token — no refresh/expiry lifecycle to build or fail.
- Establishes, for the first time, both an at-rest encryption primitive and
  an explicit-timeout/no-retry outbound HTTP pattern — both immediately
  reusable by any future feature that needs either.

### Negative — stated plainly

- This is genuinely new infrastructure (encryption at rest, async event
  dispatch, hand-timed outbound HTTP) in a codebase that has deliberately not
  needed any of the three before. Each is a new thing to operate and get
  wrong, not a reuse of an existing, proven pattern.
- `target_url` is an SSRF-relevant input even at `super_admin`-only trust; §6
  is a recommendation, not yet a decided mitigation.
- No domain event exists yet for the most obviously useful trigger
  ("a page was published") — see Decision §5's open implementation choice.

### Required follow-up

Implemented in this session: `V23__integrations.sql`; `com.coc.docs.integration.*`
(`Integration`, `IntegrationDelivery`, `IntegrationProperties`, `SecretBox`,
`IntegrationRepository`, `IntegrationDeliveryRepository`, `IntegrationEvents`,
`IntegrationDispatcher`, `IntegrationService`, `IntegrationRegisteredListener`);
`AdminIntegrationController`; the `SecurityConfig`/`AuditAction`/`ApiDtos`
additions; `SecurityRulesTest$IntegrationsPath`; and the frontend `/integrations`
page, its nav entry, and the Overview quick-action wiring for all four cards
(not just this one). Backend `mvn test` (487 run) and frontend `tsc --noEmit`/
`eslint` are clean.

Still open:

- [ ] PM sign-off on `FR-INTEG-001..006` (REQUIREMENTS-SPEC.md §7.7) and on
      this ADR's classification of ADR-004/007/009 as revised.
- [ ] `docs/design/threat-model.md` needs new `TM-031`+ entries (secret at
      rest, outbound SSRF, webhook payload confidentiality/tampering) — not
      added by this ADR.
- [ ] `docs/design/TEST-PLAN.md` and `docs/requirements/requirements-matrix.csv`
      need entries for `FR-INTEG-*` — not added by this ADR.
- [ ] `app.integrations.encryption-key` must be provisioned per environment
      before `POST /integrations` will work — same "deliberately unset in
      version control" convention every other secret here follows. Nothing
      in this session's checkout sets it, so `connect`/`rotate-secret`
      answer 503 until an operator adds it.
- [ ] No integration tests against a real Postgres (Testcontainers) were
      added for the new repositories/migration — unit-level coverage only
      (`SecurityRulesTest$IntegrationsPath` proves the authorization floor
      with a mocked service, not the schema or the JSONB containment query).
- [ ] `page.published` is not wired — see Decision §5.
- [ ] The 2026-09-22 Reconnect addition has no `FR-INTEG-*` requirement of its
      own yet, and needs a `TM-03x` threat-model entry alongside the ones
      already outstanding for connect/disconnect above.

## References

- This session's architecture analysis (SecurityConfig.java,
  ClaudeUsageProperties.java, ClaudeUsageIngestController.java,
  AvatarStorageConfig.java, FirebaseConfig.java, AccountCredential.java,
  AuditRepository.java, AppRole.java, Permission.java)
- `docs/design/adr/ADR-INDEX.md` — ADR-004, ADR-007, ADR-009 N/A records and
  their stated revisit triggers
- ADR-011 (security model, middleware enforcement), ADR-012 (two-service
  split, CONST-TECH-08), ADR-025 (push notifications — the `@Async`
  `AFTER_COMMIT` dispatch pattern this reuses), ADR-034 (notifications as
  rows), ADR-035 (Claude Usage real data — the nearest sibling "new
  machine-facing surface" decision, including its own bearer-secret
  reasoning this ADR distinguishes itself from)
- `docs/requirements/REQUIREMENTS-SPEC.md` §7.7 (this amendment)

---

## Change History

| Date | Version | Changes | Author |
|---|---|---|---|
| 2026-09-18 | 1.0 | Initial draft, on direct PM/developer instruction in-session | AI |
| 2026-09-18 | 1.1 | Renumbered from ADR-036 to ADR-037 on discovering ADR-036 (per-model pricing) already existed in `ADR-INDEX.md` | AI |
| 2026-09-22 | 1.2 | Added Reconnect (§5) — re-activates a disconnected row in place instead of requiring a new connection | AI |

---

**Approval**

| Date | Approver | Comments | Status |
|---|---|---|---|
| | | | PENDING |
