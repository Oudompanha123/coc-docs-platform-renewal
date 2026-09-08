# Skill 02 — Requirements Refinement Question Log

> Project: Coc Docs Platform
> Date: 2026-09-08 · Lead `trace-mapper`, analysis run at Opus per §0 model caution
> Inputs: [PROJECT-PROPOSAL.md](../planning/PROJECT-PROPOSAL.md), [BUSINESS-REQUIREMENTS.md](../planning/BUSINESS-REQUIREMENTS.md), [Skill 01 dialogue](../planning/questions-log.md)
> Question criteria: **CQ2** (ambiguity/contradiction) and **CQ3** (human authority) only — §4.8. No questions raised without a defect signal.

---

## [B] Gap and contradiction analysis

Parsed both Skill 01 deliverables against §3 enforced rules. **3 contradictions, 12 gaps.**

### Contradictions

| ID | Contradiction | Evidence | Disposition |
|----|---|---|---|
| **C-01** | Publishing state model contradicts itself three ways | Q1 chose an option describing "draft/review/publish workflow"; the Q3 role ladder has a **single** editing role (`admin`); BR-005 says publishing is immediate; yet Q5 added a **Preview** screen, which is meaningless without an unpublished state | **RESOLVED** — see AMB-001 |
| **C-02** | "100% translation coverage" is not testable | BR-011 forbids regression below 100%; BR-013 says editing `en` marks km/ko **stale but still published**. If "covered" means *fresh*, BR-011 is breached by the first edit anyone makes. If it means *exists*, BR-011 holds trivially. | **RESOLVED by definition** — see AMB-002 |
| **C-03** | ai-usage migration in or out of MVP | Q6 answer: "move it into the new database". But it appears in **none** of the four MVP scenarios, and RISK-011 names it the first candidate to defer | **RESOLVED — supersedes Q6**, see AMB-004 |

### Gaps

| ID | Gap | Severity | Disposition |
|----|---|---|---|
| **G-01** | **No usability requirement exists at all.** The entire project justification is that a non-technical colleague can edit content unaided — a usability claim — yet proposal §7 lists performance, availability, security, extensibility, translation integrity and operations, and **no `NFR-USE`**. The project's central claim was therefore unfalsifiable: a technically perfect console nobody can use would pass every requirement. | **Critical** | RESOLVED — AMB-003 → NFR-USE-01/02 |
| G-02 | `NFR-PERF` stated as "comparable to today's pre-rendered pages" — unmeasurable, and misleading: today's pages are statically generated and CDN-served, so a DB-backed page cannot match them without a deliberate caching strategy | High | RESOLVED — AMB-005 |
| G-03 | `NFR-SCALE` entirely absent — no page count ceiling, concurrent editors, reader volume, or growth rate | Medium | Default proposed → NFR-SCALE-01 |
| G-04 | `NFR-COMPAT` entirely absent — no browser, OS or device targets. Notable because the admin console is a new UI surface and the reader site is presumably used on mobile | Medium | Default proposed → NFR-COMPAT-01/02 |
| G-05 | All retention values marked `[ASSUMED]` — audit trail, page versions, backup frequency, RPO/RTO | Medium | Defaults proposed → NFR-OPS-* |
| G-06 | Account lifecycle on departure undefined — deactivate or delete, and what happens to content they authored | Medium | Default proposed → FR-AUTH-003, FR-OPS-001 |
| G-07 | **Concurrent editing unaddressed.** The whole point is multiple editors, yet nothing specifies what happens when two admins open the same page | High | Default proposed → FR-CONT-013 |
| G-08 | Slug change breaks external inbound links. BR-008 covers *internal* links (stored as references) and BR-009 covers *legacy hash* URLs, but neither covers an admin renaming a slug on a live page | Medium | Default proposed → FR-READ-003 |
| G-09 | Page deletion leaves dangling internal references | Medium | Default proposed → FR-CONT-007 |
| G-10 | **Search absent entirely.** No search exists today and none is specified. With 105 panels growing, readers will expect it | Low for MVP | Proposed **Won't** → FR-SEARCH-001 |
| G-11 | `/api/ingest` bearer-secret auth model carries over unexamined. It works for one machine-to-server writer but has no per-editor identity, no audit, and no revocation short of rotating one shared secret | Medium | Constrained → NFR-SEC-CHANNEL, scope-limited |
| G-12 | Migration cutover undefined — during migration both `content/*.tsx` and the database hold content. Which is authoritative, and can it be rolled back? | High | Constrained → CONST-OPS-03; design detail deferred to Skill 3 |

### Mandatory security cards (§7)
Triggered by "user authentication" + "personal data storage" + "audit logs" + "external channels":
`NFR-SEC-AUTH`, `NFR-SEC-PII`, `NFR-OPS-AUDIT`, `NFR-SEC-CHANNEL`. Financial-transaction card
(`NFR-SEC-TX`) does **not** apply — no monetary domain.

