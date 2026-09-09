# Risk Register — Coc Docs Platform

> **Version**: 2.0 · **Date**: 2026-09-09 · **Owner**: PM (Socheat-Hun)
> **Supersedes**: v1.0 (2026-09-08), scored for one part-time developer and a single-service architecture
> **Related**: [threat-model.md](threat-model.md) (security threats, CVSS-scored) · [DEV-PLAN.md §9](DEV-PLAN.md)
> **Count**: 19 (minimum 10 required, Skill 03 §4)

Security threats are tracked separately in the threat model with CVSS scores. This register covers **project** risks.

---

## What Changed in v2.0

Three inputs changed, and the risk profile moved with them:

| Change | Effect |
|---|---|
| 1 part-time developer → **6 developers** (CONST-RES-02) | **RISK-001 downgraded H/H → M/L.** Stalling is far less likely with six people and shared accountability |
| One service → **two services** (CONST-TECH-05) | **Four new risks** — contract drift, integration lag, cross-origin security, environment divergence |
| Hosting **decided: Google Cloud** | RISK-017 (undecided hosting) **closed** |

**The dominant risk has moved from stalling to diverging.** That is not a smaller risk, just a different one — and it arrives sooner. There is already one instance on day one: two developers, two different JDK versions.

---

## Heat Map

| | **Impact H** | **Impact M** | **Impact L** |
|---|---|---|---|
| **Prob H** | — | **RISK-018**, RISK-011 | — |
| **Prob M** | RISK-002, 003, 005, 007, **RISK-019** | RISK-004, 006, 008, 010, 012, 013, 015, **RISK-020** | RISK-016 |
| **Prob L** | RISK-009, 014, **RISK-021** | **RISK-001** | — |

---

## New in v2.0 — the two-service and team risks

### RISK-018 — API contract drift between frontend and backend
- **Area**: Technology · **Impact**: M · **Probability**: **H**
- **Description**: Two services built in parallel by different people. The contract can break silently — a renamed field, a changed nullability, a new required parameter — and nothing fails until someone runs the app end to end. With six developers this can happen within a single day.
- **Response**: Mitigate
- **Plan**: OpenAPI committed and reviewed, not held informally. Contract tests run in CI on **both** sides. Sprint 0 exists specifically to agree the contract before either side moves. Integration on the pilot slice starts in Sprint 1, not at the end.
- **Owner**: PM · **Checkpoint**: every PR; CI contract job must be green

### RISK-019 — Authorisation enforced only in the frontend
- **Area**: Security · **Impact**: **H** · **Probability**: M
- **Description**: The most dangerous mistake available in this architecture. A developer implements a permission check in the admin UI, it visibly works, and it is worthless — anyone can call the API directly with `curl` and skip it entirely. It looks correct in review and in manual testing.
- **Response**: Mitigate
- **Plan**: `CONST-TECH-07` makes the backend authoritative. Every authorisation test must call the API **directly**, bypassing the UI — a browser-driven test proves only that the button is hidden. `FR-AUTH-008` is the reference case and requires an explicit negative test. Called out in architecture-overview §3 and TEST-PLAN §5.
- **Owner**: whoever reviews backend PRs · **Checkpoint**: every endpoint added

### RISK-020 — Environment divergence across six machines
- **Area**: Staffing · **Impact**: M · **Probability**: M
- **Description**: Six developers, six machines, six local PostgreSQL installs. Produces "works on my machine" defects that are expensive to diagnose because they reproduce nowhere else.
- **Response**: Mitigate
- **Plan**: **Already occurred** — one developer reported Java 25 while the project targets Java 21, on day one. Sprint 0 aligns the toolchain and CI enforces it. Flyway applies the identical schema everywhere, local included.
- **Owner**: PM · **Checkpoint**: Sprint 0 exit; CI on every push

### RISK-021 — Integration deferred until late
- **Area**: Schedule · **Impact**: **H** · **Probability**: L
- **Description**: Backend and frontend each look finished, meet for the first time late, and do not fit. The classic failure of parallel work, and the reason it is scored H impact despite low probability.
- **Response**: Avoid
- **Plan**: Structural, not procedural — Sprint 1's exit criterion is an **end-to-end** edit-and-publish through both services on real content. There is no sprint in which the two sides are apart.
- **Owner**: PM · **Checkpoint**: Sprint 1 exit

---

## Re-scored in v2.0

### RISK-001 — The project stalls
- **Area**: Staffing · **Impact**: M *(was H)* · **Probability**: **L** *(was H)*
- **Was the highest-ranked risk in v1.0.** With one part-time developer, no deadline and no external accountability, stalling was the likeliest outcome. Six developers with visible assigned tasks and shared accountability changes that materially.
- **Response**: Mitigate
- **Plan**: Every sprint still ends in something usable. Coexistence means an abandoned project degrades to "some doc sets migrated" rather than a broken site. Scope levers still named in advance.
- **Owner**: PM · **Checkpoint**: sprint retros

### RISK-011 — Scope grows beyond capacity
- **Area**: Schedule · **Impact**: M · **Probability**: H *(unchanged)*
- More capacity invites more scope. *"Next time have more"* was stated at Q1, and six people make it easier to say yes.
- **Response**: Mitigate
- **Plan**: Phase-2 boundary already drawn — public access, search, section CRUD, review workflow and ai-usage migration are all `Won't`. New requests go to phase 2 by default.
- **Owner**: PM · **Checkpoint**: every sprint planning

