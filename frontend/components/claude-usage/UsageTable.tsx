"use client";

import { useState } from "react";
import { avatarColorFor, formatLastActive, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { Pagination } from "@/components/users-roles/Pagination";
import { UserAvatar } from "@/components/layout/UserAvatar";

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
 *  per-user token/cost/soft-budget data. Every figure here (totals, cost,
 *  budgetPct) is read straight off the API's period rollup, not recomputed
 *  client-side — the scaling that budgetPct depends on lives server-side.
 *
 *  Reference-tool parity: only people who actually reported tokens in the
 *  selected period appear here, same as the original tool's UserTable —
 *  someone tracked but quiet this period simply isn't a row. Remove and the
 *  soft-budget override live in the row's detail popup (UserActivityModal). */
export function UsageTable({
  members,
  emptyMessage = "No usage reported by anyone in this period.",
  onSelect,
}: {
  members: ClaudeUsageMember[];
  emptyMessage?: string;
  /** When given, a row opens that member's detail; the color is the avatar fill this row used, so the detail matches. */
  onSelect?: (member: ClaudeUsageMember, avatarColor: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Heaviest users first; ties go to whoever was active most recently.
  const reporting = members
    .filter((m) => m.totalTokens > 0)
    .sort(
      (a, b) =>
        b.totalTokens - a.totalTokens ||
        (Date.parse(b.lastActiveAt ?? "") || 0) - (Date.parse(a.lastActiveAt ?? "") || 0),
    );
  // Clamp here too, not just in <Pagination>: switching to a period with fewer
  // reporters would otherwise slice past the end and show an empty table.
  const pageCount = Math.max(1, Math.ceil(reporting.length / pageSize));
  const current = Math.min(page, pageCount);
  const offset = (current - 1) * pageSize;
  const visible = reporting.slice(offset, offset + pageSize);

  if (reporting.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-page px-4 py-8 text-center text-sm text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border">
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Models Used</th>
              <th className="px-4 py-3">Input / Output</th>
              <th className="px-4 py-3">Total Tokens</th>
              <th className="px-4 py-3">Cost</th>
              <th className="px-4 py-3">Soft Budget</th>
              {/* last_scan_at -- the reporter's last check-in, with or without new tokens (ADR-097). */}
              <th className="px-4 py-3">Last Scan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((member, index) => {
              const pct = member.budgetPct;
              const isAmber = member.budgetStatus === "amber";
              const isRed = member.budgetStatus === "red";
              const select = onSelect ? () => onSelect(member, avatarColorFor(offset + index)) : undefined;

              return (
                <tr
                  key={member.id}
                  onClick={select}
                  onKeyDown={
                    select
                      ? (event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            select();
                          }
                        }
                      : undefined
                  }
                  tabIndex={select ? 0 : undefined}
                  aria-label={select ? `View activity for ${member.displayName}` : undefined}
                  className={`transition-colors hover:bg-[#f8fafc] ${
                    select ? "cursor-pointer focus-visible:bg-[#f8fafc] focus-visible:outline-none" : ""
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={member.avatarUrl}
                        name={member.displayName}
                        initials={member.displayName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                        className="h-10 w-10 !text-sm shadow-sm"
                        style={{ backgroundColor: avatarColorFor(offset + index) }}
                      />
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate font-semibold text-dash-ink">
                          {member.displayName}
                          {/* Budget status (green/amber/red), never a roster/tracking status --
                              a nudge to hand off work before hitting the wall. */}
                          {isRed && (
                            <span className="shrink-0 rounded-full bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                              Hand off
                            </span>
                          )}
                        </p>
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
                  <td className="px-4 py-4 font-semibold text-dash-ink">{formatTokens(member.totalTokens)}</td>
                  <td className="px-4 py-4 text-dash-ink">{formatCost(member.costUsd)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-page">
                        <div
                          className={`h-full rounded-full ${isRed ? "bg-danger" : isAmber ? "bg-[#e0873c]" : "bg-[#1f9d6b]"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-xs font-semibold ${isRed ? "text-danger" : isAmber ? "text-[#e0873c]" : "text-muted"}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs text-muted">
                    {/* One time only: the reporter's last check-in, which moves even when nothing
                        new was uploaded — an upload touches it too (ADR-097). */}
                    {member.lastScanAt ? formatLastActive(member.lastScanAt) : "No scan recorded"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Pagination
        total={reporting.length}
        page={current}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
