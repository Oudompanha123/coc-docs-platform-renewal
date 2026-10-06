const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** yyyy-MM-dd, in the viewer's own local calendar day — not UTC, so "today" matches the clock on their machine. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toIsoDate(new Date());
}

/** Parses an ISO `yyyy-MM-dd` as a local date (never via `new Date(iso)`, which reads it as UTC midnight and can land on the wrong local day). */
function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

export function addDays(iso: string, delta: number): string {
  const d = parseIsoDate(iso);
  d.setDate(d.getDate() + delta);
  return toIsoDate(d);
}

/** `07-Sep-2026`, matching the reference mockup's date display. */
export function formatDisplayDate(iso: string): string {
  const d = parseIsoDate(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS[d.getMonth()] ?? "";
  return `${day}-${month}-${d.getFullYear()}`;
}

// Date#getDay() order (0=Sun..6=Sat) — deliberately not Monday-first like
// buildMonthGrid's own weekday handling, since this indexes getDay() directly.
const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** `Tue, 22 Sep` — the middle Today/date button's label once the selected date isn't today. */
export function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  const weekday = WEEKDAY_ABBR[d.getDay()] ?? "";
  const month = MONTHS[d.getMonth()] ?? "";
  return `${weekday}, ${d.getDate()} ${month}`;
}

const FULL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** month is 0-11, matching `Date#getMonth()`. */
export interface YearMonth {
  year: number;
  month: number;
}

export function yearMonthOf(iso: string): YearMonth {
  const d = parseIsoDate(iso);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function addMonths({ year, month }: YearMonth, delta: number): YearMonth {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

/** `September 2026`, for the date picker popup's header. */
export function monthLabel({ year, month }: YearMonth): string {
  return `${FULL_MONTHS[month] ?? ""} ${year}`;
}

/**
 * True if `iso` is strictly after today's local calendar date. ISO
 * `yyyy-MM-dd` strings compare lexicographically in the same order as
 * calendar order, so this needs no `Date` math at all.
 */
export function isFutureDate(iso: string): boolean {
  return iso > todayIso();
}

/**
 * Every ISO date from `a` to `b` inclusive, in calendar order regardless of
 * which argument comes first — backs the calendar popup's mouse-drag select,
 * where the pointer can move either direction from where the drag started.
 */
export function isoRangeBetween(a: string, b: string): string[] {
  const [start, end] = a <= b ? [a, b] : [b, a];
  const days: string[] = [];
  for (let cur = start; cur <= end; cur = addDays(cur, 1)) {
    days.push(cur);
  }
  return days;
}

/**
 * The Monday–Sunday week containing `iso` — this codebase's own week-start
 * convention (matching {@link buildMonthGrid}'s Monday-first grid, not a
 * Sunday-start assumption). Used only to decorate the calendar popup's Week
 * mode with a row highlight; nothing here changes what date is fetched.
 */
export function weekRangeOf(iso: string): { start: string; end: string } {
  const d = parseIsoDate(iso);
  const mondayOffset = (d.getDay() + 6) % 7; // Date#getDay(): 0=Sun..6=Sat, shifted to 0=Mon..6=Sun
  const start = new Date(d);
  start.setDate(d.getDate() - mondayOffset);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toIsoDate(start), end: toIsoDate(end) };
}

/**
 * A Monday-first grid of ISO dates for one month — `null` for the leading
 * blank cells before the 1st. Just enough cells to cover the month itself;
 * no trailing days borrowed from next month, which the task's own "day
 * grid" wording doesn't ask for.
 */
export function buildMonthGrid({ year, month }: YearMonth): (string | null)[] {
  const first = new Date(year, month, 1);
  // Date#getDay(): 0=Sun..6=Sat. Shift to Monday-first: 0=Mon..6=Sun.
  const leading = (first.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: leading }, () => null);
  for (let day = 1; day <= totalDays; day++) {
    cells.push(toIsoDate(new Date(year, month, day)));
  }
  return cells;
}
