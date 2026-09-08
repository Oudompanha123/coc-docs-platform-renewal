# ADR-008: External Channel Authentication

> **Status**: PROPOSED
> **Date**: 2026-09-08
> **Author**: security-auditor
> **Approver**: PM (Socheat-Hun), design-gate (G2) review
> **Related ADR**: ADR-011 (Security Model), ADR-005 (PII)

---

## 1. Context

The platform has exactly two external, machine-facing channels that need an authentication decision independent of the browser session model covered in ADR-011: the new Google Sign-In integration (human-facing but protocol-level), and the retained `/api/ingest` bearer-secret endpoint (machine-facing, pre-existing).

- **Background summary**: Today's site has one external channel: `/api/ingest`, authenticated by a single shared bearer secret (`INGEST_SECRET`), exempt from the middleware auth gate, with no per-editor identity or revocation short of rotating the one secret. This project adds a second external channel — Google OIDC — as the sole authentication mechanism for human users (FR-AUTH-001, FR-AUTH-002). NFR-SEC-CHANNEL requires all external calls use TLS and explicitly forbids `/api/ingest`'s pattern from becoming the template for editorial write paths.
- **Related requirements**: NFR-SEC-CHANNEL, NFR-SEC-AUTH, FR-AUTH-001, FR-AUTH-002
- **Related risks**: RISK-005 (indirectly — auth model shapes who can inject content), TM-001, TM-004 in `docs/design/threat-model.md`
- **Decision pressure**: Must be settled before any editorial write API is designed, since the wrong precedent here (reusing `/api/ingest`'s shared-secret pattern) would propagate a weak identity model across every future write path.

## 2. Decision

**Google OIDC (Sign in with Google)** is the sole authentication mechanism for every human-facing channel — reader site and admin console alike. The **existing `/api/ingest` bearer-secret channel is retained unchanged**, scope-limited strictly to its current purpose (usage-metric ingestion into Google Sheets), and is explicitly documented as a legacy exception, never a pattern to extend. No new machine-to-machine channel is introduced in MVP.

> Every human session is established via Google OIDC (authorization-code flow, server-side token exchange, ID token verified server-side). The one pre-existing machine channel (`/api/ingest`) keeps its shared-secret design as-is, under the explicit condition that it is never used as a precedent for a channel that can write editorial content, and that its secret is rotated on a defined cadence.

### Key Choices
- **Human channels (reader, admin console)**: Google OIDC only. No username/password, no separate admin-only auth mechanism, no API-key-based admin access. `google-auth-library` is already a dependency (proposal §6).
- **All external calls use TLS** — this includes the OIDC handshake (enforced by Google), the browser↔app connection (enforced by Vercel), and app↔DB (enforced by provider connection string requiring TLS).
- **`/api/ingest` retained as a documented exception**: single shared bearer secret, IP/traffic-pattern unchanged from AS-IS, explicitly out of scope for redesign since FR-USAGE-001 (migrating ai-usage into the DB) is `Won't` for this release.
- **No mTLS** is introduced. mTLS is the template pattern this agent's own case studies favor for partner/financial channels, but this platform has no partner-to-partner or financial-transaction channel — only a browser-facing OIDC flow and one internal script (`push-usage.mjs`, run by teammates' own workstations, not an external partner). mTLS would add certificate issuance/rotation operational burden with no threat it uniquely closes here.
- **Rotation**: `INGEST_SECRET` rotated on a 90-day default interval per `security/runbook-key-rotation.md`; OIDC has no comparable "secret" to rotate on the app side (Google manages signing key rotation for ID tokens; the app's own OAuth client secret, if used server-side for token exchange, follows the same 90-day rotation discipline).

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Google OIDC for all human channels; retain `/api/ingest`'s shared secret unchanged, explicitly fenced off | Zero new credential type to manage for humans (removes password admin entirely — FR-AUTH-002); reuses an already-planned dependency; does not touch a working, low-risk legacy path unnecessarily | `/api/ingest` remains a single point of compromise for usage-ingestion with no per-editor audit trail — accepted because it never gains write access to editorial content | **Adopted** |
| B | Google OIDC for humans; migrate `/api/ingest` to per-teammate OAuth tokens or short-lived signed requests as part of this project | Removes the shared-secret weakness entirely; every ingest write attributable to an individual | FR-USAGE-001 (moving ai-usage off Sheets / redesigning its ingestion) is explicitly `Won't` for this release (AMB-004) — redesigning the ingest auth without redesigning the destination store is scope creep with no product benefit this release; the endpoint's blast radius is already limited to a Sheet, not editorial content | Not adopted for MVP — natural companion to FR-USAGE-001 if it is picked up in a later release |
| C | mTLS between the app and all external dependencies (Google, DB, object storage) | Strongest channel-level assurance; matches heavier financial-grade patterns | None of this system's actual external dependencies are partner-to-partner channels needing mutual authentication — Google OIDC, managed Postgres, and managed object storage all authenticate via their own provider-standard mechanisms (OAuth, connection-string credentials, signed URLs) that already run over TLS; mTLS would require a private CA or client-cert issuance process with no counterpart on the other end for any of these providers | Not adopted — disproportionate to this system's actual channel topology |

### Scoring (Optional)

| Dimension | Weight | A | B | C |
|------|-----|---|---|---|
| Team proficiency | 25% | 9 | 6 | 3 |
| Fit to in-scope requirements (FR-USAGE-001 is Won't) | 25% | 10 | 3 | 8 |
| Security improvement over AS-IS | 20% | 8 | 9 | 8 |
| Operational cost | 15% | 9 | 5 | 2 |
| Reversibility (can adopt B later without rework) | 15% | 9 | — | 5 |
| **Weighted total** | | **8.90** | 5.30 | 5.55 |

## 4. Consequences

### 4.1 Positive Impacts
- Removes password storage, reset flows, and lockout handling from scope entirely (FR-AUTH-002), eliminating an entire class of credential-related threats.
- Keeps a working, low-risk legacy integration (`/api/ingest`) stable rather than introducing redesign risk into a path this release does not need to touch.
- Sets a clear, documented precedent (NFR-SEC-CHANNEL) that prevents the shared-secret pattern from silently propagating into the new editorial write paths this project is building.

### 4.2 Negative Impacts / Costs to Accept
- `/api/ingest` remains a single-secret channel with no per-editor identity or fine-grained revocation — accepted as TM-004 residual risk in the threat model, bounded by its limited blast radius (writes only to a Sheet, no editorial authority) and a 90-day rotation cadence.
- Google becomes a hard dependency for all authentication; an outage on Google's side blocks all sign-in. Accepted given NFR-AVAIL-01 (best-effort, no uptime SLA) and the absence of a viable, lower-cost alternative identity provider for this team size.

### 4.3 Follow-up Work
- [ ] If FR-USAGE-001 is revisited in a later release, re-open this ADR to design per-editor ingest authentication (Option B) as part of that work, not before.
- [ ] Add `/api/ingest` secret rotation to the recurring operational calendar (90-day cadence) per `security/runbook-key-rotation.md`.
- [ ] Document the OIDC client secret's own rotation cadence alongside `INGEST_SECRET` in the same runbook.

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| All external calls use TLS | Configuration/network review (Vercel enforces HTTPS; DB connection string requires `sslmode=require` or provider equivalent) | At provisioning, re-checked at each gate | 100% TLS, zero plaintext fallback |
| OIDC token verification (signature, audience, issuer, nonce) | Security test + code review | Per release | All four checks present and tested |
| `/api/ingest` scope unchanged / no new callers | Code review of any PR touching `/api/ingest` or introducing new write endpoints | Per PR | Zero editorial write paths reusing `INGEST_SECRET` pattern |
| `INGEST_SECRET` rotation | Operational audit against runbook cadence | Every 90 days | Rotated on schedule, old secret revoked |

## 6. References

- Related code: `app/api/ingest/route.ts`, `lib/auth.ts`, `app/api/login/route.ts` (AS-IS)
- Related requirements: NFR-SEC-CHANNEL, NFR-SEC-AUTH, FR-AUTH-001, FR-AUTH-002
- Related ADR: ADR-011 (Security Model — umbrella, owns session management post-authentication), ADR-005 (PII)
- Threat model: `docs/design/threat-model.md` TM-001, TM-004
- Runbook: `security/runbook-key-rotation.md`

---

## Change History

| Date | Version | Changes | Author |
|------|------|------|--------|
| 2026-09-08 | 1.0 | Initial draft | security-auditor |

---

**Approval**
| Date | Approver | Comments | Status |
|------|--------|------|------|
| 2026-09-08 | PM (Socheat-Hun) | Pending G2 design-gate review | **PENDING** |
