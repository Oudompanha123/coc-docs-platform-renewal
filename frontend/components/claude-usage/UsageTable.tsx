"use client";

import { useState } from "react";
import { avatarColorFor, formatLastActive, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { Pagination } from "@/components/users-roles/Pagination";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatCost(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** The compact shadcn table parts (ADR-104 r2.9), flush inside the caller's
 *  card — the same parts as users-roles/AccountsTable.tsx, different columns for this page's
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
      <div className="mx-4 mb-4 rounded-lg bg-muted-surface px-4 py-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div>
      <Table className="min-w-[820px]" containerClassName="border-t border-surface-border">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Person</TableHead>
            <TableHead>Models Used</TableHead>
            <TableHead>Input / Output</TableHead>
            <TableHead>Total Tokens</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Soft Budget</TableHead>
            {/* last_scan_at -- the reporter's last check-in, with or without new tokens (ADR-097). */}
            <TableHead className="pr-4">Last Scan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((member, index) => {
            const pct = member.budgetPct;
            const isAmber = member.budgetStatus === "amber";
            const isRed = member.budgetStatus === "red";
            const select = onSelect ? () => onSelect(member, avatarColorFor(offset + index)) : undefined;

            return (
              <TableRow
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
                className={select ? "cursor-pointer focus-visible:bg-muted-surface/50 focus-visible:outline-none" : undefined}
              >
                <TableCell className="pl-4">
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
                      className="size-8 !text-xs"
                      style={{ backgroundColor: avatarColorFor(offset + index) }}
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate font-medium text-foreground">
                        {member.displayName}
                        {/* Budget status (green/amber/red), never a roster/tracking status --
                            a nudge to hand off work before hitting the wall. */}
                        {isRed && (
                          <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                            Hand off
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {member.modelsUsed.length > 0 ? member.modelsUsed.join(", ") : "—"}
                </TableCell>
                <TableCell>
                  <p className="tabular-nums text-foreground">{formatTokens(member.inputTokens)} in</p>
                  <p className="text-xs tabular-nums text-muted-foreground">{formatTokens(member.outputTokens)} out</p>
                </TableCell>
                <TableCell className="font-medium tabular-nums text-foreground">{formatTokens(member.totalTokens)}</TableCell>
                <TableCell className="tabular-nums text-foreground">{formatCost(member.costUsd)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted-surface">
                      <div
                        className={`h-full rounded-full ${isRed ? "bg-destructive" : isAmber ? "bg-[#e0873c]" : "bg-[#1f9d6b]"}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium tabular-nums ${isRed ? "text-destructive" : isAmber ? "text-[#e0873c]" : "text-muted-foreground"}`}
                    >
                      {pct}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap pr-4 text-xs text-muted-foreground">
                  {/* One time only: the reporter's last check-in, which moves even when nothing
                      new was uploaded — an upload touches it too (ADR-097). */}
                  {member.lastScanAt ? formatLastActive(member.lastScanAt) : "No scan recorded"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

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
