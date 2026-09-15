import { CodeBlock } from "./CodeBlock";
import { WarningIcon } from "@/components/layout/icons";
import { DEFAULT_SOFT_BUDGET_TOKENS, type TeamMember } from "@/lib/mock/claude-usage";

function formatDefault(n: number): string {
  return `${(n / 1_000_000).toFixed(1)}M`;
}

/** Per-person soft-budget override editor + a copy-able USER_BUDGETS snippet.
 *  There's no live-writable backend here (mock-data-only, same as every other
 *  page in this frontend) — so, like the reference tool's own Vercel-env-var
 *  path, applying an override means copying this into wherever a real usage
 *  reporter reads USER_BUDGETS from, then redeploying it. */
export function BudgetOverridesPanel({
  members,
  onOverrideChange,
}: {
  members: TeamMember[];
  onOverrideChange: (member: TeamMember, tokens: number | undefined) => void;
}) {
  const reporting = members.filter((m) => m.status !== "removed");
  const overridden = reporting.filter((m) => m.budgetOverrideTokens !== undefined);

  const snippet =
    overridden.length > 0
      ? `USER_BUDGETS=${JSON.stringify(
          Object.fromEntries(overridden.map((m) => [m.email, m.budgetOverrideTokens])),
        )}`
      : `USER_BUDGETS={}`;

  return (
    <div className="mt-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h2 className="text-sm font-bold text-dash-ink">Soft budget overrides</h2>
      <p className="text-xs text-muted">
        Default is {formatDefault(DEFAULT_SOFT_BUDGET_TOKENS)} tokens per person. Set a number below to
        override just that person.
      </p>

      <div className="mt-4 divide-y divide-border">
        {reporting.map((member) => (
          <div key={member.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-dash-ink">{member.name}</p>
              <p className="truncate text-xs text-muted">{member.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step={100_000}
                value={member.budgetOverrideTokens ?? ""}
                onChange={(e) => {
                  const raw = e.target.value;
                  onOverrideChange(member, raw === "" ? undefined : Number(raw));
                }}
                placeholder={`Default (${formatDefault(DEFAULT_SOFT_BUDGET_TOKENS)})`}
                className="w-44 rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              <span className="text-xs text-muted">tokens</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
        <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
        <p className="text-sm text-dash-ink">
          Changing a number above doesn&apos;t apply anywhere by itself — Coc Docs Platform has no live
          usage-reporting backend. Copy the snippet below into your own reporting tool&apos;s{" "}
          <code className="rounded bg-page px-1 py-0.5 font-mono text-xs">USER_BUDGETS</code> environment
          variable and redeploy it for the override to take effect there.
        </p>
      </div>

      <div className="mt-4">
        <CodeBlock label="USER_BUDGETS" code={snippet} />
      </div>
    </div>
  );
}
