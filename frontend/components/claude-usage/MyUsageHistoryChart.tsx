import type { MyClaudeUsagePoint } from "@/lib/claudeUsage/myUsage";

const CHART_HEIGHT_PX = 180;
const INPUT_COLOR = "#6d3ce0"; // brand-purple
const OUTPUT_COLOR = "#4c6ff0"; // brand-blue


function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatDayLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * The caller's own daily history (ADR-052) — a single-caller sibling of the
 * admin dashboard's `UsageChart`, stacking input/output instead of
 * per-teammate segments, since there is only ever one person's data here.
 *
 * Draws only days that have usage, like the admin chart — zero-token days are
 * dropped rather than shown as empty stubs (on direct developer instruction).
 */
export function MyUsageHistoryChart({ data: allDays, today }: { data: MyClaudeUsagePoint[]; today?: string }) {
  const data = allDays.filter((point) => point.totalTokens > 0);

  if (data.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-page px-4 py-8 text-center text-sm text-muted">
        No usage reported in the last 30 days.
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((point) => point.totalTokens), 1);
  const midLabel = formatTokensShort(Math.round(maxTotal / 2));
  const maxLabel = formatTokensShort(maxTotal);

  return (
    <div>
      <div className="flex gap-2">
        {/* Y-axis: three reference ticks, not a real scale to snap to — just
            enough to read a bar's rough size at a glance. */}
        <div
          className="flex shrink-0 flex-col justify-between pb-5 text-right text-[10px] font-medium text-muted"
          style={{ height: CHART_HEIGHT_PX }}
        >
          <span>{maxLabel}</span>
          <span>{midLabel}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div
            className="relative flex items-end gap-1 border-l border-border pl-2 sm:gap-1.5"
            style={{ height: CHART_HEIGHT_PX }}
          >
            {/* Dashed reference lines, behind the bars. */}
            <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-border/70" />
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/70"
              style={{ top: CHART_HEIGHT_PX / 2 }}
            />

            {data.map((point) => {
              const isToday = today != null && point.date === today;
              const totalHeightPx = Math.max((point.totalTokens / maxTotal) * (CHART_HEIGHT_PX - 4), 3);
              const inputHeightPx = (point.inputTokens / point.totalTokens) * totalHeightPx;
              const outputHeightPx = totalHeightPx - inputHeightPx;
              const label = formatDayLabel(point.date);

              return (
                // Every bar is labelled; the min width keeps "Sep 30" from overlapping
                // its neighbour, and the wrapper scrolls sideways when 30 won't fit.
                <div key={point.date} className="z-10 flex min-w-[2.25rem] flex-1 flex-col items-center gap-1.5">
                  <div className="flex flex-col justify-end" style={{ height: CHART_HEIGHT_PX - 4 }}>
                    <div
                      className="flex w-4 flex-col-reverse overflow-hidden rounded-t-sm sm:w-6"
                      style={{ height: totalHeightPx }}
                      role="img"
                      aria-label={`${label}${isToday ? " (today)" : ""}: ${formatTokensShort(point.totalTokens)} tokens`}
                      title={`${label}${isToday ? " · Today" : ""}\n${formatTokensShort(point.inputTokens)} input · ${formatTokensShort(point.outputTokens)} output`}
                    >
                      <div style={{ height: inputHeightPx, backgroundColor: INPUT_COLOR }} />
                      <div style={{ height: outputHeightPx, backgroundColor: OUTPUT_COLOR }} />
                    </div>
                  </div>
                  <span
                    className={`h-3 whitespace-nowrap text-[9px] font-medium sm:text-[10px] ${
                      isToday ? "font-bold text-brand-purple" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: INPUT_COLOR }} aria-hidden="true" />
          Input tokens
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: OUTPUT_COLOR }} aria-hidden="true" />
          Output tokens
        </div>
      </div>
    </div>
  );
}
