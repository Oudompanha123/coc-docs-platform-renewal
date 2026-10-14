"use client";

import { SkeletonGroup, SkeletonStatCards, SkeletonTable } from "@/components/ui/skeleton";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  BarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CoinsIcon,
  UsersIcon,
  WarningIcon,
} from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { ClaudeUsageTabs } from "@/components/claude-usage/ClaudeUsageTabs";
import { DisabledMembersPanel } from "@/components/claude-usage/DisabledMembersPanel";
import { RemoveMemberModal } from "@/components/claude-usage/RemoveMemberModal";
import { UsageChart } from "@/components/claude-usage/UsageChart";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { UsageTable } from "@/components/claude-usage/UsageTable";
import { UserActivityModal } from "@/components/claude-usage/UserActivityModal";
import {
  fetchDashboard,
  removeMember,
  restoreMember,
  trackedMemberCount,
  updateMemberBudget,
  type ClaudeUsageDashboard,
  type ClaudeUsageMember,
  type Period,
} from "@/lib/admin/claudeUsage";
import { useUsageAutoRefresh } from "@/lib/claudeUsage/useUsageAutoRefresh";

const RANGE_LABEL: Record<Period, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
};

function formatTokensFull(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** "Today"/"This week"/"This month" for the current period; the actual date range once it's a past one. */
function rangeLabel(period: Period, offset: number, from: string, to: string): string {
  if (offset === 0) return RANGE_LABEL[period];
  const fromDate = new Date(`${from}T00:00:00`);
  const toDate = new Date(`${to}T00:00:00`);
  if (period === "day") {
    return fromDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }
  if (period === "month") {
    return fromDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }
  const fromLabel = fromDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const toLabel = toDate.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fromLabel} – ${toLabel}`;
}

/**
 * Claude Code Usage — the team-wide view at `/claude-usage` (ADR-035),
 * admin/super_admin only. The personal view lives at its own route,
 * `/my-claude-usage` instead (`components/claude-usage/MyClaudeUsageSection.tsx`,
 * ADR-052 v1.6), so this component is unconditionally the whole
 * of `/claude-usage`. Backed by ClaudeUsageService: real roster and usage
 * rows, ingested at `POST /api/ingest`. Content/structure is modeled on a
 * separate internal usage-dashboard tool, but styled with Coc Docs
 * Platform's own design system (white cards, indigo/blue accents, the same
 * table/pill/modal patterns as Users & Roles) rather than that tool's
 * visual style.
 *
 * Cooperative/opt-in framing throughout: removing someone only changes this
 * dashboard's tracking list, never their actual Claude Code account or
 * machine — see the footer note and the remove modal.
 */
// Hoisted, not inline: AppShell republishes the page header whenever this
// element's identity changes, so an inline literal re-rendered the topbar on
// every render of this page — including opening and closing a user's detail.
const TITLE_ICON = <BarChartIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />;

export function AdminClaudeUsageView() {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [dashboard, setDashboard] = useState<ClaudeUsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [removeTarget, setRemoveTarget] = useState<ClaudeUsageMember | null>(null);
  const [detail, setDetail] = useState<{ member: ClaudeUsageMember; avatarColor: string } | null>(null);

  const reload = useCallback(async () => {
    try {
      const next = await fetchDashboard(period, offset);
      // The usual auto-refresh brings back the same figures: keep the old object, so nothing redraws.
      setDashboard((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load Claude usage.");
    } finally {
      setLoading(false);
    }
  }, [period, offset]);

  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  // Re-read on return to the tab, once a minute while visible (so "Last
  // scan" moves on its own), and after an admin's own CLI sign-in lands here
  // (`/cli/signed-in` → `?cli=signed-in`) until a scan shows up — the team
  // totals or anyone's last scan moving.
  const { awaitingCliUpload } = useUsageAutoRefresh(
    reload,
    dashboard
      ? JSON.stringify([dashboard.totals, dashboard.members.map((m) => [m.id, m.lastScanAt ?? null])])
      : undefined,
  );

  function handlePeriodChange(next: Period) {
    setPeriod(next);
    setOffset(0);
  }

  async function withActionError(action: () => Promise<void>) {
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "That change could not be saved.");
    }
  }

  function handleBudgetOverrideChange(member: ClaudeUsageMember, tokens: number | null) {
    void withActionError(() => updateMemberBudget(member.id, tokens).then(() => undefined));
  }

  const closeDetail = useCallback(() => setDetail(null), []);

  // From the detail popup: close it first, so the confirmation is the only dialog on screen.
  const handleRemove = useCallback((member: ClaudeUsageMember) => {
    setDetail(null);
    setRemoveTarget(member);
  }, []);

  // Enable needs no confirmation: it only puts someone back on the dashboard,
  // and the popup stays open so the button flips to Disable in place.
  function handleRestore(member: ClaudeUsageMember) {
    void withActionError(() => restoreMember(member.id).then(() => undefined));
  }

  function handleConfirmRemove(member: ClaudeUsageMember) {
    setRemoveTarget(null);
    void withActionError(() => removeMember(member.id).then(() => undefined));
  }

  const members = dashboard?.members ?? [];
  const disabledMembers = dashboard?.disabledMembers ?? [];
  const totals = dashboard?.totals ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
    totalTokens: 0,
    costUsd: 0,
  };

  return (
    <AppShell
      pageTitle="Claude Code Usage"
      pageSubtitle="Track opt-in Claude Code usage and estimated API-equivalent cost across your team"
      titleIcon={TITLE_ICON}
    >
      <ClaudeUsageTabs />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex h-9 items-center gap-1 self-start rounded-control border border-surface-border bg-card p-1">
          <Button
            type="button"
            variant="ghost"
            aria-label="Previous period"
            onClick={() => setOffset((o) => Math.max(-60, o - 1))}
            className="size-7 p-0 text-muted-foreground"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          {(["day", "week", "month"] as Period[]).map((unit) => (
            <Button
              key={unit}
              type="button"
              variant={period === unit ? "default" : "ghost"}
              onClick={() => handlePeriodChange(unit)}
              className={`h-7 px-3 font-medium capitalize ${period === unit ? "" : "text-muted-foreground hover:text-foreground"}`}
            >
              {unit}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            aria-label="Next period"
            disabled={offset >= 0}
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            className="size-7 p-0 text-muted-foreground"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <span className="ml-2 pr-2 text-sm text-muted-foreground">
            {dashboard ? rangeLabel(period, offset, dashboard.from, dashboard.to) : RANGE_LABEL[period]}
          </span>
        </div>
      </div>

      {awaitingCliUpload && (
        <div role="status" className="mt-4 rounded-xl border border-surface-border bg-muted-surface px-4 py-3 text-sm text-foreground">
          Signed in. Your latest usage will appear here once <code className="font-mono text-xs">claude-team-usage</code>{" "}
          finishes uploading.
        </div>
      )}

      {loadError && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {actionError && (
        <div role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {loading ? (
        <SkeletonGroup label="Loading Claude usage" className="mt-4">
          <SkeletonStatCards />
          <SkeletonTable className="mt-4" rows={8} columns={5} />
        </SkeletonGroup>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UsageStatCard
              icon={BarChartIcon}
              label="Total Tokens"
              value={formatTokensFull(totals.totalTokens)}
              note={dashboard ? rangeLabel(period, offset, dashboard.from, dashboard.to) : RANGE_LABEL[period]}
            />
            <UsageStatCard
              icon={CoinsIcon}
              label="Cost"
              value={`$${totals.costUsd.toFixed(2)}`}
              note="API-equivalent estimate, not a charge"
            />
            <UsageStatCard
              icon={UsersIcon}
              label="Active Users"
              value={String(dashboard?.activeUsers ?? 0)}
              note={`of ${trackedMemberCount(members)} tracked`}
            />
            <UsageStatCard
              icon={WarningIcon}
              label="Near Limit"
              value={String(dashboard?.nearLimit ?? 0)}
              note="≥ 70% of soft budget"
            />
          </div>

          <section className="mt-4 rounded-xl border border-surface-border bg-card p-4">
            <h2 className="text-sm font-semibold text-foreground">Daily tokens by user</h2>
            <p className="text-xs text-muted-foreground">Stacked by teammate, current active reporters only</p>
            <div className="mt-4">
              <UsageChart data={dashboard?.daily ?? []} members={members} />
            </div>
          </section>

          <section className="mt-4 overflow-hidden rounded-xl border border-surface-border bg-card">
            <h2 className="px-4 pb-3 pt-4 text-sm font-semibold text-foreground">Per-user usage</h2>
            <UsageTable members={members} onSelect={(member, avatarColor) => setDetail({ member, avatarColor })} />
          </section>

          <DisabledMembersPanel
            members={disabledMembers}
            onSelect={(member, avatarColor) => setDetail({ member, avatarColor })}
            onEnable={handleRestore}
          />
        </>
      )}

      {detail && (
        <UserActivityModal
          // Looked up in both lists, so the button flips in place after
          // Enable/Disable moves the member from one to the other.
          member={
            members.find((m) => m.id === detail.member.id) ??
            disabledMembers.find((m) => m.id === detail.member.id) ??
            detail.member
          }
          avatarColor={detail.avatarColor}
          onClose={closeDetail}
          onRemove={handleRemove}
          onRestore={handleRestore}
          onBudgetChange={handleBudgetOverrideChange}
        />
      )}

      {removeTarget && (
        <RemoveMemberModal
          member={removeTarget}
          onClose={() => setRemoveTarget(null)}
          onConfirm={handleConfirmRemove}
        />
      )}
    </AppShell>
  );
}
