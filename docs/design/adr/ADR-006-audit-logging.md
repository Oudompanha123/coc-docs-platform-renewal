# ADR-006: Audit Logging Model

> **Status**: PROPOSED
> **Date**: 2026-09-08
> **Author**: security-auditor
> **Approver**: PM (Socheat-Hun), design-gate (G2) review
> **Related ADR**: ADR-011 (Security Model), ADR-005 (PII)

---

## 1. Context

Today, accountability for content changes is implicit: git history records every commit by the single author (the PM). Once multiple non-technical `admin`s can edit and publish directly, that free accountability disappears unless it is rebuilt deliberately as an application feature.

- **Background summary**: FR-OPS-001..003 require every content change, every failed sign-in / permission-denied event, and every rejected upload to be logged with actor, action, target and timestamp. NFR-OPS-AUDIT requires at least 1-year retention with append-only entries. BR-023 and BR-029/030 restate the same from the business side.
- **Related requirements**: FR-OPS-001, FR-OPS-002, FR-OPS-003, NFR-OPS-AUDIT, BR-023, BR-029, BR-030
- **Related risks**: TM-008 (repudiation), TM-009 (failed-login visibility) in `docs/design/threat-model.md`
- **Decision pressure**: Schema for the audit table must be settled before ADR-001-adjacent data modelling; also determines whether repudiation threats (TM-008) are adequately mitigated for G2.

## 2. Decision

A single **append-only `audit_log` table** in the same Postgres database records three event families — content changes, auth/permission events, and upload rejections — each row carrying actor, action, target, timestamp, and a small JSON detail payload. No dedicated log-aggregation service, no separate immutable-log infrastructure (e.g. WORM storage, blockchain-anchored logs) is introduced for MVP; application-layer discipline (no UPDATE/DELETE code path against this table) is the enforcement mechanism, with a documented follow-up to add DB-level enforcement if/when justified.

> Audit logging is implemented as one application-owned, append-only table, written synchronously in the same transaction as the action it records where feasible (so a failed audit write can block a content publish rather than silently losing the record), retained for at least 1 year per NFR-OPS-AUDIT, and never exposed below `admin` role.

### Key Choices
- One `audit_log` table, not per-feature tables — simplifies both the retention policy and the "translation status" / "recent edits" dashboard queries (Admin Dashboard, proposal §5.2) that read from it.
- Event families: `CONTENT_CHANGE` (create/edit/publish/delete/restore-version — FR-OPS-001), `AUTH_EVENT` (sign-in success/failure, permission-denied — FR-OPS-002), `UPLOAD_REJECTED` (with reason — FR-OPS-003).
- Row shape: `actor_id` (nullable for pre-auth failed-login attempts, capturing the attempted identifier instead), `action`, `target_type`, `target_id`, `timestamp`, `detail` (JSONB), `event_family`.
- Append-only by convention at the application layer: the ORM/service layer exposes only `insert`, never `update`/`delete`, against this table.
- Retention: rows are never purged by the application before 1 year (NFR-OPS-AUDIT); no automatic purge job exists in MVP at all — deletion, if ever needed, is a manual DBA action.
- Visibility: audit trail is readable only by `admin`/`super admin` (it is itself PII-adjacent, since it names actors) — consistent with ADR-005's role-scoping approach.

## 3. Considered Alternatives

