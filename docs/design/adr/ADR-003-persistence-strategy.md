# ADR-003: Persistence Strategy

## Status
**ACCEPTED** — 2026-09-08

- Deciders: `architect` (lead), `data-model-designer`
- Related: ADR-001 (Supabase Postgres), ADR-010 (block model), ADR-006 (audit logging)

---

## Context

Content moves from compiled TypeScript modules into Postgres. That shift silently removes properties the project currently gets free from git, and the schema has to buy them back:

| Property | Today | After migration |
|---|---|---|
| Version history | Every edit is a commit | **Gone** unless modelled (FR-CONT-012) |
| Backup | Implicit, on every push, to every clone | **Gone** unless scheduled (NFR-OPS-BACKUP) |
| Translation completeness | `tsc` fails the build if a locale lacks a page | **Gone** — no database equivalent (NFR-I18N-01) |
| Concurrent-edit safety | Git merge conflict | **Gone** unless modelled (FR-CONT-013) |
| Ordering integrity | Three hand-synced arrays, enforced by discipline | Must become one authoritative field (FR-NAV-004) |

The schema below exists largely to replace those five things.

---

## Decision

### 1. Page and page-version are separate tables

```
section        id · slug · order · created_at
page           id · section_id · slug · order · badge · min_role · deleted_at
page_version   id · page_id · locale · status · body(jsonb) · title · description
                  · version_no · source_version_id · created_by · created_at
```

- **`page`** holds identity and placement, and is **locale-independent**. A page is one thing that exists in three languages, not three separate pages.
- **`page_version`** holds localised content. One row per (page, locale, version).
- `status` ∈ `draft` | `published` | `archived`. At most one `published` row per (page, locale) — enforced by a partial unique index, not by application code.

### 2. Draft and published coexist as rows, not as a flag

AMB-001 resolved to *Draft + Published, same person*. Modelling both as rows rather than a boolean means:

- Saving a draft **cannot** affect what readers see (FR-CONT-003) — a different row is served.
- Publishing is a status transition, not a content overwrite.
- Version history (FR-CONT-012) falls out for free: prior published rows become `archived` rather than being deleted.
- Preview (FR-CONT-004) renders the draft row through the ordinary renderer, so preview fidelity is structural rather than a second rendering path that can drift.

Retention: at least the last 20 versions per (page, locale) (NFR-OPS-VERSION).

### 3. Ordering is one integer, in one place

`page.order` within `section`, and `section.order` globally. Nothing else expresses order.

This directly retires the three hand-synchronised sources of truth (`lib/i18n.ts` arrays, `Sidebar.tsx` arrays, content-file key order) that nothing but developer discipline currently keeps in agreement (FR-NAV-004).

Sparse integers with periodic renumbering, rather than fractional ranks: at 200 pages the simpler option is sufficient, and simplicity is a requirement here (CONST-RES-01).

### 4. Optimistic locking via `version_no`

The editor sends the `version_no` it loaded. If it no longer matches, the write is refused and the client is told who changed the page and when (FR-CONT-013).

Chosen over pessimistic locks or last-write-wins because it needs no lock lifecycle, no lease expiry, and no background reaper — and because **silently losing a colleague's work is the specific failure this project must not have**. Multiple editors is the entire point of the system.

### 5. Staleness is derived, not stored as a mutable flag

`page_version.source_version_id` records which `en` version a translation was made from. A translation is **stale** when the currently published `en` version differs from that reference.

Derived rather than flagged, so it cannot drift out of sync with reality — the failure mode where a page is marked fresh while its source has moved on (FR-I18N-002, UC-007 E-1).

Consistent with AMB-002: **coverage** = a published row exists for all three locales; **staleness** = a separate, derived signal that is *not* a coverage breach.

### 6. Links are references, not strings

An inline link stores `page_id`, not `/en/docs/jex3.0/usage`. URLs are constructed at render time from the section slug, page slug and locale.

Consequence: renaming a slug cannot break internal links (BR-008), and the deleted-page check (FR-CONT-007) becomes a foreign-key question rather than a text search.

### 7. Slug history for redirects

`page_slug_history (page_id, old_slug, section_id, changed_at)`. A request for a retired slug resolves to a permanent redirect (FR-READ-003). Legacy `/#slug` hash URLs are handled at the same resolution point (FR-READ-002, CONST-OPS-02).

### 8. Body stored as `jsonb`

Block arrays (ADR-010) stored as `jsonb`, not text: it is queryable, indexable, and validated on write against the block schema. A body that does not conform is rejected at the boundary rather than discovered at render time.

---

## Alternatives Considered

| Option | Why not |
|---|---|
| Single `page` table with a `body` column and no versions | Simplest, and enough for one author. Fails FR-CONT-012 outright and leaves no path back from a bad edit — which is far riskier once non-technical people are editing. |
| Draft as a boolean plus a `draft_body` column | Fewer rows, but publishing overwrites, so history requires a third mechanism, and preview needs a separate path. Collapses two clean concepts into one messy row. |
| Event sourcing / append-only edit log | Excellent history and audit. Substantially more machinery than a solo part-time project can carry, and the audit trail (ADR-006) already covers the accountability need. |
| Store rendered HTML alongside blocks | Would speed reads. Premature: NFR-PERF-01 (P95 < 1s) is achievable with ordinary caching, and a denormalised copy is a correctness hazard. Revisit only if measurement demands it. |
| Locale as a column on `page` (three page rows) | Breaks the "one page, three languages" model, makes ordering and navigation triple-counted, and makes coverage measurement awkward. |
| Fractional ranking for order | Avoids renumbering, but adds precision handling for no benefit at 200 pages. |

---

## Consequences

### Positive
- Every property lost from git is explicitly replaced, and each replacement is traceable to a requirement.
- Publishing is atomic and reversible.
- Coverage and staleness are both computable directly, which makes the translation status screen (FR-I18N-003) a query rather than a bookkeeping exercise.

### Negative
- More tables and more joins than a naive design; every read path touches `page` + `page_version`.
- Row growth: 105 panels × 3 locales × up to 20 versions ≈ 6,300 rows at the cap. Trivial for Postgres, but retention pruning must actually be implemented, not assumed.
- Derived staleness costs a comparison on read; mitigated by caching, and by the fact that the translation status screen is an admin surface with light traffic.
- `NFR-AVAIL-02` becomes essential: with content in the database, reads must survive a database outage from cache, because pre-rendering no longer protects them.

---

## References

- Requirements: FR-CONT-003/005/007/012/013, FR-NAV-004, FR-I18N-002/003/004, FR-READ-002/003, NFR-I18N-01, NFR-OPS-VERSION, NFR-OPS-BACKUP, NFR-AVAIL-02, NFR-SCALE-01
- AMB-001 (draft/publish model), AMB-002 (coverage vs staleness)
- ADR-001, ADR-010, ADR-006
