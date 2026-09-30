"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { MyUsageHistoryChart } from "@/components/claude-usage/MyUsageHistoryChart";
import {
  costChange,
  formatCost,
  formatPrice,
  formatTokens,
  modelDisplayName,
  modelFamilyName,
  UNATTRIBUTED_MODEL,
} from "@/lib/claudeUsage/format";
import {
  fetchMyUsage,
  type MyClaudeUsageBreakdown,
  type MyClaudeUsageDashboard,
  type MyClaudeUsageModel,
  type MyClaudeUsageWeek,
  type MyUsageRangeDays,
} from "@/lib/claudeUsage/myUsage";
import { useUsageAutoRefresh } from "@/lib/claudeUsage/useUsageAutoRefresh";

const RANGES: { days: MyUsageRangeDays; label: string; previous: string }[] = [
  { days: 1, label: "Today", previous: "yesterday" },
  { days: 7, label: "Last 7 days", previous: "previous 7 days" },
  { days: 30, label: "Last 30 days", previous: "previous 30 days" },
];

/** The four token categories, in Claude Code's own order — the Recent Usage table's columns. */
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

function Card({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[10px] border border-border bg-white p-6 shadow-sm ${className}`}>
      <h3 className="text-sm font-semibold text-dash-ink">{title}</h3>
      {children}
    </section>
  );
}

/** Tokens first, never dollars (ADR-063). Input + output only — cache tokens are not counted as usage here. */
function TodayCard({ input, output }: { input: number; output: number }) {
  return (
    <Card title="Today's Usage">
      <p className="mt-3 text-4xl font-bold tabular-nums text-dash-ink" data-testid="my-usage-today-tokens">
        {formatTokens(input + output)} <span className="text-lg font-semibold text-muted">tokens</span>
      </p>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-muted">Input:</dt>
          <dd className="font-medium tabular-nums text-dash-ink">{formatTokens(input)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-muted">Output:</dt>
          <dd className="font-medium tabular-nums text-dash-ink">{formatTokens(output)}</dd>
        </div>
      </dl>
    </Card>
  );
}

/** Same amber/red split as the admin table's budget bar (70% / 90%, ADR-035). */
function barColor(pct: number): string {
  if (pct >= 90) return "bg-danger";
  if (pct >= 70) return "bg-amber-500";
  return "bg-brand-purple";
}

function WeeklyCard({ week }: { week: MyClaudeUsageWeek }) {
  return (
    <Card title="Weekly Usage">
      <p className="mt-3 text-4xl font-bold tabular-nums text-dash-ink" data-testid="my-usage-week-tokens">
        {formatTokens(week.totalTokens)}{" "}
        <span className="text-lg font-semibold text-muted">/ {formatTokens(week.budgetTokens)} tokens</span>
      </p>
      <p className="mt-4 text-sm font-medium text-dash-ink">{week.pctUsed}% used</p>
      <div
        role="progressbar"
        aria-label="Weekly usage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(week.pctUsed, 100)}
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-border"
      >
        <div className={`h-full rounded-full ${barColor(week.pctUsed)}`} style={{ width: `${Math.min(week.pctUsed, 100)}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {formatTokens(week.remainingTokens)} remaining · since {formatDay(week.from)}
      </p>
    </Card>
  );
}

function ModelUsageTable({ models, emptyLabel }: { models: MyClaudeUsageModel[]; emptyLabel: string }) {
  if (models.length === 0) {
    return <p className="mt-4 py-6 text-center text-sm text-muted">No usage reported for {emptyLabel}.</p>;
  }
  const hasUnattributed = models.some((m) => m.model === UNATTRIBUTED_MODEL);
  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-sm" aria-label="Model usage">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-4 font-medium">Model</th>
              <th className="py-2 pr-4 text-right font-medium">Input</th>
              <th className="py-2 pr-4 text-right font-medium">Output</th>
              <th className="py-2 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.model} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap py-3 pr-4 font-medium text-dash-ink">{modelDisplayName(m.model)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(m.inputTokens)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(m.outputTokens)}</td>
                <td className="py-3 text-right font-semibold tabular-nums text-dash-ink">
                  {formatTokens(m.inputTokens + m.outputTokens)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasUnattributed && (
        <p className="mt-3 text-xs text-muted">
          Unattributed: reported before per-model tracking. Re-run push-usage.mjs with --days 30 to attribute it.
        </p>
      )}
    </>
  );
}

/**
 * What this usage would have cost on the pay-per-token API — never a bill,
 * and never drawn down from the subscription (ADR-063). Priced server-side
 * per model, cache tokens included (ADR-058), so the figure is the sum of
 * the per-model lines under it.
 */
