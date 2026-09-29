"use client";

import { useCallback, useEffect, useState } from "react";
import { MyUsageHistoryChart } from "@/components/claude-usage/MyUsageHistoryChart";
import {
  costChange,
  formatCost,
  formatTokens,
  modelDisplayName,
  modelShortId,
  UNATTRIBUTED_MODEL,
} from "@/lib/claudeUsage/format";
import {
  fetchMyUsage,
  type MyClaudeUsageDashboard,
  type MyClaudeUsageModel,
  type MyUsageRangeDays,
} from "@/lib/claudeUsage/myUsage";

const RANGES: { days: MyUsageRangeDays; label: string; previous: string }[] = [
  { days: 1, label: "Today", previous: "yesterday" },
  { days: 7, label: "Last 7 days", previous: "previous 7 days" },
  { days: 30, label: "Last 30 days", previous: "previous 30 days" },
];

/**
 * The four token categories, in Claude Code's own order, each with the one
 * color it has everywhere on this screen (legend, totals, cards, bars).
 */
const CATEGORIES = [
  { key: "inputTokens", label: "Input", dot: "bg-blue-500" },
  { key: "outputTokens", label: "Output", dot: "bg-violet-500" },
  { key: "cacheReadTokens", label: "Cache Read", dot: "bg-emerald-500" },
  { key: "cacheWriteTokens", label: "Cache Write", dot: "bg-orange-500" },
] as const satisfies readonly { key: keyof MyClaudeUsageModel; label: string; dot: string }[];

