# ADR-005: PII Storage and Encryption Approach

> **Status**: PROPOSED
> **Date**: 2026-09-08
> **Author**: security-auditor
> **Approver**: PM (Socheat-Hun), design-gate (G2) review
> **Related ADR**: ADR-011 (Security Model), ADR-001 (database selection, referenced not owned here)

---

## 1. Context

Moving content and identity into a database introduces the platform's first genuine PII store. Today the only persistent PII-bearing store is the ai-usage Google Sheet (per-teammate email + token usage); after migration, Postgres additionally holds account records (name, email, role) and the audit trail (actor identity per action).

- **Background summary**: NFR-SEC-PII requires personal data be access-restricted by role and never exposed to `guest`/unauthenticated requests. BUSINESS-REQUIREMENTS §7 flags PII processing as triggering a mandatory security ADR (Skill 01 §6) and marks statutory regulatory scope as **TBD**, explicitly noting the documented systems (JEX/banking/insurance) are not the same thing as this documentation platform being a regulated system itself.
- **Related requirements**: NFR-SEC-PII, BR-020, BR-021, FR-AUTH-002, FR-AUTH-003
- **Related risks**: RISK-010 (ai-usage PII, phase 2), TM-013/TM-014 in `docs/design/threat-model.md`
- **Decision pressure**: This must be settled before the DB schema is finalized in ADR-001-adjacent data modelling work; it also gates whether column-level crypto libraries need to be added as a dependency now.

**What PII actually exists in this system, precisely**:

| Data | Field(s) | Sensitivity | Who can currently see it (post-migration design) |
|---|---|---|---|
| Account identity | name, email | Low-Medium (workplace directory-equivalent) | `super admin` (all), account owner (self) |
| ai-usage records | `user_email`, per-teammate token counts, keyed `(user_email, date)` | Medium (individual productivity/usage data) | `user` (own row only), `admin`/`super admin` (all rows) per BR-020 |
| Audit trail | actor email/id, action, target, timestamp | Low-Medium (necessary for accountability, not secret) | `admin`/`super admin` (operational necessity) |

No payment data, no health data, no government ID numbers, no passwords (FR-AUTH-002 — Google OIDC only) are ever stored. This is a materially lighter PII profile than a financial or health system, and the control level below is chosen to match it, not to under- or over-build.

## 2. Decision

Personal data is protected primarily through **role-scoped access control enforced at the query layer**, backed by the **hosting provider's native encryption at rest** (Neon/Supabase both encrypt storage and backups by default), with **no bespoke column-level application encryption in MVP**. Access control is the load-bearing control here, not cryptography, because the realistic threat this system faces is a role-check bug or an over-broad query — not disk theft.

> Personal data at rest relies on provider-managed encryption; personal data in transit uses TLS end-to-end (DB connection, OIDC, browser). Confidentiality between roles is enforced by application-layer row/query scoping, not by encrypting different columns for different audiences. No column-level (`pgcrypto`/application AES-GCM) encryption is introduced for MVP; it is recorded as a deferred option, not a rejected one, should regulatory scope change (BUSINESS-REQUIREMENTS §7, "TBD").

### Key Choices
- Provider-native encryption at rest (Neon/Supabase managed) covers the "stolen disk / leaked backup" threat class.
- TLS is mandatory on every hop that touches PII: browser↔app, app↔DB, app↔OIDC (NFR-SEC-CHANNEL, ADR-011).
- Role-scoped queries are the primary confidentiality control for ai-usage data: a `user`'s query is always scoped `WHERE user_email = :self`; `admin`/`super admin` queries are unscoped by design (BR-020). This is enforced in the query/service layer, never left to client-side filtering (this is also TM-013 in the threat model).
- Account PII (name, email) is visible to `super admin` for account management and to the owning user for their own profile; it is not exposed in any `guest`-reachable response, now or in phase 2, by construction (ai-usage and account routes carry a minimum role ≥ `user`).
- No PII field is ever included in a client-side bundle, a public API response, or a log line at `info` level or below (structured logs redact email to a hashed/truncated form where logging is needed for debugging).
- Backups (NFR-OPS-BACKUP, BR-025) inherit the same encryption-at-rest guarantee from the provider; no separate backup-encryption mechanism is built.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Provider-native encryption at rest + role-scoped access control (no column-level crypto) | Zero added complexity or dependency; matches actual threat (access-control bugs, not disk theft); one part-time developer can build and maintain it; fully reversible if requirements change | Does not protect against a compromised database credential/SQL-injection reading PII directly (mitigated instead by TLS + parameterised queries + least-privilege DB role) | **Adopted** |
| B | Application-layer column encryption (AES-256-GCM via `pgcrypto` or a JS crypto library) on email/PII columns, decrypted only for authorized roles | Defends against a compromised DB credential or an internal query bypassing app-layer role checks; matches the sg-gw precedent (8 PII columns with AES-256-GCM via `@Convert`) cited in this agent's own case studies | Adds key management (where does the encryption key live, who rotates it, ADR-required rotation runbook) for a one-person part-time project with no regulatory mandate yet; breaks equality lookups/indexing on encrypted columns (ai-usage's `(user_email, date)` upsert key would need a deterministic-encryption scheme or a separate lookup hash) unless carefully designed; genuinely disproportionate to the current data sensitivity and regulatory scope (§7: TBD, not confirmed) | Not adopted for MVP — see §4.3 follow-up |
| C | No encryption at rest at all, rely solely on network-level and application-level access control | Simplest; matches "one part-time developer, no deadline" constraint most literally | Fails NFR-SEC-PII's spirit and any reasonable due-diligence bar; providers offer encryption at rest for free, so declining it has no benefit and real downside if a backup is ever mishandled | Not adopted |