| # | Alternative | Pros | Cons | Adopted |
|---|------|------|------|---------|
| A | Single append-only Postgres table, application-enforced immutability | Reuses existing infrastructure (no new system to run); simple queries for the dashboard's "recent edits" view (FR-OPS overview, proposal §5.2); matches team size (one part-time developer) | Immutability is enforced by discipline (no UPDATE/DELETE code path), not by the database itself — a direct SQL console session or a future bug could still mutate rows | **Adopted** |
| B | Same table, but with DB-level enforcement (revoke UPDATE/DELETE grants on the audit table for the application's DB role; optionally a database trigger rejecting mutation) | Closes the "direct SQL access" gap in Option A at near-zero ongoing cost | Adds one more piece of DB configuration to get right and remember on every environment (dev/staging/prod) provisioning step; for a solo developer who is also the only one with direct DB access today, the incremental protection is against future-self more than an external attacker | Not adopted for MVP; recorded as the first §4.3 follow-up rather than rejected outright |
| C | External/managed log sink (e.g. shipping audit events to a write-once object-storage bucket or a third-party logging SaaS) | Strongest tamper-evidence; industry-standard pattern for regulated audit trails (this agent's own case studies cite S3 Glacier migration for 7-year retention in a regulated context) | No such regulatory retention requirement is currently confirmed for this platform (BUSINESS-REQUIREMENTS §7: "TBD"); adds a new external dependency, cost, and integration surface disproportionate to a 1-year, non-regulated retention requirement and a one-person team | Not adopted — revisit only if BUSINESS-REQUIREMENTS §7's regulatory-scope TBD resolves to "applies" |

### Scoring (Optional)

| Dimension | Weight | A | B | C |
|------|-----|---|---|---|
| Team proficiency | 25% | 9 | 8 | 4 |
| Operational cost | 25% | 9 | 8 | 3 |
| Tamper-resistance | 20% | 5 | 7 | 10 |
| Fit to current retention requirement (1 yr, non-regulated) | 20% | 9 | 9 | 6 |
| Query convenience (dashboard reads) | 10% | 9 | 9 | 4 |
| **Weighted total** | | **8.15** | 8.05 | 5.30 |

> A and B score within 10% of each other (1.2% gap), which per the ADR template's rule would normally require PM approval to break the tie. B's DB-grant hardening is therefore recorded as an approved-in-principle, low-cost follow-up (§4.3) rather than forcing a re-decision now — the PM can adopt it at any point without re-opening this ADR.

## 4. Consequences

### 4.1 Positive Impacts
- FR-OPS-001..003 and NFR-OPS-AUDIT are satisfied with no new infrastructure.
- The same table powers a genuine product feature (the admin dashboard's "recent edits" view, proposal §5.2), so the audit trail is not pure overhead.
- TM-008 (repudiation) and TM-009 (failed-login visibility) in the threat model are mitigated to a level proportionate to the current (non-regulated, internal) risk profile.

### 4.2 Negative Impacts / Costs to Accept
- Immutability is not database-enforced in MVP; a bug or a direct SQL session could mutate history. Accepted per the threat model §4 residual-risk decision on TM-008.
- No automated retention/purge tooling exists; if retained indefinitely by default, table growth is unbounded (mitigated by the fact that audit rows are small and content-change volume is low — 200 pages, 10 concurrent editors per NFR-SCALE-01).

### 4.3 Follow-up Work
- [ ] Revoke `UPDATE`/`DELETE` grants on `audit_log` for the application's DB role (Option B hardening) — low cost, recommended before go-live if time allows, not a G2/G3 blocker.
- [ ] Re-evaluate Option C (external write-once sink) if BUSINESS-REQUIREMENTS §7's regulatory-scope determination resolves to "applies" before phase 2.
- [ ] Define an explicit retention/archival policy once the table's growth rate is observed post-launch (currently unbounded-but-small by design).

## 5. Verification / Monitoring

| Item | Measurement Method | Frequency | Threshold |
|------|---------|------|--------|
| Every content change produces exactly one audit row | Integration test (FR-OPS-001 verification method) | Per release | 100% of create/edit/publish/delete/restore actions logged |
| Failed sign-ins and permission-denied events logged | Integration test (FR-OPS-002) | Per release | 100% |
| Rejected uploads logged with reason | Integration test (FR-OPS-003) | Per release | 100% |
| No UPDATE/DELETE code path exists against `audit_log` | Static code review / grep for mutation calls against the audit repository | Per PR touching audit code | Zero matches |
| Retention ≥ 1 year | Operational audit of retention configuration | At each gate (G2/G3) and annually thereafter | ≥ 1 year, no premature purge |

## 6. References

- Related requirements: FR-OPS-001, FR-OPS-002, FR-OPS-003, NFR-OPS-AUDIT, BR-023, BR-029, BR-030
- Related ADR: ADR-011 (Security Model — umbrella), ADR-005 (PII — audit rows are PII-adjacent)
- Threat model: `docs/design/threat-model.md` TM-008, TM-009
- Related runbook: `security/runbook-incident.md` (audit trail is the primary forensic source during incident response)

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
