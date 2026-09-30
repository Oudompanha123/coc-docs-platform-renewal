"use client";

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
import { BudgetOverridesPanel } from "@/components/claude-usage/BudgetOverridesPanel";
import { InviteTeammateModal } from "@/components/claude-usage/InviteTeammateModal";
import { RemoveMemberModal } from "@/components/claude-usage/RemoveMemberModal";
import { TeamRosterPanel } from "@/components/claude-usage/TeamRosterPanel";
import { UsageChart } from "@/components/claude-usage/UsageChart";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { UsageTable } from "@/components/claude-usage/UsageTable";
import {
  fetchDashboard,
  inviteMember,
  removeMember,
  updateMemberBudget,
  type ClaudeUsageDashboard,
  type ClaudeUsageMember,
  type Period,
  type TeamRole,
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
 * Cooperative/opt-in framing throughout: removing someone or inviting them
 * only changes this dashboard's tracking list, never their actual Claude
 * Code account or machine — see the footer note and both modals.
 */
export function AdminClaudeUsageView() {
  const [period, setPeriod] = useState<Period>("week");
  const [offset, setOffset] = useState(0);
  const [dashboard, setDashboard] = useState<ClaudeUsageDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ClaudeUsageMember | null>(null);

  const reload = useCallback(async () => {
    try {
      setDashboard(await fetchDashboard(period, offset));
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

  // Re-read on return to the tab, and after an admin's own CLI sign-in lands
  // here (`/cli/signed-in` → `?cli=signed-in`) until the team totals move.
  const { awaitingCliUpload } = useUsageAutoRefresh(reload, dashboard ? JSON.stringify(dashboard.totals) : undefined);

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

  async function handleInvite(email: string, teamRole: TeamRole) {
    // Left to throw: InviteTeammateModal shows the error itself and stays open.
    await inviteMember(email, teamRole);
    await reload();
  }

  function handleBudgetOverrideChange(member: ClaudeUsageMember, tokens: number | null) {
    void withActionError(() => updateMemberBudget(member.id, tokens).then(() => undefined));
  }

  function handleRemove(member: ClaudeUsageMember) {
    setRemoveTarget(member);
  }

  function handleConfirmRemove(member: ClaudeUsageMember) {
    setRemoveTarget(null);
    void withActionError(() => removeMember(member.id).then(() => undefined));
  }

  const members = dashboard?.members ?? [];
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
      titleIcon={<BarChartIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 self-start rounded-[10px] border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            aria-label="Previous period"
            onClick={() => setOffset((o) => Math.max(-60, o - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {(["day", "week", "month"] as Period[]).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => handlePeriodChange(unit)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                period === unit ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow" : "text-muted hover:text-dash-ink"
              }`}
            >
              {unit}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next period"
            disabled={offset >= 0}
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="ml-2 pr-2 text-sm text-muted">
            {dashboard ? rangeLabel(period, offset, dashboard.from, dashboard.to) : RANGE_LABEL[period]}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 self-start rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Invite teammate
        </button>
      </div>

      {awaitingCliUpload && (
        <div role="status" className="mt-4 rounded-[10px] border border-border bg-page px-4 py-3 text-sm text-dash-ink">
          Signed in. Your latest usage will appear here once <code className="font-mono text-xs">claude-team-usage</code>{" "}
          finishes uploading.
        </div>
      )}

      {loadError && (
        <div role="alert" className="mt-4 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {loadError}
        </div>
      )}

      {actionError && (
        <div role="alert" className="mt-4 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      {loading ? (
        <p className="mt-4 rounded-[10px] border border-border bg-white px-4 py-8 text-center text-sm text-muted">
          Loading Claude usage…
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <UsageStatCard
              icon={BarChartIcon}
              label="Total Tokens"
              value={formatTokensFull(totals.totalTokens)}
              tone="purple"
              note={dashboard ? rangeLabel(period, offset, dashboard.from, dashboard.to) : RANGE_LABEL[period]}
            />
            <UsageStatCard
              icon={CoinsIcon}
              label="Reference API Cost"
              value={`$${totals.costUsd.toFixed(2)}`}
              tone="blue"
              note="API-equivalent estimate, not a charge"
            />
            <UsageStatCard
              icon={UsersIcon}
              label="Active Users"
              value={String(dashboard?.activeUsers ?? 0)}
              tone="green"
              note={`of ${members.length} tracked`}
            />
            <UsageStatCard
              icon={WarningIcon}
              label="Near Limit"
              value={String(dashboard?.nearLimit ?? 0)}
              tone="orange"
              note="≥ 70% of soft budget"
            />
          </div>

          <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-dash-ink">Daily tokens by user</h2>
            <p className="text-xs text-muted">Stacked by teammate, current active reporters only</p>
            <div className="mt-5">
              <UsageChart data={dashboard?.daily ?? []} members={members} />
            </div>
          </div>

          <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-dash-ink">Per-user usage</h2>
            <UsageTable members={members} />
          </div>

          <TeamRosterPanel members={members} onRemove={handleRemove} />

          <BudgetOverridesPanel members={members} onOverrideChange={handleBudgetOverrideChange} />
        </>
      )}

      {inviteOpen && <InviteTeammateModal onClose={() => setInviteOpen(false)} onInvite={handleInvite} />}

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
