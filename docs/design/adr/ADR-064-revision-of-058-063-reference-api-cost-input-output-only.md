# ADR-064: Reference API Cost prices input + output only; cache tokens are shown but not priced

> **Status**: PROPOSED
> **Date**: 2026-09-30
> **Author**: backend-developer (AI-drafted, per direct developer request in-session)
> **Approver**: PM — **pending** (`CONST-PROC-01`: this status is recorded by a human, never by the AI)
> **Related ADR**: ADR-058 (per-model and cache pricing — revised here), ADR-063 (Reference API Cost — its "cost formula unchanged" decision is revised here)

---

## 1. Context

ADR-063 kept ADR-058's formula, which priced cache read and cache write alongside input and output, and rejected an input + output-only formula. The developer has now asked for that formula directly. The expected figure for the example day (Input 246, Output 124.9K, Cache Read 21.6M, Cache Write 243.4K) is **$4.70**, and cache must contribute nothing to it.

## 2. Decision

- `ClaudeUsagePricing.costFor` returns `input × model input rate + output × model output rate`, per model, in USD per million tokens. Cache read, cache write and the 1-hour split are still accepted as arguments but add $0.
- Everything else stays as it is: ingestion, the stored token columns, the per-model rows, the API contract, and every UI column and label, including Cache Read and Cache Write.
- The per-model cache-read rates stay in `ModelPrice` for reference. They no longer feed the cost.

## 3. Alternatives considered

| Option | Why not |
|---|---|
| Keep ADR-058's formula (ADR-063's choice) | Overruled by the developer's explicit requirement. |
| Remove the cache columns along with their price | The developer asked for the columns to stay visible. The token counts are still useful without a price. |

## 4. Consequences

- The Reference API Cost is much lower for Claude Code traffic and no longer matches Claude Code's own usage page, which prices cache. That was the reason ADR-063 gave for rejecting this formula.
- Cost is priced **at ingest** and stored. Days already stored keep their old cache-inclusive cost until the reporter re-sends them. A day is replaced whole on each report, so `push-usage.mjs --days N` reprices the last N days. No migration reprices history, consistent with ADR-036.
