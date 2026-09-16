"use client";

import { useMemo, useState } from "react";
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
import { UsageChart } from "@/components/claude-usage/UsageChart";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { UsageTable } from "@/components/claude-usage/UsageTable";
import {
  apiCostFor,
  DAILY_USAGE,
  softBudgetPctFor,
  TEAM_MEMBERS,
  totalTokensFor,
  type TeamMember,
  type TeamRole,
} from "@/lib/mock/claude-usage";

type RangeUnit = "day" | "week" | "month";

const RANGE_LABEL: Record<RangeUnit, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
};

function formatTokensFull(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/**
 * Claude Code Usage — mock-only monitoring page, same convention as every
 * other page in this frontend (no real fetch calls). Content/structure is
 * modeled on a separate internal usage-dashboard tool, but styled with Coc
 * Docs Platform's own design system (white cards, indigo/blue accents, the
 * same table/pill/modal patterns as Users & Roles) rather than that tool's
 * visual style.
 *
 * Cooperative/opt-in framing throughout: removing someone or inviting them
 * only changes this dashboard's tracking list, never their actual Claude
 * Code account or machine — see the footer note and both modals.
 */
export default function ClaudeUsagePage() {
  const [members, setMembers] = useState<TeamMember[]>(TEAM_MEMBERS);
  const [range, setRange] = useState<RangeUnit>("week");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);

  const reporting = useMemo(() => members.filter((m) => m.status !== "removed"), [members]);

  const totals = useMemo(() => {
    const totalTokens = reporting.reduce((sum, m) => sum + totalTokensFor(m), 0);
    const totalCost = reporting.reduce((sum, m) => sum + apiCostFor(m), 0);
    const activeCount = members.filter((m) => m.status === "active").length;
    const nearLimitCount = members.filter((m) => m.status !== "removed" && softBudgetPctFor(m) >= 80).length;
    return { totalTokens, totalCost, activeCount, nearLimitCount };
  }, [members, reporting]);

  function handleRoleChange(member: TeamMember, role: TeamRole) {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role } : m)));
  }

  function handleBudgetOverrideChange(member: TeamMember, tokens: number | undefined) {
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, budgetOverrideTokens: tokens } : m)),
    );
  }

  function handleRemove(member: TeamMember) {
    setRemoveTarget(member);
  }

  function handleConfirmRemove(member: TeamMember) {
    setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, status: "removed" } : m)));
    setRemoveTarget(null);
  }

  function handleInvite(email: string, role: TeamRole) {
    const name = email.split("@")[0] ?? email;
    setMembers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        status: "invited",
        modelsUsed: [],
        lastActive: "Never",
        inputTokens: 0,
        outputTokens: 0,
      },
    ]);
  }

  return (
    <AppShell
      pageTitle="Claude Code Usage"
      pageSubtitle="Track opt-in Claude Code usage and estimated API-equivalent cost across your team"
      titleIcon={<BarChartIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 self-start rounded-xl border border-border bg-white p-1 shadow-sm">
          <button
            type="button"
            aria-label="Previous period"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          {(["day", "week", "month"] as RangeUnit[]).map((unit) => (
            <button
              key={unit}
              type="button"
              onClick={() => setRange(unit)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors ${
                range === unit ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow" : "text-muted hover:text-dash-ink"
              }`}
            >
              {unit}
            </button>
          ))}
          <button
            type="button"
            aria-label="Next period"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          <span className="ml-2 pr-2 text-sm text-muted">{RANGE_LABEL[range]}</span>
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

      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
        <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
        <p className="text-sm text-dash-ink">
          Token counts and API-equivalent cost below are <span className="font-semibold">soft-budget estimates</span>,
          not a real invoice or a hard usage limit — actual billing depends on the plan and models each person uses.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UsageStatCard
          icon={BarChartIcon}
          label="Total Tokens"
          value={formatTokensFull(totals.totalTokens)}
          tone="purple"
          note={RANGE_LABEL[range]}
        />
        <UsageStatCard
          icon={CoinsIcon}
          label="API-Equivalent Cost"
          value={`$${totals.totalCost.toFixed(2)}`}
          tone="blue"
          note="Estimated, blended rate"
        />
        <UsageStatCard
          icon={UsersIcon}
          label="Active Users"
          value={String(totals.activeCount)}
          tone="green"
          note={`of ${members.length} tracked`}
        />
        <UsageStatCard
          icon={WarningIcon}
          label="Near Limit"
          value={String(totals.nearLimitCount)}
          tone="orange"
          note="≥ 80% of soft budget"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-dash-ink">Daily tokens by user</h2>
        <p className="text-xs text-muted">Stacked by teammate, current active reporters only</p>
        <div className="mt-5">
          <UsageChart data={DAILY_USAGE} members={members} />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-bold text-dash-ink">Per-user usage</h2>
        <UsageTable members={members} onRoleChange={handleRoleChange} onRemove={handleRemove} />
      </div>

      <BudgetOverridesPanel members={members} onOverrideChange={handleBudgetOverrideChange} />

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