function ReferenceCostCard({
  usage,
  previousLabel,
}: {
  usage: MyClaudeUsageBreakdown | undefined;
  previousLabel: string;
}) {
  const change = usage ? costChange(usage.costUsd, usage.previousCostUsd) : null;
  const models = usage?.byModel ?? [];
  return (
    <Card title="Reference API Cost" className="lg:col-span-2">
      <p className="mt-3 text-4xl font-bold tabular-nums text-dash-ink" data-testid="my-usage-total-cost">
        {formatCost(usage?.costUsd ?? 0)}
      </p>
      {models.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-muted" data-testid="my-usage-cost-models">
          {models.map((m) => (
            <li key={m.model}>
              {modelFamilyName(m.model)} · {formatTokens(m.inputTokens + m.outputTokens)} tokens
              {models.length > 1 && <span className="tabular-nums"> · {formatCost(m.costUsd)}</span>}
            </li>
          ))}
        </ul>
      )}
      {change && (
        <p
          className={`mt-3 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
            change.up ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
          }`}
        >
          {change.up ? "↑" : "↓"} {change.pct}% from {previousLabel}
        </p>
      )}
      <p className="mt-4 flex gap-2 rounded-md bg-page px-3 py-2 text-xs text-muted" role="note">
        <span aria-hidden>ⓘ</span>
        <span>
          API-equivalent estimate only. This is not an additional Claude subscription charge.
          <br />
          Priced at each model&apos;s published API rate for input, output, and cache tokens.
        </span>
      </p>
    </Card>
  );
}

/** The plan price on its own — deliberately no "remaining" or comparison with the API cost (ADR-063). */
function SubscriptionCard({ usdPerMonth }: { usdPerMonth: number }) {
  return (
    <Card title="Subscription">
      <p className="mt-3 text-4xl font-bold tabular-nums text-dash-ink" data-testid="my-usage-subscription">
        {formatPrice(usdPerMonth)} <span className="text-lg font-semibold text-muted">/ month</span>
      </p>
      <p className="mt-4 text-xs text-muted">Your Claude plan. Fixed per seat — not a token credit balance.</p>
    </Card>
  );
}

/**
 * "My Claude Usage" — rendered by its own route, `/my-claude-usage`
 * (ADR-052 v1.6). `/claude-usage` is a separate, admin/super_admin-only page
 * — see `app/(shell)/claude-usage/page.tsx`.
 *
 * Tokens are the headline, dollars are not (ADR-063): Today's Usage and
 * Weekly Usage (against the weekly soft budget) first, then Model Usage over
 * the selected window, then the Reference API Cost and the Subscription as
 * two separate cards. The API figure is never subtracted from, or compared
 * with, the subscription price — they answer different questions. Every
 * figure comes from `GET /api/v1/claude-usage/me`, which the backend
 * resolves from the session and prices server-side (ADR-058) — nothing is
 * priced here, so the cost is always exactly the sum of its per-model lines.
 *
 * Does **not** render `DownloadConfigPanel` (removed on direct developer
 * instruction) — the setup guide's own `push-usage.mjs` download link
 * (`ContentRenderer`, ADR-053) is the self-service path.
 *
 * Refetches whenever the tab regains focus, so switching back from the
 * terminal after a `claude-team-usage scan` shows the new figures; and after
 * the CLI's browser sign-in returns here (`?cli=signed-in`), polls until
 * "last reported" moves (`useUsageAutoRefresh`). Only the CLI uploads —
 * this page just re-reads.
 *
 * // req: FR-USAGE-005, ADR-052, ADR-058, ADR-060, ADR-063
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

  const reloadCurrent = useCallback(() => reload(days), [reload, days]);
  const { awaitingCliUpload } = useUsageAutoRefresh(reloadCurrent, dashboard ? dashboard.lastUpdated : undefined);

  const usage = dashboard?.usage;
  const range = RANGES.find((r) => r.days === days) ?? RANGES[1]!;

  return (
    <div>
      {awaitingCliUpload && (
        <div role="status" className="mb-4 rounded-[10px] border border-border bg-page px-4 py-3 text-sm text-dash-ink">
          Signed in. Your latest usage will appear here once <code className="font-mono text-xs">claude-team-usage</code>{" "}
          finishes uploading.
        </div>
      )}

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
          <div className="grid gap-4 md:grid-cols-2">
            <TodayCard input={dashboard?.todayInputTokens ?? 0} output={dashboard?.todayOutputTokens ?? 0} />
            {dashboard?.week && <WeeklyCard week={dashboard.week} />}
          </div>

          <section className="mt-6 rounded-[10px] border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-dash-ink">Model Usage</h3>
              <div>
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
            </div>
            <ModelUsageTable models={usage?.byModel ?? []} emptyLabel={range.label.toLowerCase()} />
          </section>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <ReferenceCostCard usage={usage} previousLabel={range.previous} />
            <SubscriptionCard usdPerMonth={dashboard?.subscriptionUsdPerMonth ?? 0} />
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
                      <th className="px-4 py-3 text-right font-medium">Reference API Cost</th>
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
