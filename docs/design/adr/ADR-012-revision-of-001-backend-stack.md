# ADR-012: Backend Stack — revision of ADR-001

## Status
**ACCEPTED in part · DEFERRED in part** — 2026-09-08

Supersedes the language, framework and runtime sections of [ADR-001](ADR-001-tech-stack.md), and reopens its database and storage decisions.

- Deciders: `architect` (lead), PM (Socheat-Hun)
- Revises: ADR-001
- Consequence: **G2 reverted to pending.** It was approved against a single-service design that no longer describes the system.

---

## Context — why ADR-001 was wrong

ADR-001 listed language, framework and runtime as *"Already fixed, not under evaluation here"*, citing `CONST-TECH-01`.

That constraint was not supplied by the PM. It was **inferred** during Skill 01, recorded as `Q11 — DERIVED` without being asked, written into the requirements as a constraint, and then cited in ADR-001 as grounds for not evaluating the decision. An inference was promoted to a constraint and the constraint then justified skipping the comparison — circular reasoning around precisely the decision Skill 03 §2 most clearly requires candidates for.

The PM's Q1 wording was **"I want to *seperate have backend, front end*"**. That was read as "content separated from code". It in fact meant two services.

Two facts that should have prompted the question and did not:
- HARNESS-PROCESS-STANDARD §5.7 names **Java as the organisation's baseline language**.
- This harness's `architect`, `backend-developer` and `adapter-builder` agents are all Spring Boot–oriented.

Corrected on 2026-09-08 when the PM asked why the stack had never been put to them.

---

## Decision 1 — Two-service architecture *(ACCEPTED)*

| | |
|---|---|
| **Frontend** | Next.js 15 / React 19 / TypeScript. Pure presentation: renders pages, hosts the BlockNote admin UI. No database access. |
| **Backend** | **Java 21 · Spring Boot 3.4 · Maven.** Owns all persistence, authorisation, validation and business rules. Exposes a REST API. |
| **Contract** | OpenAPI, versioned. The frontend consumes it; nothing else does. |

Java 21 (current LTS) and Maven, the latter matching the JEX Studio ecosystem the PM already works in.

### Why not evaluated against alternatives
Skill 03 §2 requires ≥2 candidates. Here the choice is **constrained, not optimised**: the organisation standardises on Java (§5.7). Recording the alternatives honestly rather than staging a comparison whose outcome is predetermined:

