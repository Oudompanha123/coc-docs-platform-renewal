# ADR-058: Keep per-model Claude usage, and price cache tokens the way Claude Code does

> **Status**: PROPOSED
> **Date**: 2026-09-28
> **Author**: backend-developer / frontend-developer (AI-drafted, per direct developer request in-session)
> **Approver**: PM — **pending** (`CONST-PROC-01`: this status is recorded by a human, never by the AI)
> **Related ADR**: ADR-035 (Claude Usage becomes real data), ADR-036 (per-model pricing — revised here), ADR-052 (personal dashboard)

---

## 1. Context

The developer asked for `/my-claude-usage` to match Claude Code's own usage page: input, output, cache read and cache write shown separately, grouped by model, each with its own cost, and a total cost that is their sum — with the numbers coming from the same Claude Code JSONL, not a lookalike UI.

Tracing the data flow (JSONL → `push-usage.mjs` → `POST /api/ingest` → database → `GET /api/v1/claude-usage/me`) found three problems:

1. **Per-model detail was discarded at persistence.** The reporter already sent `byModel` with all four categories per model. `ClaudeUsageService.recordUsage` used it only to compute one daily `cost_usd`, then dropped it; `claude_usage_daily` holds a single flat row per (member, day). "Usage by Model" could not be answered from the database.
2. **1-hour cache writes were priced as 5-minute.** Claude Code's JSONL splits `cache_creation_input_tokens` into `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`. Measured on this machine's transcripts: every one of 14,814 usage records has the split, and 99% of cache writes are 1-hour. They price at 2× input; ADR-036 priced all writes at 1.25×.
3. **The price table was stale for current models.** `claude-opus-5-5` prefix-matched `claude-opus-5` and priced at $5/$25 instead of $4/$20, and cache reads were a flat 0.10× input — but Opus 5.5 reads at $0.20/MTok (0.05×) and Fable/Mythos 5.1 at $0.25/MTok (0.025×).

The worked example from Claude Code's usage page (Opus 5.5: 1.4k input, 38.3k output, 5.5m cache read, 107.9k cache write → $2.73) only reconciles with all three fixed: $4 × 1.4k + $20 × 38.3k + $0.20 × 5.5m + $8 × 107.9k = $2.7348. The old table gives $4.32; fixing only the model rates gives $2.41.

## 2. Decision

- **New table `claude_usage_daily_model` (V49)**, one row per (member, day, model): `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `cache_creation_1h_tokens`, `cost_usd numeric(14,6)`. `claude_usage_daily` is unchanged and stays the source of truth for day totals, the budget and the admin dashboard.
- **Same idempotency rule as ADR-035 decision 3.** Each ingest replaces that member+day's whole per-model set (delete-then-insert) in the same transaction as the `claude_usage_daily` upsert. A replay converges; a model missing from a later report disappears. The reporter still dedupes on `message.id|requestId`, but a response now counts at the **largest** value seen per category across its lines, not the first line's: a streamed response can log an early line with a partial `output_tokens` (`stop_reason: null`). Measured on this machine, first-line-wins undercounted output by 19,605 tokens over 30 responses; input and cache counts never differed between lines.
- **Pricing (`ClaudeUsagePricing`)**: `ModelPrice` gains a per-model `cacheRead` rate (default 0.10× input; Opus 5.5 $0.20, Fable/Mythos 5.1 $0.25); `claude-opus-5-5` gets its own $4/$20 entry; cache writes price at 1.25× input for 5-minute and 2× for 1-hour. Still computed only on the server, at ingest.
- **Wire contract, additive only.** `byModel.<model>.cacheCreation1h` is optional on `POST /api/ingest`; it is absent from older reporters, reads as 0, and all their writes price as 5-minute, exactly as before. `GET /api/v1/claude-usage/me` accepts `?days=1|7|30` (default 7; anything else falls back to 7) and adds a `usage` object: the window's four totals, `costUsd` (always the sum of `byModel`), `previousCostUsd`, `byModel[]` and `recent[]` (one row per day and model). Whose data it returns is still decided only by the session.
- **Days reported before V49** have a daily row but no model rows. They appear as an `unattributed` entry built from the daily row, so the by-model figures still add up. Re-running `push-usage.mjs --days 30` rewrites those days with real per-model rows.
- **Reporter**: only the downloadable template `frontend/public/downloads/push-usage.mjs` changes: it adds `cacheCreation1h` per model. The personalization marker and download flow are unchanged. `tools/claude-usage-reporter/` is a `git subtree` and needs the same change upstream (see Consequences).

## 3. Alternatives considered

| Option | Why not |
|---|---|
| Add per-model JSON column to `claude_usage_daily` | Not queryable/aggregatable without jsonb gymnastics, and no constraints on the counts. |
| Keep 5-minute pricing for all writes | Understates cost by roughly 60% of the cache-write component for Claude Code's real traffic, and cannot match Claude Code's page. |
| Price on the client from raw tokens | Violates ADR-036's "never trusted from the client" rule, and a price change would need every reporter redeployed. |

## 4. Consequences

- Cost figures for Claude Code usage go **up** compared with the old table, because 1-hour writes are now priced correctly, and go **down** for Opus 5.5. Admin dashboard totals change the same way for any day re-ingested after deploy. Days already stored keep their old `cost_usd` until they are reported again.
- `tools/claude-usage-reporter/push-usage.mjs` must get the same `cacheCreation1h` change in its own repository, then come in with `git subtree pull`. Until then, a teammate running that copy is priced at 5-minute rates.
- Claude Code's own usage page can include small background calls, such as Haiku title generation, that Claude Code does not write to the session JSONL. The dashboard can only report what is in the transcripts.
