import { avatarColorFor, type ClaudeUsageDailyPoint, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";

const CHART_HEIGHT_PX = 160;

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
  const reportingMembers = members.filter((m) => data.some((point) => (point.byMember[m.id] ?? 0) > 0));
  const dayTotals = data.map((point) =>
    reportingMembers.reduce((sum, m) => sum + (point.byMember[m.id] ?? 0), 0),
  );
  const maxTotal = Math.max(...dayTotals, 1);

  return (
    <div>
      <div className="flex items-end justify-between gap-3 px-2 sm:gap-6">
        {data.map((point, dayIndex) => {
          const dayTotal = dayTotals[dayIndex] ?? 0;
          const barHeightPx = (dayTotal / maxTotal) * CHART_HEIGHT_PX;
          const label = formatDayLabel(point.date);

          return (
            <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex flex-col justify-end" style={{ height: CHART_HEIGHT_PX }}>
                <div
                  className="flex w-8 flex-col-reverse overflow-hidden rounded-t-md sm:w-10"
                  style={{ height: barHeightPx }}
                  role="img"
                  aria-label={`${label}: ${formatTokensShort(dayTotal)} tokens`}
                >
                  {reportingMembers.map((member, memberIndex) => {
                    const value = point.byMember[member.id] ?? 0;
                    if (value === 0) return null;
                    const segmentHeightPx = dayTotal > 0 ? (value / dayTotal) * barHeightPx : 0;
                    return (
                      <div
                        key={member.id}
                        style={{ height: segmentHeightPx, backgroundColor: avatarColorFor(memberIndex) }}
                        title={`${member.displayName}: ${formatTokensShort(value)} tokens`}
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
        {reportingMembers.map((member, index) => (
          <div key={member.id} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: avatarColorFor(index) }}
              aria-hidden="true"
            />
            {member.displayName}
          </div>
        ))}
      </div>
    </div>
  );
}