---

## [C] Resolution dialogue

### AMB-001 — Publishing state model (C-01) · CQ2
**Candidates**: A: Draft + Published, same person · B: Published only, edits live on save · C: Draft → Review → Published with author/publisher split
**PM selected: A — Draft + Published, same person.**

Consequences:
- `admin` saves drafts freely and publishes explicitly. No approval step, no second role.
- The Preview screen becomes coherent (it renders the draft).
- **BR-005 is amended**: publishing — not saving — makes content live. Still no build or deploy.
- The Q1 implication of a review workflow is **explicitly dropped** for MVP. Recorded as
  `FR-WORKFLOW-001` = **Won't** (this release), revisitable when a second editor exists.

### AMB-002 — Definition of translation coverage (C-02) · CQ2
**Not put to the PM.** With AMB-001 resolved, the sensible reading is unambiguous and asking would
breach §4.8's "no unnecessary queries". Resolved by definition, flagged for confirmation at G1:

> **Coverage** = the page has a *published* version in all three locales. Measured by
> `NFR-I18N-01`, target 100%.
> **Staleness** = a published translation whose `en` source has changed since. Measured
> separately by `FR-I18N-003`; **staleness is not a coverage breach.**

This makes both BR-011 and BR-013 testable and non-contradictory.

### AMB-003 — Usability measure (G-01) · CQ2
**Candidates**: A: unassisted task test · B: time-boxed target · C: both · D: defer
**PM selected: A — unassisted task test.**

> A named non-technical colleague edits and publishes a real page, unaided, with no training
> beyond a one-page guide. **Pass = they complete it without asking the PM.**

Deliberately behavioural rather than time-based: a stopwatch can pass while the person is still
confused, and "did they need to ask me?" is the literal restatement of the Q2 driver.

### AMB-004 — ai-usage migration scope (C-03) · CQ3
**Candidates**: A: defer to phase 2 · B: include in MVP · C: remove from the platform
**PM selected: A — defer to phase 2. This supersedes the Q6 answer** ("move it into the new
database"), which was given before the solo/part-time constraint (Q8) was known.

Recorded as a deliberate revision, not a silent change. ai-usage stays on Google Sheets for MVP;
`lib/usage/*` is untouched. Cheapest available scope cut, and it removes work that does nothing
for the stated driver.

### AMB-005 — Performance target (G-02) · CQ2
**Candidates**: A: P95 < 1s reader pages · B: P95 < 500ms · C: admin only, no reader target · D: measure baseline first
**PM selected: A — P95 < 1s for reader pages.**

Achievable for a DB-backed docs page with sensible caching, without the CDN-layer design work
option B would force into ADR-001. Note honestly: this is **slower than today**, since current
pages are statically generated. Accepted as a deliberate trade.

---

## Defaults applied without a question (§4.8 — no defect signal, no query)

Each is stated as a requirement and flagged for PM confirmation at G1 rather than asked as a
separate question.

| Gap | Default applied | Requirement |
|---|---|---|
| G-03 scale | 200 pages, 10 concurrent editors, internal reader volume | NFR-SCALE-01 |
| G-04 compatibility | Reader: current Chrome/Edge/Firefox/Safari incl. mobile. Admin: desktop-first, current Chrome/Edge | NFR-COMPAT-01/02 |
| G-05 retention | Audit 1 year · last 20 page versions · daily backup | NFR-OPS-AUDIT/BACKUP/VERSION |
| G-06 account lifecycle | Deactivate, never delete; authored content and audit attribution survive | FR-AUTH-003 |
| G-07 concurrent edit | Optimistic locking — second saver is warned, not silently overwritten | FR-CONT-013 |
| G-08 slug change | Old path 301-redirects to the new one | FR-READ-003 |
| G-09 page deletion | Soft delete; internal references to a deleted page flagged in the admin | FR-CONT-007 |
| G-10 search | **Won't** for MVP | FR-SEARCH-001 |
| G-11 ingest auth | Bearer secret retained, scope-limited to the ingest endpoint; explicitly not a template for editorial writes | NFR-SEC-CHANNEL |
| G-12 cutover | Database is authoritative from cutover; the `site` branch is the rollback path and must remain deployable until sign-off | CONST-OPS-03 |

---

## Outcome

- **3 contradictions**: all resolved (2 by PM decision, 1 by definition)
- **12 gaps**: 3 resolved by PM decision, 9 closed with stated defaults pending G1 confirmation
- **0 `[AMBIGUOUS]` items left open**
- All four §7 mandatory security cards issued

**§6 DoD item 2 satisfied.** Remaining DoD: REQ-IDs with zero orphans (done, see matrix),
matrix 100% complete (done), **G1 approval — human only, still pending.**
