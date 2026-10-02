import type { HrmsAttendanceCheck, HrmsAttendanceRow } from "@/lib/notify/activity";

/**
 * HRMS's own status text, bucketed into the four visual kinds this page
 * distinguishes — a substring match, not an exact-value map, since HRMS's own
 * wording is passed through unchanged elsewhere in this app (see
 * HrmsMailContent.java's own doc comment) and a status this build has never
 * seen before must still render as *something* honest rather than being
 * silently mislabeled "Normal". "missed" is checked first: "Missed Check-In"
 * would otherwise also match a naive "check-in" test.
 */
export type StatusKind = "normal" | "late" | "missed" | "other";

export function statusKind(status: string): StatusKind {
  const s = status.toLowerCase();
  if (s.includes("missed")) return "missed";
  if (s.includes("late")) return "late";
  if (s.includes("normal")) return "normal";
  return "other";
}

/**
 * `"00:00"` is HRMS's own literal string for "never happened" (see
 * HrmsMailContent.java's Entry doc comment); an empty string is this app's
 * own parser-couldn't-read-this-cell fallback. Both mean the same thing to a
 * viewer: nothing to show. Returns null for either, so the caller renders
 * `--:--` instead of a misleading `00:00`.
 */
export function actualTimeOrNull(check: HrmsAttendanceCheck): string | null {
  const actual = check.actual.trim();
  return actual === "" || actual === "00:00" ? null : actual;
}

/**
 * Minutes between a scheduled and actual `"HH:MM"` time, clamped to zero
 * rather than ever going negative — this describes how late a logged check
 * was on the personal Attendance page ("5 min late"), not a general time
 * delta, so an actual time earlier than scheduled (an early check-in) reads
 * as 0, not a negative number. Returns null when either string isn't a
 * parseable 24-hour `"HH:MM"`.
 */
export function minutesLate(scheduled: string, actual: string): number | null {
  const toMinutes = (value: string): number | null => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) return null;
    const hours = Number(match[1]);
    const mins = Number(match[2]);
    if (hours > 23 || mins > 59) return null;
    return hours * 60 + mins;
  };
  const start = toMinutes(scheduled);
  const end = toMinutes(actual);
  if (start === null || end === null) return null;
  return Math.max(0, end - start);
}

/**
 * The rows a name search matches — shared by {@link AttendanceTable}'s own
 * filtering and the Export button, so a file downloaded mid-search cannot
 * hold more than the table beside it shows (same reasoning as
 * `export-users.ts`'s own filtered export).
 */
export function filterAttendanceRows(rows: HrmsAttendanceRow[], search: string): HrmsAttendanceRow[] {
  const q = search.trim().toLowerCase();
  return q.length === 0 ? rows : rows.filter((r) => r.name.toLowerCase().includes(q));
}

export interface AttendanceStats {
  totalScheduled: number;
  onTime: number;
  onTimePct: number;
  lateCheckIn: number;
  lateCheckInPct: number;
  missedCheckIn: number;
  missedCheckOut: number;
  missedLogs: number;
}

/**
 * Every card on the page is a count over `rows`, computed here rather than
 * trusted from anywhere else — never hard-coded, per the task's own
 * acceptance criteria. "On time"/"late"/"missed check-in" are read from each
 * row's TODAY CHECK-IN status only (not yesterday's check-out) — confirmed
 * against the reference mockup's own numbers, where On Time + Late Check-In +
 * Missed Check-In sums to Total Scheduled exactly. "Missed Logs" is the
 * separate, wider count spanning both check-out and check-in misses.
 */
export function computeAttendanceStats(rows: HrmsAttendanceRow[]): AttendanceStats {
  const totalScheduled = rows.length;
  let onTime = 0;
  let lateCheckIn = 0;
  let missedCheckIn = 0;
  let missedCheckOut = 0;

  for (const row of rows) {
    switch (statusKind(row.todayCheckIn.status)) {
      case "normal":
        onTime++;
        break;
      case "late":
        lateCheckIn++;
        break;
      case "missed":
        missedCheckIn++;
        break;
      case "other":
        break;
    }
    if (statusKind(row.yesterdayCheckOut.status) === "missed") {
      missedCheckOut++;
    }
  }

  const pct = (count: number) => (totalScheduled === 0 ? 0 : Math.round((count / totalScheduled) * 100));

  return {
    totalScheduled,
    onTime,
    onTimePct: pct(onTime),
    lateCheckIn,
    lateCheckInPct: pct(lateCheckIn),
    missedCheckIn,
    missedCheckOut,
    missedLogs: missedCheckIn + missedCheckOut,
  };
}
