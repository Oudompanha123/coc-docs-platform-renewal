"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChartIcon, PulseIcon, RenewIcon } from "@/components/layout/icons";
import { MyUsageHistoryChart } from "@/components/claude-usage/MyUsageHistoryChart";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { fetchMyUsage, type MyClaudeUsageDashboard, type MyClaudeUsagePoint } from "@/lib/claudeUsage/myUsage";

function formatTokensFull(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatLastUpdated(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Never";
  return when.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/** Sum of the trailing `days` entries of a chronologically-ordered (oldest → newest) history. */
function sumLastDays(daily: MyClaudeUsagePoint[], days: number): number {
  return daily.slice(-days).reduce((sum, point) => sum + point.totalTokens, 0);
}

function sumTokens(daily: MyClaudeUsagePoint[], pick: (point: MyClaudeUsagePoint) => number): number {
  return daily.reduce((sum, point) => sum + pick(point), 0);
}

/**
 * "My Claude Usage" — rendered by its own route, `/my-claude-usage`
 * (ADR-052 v1.6), not embedded on `/home` any more. `/claude-usage` is a
 * separate, admin/super_admin-only page — see
 * `app/(shell)/claude-usage/page.tsx`.
 *
 * Every caller sees only its own rows here, read from `GET
 * /api/v1/claude-usage/me`, which the backend resolves from the session —
 * there is nothing on this page that could ask for anyone else's usage.
 *
 * Does **not** render `DownloadConfigPanel` (removed on direct developer
 * instruction) — `AdminClaudeUsageView` is the only place that panel still
 * appears. A plain member self-minting a token still works end to end: the
 * setup guide's own `push-usage.mjs` download link (`ContentRenderer`,
 * ADR-053) personalizes it the same way, for any signed-in rank, without
 * this section's help.
 */
export function MyClaudeUsageSection() {
  const [dashboard, setDashboard] = useState<MyClaudeUsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setDashboard(await fetchMyUsage());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load your Claude usage.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const daily = dashboard?.daily ?? [];
  const weekTotal = sumLastDays(daily, 7);
  const monthTotal = sumLastDays(daily, 30);
  const monthInput = sumTokens(daily, (p) => p.inputTokens);
  const monthOutput = sumTokens(daily, (p) => p.outputTokens);
  const monthAll = monthInput + monthOutput;
  const inputPct = monthAll > 0 ? Math.round((monthInput / monthAll) * 100) : 0;

  return (
    <div>
      {loadError && (
        <div role="alert" className="rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="rounded-[10px] border border-border bg-white px-4 py-8 text-center text-sm text-muted">
          Loading your Claude usage…
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <UsageStatCard
              icon={BarChartIcon}
              label="Today's Tokens"
              value={formatTokensFull(dashboard?.todayTotalTokens ?? 0)}
              tone="purple"
              note="Input + output, today"
            />
            <UsageStatCard
              icon={PulseIcon}
              label="This Week"
              value={formatTokensFull(weekTotal)}
              tone="blue"
              note="Last 7 days"
            />
            <UsageStatCard
              icon={RenewIcon}
              label="This Month"
              value={formatTokensFull(monthTotal)}
              tone="green"
              note="Last 30 days"
            />
          </div>

          <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-dash-ink">Input vs. output, last 30 days</h3>
              {monthAll > 0 && (
                <p className="text-xs font-semibold text-muted">
                  {formatTokensFull(monthInput)} in ({inputPct}%) · {formatTokensFull(monthOutput)} out ({100 - inputPct}%)
                </p>
              )}
            </div>
            <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-page">
              {monthAll > 0 ? (
                <>
                  <div className="h-full bg-brand-purple" style={{ width: `${inputPct}%` }} />
                  <div className="h-full bg-brand-blue" style={{ width: `${100 - inputPct}%` }} />
                </>
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
          </div>

          <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-dash-ink">Daily usage history</h3>
                <p className="text-xs text-muted">Last 30 days · input (purple) stacked under output (blue)</p>
              </div>
              <p className="text-xs text-muted">Last reported: {formatLastUpdated(dashboard?.lastUpdated ?? null)}</p>
            </div>
            <div className="mt-5">
              <MyUsageHistoryChart data={daily} today={dashboard?.today} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
