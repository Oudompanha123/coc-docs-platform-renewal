import { toIsoDate } from "@/lib/attendance/dates";

/**
 * The editor's expiry field, as plain functions (ADR-098).
 *
 * <p>The API speaks ISO instants; the field speaks a local calendar day plus a
 * local wall-clock time, because that is what an admin means by "Friday at
 * 18:00". Getting either direction wrong moves an announcement's expiry by
 * the reader's UTC offset — seven hours, here — so the conversions live here,
 * tested, rather than inline in a component.
 */

/** The quick choices above the date. `custom` is "Pick a date"; a preset becomes a concrete date the moment it is chosen. */
export type ExpiryChoice = "none" | "1d" | "7d" | "30d" | "custom";

export const EXPIRY_CHOICES: { key: ExpiryChoice; label: string }[] = [
  { key: "none", label: "No expiry" },
  { key: "1d", label: "1 day" },
  { key: "7d", label: "1 week" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Pick a date" },
];

const PRESET_DAYS: Record<"1d" | "7d" | "30d", number> = { "1d": 1, "7d": 7, "30d": 30 };

/** Times offered in the time select: every half hour. */
const STEP_MINUTES = 30;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** `now` plus the preset's days, rounded up to the next half hour so the summary reads "18:30", not "18:07". */
export function presetExpiry(preset: "1d" | "7d" | "30d", now: Date = new Date()): string {
  const at = new Date(now);
  at.setDate(at.getDate() + PRESET_DAYS[preset]);
  at.setSeconds(0, 0);
  const remainder = at.getMinutes() % STEP_MINUTES;
  if (remainder !== 0) at.setMinutes(at.getMinutes() + STEP_MINUTES - remainder);
  return at.toISOString();
}

/** ISO instant → local `{ date: "yyyy-MM-dd", time: "HH:mm" }`; null for unparseable. */
export function splitExpiry(iso: string): { date: string; time: string } | null {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return null;
  return { date: toIsoDate(at), time: `${pad(at.getHours())}:${pad(at.getMinutes())}` };
}

/** Local `yyyy-MM-dd` + `HH:mm` → ISO instant; null for unparseable. */
export function joinExpiry(date: string, time: string): string | null {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if ([y, m, d, hh, mm].some((n) => n === undefined || Number.isNaN(n))) return null;
  const at = new Date(y!, m! - 1, d!, hh!, mm!);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/**
 * Every half hour of the day, `00:00` … `23:30`. `include` adds one more —
 * an existing announcement saved at 18:07 must still show 18:07 rather than
 * silently snapping to a neighbour the admin never chose.
 */
export function timeOptions(include?: string): string[] {
  const times: string[] = [];
  for (let minutes = 0; minutes < 24 * 60; minutes += STEP_MINUTES) {
    times.push(`${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`);
  }
  if (include && !times.includes(include)) times.push(include);
  return times.sort();
}

/** "in 45 minutes", "in 5 hours", "in 3 days" — or "already passed". */
export function relativeExpiry(iso: string, now: Date = new Date()): string {
  const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000);
  if (minutes <= 0) return "already passed";
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in ${hours} hour${hours === 1 ? "" : "s"}`;
  const days = Math.round(hours / 24);
  return `in ${days} days`;
}

/** "Fri, 9 Oct 2026 at 18:00" in the reader's own locale and zone. */
export function formatDateTime(iso: string): string {
  const at = new Date(iso);
  const day = at.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  return `${day} at ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** True when the expiry is set and not in the future — the server refuses it, so the editor says so first. */
export function isExpiryPast(iso: string | null, now: Date = new Date()): boolean {
  return iso !== null && new Date(iso).getTime() <= now.getTime();
}
