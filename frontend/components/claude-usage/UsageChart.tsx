import type { ClaudeUsageDailyPoint, ClaudeUsageMember } from "@/lib/admin/claudeUsage";

const CHART_HEIGHT_PX = 160;

/**
 * Fixed categorical slots, assigned in order and never cycled — restores the
 * reference tool's `lib/usage` chart palette (`usage.css` --u-series-1..8).
 * A 9th-and-beyond reporter folds into {@link OTHER_KEY} rather than reusing
 * an earlier person's colour, which would make two different teammates read
 * as the same series in the stack and the legend.
 */
const CHART_PALETTE = ["#4a3aa7", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#2a78d6", "#e34948"] as const;
const MAX_SERIES = CHART_PALETTE.length;
const OTHER_COLOR = "#8b8b9c";
const OTHER_KEY = "__other__";

type Series = { key: string; label: string; color: string };

/** Named slots for the top `MAX_SERIES` reporting members (already sorted by
 *  total desc from the backend), plus one "Other" slot summing the rest —
 *  built once so the stacked bars and the legend below read off the exact
 *  same mapping and can never disagree with each other. */
function buildSeries(reportingMembers: ClaudeUsageMember[]): Series[] {
  const named: Series[] = reportingMembers.slice(0, MAX_SERIES).map((member, i) => ({
    key: member.id,
    label: member.displayName,
    color: CHART_PALETTE[i]!,
  }));
  if (reportingMembers.length > MAX_SERIES) {
    named.push({ key: OTHER_KEY, label: "Other", color: OTHER_COLOR });
  }
  return named;
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

/** Short label for one point on the x-axis. A weekday name only reads well
 *  for a 7-point week; a day or month view can be 1 or up to 31 points, so
 *  every period uses the same "Sep 17" short-date form instead. */
function formatDayLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Pure CSS/HTML stacked bar chart — no charting dependency. Bar and segment
 *  heights are computed in px (not %) since these bars sit inside a flex
 *  column whose height is content-driven, where percentage heights would be
 *  ambiguous; explicit px keeps the math (and verification) unambiguous. */
export function UsageChart({ data, members }: { data: ClaudeUsageDailyPoint[]; members: ClaudeUsageMember[] }) {
  // Only days that actually have tokens get a column -- a quiet day (point.total
  // === 0, straight from the backend's own per-day rollup) is skipped entirely
  // rather than rendered as an empty/invisible placeholder.
  const activeDays = data.filter((point) => point.total > 0);

  if (activeDays.length === 0) {
    return (
      <div className="rounded-[10px] border border-border bg-page px-4 py-8 text-center text-sm text-muted">
        No usage reported in this period.
      </div>
    );
  }

  const reportingMembers = members.filter((m) => activeDays.some((point) => (point.byMember[m.id] ?? 0) > 0));
  const series = buildSeries(reportingMembers);
  const namedKeys = new Set(series.map((s) => s.key).filter((key) => key !== OTHER_KEY));

  const maxTotal = Math.max(...activeDays.map((point) => point.total), 1);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 px-2 sm:gap-6">
        {activeDays.map((point) => {
          const dayTotal = point.total;
          const barHeightPx = (dayTotal / maxTotal) * CHART_HEIGHT_PX;
          const label = formatDayLabel(point.date);

          // Fold whichever reporters didn't get a named slot into "Other", so a
          // colour always means the same person from one day to the next.
          const otherTotal = Object.entries(point.byMember)
            .filter(([memberId]) => !namedKeys.has(memberId))
            .reduce((sum, [, value]) => sum + value, 0);

          return (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex flex-col justify-end" style={{ height: CHART_HEIGHT_PX }}>
                <div
                  className="flex w-8 flex-col-reverse overflow-hidden rounded-t-md sm:w-10"
                  style={{ height: barHeightPx }}
                  role="img"
                  aria-label={`${label}: ${formatTokensShort(dayTotal)} tokens`}
                >
                  {series.map((s) => {
                    const value = s.key === OTHER_KEY ? otherTotal : (point.byMember[s.key] ?? 0);
                    if (value === 0) return null;
                    const segmentHeightPx = dayTotal > 0 ? (value / dayTotal) * barHeightPx : 0;
                    return (
                      <div
                        key={s.key}
                        style={{ height: segmentHeightPx, backgroundColor: s.color }}
                        title={`${s.label}: ${formatTokensShort(value)} tokens`}
                      />
                    );
                  })}
                </div>
              </div>
              <span className="text-xs font-medium text-muted">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