function formatLastUpdated(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Never";
  return when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDay(isoDate: string): string {
  // A calendar date, not an instant — parse as local so it never shifts a day.
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y!, m! - 1, d!).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function TokenFigure({ label, dot, value, large }: { label: string; dot: string; value: number; large?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-xs text-muted">
        <span aria-hidden className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />
        {label}
      </p>
      <p className={`mt-1 font-bold tabular-nums text-dash-ink ${large ? "text-2xl" : "text-lg"}`}>{formatTokens(value)}</p>
    </div>
  );
}

/** One bar split by each category's share of this model's tokens — what the usage is mostly made of. */
function CategoryBar({ usage }: { usage: MyClaudeUsageModel }) {
  const total = CATEGORIES.reduce((sum, c) => sum + usage[c.key], 0);
  if (total <= 0) return null;
  return (
    <div className="mt-4 flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-border" aria-hidden>
      {CATEGORIES.map((c) =>
        usage[c.key] > 0 ? (
          <span key={c.key} className={`h-full ${c.dot}`} style={{ width: `${(usage[c.key] / total) * 100}%`, minWidth: 2 }} />
        ) : null,
      )}
    </div>
  );
}

function ModelCard({ usage }: { usage: MyClaudeUsageModel }) {
  const unattributed = usage.model === UNATTRIBUTED_MODEL;
  return (
    <div className="rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-base font-bold text-dash-ink">{modelDisplayName(usage.model)}</h4>
            {!unattributed && (
              <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-700">
                {modelShortId(usage.model)}
              </span>
            )}
          </div>
          {unattributed && (
            <p className="mt-1 text-xs text-muted">
              Reported before per-model tracking. Re-run push-usage.mjs with --days 30 to attribute it.
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CATEGORIES.map((c) => (
              <TokenFigure key={c.key} label={c.label} dot={c.dot} value={usage[c.key]} />
            ))}
          </div>
          <CategoryBar usage={usage} />
        </div>
        <div className="border-t border-border pt-3 sm:w-36 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
          <p className="text-xs text-muted">Cost</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-dash-ink">{formatCost(usage.costUsd)}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * "My Claude Usage" — rendered by its own route, `/my-claude-usage`
 * (ADR-052 v1.6). `/claude-usage` is a separate, admin/super_admin-only page
 * — see `app/(shell)/claude-usage/page.tsx`.
 *
 * Laid out like Claude Code's own usage page (ADR-058): total cost, the four
 * token categories (input, output, cache read, cache write) kept separate,
 * then the same four per model with each model's own cost. Every figure
 * comes from `GET /api/v1/claude-usage/me`, which the backend resolves from
 * the session and prices server-side — nothing is summed or priced here, so
 * the headline cost is always exactly the sum of the model cards.
 *
 * Does **not** render `DownloadConfigPanel` (removed on direct developer
 * instruction) — the setup guide's own `push-usage.mjs` download link
 * (`ContentRenderer`, ADR-053) is the self-service path.
 *
 * // req: FR-USAGE-005, ADR-052, ADR-058
 */
export function MyClaudeUsageSection() {
  const [days, setDays] = useState<MyUsageRangeDays>(7);
  const [dashboard, setDashboard] = useState<MyClaudeUsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async (range: MyUsageRangeDays) => {
    try {
      setDashboard(await fetchMyUsage(range));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load your Claude usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload(days);
  }, [reload, days]);

  const usage = dashboard?.usage;
  const range = RANGES.find((r) => r.days === days) ?? RANGES[1]!;
  const change = usage ? costChange(usage.costUsd, usage.previousCostUsd) : null;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <label className="sr-only" htmlFor="my-usage-range">
          Period
        </label>
        <select
          id="my-usage-range"
          value={days}
          onChange={(e) => setDays(Number(e.target.value) as MyUsageRangeDays)}
          className="rounded-[10px] border border-border bg-white px-3 py-2 text-sm font-medium text-dash-ink shadow-sm"
        >
          {RANGES.map((r) => (
            <option key={r.days} value={r.days}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {loadError && (
        <div role="alert" className="mb-4 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="rounded-[10px] border border-border bg-white px-4 py-8 text-center text-sm text-muted">
          Loading your Claude usage…
        </p>
      ) : (
        <>
          <div className="rounded-[10px] border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
              <div className="lg:w-64 lg:shrink-0 lg:border-r lg:border-border lg:pr-6">
                <p
                  className="text-sm font-semibold text-dash-ink"
                  title="API-equivalent estimate at Anthropic's published per-model rates — not what you are billed."
                >
                  Total cost
                </p>
                <p className="mt-2 text-4xl font-bold tabular-nums text-dash-ink" data-testid="my-usage-total-cost">
                  {formatCost(usage?.costUsd ?? 0)}
                </p>
                {change && (
                  <p
                    className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                      change.up ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {change.up ? "↑" : "↓"} {change.pct}% from {range.previous}
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dash-ink">Total tokens (all models)</p>
                <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {CATEGORIES.map((c) => (
                    <TokenFigure key={c.key} label={c.label} dot={c.dot} value={usage?.[c.key] ?? 0} large />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-dash-ink">Usage by Model</h3>
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              {CATEGORIES.map((c) => (
                <span key={c.key} className="flex items-center gap-1.5">
                  <span aria-hidden className={`h-2 w-2 rounded-full ${c.dot}`} />
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {usage && usage.byModel.length > 0 ? (
              usage.byModel.map((m) => <ModelCard key={m.model} usage={m} />)
            ) : (
              <p className="rounded-[10px] border border-border bg-white px-4 py-8 text-center text-sm text-muted">
                No usage reported for {range.label.toLowerCase()}.
              </p>
            )}
          </div>

          {usage && usage.recent.length > 0 && (
            <>
              <h3 className="mt-8 text-lg font-bold text-dash-ink">Recent Usage</h3>
              <div className="mt-3 overflow-x-auto rounded-[10px] border border-border bg-white shadow-sm">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Model</th>
                      {CATEGORIES.map((c) => (
                        <th key={c.key} className="px-4 py-3 text-right font-medium">
                          {c.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-right font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.recent.map((row) => (
                      <tr key={`${row.date}|${row.model}`} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-4 py-3 text-dash-ink">{formatDay(row.date)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-dash-ink">{modelDisplayName(row.model)}</td>
                        {CATEGORIES.map((c) => (
                          <td key={c.key} className="px-4 py-3 text-right tabular-nums text-dash-ink">
                            {formatTokens(row[c.key])}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right tabular-nums text-dash-ink">{formatCost(row.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="mt-8 rounded-[10px] border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-dash-ink">Daily usage history</h3>
                <p className="text-xs text-muted">Last 30 days · input (purple) stacked under output (blue)</p>
              </div>
              <p className="text-xs text-muted">Last reported: {formatLastUpdated(dashboard?.lastUpdated ?? null)}</p>
            </div>
            <div className="mt-5">
              <MyUsageHistoryChart data={dashboard?.daily ?? []} today={dashboard?.today} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
