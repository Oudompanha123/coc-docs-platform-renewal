import type { ScanLogSummary, ScanStatus, ScanStepKey } from "@/lib/admin/claudeUsage";

// req: FR-USAGE-002, ADR-096 — the View Logs page's own logic, kept out of the components.

export const STEP_LABELS: Record<ScanStepKey, string> = {
  start: "Start Scan",
  "find-transcripts": "Find Transcripts",
  "parse-usage": "Parse Usage",
  deduplicate: "Deduplicate",
  "calculate-usage": "Calculate Usage",
  "check-new-usage": "Check New Usage",
  upload: "Upload Usage / Check-in",
  complete: "Complete",
};

export const STATUS_LABELS: Record<ScanStatus, string> = {
  success: "Success",
  warning: "Warning",
  failed: "Failed",
};

export type StatusFilter = ScanStatus | "all";

export interface ScanLogFilters {
  /** `ScanPerson.key`, or "all". */
  person: string;
  status: StatusFilter;
  search: string;
}

export interface ScanPerson {
  /** memberId when the email is on the roster, else the email. */
  key: string;
  name: string;
  email: string;
}

export interface ScanSummary {
  total: number;
  success: number;
  warning: number;
  failed: number;
  /** The newest scan in the set, whatever its status. */
  last: ScanLogSummary | null;
}

export const personKey = (log: ScanLogSummary): string => log.memberId ?? log.email;
export const personName = (log: ScanLogSummary): string => log.displayName?.trim() || log.email;

/** "0.4s", "8s", "1m 05s". */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Today, 11:00 AM", "Yesterday, 4:00 PM", "Oct 5, 11:00 AM" — a log needs the time on every row, unlike `formatLastActive`. */
export function formatScanTime(iso: string, now: Date = new Date()): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "—";
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (sameDay(when, now)) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(when, yesterday)) return `Yesterday, ${time}`;
  const date = when.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(when.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
  return `${date}, ${time}`;
}

/** Full timestamp for the detail view: "Oct 7, 2026, 11:00:01 AM". */
export function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "—";
  return when.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatCount(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("en-US");
}

/** Every person who has a scan in `logs`, by name. */
export function peopleIn(logs: ScanLogSummary[]): ScanPerson[] {
  const byKey = new Map<string, ScanPerson>();
  for (const log of logs) {
    const key = personKey(log);
    if (!byKey.has(key)) byKey.set(key, { key, name: personName(log), email: log.email });
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function summarize(logs: ScanLogSummary[]): ScanSummary {
  const summary: ScanSummary = { total: logs.length, success: 0, warning: 0, failed: 0, last: null };
  for (const log of logs) {
    summary[log.status]++;
    if (!summary.last || Date.parse(log.startedAt) > Date.parse(summary.last.startedAt)) summary.last = log;
  }
  return summary;
}

/** Search covers who, the scan ID, the error and the CLI version — what an admin would paste in from a report. */
export function filterLogs(logs: ScanLogSummary[], filters: ScanLogFilters): ScanLogSummary[] {
  const needle = filters.search.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.person !== "all" && personKey(log) !== filters.person) return false;
    if (filters.status !== "all" && log.status !== filters.status) return false;
    if (!needle) return true;
    return [personName(log), log.email, log.scanRef, log.errorMessage ?? "", log.cliVersion ?? ""].some((field) =>
      field.toLowerCase().includes(needle),
    );
  });
}

/**
 * One sentence an admin can read without opening the timeline. "No new usage"
 * is reported as a success — the scan and its check-in worked.
 */
export function resultMessage(log: ScanLogSummary): string {
  if (log.status === "failed") {
    const where = log.errorStep ? ` at "${STEP_LABELS[log.errorStep]}"` : "";
    return `Scan failed${where}.${log.errorMessage ? ` ${log.errorMessage}` : ""}`;
  }
  const outcome =
    log.uploadStatus === "uploaded"
      ? `${formatCount(log.newTokens)} new tokens reported.`
      : log.uploadStatus === "not-needed"
        ? "No new usage found."
        : "";
  const lead = log.status === "warning" ? "Scan completed with warnings." : "Scan completed successfully.";
  const tail = log.status === "warning" ? "See the timeline for details." : "";
  return [lead, outcome, tail].filter(Boolean).join(" ");
}

/** ISO calendar date (YYYY-MM-DD) in the browser's own zone. */
export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type RangePreset = "today" | "7d" | "30d" | "custom";

/** The range a preset means on `now`; null for "custom". */
export function presetRange(preset: RangePreset, now: Date = new Date()): { from: string; to: string } | null {
  if (preset === "custom") return null;
  const from = new Date(now);
  from.setDate(now.getDate() - (preset === "today" ? 0 : preset === "7d" ? 6 : 29));
  return { from: isoDate(from), to: isoDate(now) };
}
