"use client";

import { useState } from "react";
import type { ClaudeUsageDailyPoint, ClaudeUsageMember } from "@/lib/admin/claudeUsage";

const PLOT_HEIGHT_PX = 180;
/** Px of surface between stacked segments — the spacer that separates them, never a stroke. */
const SEGMENT_GAP_PX = 2;

/**
 * Categorical slots, assigned in order and never cycled. The colours are CSS
 * variables (`--series-*`, globals.css) holding the dataviz reference palette,
 * with separately validated light and dark steps — so the chart is a selected
 * dark palette in dark mode, not light colours on a dark card. A 9th-and-beyond
 * reporter folds into "Other" rather than reusing an earlier person's colour,
 * which would make two teammates read as one series.
 */
const SERIES_VARS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--series-${n})`);
const MAX_SERIES = SERIES_VARS.length;
const OTHER_KEY = "__other__";

type Series = { key: string; label: string; color: string };

/** Named slots for the top reporting members (already sorted by total desc from
 *  the backend), plus one "Other" slot — built once so bars, tooltip and legend
 *  read the same mapping and can never disagree. */
function buildSeries(reportingMembers: ClaudeUsageMember[]): Series[] {
  const named: Series[] = reportingMembers.slice(0, MAX_SERIES).map((member, i) => ({
    key: member.id,
    label: member.displayName,
    color: SERIES_VARS[i]!,
  }));
  if (reportingMembers.length > MAX_SERIES) {
    named.push({ key: OTHER_KEY, label: "Other", color: "var(--series-other)" });
  }
  return named;
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

function formatDayLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** A clean axis: the smallest 1/2/2.5/5 × 10ⁿ step that covers `max` in at most
 *  four steps, so ticks read 0 / 500K / 1M / 1.5M rather than 0 / 437K / 874K. */
function niceTicks(max: number): number[] {
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(Math.max(rough, 1)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s * 4 >= max) ?? 10 * pow;
  const count = Math.max(1, Math.ceil(max / step));
  return Array.from({ length: count + 1 }, (_, i) => i * step);
}

/**
 * Daily tokens, stacked by teammate — plain HTML, no charting dependency.
 *
 * Built to the dataviz method (ADR-104 r2.10): every day in the range keeps
 * its slot, quiet ones included, so the time axis is honest; columns are at
 * most 24px with a 4px rounded top and a square baseline; stacked segments are
 * separated by a 2px surface gap; a recessive y-axis with clean ticks gives the
 * heights a scale; and each day is a hover/focus target whose tooltip lists the
 * total and every teammate's share. The legend sits below; the Per-user table
 * under this card is the table view.
 */
export function UsageChart({ data, members }: { data: ClaudeUsageDailyPoint[]; members: ClaudeUsageMember[] }) {
  const [active, setActive] = useState<number | null>(null);

  const hasUsage = data.some((point) => point.total > 0);
  if (!hasUsage) {
    return (
      <div className="rounded-lg bg-muted-surface px-4 py-8 text-center text-sm text-muted-foreground">
        No usage reported in this period.
      </div>
    );
  }

  const reportingMembers = members.filter((m) => data.some((point) => (point.byMember[m.id] ?? 0) > 0));
  const series = buildSeries(reportingMembers);
  const namedKeys = new Set(series.map((s) => s.key).filter((key) => key !== OTHER_KEY));

  const ticks = niceTicks(Math.max(...data.map((point) => point.total), 1));
  const scaleMax = ticks[ticks.length - 1]!;
  // At most ~8 date labels, so a 31-day month never collides.
  const labelEvery = Math.max(1, Math.ceil(data.length / 8));

  function valuesFor(point: ClaudeUsageDailyPoint): { series: Series; value: number }[] {
    const otherTotal = Object.entries(point.byMember)
      .filter(([memberId]) => !namedKeys.has(memberId))
      .reduce((sum, [, value]) => sum + value, 0);
    return series
      .map((s) => ({ series: s, value: s.key === OTHER_KEY ? otherTotal : (point.byMember[s.key] ?? 0) }))
      .filter((entry) => entry.value > 0);
  }

  const activePoint = active === null ? null : data[active];

  return (
    // `pt-3`: tick labels are centred on their gridlines, so the top one rises
    // half its height above the plot; without this room it ran into the
    // card's subtitle.
    <div className="pt-3">
      <div className="flex gap-2">
        {/* Y-axis: recessive, clean numbers, right-aligned to the plot. */}
        <div className="relative w-10 shrink-0" style={{ height: PLOT_HEIGHT_PX }} aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 text-[11px] tabular-nums text-muted-foreground"
              style={{ bottom: `${(tick / scaleMax) * 100}%` }}
            >
              {formatTokensShort(tick)}
            </span>
          ))}
        </div>

        <div className="relative min-w-0 flex-1">
          {/* Gridlines, behind the columns. The baseline is a touch stronger. */}
          <div className="pointer-events-none absolute inset-x-0 top-0" style={{ height: PLOT_HEIGHT_PX }} aria-hidden="true">
            {ticks.map((tick) => (
              <div
                key={tick}
                className={`absolute inset-x-0 h-px ${tick === 0 ? "bg-surface-border" : "bg-surface-border/60"}`}
                style={{ bottom: `${(tick / scaleMax) * 100}%` }}
              />
            ))}
          </div>

          <div className="relative flex" style={{ height: PLOT_HEIGHT_PX }} onMouseLeave={() => setActive(null)}>
            {data.map((point, index) => {
              const label = formatDayLabel(point.date);
              const entries = valuesFor(point);
              const barHeightPx = (point.total / scaleMax) * PLOT_HEIGHT_PX;
              const gaps = Math.max(0, entries.length - 1) * SEGMENT_GAP_PX;
              const fillPx = Math.max(0, barHeightPx - gaps);
              const isActive = active === index;
              return (
                // The whole column is the hit target — bigger than the bar, so
                // a thin or empty day is still easy to point at.
                <div
                  key={point.date}
                  role="img"
                  tabIndex={0}
                  aria-label={`${label}: ${point.total.toLocaleString()} tokens`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                  className={`flex h-full flex-1 items-end justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive ? "bg-muted-surface/70" : ""
                  }`}
                >
                  {entries.length > 0 && (
                    <div
                      className="flex w-[60%] max-w-6 min-w-1.5 flex-col-reverse overflow-hidden rounded-t-[4px]"
                      style={{ height: barHeightPx, gap: SEGMENT_GAP_PX }}
                    >
                      {entries.map(({ series: s, value }) => (
                        <div
                          key={s.key}
                          className="shrink-0"
                          style={{ height: (value / point.total) * fillPx, backgroundColor: s.color }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* One tooltip: the hovered or focused day. Values lead, names follow;
              text stays in text colours, a short line carries each identity. */}
          {activePoint && active !== null && (
            <div
              role="tooltip"
              className="pointer-events-none absolute z-10 min-w-44 rounded-xl border border-surface-border bg-popover px-3 py-2.5 text-popover-foreground shadow-md"
              style={{
                bottom: PLOT_HEIGHT_PX + 8 - Math.min(PLOT_HEIGHT_PX, (activePoint.total / scaleMax) * PLOT_HEIGHT_PX),
                ...(active / data.length < 0.25
                  ? { left: `${(active / data.length) * 100}%` }
                  : active / data.length > 0.75
                    ? { right: `${(1 - (active + 1) / data.length) * 100}%` }
                    : { left: `${((active + 0.5) / data.length) * 100}%`, transform: "translateX(-50%)" }),
              }}
            >
              <p className="text-xs text-muted-foreground">{formatDayLabel(activePoint.date)}</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {activePoint.total.toLocaleString()} <span className="font-normal text-muted-foreground">tokens</span>
              </p>
              {valuesFor(activePoint).length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-surface-border pt-2">
                  {valuesFor(activePoint)
                    .sort((a, b) => b.value - a.value)
                    .map(({ series: s, value }) => (
                      <li key={s.key} className="flex items-center gap-2 text-xs">
                        <span aria-hidden="true" className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="font-semibold tabular-nums text-foreground">{formatTokensShort(value)}</span>
                        <span className="truncate text-muted-foreground">{s.label}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          <div className="mt-2 flex" aria-hidden="true">
            {data.map((point, index) => (
              <span key={point.date} className="flex-1 text-center text-[11px] text-muted-foreground">
                {index % labelEvery === 0 ? formatDayLabel(point.date) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend — always present for two or more series; rects, matching the bars. */}
      {series.length > 1 && (
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-surface-border pt-3" aria-label="Teammates">
          {series.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color }} aria-hidden="true" />
              {s.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
