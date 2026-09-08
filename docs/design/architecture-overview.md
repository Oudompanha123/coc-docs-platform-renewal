# Architecture Overview — Coc Docs Platform

> **Version**: 1.0 · **Date**: 2026-09-08 · **Author**: `architect`
> **Related**: [ADR-001](adr/ADR-001-tech-stack.md) · [ADR-003](adr/ADR-003-persistence-strategy.md) · [ADR-010](adr/ADR-010-content-model.md) · [ADR-011](adr/ADR-011-security-model.md) · [threat-model.md](threat-model.md)

---

## 1. Shape of the Change

This is **not** a rewrite. The Next.js application stays; what changes is where content comes from and who can change it.

```mermaid
graph LR
  subgraph AS-IS["AS-IS — content is code"]
    A1[content/*.tsx<br/>105 panels, ~14k lines] -->|import at build| A2[Next.js build]
    A2 --> A3[Pre-rendered pages<br/>generateStaticParams<br/>dynamicParams = false]
    A3 --> A4[Reader]
    A5[Developer] -->|edit + commit + deploy| A1
  end
```

```mermaid
graph LR
  subgraph TO-BE["TO-BE — content is data"]
    B1[(Supabase Postgres<br/>pages · versions · nav)] -->|query at request| B2[Next.js server<br/>on-demand ISR]
    B2 --> B3[Reader]
    B4[Non-technical admin] -->|BlockNote editor| B5[Admin console]
    B5 -->|write| B1
    B6[(Supabase Storage<br/>images)] --> B2
    B5 -->|upload| B6
  end
```

The developer disappears from the content path. That is the whole project.

---

## 2. Component View

```mermaid
graph TB
  subgraph Client
    R[Reader browser]
    E[Admin browser]
  end

  subgraph Vercel["Vercel — Next.js 15 App Router"]
    MW[middleware.ts<br/>auth gate + locale routing]
    RP["Reader routes<br/>/[lang]/docs/[section]/[slug]"]
    AP["Admin routes<br/>/admin/*"]
    API[Route handlers<br/>/api/*]
    REG[Component registry<br/>HarnessDemo · OwnerTree]
    CACHE[ISR / response cache]
  end

  subgraph Supabase
    DB[(Postgres<br/>content · nav · users · audit)]
    ST[(Storage<br/>images)]
  end

  subgraph External
    G[Google OIDC]
    GS[(Google Sheets<br/>ai-usage — unchanged)]
  end

  R --> MW --> RP --> CACHE --> DB
  RP --> REG
  E --> MW --> AP --> API --> DB
  API --> ST
  RP --> ST
  MW --> G
  API -.->|unchanged in MVP| GS

  style DB fill:#2d5016,color:#fff
  style ST fill:#2d5016,color:#fff
  style G fill:#7a3b0a,color:#fff
  style GS fill:#555,color:#fff
```

| Component | New? | Notes |
|---|---|---|
| `middleware.ts` | modified | Keeps locale routing; auth gate switches from shared-password cookie to Google session, and gains per-page `min_role` checks |
| Reader routes | modified | `generateStaticParams` + `dynamicParams: false` → **on-demand ISR**. This is the change that makes "add a page without a deploy" possible |
| Admin routes | **new** | The console: pages, editor, navigation, translation status, media, users |
| Component registry | **new** | Closed server-side map of embeddable components (ADR-010 §4) |
| Postgres | **new** | Content, navigation, users, roles, audit |
| Storage | **new** | Uploaded images — no equivalent exists today |
| Google Sheets / ai-usage | **unchanged** | `FR-USAGE-001` is `Won't` for MVP; `lib/usage/*` is untouched |

---

## 3. Read Path

```mermaid
sequenceDiagram
  actor Reader
  participant MW as middleware
  participant Page as Route handler
  participant Cache as ISR cache
  participant DB as Postgres

  Reader->>MW: GET /ko/docs/jex3.0/usage
  MW->>MW: verify session · resolve locale
  MW->>Page: authorised
  Page->>Cache: cached render?
  alt hit
    Cache-->>Reader: HTML (fast path)
  else miss
    Page->>DB: published version (page, ko) + nav
    DB-->>Page: blocks (jsonb) + nav rows
    Page->>Page: render blocks · resolve PageRef links
    Page->>Cache: store
    Page-->>Reader: HTML
  end
  Note over Cache,DB: DB unavailable → serve stale cache (NFR-AVAIL-02)
```

**Why the cache is load-bearing, not an optimisation.** Today every page is pre-rendered and survives a total backend outage. Once content lives in the database, the database becomes a single point of failure *for reading documentation*. NFR-AVAIL-02 exists to buy that resilience back, and NFR-PERF-01 (P95 < 1s) is only reachable through it — reads are slower than today by design (AMB-005).

---

