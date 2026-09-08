# ADR-001: Technology Stack

## Status
**SUPERSEDED IN PART** by [ADR-012](ADR-012-revision-of-001-backend-stack.md) — 2026-09-08, same day.

> **Do not read the stack sections below as current.** This ADR listed language, framework and runtime as *"Already fixed, not under evaluation"*, citing `CONST-TECH-01` — a constraint that had been **inferred rather than asked** (recorded as `Q11 — DERIVED`), written into the requirements, and then cited here as grounds for skipping the comparison. The PM's Q1 wording, *"I want to separate have backend, front end"*, in fact meant two services, and the organisation's baseline language is Java (§5.7).
>
> | Section | Status |
> |---|---|
> | Language / framework / runtime | **Superseded** — Java 21 · Spring Boot 3.4 · Maven backend + Next.js frontend (ADR-012 §1) |
> | Decision 1 — Database | **Reopened** — the 1.8% Supabase win rested on JavaScript-SDK bundling a Spring backend will not use (ADR-012 §2) |
> | Decision 2 — Object storage | **Reopened** — provider deferred; the S3 API is fixed as the abstraction (ADR-012 §2) |
> | Decision 3 — Editor library (BlockNote) | **Still valid** — a frontend decision, unaffected |
> | Rejected alternatives (MDX, off-the-shelf CMS, git-backed) | **Still valid** |
>
> Retained unedited as the record of how the decision was actually made, including the error.

---

## Original Status (as recorded 2026-09-08, before revision)
**ACCEPTED** — 2026-09-08.

Two of the three decisions fell inside the <10% runner-up margin, so PM approval was mandatory (Skill 03 §2). Both were put to the PM and confirmed:

| Decision | Selected | Runner-up | Gap | PM decision |
|---|---|---|---|---|
| Database | **Supabase (Postgres)** | Neon (4.03) | 1.8% | Confirmed 2026-09-08 |
| Object storage | **Supabase Storage** | — | — | Follows the database decision |
| Editor library | **BlockNote** | TipTap (3.77) | 2.7% | Confirmed 2026-09-08 |

- Date: 2026-09-08
- Deciders: `architect` (lead), PM (Socheat-Hun) — PM held the tie-break on both close calls
- Supersedes: —

---

## Context

Coc Docs Platform moves documentation content out of compiled `.tsx` modules into a database behind an admin console operated by **non-technical editors** (NFR-USE-01). Three components must be chosen; everything else is already constrained.

**Already fixed, not under evaluation here:**

| Component | Decision | Basis |
|---|---|---|
| Language / runtime | TypeScript 5.6 / Node | CONST-TECH-01 |
| Framework | Next.js 15 (App Router) / React 19 | CONST-TECH-01 |
| Hosting | Vercel | CONST-TECH-02 |
| Authentication | Google Sign-In (OIDC) | FR-AUTH-001, FR-AUTH-002 |
| Content model | Block schema, not MDX | CONST-TECH-03 → detail in ADR-010 |
| CI | GitHub Actions (L2 hook already authored) | `hooks/ci-security-auditor.yml` |

**Open for decision: (1) database, (2) object storage, (3) editor library.**

The dominant constraint is **CONST-RES-01 — one part-time developer, no deadline**. This shifts weight toward things that reduce total moving parts and learning surface, and away from options that are technically superior but demand more build and operations effort.

### Evaluation method

Six dimensions with fixed weights, per Skill 03 §2 `[basis:sg-gw-retrospective,adjustable]`. Scores are 1–5.

| Dimension | Weight |
|------|-------|
| Team proficiency | 25% |
| Ecosystem / community | 15% |
| License / cost | 15% |
| Performance (against required NFRs) | 15% |
| Security (vulnerability history) | 15% |
| Operations / monitoring | 15% |

> **Note on "Performance"**: for the editor decision this dimension is scored against **NFR-USE-01**, not throughput. Usability *is* the binding non-functional requirement for that component — a fast editor a non-technical person cannot operate fails the project's central claim.

---

## Decision 1 — Database

PM stated a starting preference for Postgres on Neon or Supabase (§9 dialogue, 2026-09-08).

