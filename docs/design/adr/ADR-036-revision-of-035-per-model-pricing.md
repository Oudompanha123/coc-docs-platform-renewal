# ADR-036: Real per-model pricing, revising ADR-035 decision 4

## Status

Accepted. Implemented directly on PM/developer instruction in-session, same
class of decision as REQUIREMENTS-SPEC.md §7.3–§7.6 — formal PM sign-off
recommended, not yet recorded.

## Context

ADR-035 deliberately kept the Claude Usage dashboard's existing cost
convention when it replaced the mock with real data: a single flat rate,
$0.006 per 1,000 tokens, applied to `input + output` regardless of which
model produced them. That decision (ADR-035 decision 4) reasoned that
"changing what the existing UI's stat card... already promised the reader is
a separate decision from making the data real, and is not made here."

The PM/developer asked, in this session, why a specific figure ($1.59) looked
low, and on seeing the formula, asked directly for real per-model pricing —
the separate decision ADR-035 explicitly deferred. This ADR is that decision.

## Decision

### 1. Real per-model rates, ported from the reference tool's `pricing.ts`

`ClaudeUsagePricing` prices each model at its own first-party Anthropic API
rate (USD per million tokens): Opus 5 ($5 in / $25 out), Sonnet 5 ($2 / $10),
Sonnet 4.6 ($3 / $15), Haiku 4.5 ($1 / $5), Fable 5 / Mythos 5 ($10 / $50).
Cache read prices at 0.10× the model's own input rate; cache write at 1.25×
(the 5-minute kind, Claude Code's default — a 1-hour cache write prices
higher and is not distinguished, the same simplification the source table
makes). Matched longest-prefix-first, so a dated/suffixed model id (e.g.
`claude-opus-5-20260115`) still resolves, and an unrecognized model prices as
Opus so cost is never understated.

This remains an estimate of API-equivalent cost, never actual spend — the
team is on subscription plans, not billed per token. The dashboard's copy
already said this before this change and continues to.

### 2. The ingest payload gains an optional per-model breakdown

Real pricing needs to know *which* tokens came from *which* model within a
day — a single day-level total cannot answer that once more than one model
was used. `POST /api/ingest` gains `byModel`, a map of model id to that
model's own `input`/`output`/`cacheRead`/`cacheCreation` for the day
(`ApiDtos.ClaudeUsageModelTokensRequest`). The existing flat
`input`/`output`/`cacheRead`/`cacheCreation` fields remain required and
authoritative for the day's token *totals* — `byModel` is used only to price
those totals, not to re-derive them, so a reporter that sends a `byModel`
whose sum disagrees with the flat totals still has its totals recorded
correctly; only the price could be inconsistent with them, which is a data
inconsistency the reporter created, not one this backend manufactures.

### 3. No breakdown means $0 cost, never a guess

A reporter that predates this (or a future one with a bug) can still send
just the flat totals and a plain `models` name list, and its tokens and
history are recorded exactly as before — priced at $0 rather than falling
back to ADR-035's retired blended rate or any other estimate. Silently
reviving the old formula as a "safe default" would produce a number that
looks precise and is not; $0 is visibly a placeholder, which is the more
honest failure mode. This is the same trade-off the reference tool's own
ingest route makes for exactly this case.

`models` (the display list) is derived from `byModel`'s own keys whenever it
is present and non-empty, not read separately — a row would otherwise have
two sources for "which models ran" that could disagree with each other.

### 4. Priced server-side, at ingest time, never trusted from the reporter

Unchanged from ADR-035: pricing happens once, when the row is written, using
whatever price table this backend is running at that moment. A future price
correction means editing `ClaudeUsagePricing`'s table, not asking every
teammate to update their local script. Each model's cost is computed at
higher intermediate precision and only the sum across a day's models is
rounded once, to the storage column's 4-decimal scale — rounding per model
first would compound error across a day that used several of them.

## Consequences

### Positive

- "API-Equivalent Cost" now answers the question its label already claimed
  to: what this usage would have cost at Anthropic's real rates, not one
  rate applied uniformly regardless of model.
- Cache tokens are now priced at all — the flat-rate formula ignored them
  entirely, which under-priced any heavy cache user by a wide margin.

### Negative — stated plainly

- **Historical rows are not retroactively repriced.** Every `claude_usage_daily`
  row ingested before this change keeps its old flat-rate `cost_usd` forever;
  there is no migration or backfill here. A week's total that spans this
  change is a mix of two pricing methodologies with no marker distinguishing
  them. Accepted because recomputing history would need the original
  per-model breakdown, which was never stored for those rows — it cannot be
  reconstructed from what's already on disk.
- **A reporter that never adopts `byModel` reports $0 forever**, not a
  degraded-but-present estimate. This is a regression in "always shows some
  number" for exactly the callers this ADR does not update, in exchange for
  never showing a confident-looking wrong one.
- The price table is a hand-maintained snapshot in `ClaudeUsagePricing`, the
  same maintenance burden ADR-035 already accepted for the (now retired)
  blended-rate constant, just with more entries to keep current.

## References

- ADR-035 (Claude Usage becomes real data — decision 4 is what this revises)
- `D:\Jex MCP 3.0\jexmcp3.0\lib\usage\pricing.ts` — the source table this was ported from
- `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsagePricing.java`
- `backend/src/main/java/com/coc/docs/claudeusage/ClaudeUsageService.java` (`recordUsage`, `costFor`)
