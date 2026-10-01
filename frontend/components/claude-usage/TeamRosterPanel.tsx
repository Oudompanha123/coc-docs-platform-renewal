"use client";

import { useState } from "react";
import { type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { Pagination } from "@/components/users-roles/Pagination";
import { TrackingStatusBadge } from "./TrackingStatusBadge";

/**
 * Every roster member, independent of the selected Day/Week/Month period —
 * the counterpart to {@link BudgetOverridesPanel}, which already does the
 * same "always the full roster" thing for budget overrides. Needed because
 * "Per-user usage" (UsageTable) now shows only people who actually reported
 * in the selected period (reference-tool parity), so someone with zero
 * activity this period would otherwise have nowhere to be removed.
 */
export function TeamRosterPanel({
  members,
  onRemove,
}: {
  members: ClaudeUsageMember[];
  onRemove: (member: ClaudeUsageMember) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const roster = [...members].sort((a, b) => a.displayName.localeCompare(b.displayName));
  // Clamp here too, not just in <Pagination>: removing the last member on the
  // final page would otherwise slice past the end and show an empty list.
  const pageCount = Math.max(1, Math.ceil(roster.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = roster.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-dash-ink">Team roster</h2>
      <p className="text-xs text-muted">
        Everyone ever tracked, regardless of the period selected above — this is where to remove someone even
        if they haven&apos;t reported usage recently.
      </p>

      <div className="mt-4 divide-y divide-border">
        {visible.map((member) => (
          <div key={member.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dash-ink">{member.displayName}</p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <TrackingStatusBadge status={member.status} />
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
            </div>
          </div>
        ))}
      </div>

      {roster.length > 0 && (
        <div className="-mx-5 -mb-5 mt-2">
          <Pagination
            total={roster.length}
            page={current}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}