## 4. Write Path

```mermaid
sequenceDiagram
  actor Admin as admin (non-technical)
  participant UI as BlockNote editor
  participant API as /api/admin/pages
  participant DB as Postgres
  participant Cache as ISR cache

  Admin->>UI: edit blocks
  UI->>API: save draft (version_no)
  API->>API: authorise role · validate block schema · sanitise
  API->>DB: optimistic check on version_no
  alt version conflict
    DB-->>API: mismatch
    API-->>Admin: "changed by X at Y" — keep mine / take theirs
  else ok
    API->>DB: upsert draft row
    API->>DB: audit entry
    API-->>Admin: saved
  end
  Admin->>UI: Preview → renders the draft row
  Admin->>API: Publish
  API->>DB: draft → published · prior → archived · atomic
  API->>DB: mark km/ko stale (derived via source_version_id)
  API->>Cache: revalidate affected paths
  Note over Cache: live for readers — no build, no deploy
```

The final note is the project's KPI: **zero deploys for content changes.**

---

## 5. Trust Boundaries

Enumerated here; analysed with STRIDE and scored in [threat-model.md](threat-model.md).

```mermaid
graph TB
  subgraph U["Untrusted"]
    UB[Reader / anonymous]
  end
  subgraph SA["Semi-trusted — authenticated, non-technical"]
    AD[admin authoring content]
  end
  subgraph TR["Trusted — server"]
    SRV[Next.js server · route handlers]
  end
  subgraph DATA["Data"]
    PG[(Postgres)]
    OS[(Storage)]
  end
  UB -->|B1 HTTP| SRV
  AD -->|B2 authoring: blocks + uploads| SRV
  SRV -->|B3 credentialed| PG
  SRV -->|B4 credentialed| OS
  SRV -->|B5 OIDC| GO[Google]
  EXT[Teammate machine] -->|B6 bearer secret| SRV
```

| ID | Boundary | Principal new risk |
|---|---|---|
| B1 | Reader → server | Standard web surface; widens materially in phase 2 when readers become anonymous |
| **B2** | **Admin → server** | **The new one.** Semi-trusted humans submit structured content and binary files. Mitigated structurally: no raw-HTML block exists (ADR-010 §3), block schema validated on write, uploads sniffed not trusted |
| B3 / B4 | Server → Supabase | Credentialed; secrets never reach the client |
| B5 | Server → Google OIDC | Sole authentication dependency; no local password fallback by design (FR-AUTH-002) |
| B6 | Ingest endpoint | Pre-existing shared bearer secret. Scope-limited and explicitly **not** a pattern for editorial writes (NFR-SEC-CHANNEL) |

---

## 6. Content Tiering

Not all 105 panels become editable. Established at Q4 and carried into ADR-010.

```mermaid
graph LR
  subgraph A["Tier A — the majority"]
    A1[prose · tables · code · callouts · steps] --> A2[(Postgres blocks)] --> A3[Admin-editable]
  end
  subgraph B["Tier B — a handful"]
    B1[HarnessDemo · OwnerTree · ideaData tables] --> B2[Stay in code] --> B3[Referenced by embed block]
  end
  subgraph C["Tier C — two pages"]
    C1[ai-usage guide · config] --> C2[Decision deferred to Sprint 2]
  end
```

Tier B is a **cost lever, not a compromise**: non-technical staff were never going to edit an interactive demo, so paying to make it editable buys nothing.

---

## 7. What Is Deliberately Not Changing

| Kept | Why |
|---|---|
| Next.js / React / TypeScript / Vercel | CONST-TECH-01/02 — working, known, already paid for |
| Locale routing and `/{lang}/docs/...` URL shape | Preserves inbound links; FR-READ-002 and CONST-OPS-02 require it |
| `lib/usage/*` and the Google Sheets backend | `FR-USAGE-001` is `Won't`; migrating it serves no stated driver |
| `PageFx` copy-button enhancement | Reused for `code` blocks with `copyable: true` |
| The styled 404 and `PendingTranslation` patterns | Generalised from per-page hacks into system behaviour (FR-READ-004, FR-READ-006) |

---

## 8. Sequencing Implication

The architecture is deliberately **shippable in slices**, because CONST-RES-01 permits nothing else:

1. **Pilot** — schema + editor + one doc set (`jex2.0`, 5 pages) rendered from the database, with the rest still served from `content/*.tsx`. Both paths coexist.
2. **Prove the model** against the hardest content (`coach.tsx`) before mass migration.
3. **Migrate** remaining doc sets one at a time.
4. **Cut over** — `content/*.tsx` retired; the database becomes authoritative (CONST-OPS-03), with the `site` branch retained as the rollback path until sign-off.

Coexistence of the two content sources during migration is a first-class design requirement, not a transitional hack — see DEV-PLAN §4.