| Candidate | Proficiency 25% | Ecosystem 15% | Cost 15% | Perf/NFR 15% | Security 15% | Ops 15% | **Weighted** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Supabase (Postgres)** | 3.5 | 4.5 | 4.5 | 4.0 | 4.0 | 4.5 | **4.10** |
| **Neon (Postgres)** | 3.5 | 4.0 | 4.5 | 4.5 | 4.0 | 4.0 | **4.03** |
| Vercel Postgres | 3.5 | 3.5 | 3.5 | 4.0 | 4.0 | 4.5 | **3.80** |

**Gap between Supabase and Neon: 1.8% — inside the <10% margin. PM approval required.**

### The real difference

Both are serverless Postgres and both satisfy every requirement. The scores are close because the databases are nearly equivalent; what separates them is **what else comes in the box**.

| | Supabase | Neon |
|---|---|---|
| Postgres | ✅ | ✅ |
| **Object storage** (needed for FR-MEDIA-001) | ✅ included | ❌ separate vendor |
| Row-level security | ✅ built in | ❌ implement in app |
| Vendor count for this project | **1** | **2** |
| Database branching | basic | ✅ excellent |
| "Just Postgres", minimal lock-in | less so | ✅ |

Supabase wins on operations (one dashboard, one SDK, one bill, one set of credentials) and would close the FR-MEDIA storage decision at the same time. Neon wins on being a purer, more portable Postgres with better branching, but leaves object storage unsolved.

Under CONST-RES-01, **reducing vendor count from two to one is worth more than branching quality** — which is why Supabase leads. But the margin is thin enough that the standard requires the PM to make the call rather than the architect.

---

## Decision 2 — Object storage

**Coupled to Decision 1.** Scored conditionally rather than independently:

| If DB is… | Storage | Rationale |
|---|---|---|
| **Supabase** | **Supabase Storage** | Already present; same auth context and SDK; no additional vendor. Effectively a free consequence of Decision 1. |
| **Neon** | **Vercel Blob** | Same vendor as hosting, native Next.js integration, simplest of the standalone options. Cloudflare R2 is cheaper at volume but this project stores screenshots, not terabytes — cost is not the deciding factor. |

Either satisfies NFR-SEC-UPLOAD provided uploads are validated on declared type, sniffed content type and size, and stored outside any executable path (ADR-011).

---

## Decision 3 — Editor library

Requirements this must satisfy: a fixed 8–10 block vocabulary (CONST-TECH-04), a custom **embed block** referencing code-resident components (FR-CONT-010, for `HarnessDemo` / `OwnerTree`), a distinct **copyable code block** type (FR-CONT-011), and above all **operability by a non-technical person** (NFR-USE-01).

| Candidate | Proficiency 25% | Ecosystem 15% | Cost 15% | Perf/NFR 15% | Security 15% | Ops 15% | **Weighted** |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **BlockNote** | 3.0 | 3.5 | 4.5 | 4.8 | 4.0 | 4.0 | **3.87** |
| **TipTap** | 3.0 | 4.8 | 3.5 | 3.8 | 4.0 | 4.0 | **3.77** |
| Lexical | 2.5 | 4.0 | 5.0 | 3.5 | 4.0 | 3.5 | **3.63** |

**Gap between BlockNote and TipTap: 2.7% — inside the <10% margin. PM approval required.**

### The real difference

- **BlockNote** is block-based natively, with a Notion-like editing experience that is the closest match to what a non-technical editor expects. It is built on ProseMirror (via TipTap), so it inherits that maturity underneath. Scores highest on Perf/NFR precisely because NFR-USE-01 is the requirement being measured. Against it: a younger project with a smaller community, and custom block types are the thing to validate first.
- **TipTap** is markedly more mature with a far larger ecosystem — the strongest choice on longevity. Against it: it is a *document*-model editor by default, so constraining it to a fixed block vocabulary is work rather than a starting point, and several extensions sit behind a paid Pro tier (reflected in the cost score).
- **Lexical** offers the most control and best performance, but is the lowest-level of the three. For one part-time developer, "most code to write" is close to disqualifying regardless of technical merit.

> **This is the highest-risk choice in the project.** The editor is where NFR-USE-01 is won or lost, and it is the component with the least reversible commitment once 105 panels have been migrated into its block format. **The pilot (`jex2.0`, 5 pages) exists to test this decision before it becomes expensive** — see DEV-PLAN Sprint 1.

---

## Alternatives Considered and Rejected Outright

