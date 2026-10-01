/**
 * Date-range presets and display helpers for the admin User Activity detail
 * (ADR-074). Pure, so the range arithmetic is tested on its own rather than
 * through the modal.
 *
 * // req: FR-USAGE-001, ADR-074
 */

/** Must agree with the backend's REPORT_ZONE and the reporter's REPORT_TZ — "today" is the team's day, not the viewer's. */
export const REPORT_TZ = "Asia/Phnom_Penh";

export type ActivityPreset = "today" | "7d" | "30d" | "custom";

export const ACTIVITY_PRESETS: { value: ActivityPreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom" },
];

const ymdFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: REPORT_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** The calendar date of `at` in the team's reporting zone, as YYYY-MM-DD. */
export function reportDate(at: Date = new Date()): string {
  return ymdFormatter.format(at);
}

/** YYYY-MM-DD minus `days` whole days — calendar arithmetic, immune to DST. */
export function minusDays(date: string, days: number): string {
  const [y = 0, m = 1, d = 1] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - days)).toISOString().slice(0, 10);
}

/**
 * The inclusive `{ from, to }` a preset covers, ending today. `custom` uses
 * the dates given, swapped if entered backwards, or null until both exist.
 */
export function presetRange(
  preset: ActivityPreset,
  today: string,
  custom?: { from: string; to: string },
): { from: string; to: string } | null {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: minusDays(today, 6), to: today };
    case "30d":
      return { from: minusDays(today, 29), to: today };
    case "custom":
      if (!custom?.from || !custom?.to) return null;
      return custom.from <= custom.to ? custom : { from: custom.to, to: custom.from };
  }
}

/** 0 → "0m", 59 → "<1m", 1620 → "27m", 5880 → "1h 38m", 7200 → "2h". Null (not reported) → "—". */
export function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds <= 0) return "0m";
  if (seconds < 60) return "<1m";
  const minutes = Math.round(seconds / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** A count that may not have been reported: null → "—", never "0". */
export function formatCount(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("en-US");
}

/**
 * The largest `limit` projects by total tokens, plus one "N more" row holding
 * the rest — for the token bars, which stay readable at five or six rows.
 * Input is assumed sorted largest first (the API's order).
 */
export function topProjects<T extends { name: string; totalTokens: number }>(
  projects: T[],
  limit = 5,
): { name: string; totalTokens: number; rest: boolean }[] {
  const head = projects.slice(0, limit).map((p) => ({ name: p.name, totalTokens: p.totalTokens, rest: false }));
  const tail = projects.slice(limit);
  if (tail.length === 0) return head;
  return [
    ...head,
    {
      name: `${tail.length} more ${tail.length === 1 ? "project" : "projects"}`,
      totalTokens: tail.reduce((sum, p) => sum + p.totalTokens, 0),
      rest: true,
    },
  ];
}
