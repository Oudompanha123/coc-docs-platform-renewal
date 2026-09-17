import { CheckCircleIcon } from "@/components/layout/icons";
import { DEFAULT_SOFT_BUDGET_TOKENS, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";

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
  const reporting = members.filter((m) => m.status !== "removed");

  function commit(member: ClaudeUsageMember, raw: string) {
    const trimmed = raw.trim();
    const next = trimmed === "" ? null : Number(trimmed);
    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
    if (next === (member.budgetOverrideTokens ?? null)) return;
    onOverrideChange(member, next);
  }

  return (
    <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-dash-ink">Soft budget overrides</h2>
      <p className="text-xs text-muted">
        Default is {formatDefault(DEFAULT_SOFT_BUDGET_TOKENS)} tokens per person, per week. Set a number
        below to override just that person — it scales automatically for whichever period is selected above.
      </p>

      <div className="mt-4 divide-y divide-border">
        {reporting.map((member) => (
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

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
        <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
        <p className="text-sm text-dash-ink">
          Overrides take effect immediately across this dashboard — there is nothing else to configure or
          redeploy.
        </p>
      </div>
    </div>
  );
}
