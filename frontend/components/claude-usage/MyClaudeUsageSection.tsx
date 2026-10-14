"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { MyScanStatusSection } from "@/components/claude-usage/MyScanStatusSection";
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
  type MyClaudeUsageDayModel,
  type MyUsageRangeDays,
} from "@/lib/claudeUsage/myUsage";
import { useUsageAutoRefresh } from "@/lib/claudeUsage/useUsageAutoRefresh";

const RANGES: { days: MyUsageRangeDays; label: string; previous: string }[] = [
  { days: 1, label: "Today", previous: "yesterday" },
  { days: 7, label: "Last 7 days", previous: "previous 7 days" },
  { days: 30, label: "Last 30 days", previous: "previous 30 days" },
];

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
  // No shadow: this component is nested inside /account/settings's own
  // Claude Usage card, which already has one — a shadow here would double
  // up. rounded-xl (not this file's -elsewhere- rounded-[10px]) matches
  // that outer card's own corner radius, per that task's explicit ask.
  return (
    <section className={`rounded-xl border border-border bg-white p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-dash-ink">{title}</h3>
      {children}
    </section>
  );
}

/** One row per (day, model) in the selected window, newest day first — usage and cost side by side. */
function ModelUsageTable({ rows, emptyLabel }: { rows: MyClaudeUsageDayModel[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="mt-4 py-6 text-center text-sm text-muted">No usage reported for {emptyLabel}.</p>;
  }
  const hasUnattributed = rows.some((r) => r.model === UNATTRIBUTED_MODEL);
  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm" aria-label="Model usage">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Model</th>
              <th className="py-2 pr-4 text-right font-medium">Input</th>
              <th className="py-2 pr-4 text-right font-medium">Output</th>
              <th className="py-2 pr-4 text-right font-medium">Total</th>
              <th className="py-2 pr-4 text-right font-medium">Cache Read</th>
              <th className="py-2 pr-4 text-right font-medium">Cache Write</th>
              <th className="py-2 text-right font-medium">Reference API Cost</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.date}|${r.model}`} className="border-b border-border last:border-0">
                <td className="whitespace-nowrap py-3 pr-4 text-dash-ink">{formatDay(r.date)}</td>
                <td className="whitespace-nowrap py-3 pr-4 font-medium text-dash-ink">{modelDisplayName(r.model)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(r.inputTokens)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(r.outputTokens)}</td>
                <td className="py-3 pr-4 text-right font-semibold tabular-nums text-dash-ink">
                  {formatTokens(r.inputTokens + r.outputTokens)}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(r.cacheReadTokens)}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-dash-ink">{formatTokens(r.cacheWriteTokens)}</td>
                <td className="py-3 text-right tabular-nums text-dash-ink">{formatCost(r.costUsd)}</td>
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
 * and never drawn down from the subscription (ADR-065). Priced server-side
 * per model, input + output only (ADR-066), so the figure is the sum of
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

/** The plan price on its own — deliberately no "remaining" or comparison with the API cost (ADR-065). */
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
 * "My Claude Usage" — a section inside `/account/settings` now (ADR-094,
 * revising ADR-052 v1.6's own route), reached via the Settings side menu
 * rather than its own top-nav link or page; `/my-claude-usage` permanently
 * redirects to `/account/settings#claude-usage` (`next.config.ts`).
 * `/claude-usage` is a separate, admin/super_admin-only page — see
 * `app/(shell)/claude-usage/page.tsx` — untouched by that move.
 *
 * Tokens are the headline, dollars are not (ADR-065): the Reference API Cost
 * and the Subscription price as two separate cards first (never subtracted
 * from or compared with each other — they answer different questions), then
 * Model Usage — one row per (day, model) over the selected window — then the
 * Daily usage history chart. Every figure comes from
 * `GET /api/v1/claude-usage/me`, which the backend resolves from the session
 * and prices server-side (ADR-058) — nothing is priced here, so the cost is
 * always exactly the sum of its per-model lines.
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
 * // req: FR-USAGE-005, ADR-052, ADR-058, ADR-060, ADR-065
 */
export function MyClaudeUsageSection({ scanLogsHref }: { scanLogsHref?: string } = {}) {
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
          <div className="grid gap-4 lg:grid-cols-3">
            <ReferenceCostCard usage={usage} previousLabel={range.previous} />
            <SubscriptionCard usdPerMonth={dashboard?.subscriptionUsdPerMonth ?? 0} />
          </div>

          <section className="mt-6 rounded-xl border border-border bg-white p-6">
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
            <ModelUsageTable rows={usage?.recent ?? []} emptyLabel={range.label.toLowerCase()} />
          </section>

          <div className="mt-8 rounded-xl border border-border bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-dash-ink">Daily usage history</h3>
                <p className="text-xs text-muted">Last 30 days · input (purple) stacked under output (blue)</p>
              </div>
              <div className="text-right text-xs text-muted">
                {/* A scan that found nothing new uploads nothing, so the two differ (ADR-097). */}
                <p>Last scan: {formatLastUpdated(dashboard?.lastScanAt ?? null)}</p>
                <p>Last usage update: {formatLastUpdated(dashboard?.lastUpdated ?? null)}</p>
              </div>
            </div>
            <div className="mt-5">
              <MyUsageHistoryChart data={dashboard?.daily ?? []} today={dashboard?.today} />
            </div>
          </div>

          <MyScanStatusSection scanLogsHref={scanLogsHref} />
        </>
      )}
    </div>
  );
}
