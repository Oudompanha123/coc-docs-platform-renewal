"use client";

import { useState } from "react";
import { DEFAULT_SOFT_BUDGET_TOKENS, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { Pagination } from "@/components/users-roles/Pagination";

function formatDefault(n: number): string {
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * Per-person soft-budget override editor. The number typed here is a
 * weekly-equivalent figure — the backend scales it to whatever period
 * (Day/Week/Month) is currently selected, so the meaning of "budget" stays
 * consistent as the range switcher above is used (ADR-035 decision 5).
 *
 * Saved on blur/Enter rather than on every keystroke, so a half-typed number
 * is never sent as a real override.
 */
export function BudgetOverridesPanel({
  members,
  onOverrideChange,
}: {
  members: ClaudeUsageMember[];
  onOverrideChange: (member: ClaudeUsageMember, tokens: number | null) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const reporting = members.filter((m) => m.status !== "removed");
  // Clamp here too, not just in <Pagination>: removing someone on the final
  // page would otherwise slice past the end and show an empty list.
  const pageCount = Math.max(1, Math.ceil(reporting.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = reporting.slice((current - 1) * pageSize, current * pageSize);

  function commit(member: ClaudeUsageMember, raw: string) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
    if (next === (member.budgetOverrideTokens ?? null)) return;
    onOverrideChange(member, next);
  }

  return (
    <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-dash-ink">Soft budget overrides</h2>
      <p className="text-xs text-muted">
        Default is {formatDefault(DEFAULT_SOFT_BUDGET_TOKENS)} tokens per person, per week. Set a number
        below to override just that person — it scales automatically for whichever period is selected above.
      </p>

      <div className="mt-4 divide-y divide-border">
        {visible.map((member) => (
          <div key={member.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dash-ink">{member.displayName}</p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={100_000}
                step={100_000}
                defaultValue={member.budgetOverrideTokens ?? ""}
                key={`${member.id}-${member.budgetOverrideTokens ?? "default"}`}
                onBlur={(e) => commit(member, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                }}
                placeholder={`Default (${formatDefault(DEFAULT_SOFT_BUDGET_TOKENS)})`}
                className="w-44 rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              <span className="text-xs text-muted">tokens / week</span>
            </div>
          </div>
        ))}
      </div>

      {reporting.length > 0 && (
        <div className="-mx-5 -mb-5 mt-2">
          <Pagination
            total={reporting.length}
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