### RISK-017 — Backend hosting undecided — **CLOSED 2026-09-09**
Resolved: Google Cloud, external cloud permitted (ADR-012 §2.1). The production *database provider* remains open but is not a risk — `CONST-TECH-08` keeps the design portable, so switching costs a connection string.

---

## Carried forward from v1.0

### RISK-002 — Vocabulary reduction causes visible regression
**H / M · Accept with verification.** 32 block structures collapse to 10. Some pages will not look as they do today. Sprint 2 measures the damage on `coach.tsx` before mass migration. *Owner*: PM · *Checkpoint*: Sprint 2 exit.

### RISK-003 — Automated conversion proves infeasible
**H / M · Mitigate.** Content is compiled JSX with interleaved expressions and `dangerouslySetInnerHTML`. Sprint 1 hand-migrates 15 versions *before* any converter is written, so the converter is built from evidence. Sprint 5 budgets manual review of every panel regardless. *Owner*: migration track · *Checkpoint*: Sprint 1 retro — record actual minutes per panel.

### RISK-004 — Silent loss of translation completeness
**M / M · Mitigate.** `tsc` currently fails the build on a missing locale; a database cannot. FR-I18N-003 status screen is the compensating control; staleness is derived, not flagged, so it cannot drift. *Owner*: PM · *Checkpoint*: coverage must read 100% every sprint.

### RISK-005 — Stored XSS via authored content
**H / M · Mitigate.** Structural, not filter-based: ADR-010 §3 removes raw HTML from the model entirely. The tiered escape-hatch variant was rejected precisely because it reintroduces this. See TM-010. *Owner*: backend reviewers · *Checkpoint*: Sprint 5 security tests.

### RISK-006 — Upload becomes an attack surface
**M / M · Mitigate.** Entirely new capability — zero images today, no pattern to inherit. Three-signal validation, storage outside executable paths. *Owner*: backend · *Checkpoint*: Sprint 4.

### RISK-007 — Encoding corruption during migration
**H / M · Avoid.** PowerShell 5.1 corrupts em-dashes, Korean and Khmer (`CLAUDE.md:152`); ~9,000 lines of km/ko will pass through tooling. CONST-OPS-01 forbids it outright; round-trip verification is automated because corruption is often invisible on inspection. *Owner*: migration track · *Checkpoint*: every batch.

### RISK-008 — Database becomes a single point of failure for reading
**M / M · Mitigate.** Today's pages are pre-rendered and survive a backend outage. **Two services now mean two things can fail** between reader and documentation. NFR-AVAIL-02 cache fallback; failure-injection test. *Owner*: frontend · *Checkpoint*: Sprint 6 drill.

### RISK-009 — Loss of content history and backup
**H / L · Mitigate.** Git currently provides history, rollback and backup free on every push. FR-CONT-012 versioning, NFR-OPS-BACKUP with a **restore drill** — the drill is the requirement, not the config. *Owner*: PM · *Checkpoint*: Sprint 6, must actually be performed.

### RISK-010 — Editor choice proves wrong after content is migrated
**M / M · Mitigate.** BlockNote won by 2.7% — inside the noise. Content is stored in its block format, so reversing after mass migration means migrating twice. Sprints 1–2 expose this while it is 5–15 pages. *Owner*: frontend · *Checkpoint*: Sprint 2 go/no-go.

### RISK-012 — Tier B boundary shifts
**M / M · Accept.** More panels may embed components than the three identified. The `embed` block generalises, so extra cases are registrations rather than redesign. *Owner*: migration track · *Checkpoint*: Sprint 2 and 5.

### RISK-013 — NFR-USE-01 fails at the end
**M / M → M / L · Mitigate.** **Volunteer now named: Pann Voleak.** Dry run scheduled in Sprint 2, not Sprint 7. Outstanding: confirm Workspace provisioning and explicit consent. *Owner*: Sreyly · *Checkpoint*: Sprint 2 dry run.

### RISK-014 — Google OIDC outage locks everyone out
**H / L · Accept.** Sole authentication path; FR-AUTH-002 forbids stored passwords, so no local fallback by design — a fallback would reintroduce the credential handling that Google sign-in removes. *Owner*: PM · *Checkpoint*: phase-2 planning.

### RISK-015 — Slug or URL changes break inbound links
**M / M · Mitigate.** `page_slug_history` with permanent redirects; legacy `/#slug` hashes preserved; internal links stored as page references, not strings. *Owner*: backend · *Checkpoint*: Sprints 3 and 6.

### RISK-016 — Phase-2 disclosure exposes the internal portfolio
**L (MVP) / H (phase 2) · L · Avoid.** The `idea` doc set lists 9 internal system names, environment IDs, debug ports and Tomcat versions; ai-usage holds employee PII. BR-026 requires an explicit human decision before any page becomes `guest`-visible — the default must never be "public". *Owner*: PM · *Checkpoint*: phase-2 planning gate, mandatory threat-model re-review.

---

## Review Cadence

| When | What |
|---|---|
| Every sprint retro | Re-score RISK-011, 018, 020 — the coordination risks |
| Sprint 0 exit | RISK-020 must be closed: six machines, one toolchain |
| Sprint 1 exit | RISK-021 — end-to-end integration proven, or the plan is wrong |
| Sprint 2 exit | Go/no-go on RISK-002, 010, 012 |
| Sprint 6 | Verify RISK-008, 009 **by drill, not by assertion** |
| Phase-2 planning | Full re-review; mandatory for RISK-016 |