| Alternative | Would have scored well on | Rejected because |
|---|---|---|
| Next.js route handlers (ADR-001's assumption) | Fastest solo build, one language, one deployable, shared types | Not a separate backend; conflicts with the org Java standard |
| Node/NestJS backend | True separation, still all-TypeScript | Conflicts with the org Java standard |
| Python / FastAPI | Lighter than Spring, within §5.7's language list | Java is the *baseline*; Spring is the expected choice |

**Cost, stated plainly**: two deployables, two languages, an API contract to design and version, cross-service authentication, two test suites and two CI pipelines. For one part-time developer this roughly doubles the build surface, and `RISK-001` (the project stalls) was already the highest-ranked risk. This is a legitimate organisational decision, not a technical mistake — but it is not free, and the sprint plan must be rebuilt around it rather than patched.

---

## Decision 2 — Database and storage *(RESOLVED 2026-09-09)*

> **Update, 2026-09-09.** The blocking question below has been answered by the PM: **deployment target is Google Cloud, and external cloud is permitted for this internal tool.** The original deferral text is retained beneath for the record; the resolution follows.
>
> ### 2.1 Hosting — **Google Cloud** *(ACCEPTED)*
> PM decision, 2026-09-09. Confirmed that company policy permits an internal documentation tool to run on external cloud, which was the specific risk that made this a deferral rather than a comparison.
>
> ### 2.2 Development database — **local PostgreSQL** *(ACCEPTED)*
> Developers run PostgreSQL locally, administered with pgAdmin. Flyway applies the identical `V1__initial_schema.sql` used everywhere else, so dev and production run the same schema from day one.
>
> **Note for setup instructions**: pgAdmin is the administration client, not the database. Both are needed — PostgreSQL 15+ server, plus pgAdmin to manage it.
>
> Chosen so implementation can start immediately: it costs nothing, needs no cloud account, works offline, and requires no provisioning before the first line of code.
>
> ### 2.3 Production database — **narrowed, decided before first deploy** *(OPEN, non-blocking)*
> With hosting settled, three candidates remain, all viable on GCP:
>
> | Option | For | Against |
> |---|---|---|
> | **Cloud SQL for PostgreSQL** | GCP-native, managed, same-VPC latency, no external vendor | No always-free tier — a real monthly bill from day one |
> | **Neon / Supabase free tier** | Free, quick, already scored in ADR-001 | External data store; adds a vendor and an internet hop |
> | **Self-managed on Compute Engine** | Fits the always-free VM tier | You operate, patch and back it up yourself |
>
> **This no longer blocks G2.** It is a *deployment* decision, not an *architecture* decision — `CONST-TECH-08` keeps the design provider-portable (plain PostgreSQL 15+, JDBC, Flyway, S3-API storage), so switching provider costs a connection string and a storage endpoint. A design gate should settle the architecture; it need not settle the vendor SKU.
>
> Decide before the first deployment, not before the first commit.
>
> ### 2.4 Object storage — S3 API, provider deferred with the database
> Unchanged from below: the S3 API is fixed as the abstraction. On GCP that is Cloud Storage's S3-compatible interface, or any S3 provider.

---

### Original deferral text (retained for the record)

ADR-001 chose Supabase over Neon by **1.8%**, and that margin rested almost entirely on Supabase bundling storage, auth and row-level security behind **one JavaScript SDK**. A Spring backend reaches Postgres over JDBC and will not use that SDK, will not use Supabase Auth (Google OIDC is verified server-side), and will not use RLS (authorisation is enforced in the service layer). **The reason Supabase won no longer applies.**

It cannot simply be re-decided, because it is coupled to a question that is open:

> **Backend hosting is `[DEFERRED]`** (PM, 2026-09-08). Serverless Postgres — Supabase, Neon — assumes the backend can reach the public internet. If this deploys onto the bank's internal infrastructure, that may be prohibited outright, and an on-prem or corporate-cloud Postgres becomes the only viable option regardless of any scoring.

Deciding the database before hosting would repeat the error this ADR exists to correct.

### Interim rule — design so the choice stays open

Binding until the deferred decision closes:

| Rule | Consequence |
|---|---|
| **Target plain PostgreSQL 15+** | No provider-proprietary features. `0001_initial_schema.sql` already complies — it uses only standard Postgres. |
| **Access via JDBC + a connection pool** (HikariCP) | Works against any Postgres, hosted or on-prem |
| **Migrations via Flyway** | Plain SQL migrations, provider-independent |
| **Object storage behind the S3 API** | Supabase Storage, AWS S3, Azure Blob (S3 gateway) and on-prem MinIO all speak it. **This is decided and is not deferred** — the abstraction is portable even though the provider is not. |
| **No RLS-dependent authorisation** | Authorisation lives in the Spring service layer, so the database is replaceable |

Under these rules, changing the Postgres provider later costs a connection string and a storage endpoint. That is what makes deferring safe rather than merely postponing pain.

### Closure criteria
This decision closes when hosting is chosen. It **blocks G2 re-approval** — a design gate cannot pass with its deployment target unknown.

> **Closed 2026-09-09** — hosting chosen (Google Cloud). See §2.1–2.4 above. G2 is no longer blocked by this decision.

---

## Decision 3 — Where validation lives *(ACCEPTED)*

The block-model validator (ADR-010) must now exist on both sides, with an unambiguous authority:

| | Language | Role |
|---|---|---|
| **Backend** | Java | **Authoritative.** Every write is validated server-side before persistence. A frontend that skips validation cannot inject anything. |
| Frontend | TypeScript (`lib/content/validate.ts`, already written) | Advisory only — immediate editor feedback. Never trusted. |

`validate.ts` is not wasted work: it is a working, tested specification of the rules, and it keeps its purpose as the client-side pre-check. The Java port must match it exactly, and the block model (ADR-010) remains language-neutral — a data specification, not code.

**Rule**: no write path may rely on client-side validation. `NFR-SEC-SANITIZE` is satisfied in the backend or not at all.

---

## Decision 4 — Authentication across two services *(ACCEPTED in principle, detail to ADR-011 revision)*

Google OIDC is unchanged (`FR-AUTH-001`), but the flow now crosses a service boundary. Fixed here:

- The **backend** verifies Google ID tokens — signature, audience, issuer, nonce. The frontend never asserts identity.
- The backend issues its own session credential; TTL remains **1 day** (AMB-006).
- **Role is read server-side from the database on every request** and is never accepted from a client header or claim. This is unchanged from ADR-011 and matters more now, since there is a network hop an attacker could target (threat TM-003).
- Frontend and backend will sit on different origins, so CORS and cookie `SameSite` behaviour need explicit design — a **new attack surface that did not exist in the single-service design**.

ADR-011 and the threat model must be revised for the added boundary before G2.

---

## Consequences

### Documents now stale and requiring revision before G2

| Document | Change needed |
|---|---|
| `ADR-001` | Marked SUPERSEDED by this ADR |
| `REQUIREMENTS-SPEC.md` | `CONST-TECH-01/02` scoped to the frontend; new `CONST-TECH-05/06/07` added. **Amends a G1-approved baseline** — recorded in its change history |
| `architecture-overview.md` | Rewrite for two services, the API contract and the new trust boundary |
| `DEV-PLAN.md` | Sprint plan rebuilt: backend and frontend workstreams, API contract first |
| `sprint-1-tasks.md` | T3–T9 change substantially; T2 and T5 survive |
| `threat-model.md` | New boundary B7 (frontend ↔ backend); TM-003 re-scored |
| `ADR-011` | Session and role enforcement across two services |
| `TEST-PLAN.md` | Two test suites; API contract tests added |

### Work that survives unchanged
- `0001_initial_schema.sql` — plain Postgres, no provider features
- ADR-003 persistence strategy — schema design is language-neutral
- ADR-010 content model — a data specification
- ADR-005, ADR-006, ADR-008 — decisions, not implementations
- All 84 requirements except the technology constraints
- `lib/content/validate.ts` — repurposed as the client-side pre-check

### Negative
- Build surface roughly doubles for a solo part-time developer; `RISK-001` worsens materially and the risk register must be re-scored.
- A whole class of bugs — serialisation mismatch, CORS, contract drift — that a single-service design simply does not have.
- Local development now requires running two services.

---

## Open Items Blocking G2 Re-Approval

| Item | Owner | Status |
|---|---|---|
| ~~Backend hosting target~~ | PM | ✅ **Closed 2026-09-09 — Google Cloud** |
| ~~Database and storage provider~~ | Follows hosting | ✅ **No longer blocking** — local PostgreSQL for development; production provider is a pre-deploy decision (§2.3) |
| Revised architecture, DEV-PLAN, threat model, ADR-011, TEST-PLAN | `architect` | ⏳ In progress — **the only remaining blocker** |
| Re-scored risk register | `architect` | ⏳ In progress |

**One item now stands between here and G2**: the six design documents still describe the single-service Next.js system. Approving G2 against them would approve a design that is not being built.

---

## References
- ADR-001 (superseded in part), ADR-003, ADR-010, ADR-011
- HARNESS-PROCESS-STANDARD §5.2 (revision ADRs), §5.7 (organisation languages), §2 (stack comparison)
- `docs/planning/questions-log.md#Q11` — the derivation that should have been a question
