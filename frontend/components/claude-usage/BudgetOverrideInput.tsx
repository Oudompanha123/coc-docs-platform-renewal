"use client";

import { DEFAULT_SOFT_BUDGET_TOKENS, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";

export function formatDefaultBudget(n: number = DEFAULT_SOFT_BUDGET_TOKENS): string {
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/**
 * One person's soft-budget override. The number is a weekly-equivalent figure
 * — the backend scales it to the selected Day/Week/Month (ADR-035 decision 5).
 * Empty means "use the team default".
 *
 * Saved on blur/Enter rather than on every keystroke, so a half-typed number
 * is never sent as a real override. Lives in the user detail popup
 * (UserActivityModal), the only place a budget is set.
 */
export function BudgetOverrideInput({
  member,
  onChange,
}: {
  member: ClaudeUsageMember;
  onChange: (member: ClaudeUsageMember, tokens: number | null) => void;
}) {
  function commit(raw: string) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
    if (next === (member.budgetOverrideTokens ?? null)) return;
    onChange(member, next);
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={100_000}
        step={100_000}
        aria-label={`Soft budget for ${member.displayName}, tokens per week`}
        defaultValue={member.budgetOverrideTokens ?? ""}
        // Remounts with the saved value once the dashboard reloads.
        key={`${member.id}-${member.budgetOverrideTokens ?? "default"}`}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        placeholder={`Default (${formatDefaultBudget()})`}
        className="w-44 rounded-xl border border-muted/40 bg-white px-3 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring"
      />
      <span className="text-xs text-muted">tokens / week</span>
    </div>
  );
}
