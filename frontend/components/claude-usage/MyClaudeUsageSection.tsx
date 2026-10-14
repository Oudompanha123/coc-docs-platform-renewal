"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";
import { MyScanStatusSection } from "@/components/claude-usage/MyScanStatusSection";
import { MyUsageHistoryChart } from "@/components/claude-usage/MyUsageHistoryChart";
import { SimpleSelect } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <section className={`rounded-xl border border-surface-border bg-card p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

/** One row per (day, model) in the selected window, newest day first — usage and cost side by side. */
function ModelUsageTable({ rows, emptyLabel }: { rows: MyClaudeUsageDayModel[]; emptyLabel: string }) {
  if (rows.length === 0) {
    return <p className="px-5 pb-6 pt-2 text-center text-sm text-muted-foreground">No usage reported for {emptyLabel}.</p>;
  }
  const hasUnattributed = rows.some((r) => r.model === UNATTRIBUTED_MODEL);
  return (
    <>
      <Table className="min-w-[720px]" containerClassName="border-t border-surface-border" aria-label="Model usage">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-5">Date</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="text-right">Input</TableHead>
            <TableHead className="text-right">Output</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Cache Read</TableHead>
            <TableHead className="text-right">Cache Write</TableHead>
            <TableHead className="pr-5 text-right">Reference API Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={`${r.date}|${r.model}`}>
              <TableCell className="whitespace-nowrap pl-5 text-foreground">{formatDay(r.date)}</TableCell>
              <TableCell className="whitespace-nowrap font-medium text-foreground">{modelDisplayName(r.model)}</TableCell>
              <TableCell className="text-right tabular-nums text-foreground">{formatTokens(r.inputTokens)}</TableCell>
              <TableCell className="text-right tabular-nums text-foreground">{formatTokens(r.outputTokens)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums text-foreground">
                {formatTokens(r.inputTokens + r.outputTokens)}
              </TableCell>
              <TableCell className="text-right tabular-nums text-foreground">{formatTokens(r.cacheReadTokens)}</TableCell>
              <TableCell className="text-right tabular-nums text-foreground">{formatTokens(r.cacheWriteTokens)}</TableCell>
              <TableCell className="pr-5 text-right tabular-nums text-foreground">{formatCost(r.costUsd)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {hasUnattributed && (
        <p className="border-t border-surface-border px-5 py-3 text-xs text-muted-foreground">
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
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground" data-testid="my-usage-total-cost">
        {formatCost(usage?.costUsd ?? 0)}
      </p>
      {models.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-sm text-muted-foreground" data-testid="my-usage-cost-models">
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
          className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
            change.up
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
          }`}
        >
          {change.up ? "↑" : "↓"} {change.pct}% from {previousLabel}
        </p>
      )}
      <p className="mt-4 flex gap-2 rounded-lg bg-muted-surface px-3 py-2 text-xs text-muted-foreground" role="note">
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
      <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums text-foreground" data-testid="my-usage-subscription">
        {formatPrice(usdPerMonth)} <span className="text-sm font-medium text-muted-foreground">/ month</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground">Your Claude plan. Fixed per seat — not a token credit balance.</p>
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
        <div role="status" className="mb-4 rounded-xl border border-surface-border bg-muted-surface px-4 py-3 text-sm text-foreground">
          Signed in. Your latest usage will appear here once <code className="font-mono text-xs">claude-team-usage</code>{" "}
          finishes uploading.
        </div>
      )}

      {loadError && (
        <div role="alert" className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {loading ? (
        <p className="rounded-xl border border-surface-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Loading your Claude usage…
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <ReferenceCostCard usage={usage} previousLabel={range.previous} />
            <SubscriptionCard usdPerMonth={dashboard?.subscriptionUsdPerMonth ?? 0} />
          </div>

          <section className="mt-4 overflow-hidden rounded-xl border border-surface-border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
              <h3 className="text-sm font-semibold text-foreground">Model Usage</h3>
              <SimpleSelect
                id="my-usage-range"
                aria-label="Period"
                value={String(days)}
                onValueChange={(v) => setDays(Number(v) as MyUsageRangeDays)}
                options={RANGES.map((r) => ({ value: String(r.days), label: r.label }))}
                className="w-auto min-w-36 font-medium"
              />
            </div>
            <ModelUsageTable rows={usage?.recent ?? []} emptyLabel={range.label.toLowerCase()} />
          </section>

          <div className="mt-4 rounded-xl border border-surface-border bg-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Daily usage history</h3>
                <p className="text-xs text-muted-foreground">Last 30 days · input (purple) stacked under output (blue)</p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {/* A scan that found nothing new uploads nothing, so the two differ (ADR-097). */}
                <p>Last scan: {formatLastUpdated(dashboard?.lastScanAt ?? null)}</p>
                <p>Last usage update: {formatLastUpdated(dashboard?.lastUpdated ?? null)}</p>
              </div>
            </div>
            <div className="mt-4">
              <MyUsageHistoryChart data={dashboard?.daily ?? []} today={dashboard?.today} />
            </div>
          </div>

          <MyScanStatusSection scanLogsHref={scanLogsHref} />
        </>
      )}
    </div>
  );
}
