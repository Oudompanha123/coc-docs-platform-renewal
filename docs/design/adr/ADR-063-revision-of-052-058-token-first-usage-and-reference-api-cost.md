# ADR-063: Personal Claude Usage leads with tokens; dollars are a "Reference API Cost", kept apart from the subscription

> **Status**: PROPOSED
> **Date**: 2026-09-30
> **Author**: frontend-developer / backend-developer (AI-drafted, per direct developer request in-session)
> **Approver**: PM — **pending** (`CONST-PROC-01`: this status is recorded by a human, never by the AI)
> **Related ADR**: ADR-035 (soft budget), ADR-052 (personal dashboard — revised here), ADR-058 (per-model pricing — kept, relabelled here)

---

## 1. Context

`/my-claude-usage` led with "Total cost" in dollars. The team pays for Claude on a subscription, not per token, so a dollar headline read like a bill. It also invited a wrong sum: "$25/month plan minus $4.69 today = $20.31 left", as if the subscription were a prepaid token credit. The developer asked for tokens as the headline, a weekly figure measured against the budget, and the dollar figure clearly labelled as an API-equivalent estimate that is separate from the subscription.

## 2. Decision

- **Layout.** The page shows, in this order: Today's Usage (input + output tokens), Weekly Usage (this Monday to today, measured against the member's **whole** weekly soft budget, with % used, a progress bar and remaining tokens), Model Usage (Input / Output / Total for each model over the Today / 7 / 30-day selector), then two separate cards: **Reference API Cost** and **Subscription**. The 30-day history chart and the Recent Usage table are unchanged.
- **Naming.** The dollar figure is called "Reference API Cost" everywhere, including the admin dashboard's stat card and table column. It always carries the note: *"API-equivalent estimate only. This is not an additional Claude subscription charge."* It is never labelled Claude Bill, Amount Paid, Subscription Cost or Additional Cost.
- **Cost formula unchanged (ADR-058).** Each model is priced at its own published rate for input, output, cache read and cache write, on the server, at ingest. The developer's proposed input + output-only formula was considered and rejected (see §3). The card says that cache tokens are priced.
- **Subscription.** `ClaudeUsagePricing.SUBSCRIPTION_USD_PER_MONTH = 25` is sent as a display value (`subscriptionUsdPerMonth`). Nothing subtracts the Reference API Cost from it or compares the two.
- **Wire contract, additive only.** `GET /api/v1/claude-usage/me` gains `week { from, to, inputTokens, outputTokens, totalTokens, budgetTokens, pctUsed, remainingTokens }` and `subscriptionUsdPerMonth`. `pctUsed` can exceed 100. `remainingTokens` never goes below 0.

## 3. Alternatives considered

| Option | Why not |
|---|---|
| Price input + output only | For Claude Code traffic, most of the API-equivalent cost is cache read/write. Dropping it would understate the figure several times over and it would no longer match Claude Code's own usage page (ADR-058). |
| Pro-rate the weekly budget to days elapsed | "52% used" should mean 52% of the week's allowance is gone, not "on pace". The admin table already pro-rates by period length for comparisons, which serves a different purpose. |
| Per-member subscription price (new column) | Everyone is on the same plan today. That would need a migration and an admin UI for no current need. |

## 4. Consequences

- Admin and personal pages both say "Reference API Cost". No figures change.
- A plan price change is a one-line edit to `ClaudeUsagePricing`.
- If plans ever differ per member, this ADR needs revising to add a per-member column.