### Scoring (Optional)

| Dimension | Weight | A | B | C |
|------|-----|---|---|---|
| Team proficiency (1 part-time dev) | 30% | 9 | 4 | 9 |
| Regulatory fit (current, non-regulated scope) | 25% | 9 | 7 | 5 |
| Security depth | 20% | 6 | 9 | 2 |
| Operational cost (key rotation, indexing impact) | 15% | 9 | 3 | 10 |
| Reversibility / future-proofing | 10% | 8 | 6 | 3 |
| **Weighted total** | | **8.20** | 5.90 | 6.35 |

> Option A is adopted at a comfortable margin (> 10% over runner-up C, and C is disqualified on NFR-SEC-PII grounds regardless of score).

## 4. Consequences

### 4.1 Positive Impacts
- No new cryptographic key to generate, store, or rotate — reduces the attack surface (a mishandled encryption key is itself a common breach cause) and the operational burden on a solo developer.
- ai-usage's `(user_email, date)` upsert key remains a plain indexable column, preserving simple, fast queries.
- The control matches the actual data sensitivity: this is workplace directory + productivity-metric data, not financial or health PII, and BUSINESS-REQUIREMENTS §7 has not yet established a statutory retention/encryption obligation.

### 4.2 Negative Impacts / Costs to Accept
- If the application's DB credential or a service role is ever over-privileged or leaked, PII is readable in plaintext by whoever holds that credential — this is accepted because the mitigating control (least-privilege DB role, credential held only in Vercel env vars, never committed) is judged sufficient at this sensitivity level.
- If regulatory scope is later confirmed to apply (phase 2, per BUSINESS-REQUIREMENTS §7 "TBD"), this decision will need revisiting — flagged explicitly as a follow-up, not silently deferred.
- A DBA or anyone with direct database access (there is effectively only the PM/developer today) sees PII in plaintext. Given a one-person team, this is the same access the PM already has to today's Google Sheet.

### 4.3 Follow-up Work
- [ ] Before phase 2 public exposure, re-run the BUSINESS-REQUIREMENTS §7 regulatory-scope check (EFSR/ISMS-P/Credit Information Act) and revisit this ADR if any applies.
- [ ] If the platform ever adds a second operator with direct DB access beyond the PM, re-evaluate column-level encryption for the ai-usage table specifically (highest-sensitivity PII in scope).
- [ ] Configure the application's DB role with least privilege (no `DROP`/`ALTER` on production tables; read/write only on the tables it needs).

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Provider encryption-at-rest enabled | Configuration review of Neon/Supabase project settings | Once, at provisioning; re-checked at each gate | Enabled (provider default) |
| ai-usage row-scoping correctness | Security test: `user` A queries usage endpoint, asserts A cannot retrieve `user` B's row | Per release (Skill 5) | 100% pass |
| No PII in client bundle / public response | Code review + grep for PII field names in `app/` client components and public API routes | Per PR touching account/usage code | Zero matches outside authorized server-side code |
| No PII at `info`-level logs | Code review of logging calls | Per PR | Zero raw email/PII in log statements |

## 6. References

- Related code: `lib/usage/*`, `app/api/ingest/route.ts` (AS-IS, retained per ADR-011)
- Related requirements: NFR-SEC-PII, BR-020, BR-021, FR-AUTH-002, FR-AUTH-003
- Related ADR: ADR-011 (Security Model — umbrella), ADR-001 (DB provider selection)
- Threat model: `docs/design/threat-model.md` TM-013, TM-014
- External materials: Neon/Supabase encryption-at-rest documentation (provider docs, reviewed at provisioning time)

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
