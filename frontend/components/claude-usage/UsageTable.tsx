import {
  apiCostFor,
  avatarColorFor,
  softBudgetPctFor,
  totalTokensFor,
  type TeamMember,
  type TeamRole,
} from "@/lib/mock/claude-usage";
import { RolePill } from "./RolePill";
import { TrackingStatusBadge } from "./TrackingStatusBadge";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Same table shell (rounded card, header tint, row hover, divide-y) as
 *  users-roles/AccountsTable.tsx — different columns for this page's
 *  per-user token/cost/soft-budget data. */
export function UsageTable({
  members,
  onRoleChange,
  onRemove,
}: {
  members: TeamMember[];
  onRoleChange: (member: TeamMember, role: TeamRole) => void;
  onRemove: (member: TeamMember) => void;
}) {
  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border">
      <table className="w-full min-w-[960px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Person</th>
            <th className="px-4 py-3">Models Used</th>
            <th className="px-4 py-3">Input / Output</th>
            <th className="px-4 py-3">Total Tokens</th>
            <th className="px-4 py-3">API Cost</th>
            <th className="px-4 py-3">Soft Budget</th>
            <th className="px-4 py-3">Last Active</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {members.map((member, index) => {
            const total = totalTokensFor(member);
            const cost = apiCostFor(member);
            const pct = softBudgetPctFor(member);
            const overBudget = pct >= 100;
            const nearBudget = pct >= 80 && !overBudget;

            return (
              <tr key={member.id} className="transition-colors hover:bg-[#f8fafc]">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                      style={{ backgroundColor: avatarColorFor(index) }}
                    >
                      {member.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-dash-ink">{member.name}</p>
                      <p className="truncate text-xs text-muted">{member.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-muted">
                  {member.modelsUsed.length > 0 ? member.modelsUsed.join(", ") : "—"}
                </td>
                <td className="px-4 py-4">
                  <p className="text-dash-ink">{formatTokens(member.inputTokens)} in</p>
                  <p className="text-xs text-muted">{formatTokens(member.outputTokens)} out</p>
                </td>
                <td className="px-4 py-4 font-semibold text-dash-ink">{formatTokens(total)}</td>
                <td className="px-4 py-4 text-dash-ink">{formatCost(cost)}</td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-page">
                      <div
                        className={`h-full rounded-full ${
                          overBudget ? "bg-danger" : nearBudget ? "bg-[#e0873c]" : "bg-gradient-to-r from-brand-purple to-brand-blue"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        overBudget ? "text-danger" : nearBudget ? "text-[#e0873c]" : "text-muted"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs text-muted">{member.lastActive}</td>
                <td className="px-4 py-4">
                  <TrackingStatusBadge status={member.status} />
                </td>
                <td className="px-4 py-4">
                  <RolePill
                    role={member.role}
                    disabled={member.status === "removed"}
                    onChange={(role) => onRoleChange(member, role)}
                  />
                </td>
                <td className="px-4 py-4 text-right">
                  {member.status !== "removed" ? (
                    <button
                      type="button"
                      onClick={() => onRemove(member)}
                      className="inline-flex items-center rounded-full bg-danger/10 px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
                    >
                      Remove
                    </button>
                  ) : (
                    <span className="inline-flex cursor-not-allowed items-center rounded-full bg-page px-4 py-1.5 text-sm font-semibold text-muted">
                      Removed
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