| Option | Why rejected |
|---|---|
| **MDX + a code-ish editor** | MDX is code. A non-technical editor facing JSX and imports is blocked exactly as they are today, so this would relocate the bottleneck rather than remove it — a direct contradiction of the project's purpose (§2.3 of the proposal). Excluded by CONST-TECH-03. |
| **An off-the-shelf CMS** (Strapi, Directus, Payload, Sanity, Contentful) | Genuinely tempting under CONST-RES-01, and would deliver much of the admin console for free. Rejected because FR-CONT-010 requires embedding *this codebase's* live React components (`HarnessDemo`, `OwnerTree`) inside content, and FR-READ-002 requires preserving legacy hash-URL behaviour. Both mean the rendering path must stay inside the existing Next.js app, so an external CMS would add a system without removing one. **Worth revisiting if the pilot shows the custom editor is too large a build.** |
| **Keeping content in git, adding a web editor over it** | Preserves version history and backup for free, and keeps the deploy-free requirement unmet — every save would still trigger a build, breaching FR-CONT-005 and the project KPI (zero deploys for content changes). |
| **MySQL / PlanetScale** | No requirement favours it, and JSONB (Postgres) is a better fit for storing block arrays than JSON in MySQL. |
| **SQLite (Turso / D1)** | Adequate at this scale and cheapest to run, but the weaker concurrent-write story works against FR-CONT-013 optimistic locking, and the smaller ecosystem costs more solo debugging time. Scored but not tabled as a serious contender given the PM's stated Postgres preference. |

---

## Consequences

### Positive
- Postgres JSONB stores block arrays natively, with real querying over content — impossible today, when content is compiled JSX.
- Serverless pricing suits genuinely low traffic; both candidates have free tiers that comfortably cover 200 pages and 10 editors (NFR-SCALE-01).
- The existing `lib/usage/*` module already demonstrates this codebase's pattern for server-side credentialed access to an external store, so the shape is familiar.

### Negative / accepted costs
- **The database becomes a single point of failure for reading documentation.** Today's pages are pre-rendered and survive a backend outage entirely. NFR-AVAIL-02 (cache fallback) is the compensating control and is not optional.
- Reader page latency will be **worse than today** — NFR-PERF-01 targets P95 < 1s against statically served pages that are far faster. Accepted deliberately (AMB-005).
- New vendor relationships and new credentials to manage, whichever way Decision 1 goes.
- The editor library is a long-term commitment: migrated content is stored in its block format, so switching later means migrating 105 panels a second time.

### Follow-on decisions
- ADR-003 — persistence strategy (schema, versioning, ordering, optimistic locking)
- ADR-010 — content model and block vocabulary
- ADR-011 — security model (auth, session, roles, sanitisation, uploads)

---

## §7. PM Tie-Break Record (closed)

Skill 03 §2: *"Select the highest-scoring option, but if the gap to the runner-up is <10%, PM approval is mandatory."* Both close calls were raised as **CQ3** items and resolved by the PM on 2026-09-08.

| Decision | Leader | Runner-up | Gap | Outcome |
|---|---|---|---|---|
| Database | Supabase (4.10) | Neon (4.03) | **1.8%** | ✅ PM selected Supabase — "fewer moving parts" |
| Editor | BlockNote (3.87) | TipTap (3.77) | **2.7%** | ✅ PM selected BlockNote — best fit for non-technical editors |
| Object storage | Supabase Storage | Vercel Blob | — | Followed Decision 1 automatically |

The scoring did not decide either question — in both cases the margin was well inside noise for a subjective 1–5 scale, which is precisely what the <10% rule exists to catch. The scores narrowed the field; the PM chose.

### Reversibility note
The database decision is comparatively cheap to revisit — Supabase is Postgres, and content could be moved to another Postgres host. **The editor decision is not.** Once 105 panels are stored in BlockNote's block format, changing editors means migrating all of them again. Sprint 1's pilot exists to expose that risk while it is still five pages rather than a hundred.

---

## References

- Requirements: CONST-TECH-01/02/03/04, CONST-RES-01, FR-CONT-009/010/011, FR-MEDIA-001/004, FR-AUTH-001/002, NFR-USE-01, NFR-PERF-01, NFR-AVAIL-02, NFR-SCALE-01, NFR-SEC-UPLOAD
- `docs/requirements/REQUIREMENTS-SPEC.md`
- `docs/planning/PROJECT-PROPOSAL.md` §8, §11
- Skill 03 §2 weighting `[basis:sg-gw-retrospective,adjustable]`
