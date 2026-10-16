import type { ScanLogSummary, ScanStepKey } from "@/lib/admin/claudeUsage";

// req: FR-USAGE-002, ADR-099, ADR-107 — the Scan Logs page's own logic, kept out of the components.

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

/**
 * What a scan means to an admin, read from the record's own status and upload
 * fields — no new server data. The CLI's `status` alone can't tell "the PC
 * counted usage but the upload didn't land" (retried by the next scan) from
 * "nothing works until someone signs in again"; this does.
 *
 * - in-progress — the reporter said it started; no result yet (ADR-107). Never
 *                 shown as success until the server has the result.
 * - success     — scanned and uploaded new usage
 * - no-usage    — scanned fine, nothing new to upload
 * - partial     — finished with a warning, or counted usage it couldn't upload
 *                 for a passing reason (network, server); the next scan retries
 * - failed      — stopped, and stays stopped until someone fixes the cause
 * - no-result   — started and never sent a result (`incomplete`). Nothing
 *                 says it failed — the PC may simply have slept or shut down
 *                 mid-scan — so it is neither counted nor coloured as Failed.
 */
export type ScanOutcome = "in-progress" | "success" | "partial" | "failed" | "no-usage" | "no-result";

export const OUTCOME_LABELS: Record<ScanOutcome, string> = {
  "in-progress": "In Progress",
  success: "Success",
  partial: "Partial Success",
  failed: "Failed",
  "no-usage": "No New Usage",
  "no-result": "No Result",
};

/** What a status badge can show: a scan's outcome, or — for a person or range with no scan — that there is none. */
export type ScanIndicator = ScanOutcome | "no-recent";

export const INDICATOR_LABELS: Record<ScanIndicator, string> = { ...OUTCOME_LABELS, "no-recent": "No Recent Scan" };

export type StatusFilter = ScanOutcome | "all";

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

export interface ScanSummary extends Record<ScanOutcome, number> {
  total: number;
  /** The newest scan in the set, whatever its status. */
  last: ScanLogSummary | null;
}

export const personKey = (log: ScanLogSummary): string => log.memberId ?? log.email;
export const personName = (log: ScanLogSummary): string => log.displayName?.trim() || log.email;

/**
 * The reporter's daily Task Scheduler slots (`SCHEDULE_TIMES` in
 * tools/claude-team-usage/src/schedule.js), as minutes after midnight in the
 * team's reporting zone — the same zone the scan ID uses.
 */
const SCHEDULED_SLOT_MINUTES = [11 * 60, 16 * 60];
/** A scheduled scan this long after its slot, or more, counts as started late. */
export const SCHEDULED_GRACE_MINUTES = 15;
const REPORT_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Phnom_Penh",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/**
 * A scheduled scan that did not start within SCHEDULED_GRACE_MINUTES after
 * 11:00 or 16:00. Only the start time is compared — the record says nothing
 * about why, so nothing here guesses (a PC that was off, asleep, logged out…).
 */
export function startedLate(log: Pick<ScanLogSummary, "trigger" | "startedAt">): boolean {
  if (log.trigger !== "scheduled") return false;
  const when = new Date(log.startedAt);
  if (Number.isNaN(when.getTime())) return false;
  const parts = Object.fromEntries(REPORT_TIME.formatToParts(when).map((p) => [p.type, p.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  return !SCHEDULED_SLOT_MINUTES.some((slot) => minutes >= slot && minutes - slot <= SCHEDULED_GRACE_MINUTES);
}

/** How the scan was started, as the table shows it: from the record's `trigger`, plus whether a scheduled one started late. */
export function triggerText(log: Pick<ScanLogSummary, "trigger" | "startedAt">): string {
  if (log.trigger !== "scheduled") return "Manual";
  return startedLate(log) ? "Scheduled · started late" : "Scheduled";
}

/** "0.4s", "8s", "1m 05s"; "—" for a scan with no result yet. */
export function formatDuration(ms: number | null): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return "—";
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
  const summary: ScanSummary = {
    total: logs.length,
    "in-progress": 0,
    success: 0,
    partial: 0,
    failed: 0,
    "no-usage": 0,
    "no-result": 0,
    last: null,
  };
  for (const log of logs) {
    summary[scanOutcome(log)]++;
    if (!summary.last || Date.parse(log.startedAt) > Date.parse(summary.last.startedAt)) summary.last = log;
  }
  return summary;
}

/** Search covers who, the scan ID, the problem, the raw error and the CLI version — what an admin would paste in from a report. */
export function filterLogs(logs: ScanLogSummary[], filters: ScanLogFilters): ScanLogSummary[] {
  const needle = filters.search.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.person !== "all" && personKey(log) !== filters.person) return false;
    if (filters.status !== "all" && scanOutcome(log) !== filters.status) return false;
    if (!needle) return true;
    return [
      personName(log),
      log.email,
      log.scanRef,
      diagnoseScan(log)?.problem ?? "",
      log.errorMessage ?? "",
      log.cliVersion ?? "",
    ].some((field) => field.toLowerCase().includes(needle));
  });
}

export function scanOutcome(log: ScanLogSummary): ScanOutcome {
  if (log.status === "running") return "in-progress";
  if (log.status === "incomplete") return "no-result";
  if (log.status === "failed") return diagnoseScan(log)?.retriedNextScan ? "partial" : "failed";
  if (log.status === "warning") return "partial";
  return log.uploadStatus === "not-needed" ? "no-usage" : "success";
}

/** The table's Result cell: short enough to scan down a long list. */
export function resultText(log: ScanLogSummary): string {
  if (log.status === "running") return "Scan in progress";
  const diagnosis = diagnoseScan(log);
  if (diagnosis) return diagnosis.problem;
  if (log.uploadStatus === "not-needed") return "No usage found";
  return "Usage uploaded";
}

/** One step of a fix. `command` renders as a copyable terminal line. */
export interface FixStep {
  text: string;
  command?: string;
}

export interface ScanDiagnosis {
  /** Stable, for the Technical details panel and for searching a report. */
  code: string;
  /** A few words: the table's Result and the drawer's Problem heading. */
  problem: string;
  /** One or two plain sentences: what happened, for someone who isn't a developer. */
  description: string;
  fix: FixStep[];
  /** The usage is still on the PC and the next scan sends it — what makes a failure "partial". */
  retriedNextScan: boolean;
}

const LOGIN: FixStep = { text: "Run the login command to refresh your credentials.", command: "claude-team-usage login" };
const SCAN_AGAIN: FixStep = { text: "Then run the scan again.", command: "claude-team-usage scan" };
const SCAN_VERBOSE: FixStep = {
  text: "Run the scan again with details, and send the output to the Coc Docs team if it fails again.",
  command: "claude-team-usage scan --verbose",
};

/**
 * Known failures, matched on the CLI's own error text (tools/claude-team-usage
 * src/upload.js, src/config.js). First match wins, so the specific cases sit
 * above the general ones — Vercel's 401 above the app's own 401.
 */
const KNOWN_FAILURES: { pattern: RegExp; diagnosis: Omit<ScanDiagnosis, "retriedNextScan">; retriedNextScan: boolean }[] = [
  {
    pattern: /deployment protection/i,
    retriedNextScan: false,
    diagnosis: {
      code: "BLOCKED_BY_HOST",
      problem: "Blocked before reaching Coc Docs",
      description: "The hosting provider's access protection turned the upload away before it reached the app.",
      fix: [
        { text: "Set VERCEL_AUTOMATION_BYPASS_SECRET on this PC to the deployment's Protection Bypass for Automation secret." },
        SCAN_AGAIN,
      ],
    },
  },
  {
    pattern: /\(401\)|token is invalid|been revoked|not signed in/i,
    retriedNextScan: false,
    diagnosis: {
      code: "AUTH_FAILED",
      problem: "Authentication failed",
      description: "Your Claude Usage login has expired or is invalid.",
      fix: [LOGIN, SCAN_AGAIN],
    },
  },
  {
    pattern: /\(403\)/,
    retriedNextScan: false,
    diagnosis: {
      code: "WRONG_ACCOUNT",
      problem: "Signed in as someone else",
      description: "The login saved on this PC belongs to a different account, so the server refused usage for this email.",
      fix: [{ ...LOGIN, text: "Sign in again as yourself." }, SCAN_AGAIN],
    },
  },
  {
    pattern: /certificate|NODE_EXTRA_CA_CERTS|SELF_SIGNED|UNABLE_TO_VERIFY/i,
    retriedNextScan: false,
    diagnosis: {
      code: "CERTIFICATE_UNTRUSTED",
      problem: "Secure connection blocked",
      description: "A proxy or security agent on this PC is intercepting HTTPS, and the reporter doesn't trust its certificate.",
      fix: [
        { text: "Ask IT for the proxy's root certificate and set NODE_EXTRA_CA_CERTS to that file. Never turn certificate checks off." },
        SCAN_AGAIN,
      ],
    },
  },
  {
    pattern: /damaged|incomplete|COC_DOCS_URL|USER_EMAIL/,
    retriedNextScan: false,
    diagnosis: {
      code: "LOGIN_SETTINGS_DAMAGED",
      problem: "Login settings damaged",
      description: "The reporter's saved login on this PC is missing or unreadable.",
      fix: [LOGIN, SCAN_AGAIN],
    },
  },
  {
    pattern: /no ingest route|\b404\b/i,
    retriedNextScan: false,
    diagnosis: {
      code: "WRONG_SERVER_ADDRESS",
      problem: "Wrong server address",
      description: "The server address saved on this PC doesn't lead to Coc Docs' upload route.",
      fix: [{ ...LOGIN, text: "Sign in again to refresh the server address." }, SCAN_AGAIN],
    },
  },
  {
    pattern: /cannot resolve the host|ENOTFOUND|EAI_AGAIN/,
    retriedNextScan: true,
    diagnosis: {
      code: "SERVER_NOT_FOUND",
      problem: "Upload failed — server not found",
      description:
        "This PC couldn't look up the Coc Docs server, usually because it was offline or off the VPN. The usage is still on the PC and is sent with the next scan.",
      fix: [
        { text: "Check the PC is online, and on the VPN if your network needs it." },
        { ...LOGIN, text: "If it keeps failing, sign in again to refresh the server address." },
        SCAN_AGAIN,
      ],
    },
  },
  {
    pattern: /nothing is listening|ECONNREFUSED|ECONNRESET|ETIMEDOUT|no response from|fetch failed|socket hang up/i,
    retriedNextScan: true,
    diagnosis: {
      code: "SERVER_UNREACHABLE",
      problem: "Upload failed — server unreachable",
      description:
        "The Coc Docs server didn't answer. The usage is still on the PC and is sent with the next scan.",
      fix: [{ text: "Check the Coc Docs server is running and reachable from this PC." }, SCAN_AGAIN],
    },
  },
  {
    pattern: /HTTP 5\d\d/,
    retriedNextScan: true,
    diagnosis: {
      code: "SERVER_ERROR",
      problem: "Upload failed — server error",
      description: "The Coc Docs server hit an error while saving the usage. The usage is still on the PC and is sent with the next scan.",
      fix: [{ text: "Check the backend logs for errors around this scan's time." }, SCAN_AGAIN],
    },
  },
];

/**
 * The plain-language problem and fix for a scan that didn't fully succeed;
 * null for one that did. Never returns the raw error as the problem — that
 * belongs in Technical details, which is where a stack trace would land too.
 */
export function diagnoseScan(log: ScanLogSummary): ScanDiagnosis | null {
  if (log.status === "incomplete") {
    return {
      code: "NO_RESULT",
      problem: "No result received",
      description:
        "The scan reported that it started, but its result never reached Coc Docs. The PC may have gone to sleep, lost its connection, or the scan was stopped. If the result was saved on the PC, the next scan sends it and this row updates.",
      fix: [{ text: "Run the scan again.", command: "claude-team-usage scan" }, SCAN_VERBOSE],
      retriedNextScan: false,
    };
  }
  if (log.status === "warning") {
    return {
      code: "COMPLETED_WITH_WARNINGS",
      problem: "Completed with warnings",
      description:
        "The scan finished, but one step needs a look — for example, some transcript files couldn't be read, or the check-in wasn't recorded. Technical details shows which step.",
      fix: [{ text: "Run the scan again. If the warning stays, check the step marked in Technical details.", command: "claude-team-usage scan" }],
      retriedNextScan: true,
    };
  }
  if (log.status !== "failed") return null;

  const message = log.errorMessage ?? "";
  const known = KNOWN_FAILURES.find((f) => f.pattern.test(message));
  if (known) return { ...known.diagnosis, retriedNextScan: known.retriedNextScan };

  switch (log.errorStep) {
    case "upload":
      return {
        code: "UPLOAD_FAILED",
        problem: "Upload failed",
        description: "The scan counted the usage but couldn't upload it. The usage is still on the PC and is sent with the next scan.",
        fix: [SCAN_AGAIN, SCAN_VERBOSE],
        retriedNextScan: true,
      };
    case "find-transcripts":
      return {
        code: "TRANSCRIPTS_UNREADABLE",
        problem: "Couldn't read Claude Code history",
        description: "The reporter couldn't open the Claude Code history on this PC.",
        fix: [{ text: "Make sure Claude Code has been used on this PC, under the same Windows account." }, SCAN_VERBOSE],
        retriedNextScan: false,
      };
    case "parse-usage":
    case "deduplicate":
    case "calculate-usage":
    case "check-new-usage":
      return {
        code: "PROCESSING_FAILED",
        problem: "Couldn't process usage",
        description: "The reporter found the Claude Code history but couldn't work out the usage from it.",
        fix: [SCAN_VERBOSE],
        retriedNextScan: false,
      };
    default:
      return {
        code: "SCAN_STOPPED",
        problem: "Scan stopped",
        description: "The scan stopped before it finished.",
        fix: [SCAN_VERBOSE],
        retriedNextScan: false,
      };
  }
}

/** "AUTH_FAILED (HTTP 401)" — the diagnosis code, plus the HTTP status when the error carries one. */
export function errorCode(log: ScanLogSummary, diagnosis: ScanDiagnosis): string {
  const http = /\((\d{3})\)|HTTP (\d{3})/.exec(log.errorMessage ?? "");
  const status = http?.[1] ?? http?.[2];
  return status ? `${diagnosis.code} (HTTP ${status})` : diagnosis.code;
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

/** The table's Records cell: what the scan read, when it got that far. */
export function recordsText(log: ScanLogSummary): string {
  if (log.transcriptFiles == null && log.responses == null) return "—";
  const parts: string[] = [];
  if (log.transcriptFiles != null) parts.push(`${formatCount(log.transcriptFiles)} file${log.transcriptFiles === 1 ? "" : "s"}`);
  if (log.responses != null) parts.push(`${formatCount(log.responses)} response${log.responses === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

/** One stage of a scan, as the status panel and the drawer show it. */
export type StageState = "done" | "failed" | "skipped" | "waiting" | "unknown";

export interface ScanStage {
  key: "scan" | "upload" | "log";
  label: string;
  state: StageState;
  detail: string;
}

const SCAN_STEPS: ReadonlySet<string> = new Set([
  "start",
  "find-transcripts",
  "parse-usage",
  "deduplicate",
  "calculate-usage",
  "check-new-usage",
]);

/**
 * The three things that have to work for a scan to count — reading the usage
 * on the PC, uploading it, and the scan's own record reaching Coc Docs — each
 * judged only from what the server holds. A stage the server can't vouch for
 * is `waiting` or `unknown`, never `done`.
 */
export function scanStages(log: ScanLogSummary): ScanStage[] {
  if (log.status === "running") {
    return [
      { key: "scan", label: "Scan", state: "waiting", detail: "Reading usage on the PC" },
      { key: "upload", label: "Upload", state: "waiting", detail: "Not yet" },
      { key: "log", label: "Scan record", state: "waiting", detail: "Waiting for the result" },
    ];
  }
  if (log.status === "incomplete") {
    return [
      { key: "scan", label: "Scan", state: "unknown", detail: "No result to confirm it" },
      { key: "upload", label: "Upload", state: "unknown", detail: "No result to confirm it" },
      // Not "failed": its absence is all the server knows (see `no-result`).
      { key: "log", label: "Scan record", state: "unknown", detail: "Never received" },
    ];
  }
  const records = recordsText(log);
  const scan: ScanStage =
    log.errorStep != null && SCAN_STEPS.has(log.errorStep)
      ? { key: "scan", label: "Scan", state: "failed", detail: "Stopped before it finished reading usage" }
      : { key: "scan", label: "Scan", state: "done", detail: records === "—" ? "Completed" : records };
  const upload: ScanStage =
    log.uploadStatus === "uploaded"
      ? { key: "upload", label: "Upload", state: "done", detail: `${formatCount(log.newTokens)} new tokens uploaded` }
      : log.uploadStatus === "not-needed"
        ? { key: "upload", label: "Upload", state: "done", detail: "Nothing new to upload" }
        : log.uploadStatus === "failed"
          ? { key: "upload", label: "Upload", state: "failed", detail: "The upload didn't land" }
          : { key: "upload", label: "Upload", state: "skipped", detail: "Not attempted" };
  return [scan, upload, { key: "log", label: "Scan record", state: "done", detail: "Received by Coc Docs" }];
}

/** The status panel's headline for the newest scan — or for no scan at all. */
export function statusMessage(log: ScanLogSummary | null): { indicator: ScanIndicator; title: string; message: string } {
  if (!log) {
    return { indicator: "no-recent", title: "No recent scan", message: "No scan has been recorded in this date range yet." };
  }
  const outcome = scanOutcome(log);
  const diagnosis = diagnoseScan(log);
  switch (outcome) {
    case "in-progress":
      return { indicator: outcome, title: "Scan in progress", message: "Waiting for the reporter to send its result." };
    case "success":
      return {
        indicator: outcome,
        title: "Scan completed successfully",
        message: `Usage scanned and ${formatCount(log.newTokens)} new tokens uploaded.`,
      };
    case "no-usage":
      return { indicator: outcome, title: "Scan completed successfully", message: "Usage scanned — nothing new to upload." };
    case "partial":
      return { indicator: outcome, title: diagnosis?.problem ?? "Completed with problems", message: diagnosis?.description ?? "" };
    case "failed":
      return { indicator: outcome, title: diagnosis?.problem ?? "Scan failed", message: diagnosis?.description ?? "" };
    case "no-result":
      return { indicator: outcome, title: diagnosis?.problem ?? "No result received", message: diagnosis?.description ?? "" };
  }
}

/** One status change worth telling the viewer about, once. */
export interface ScanNotice {
  /** `${id}:${outcome}` — the same scan reaching the same outcome is never announced twice. */
  key: string;
  log: ScanLogSummary;
  outcome: ScanOutcome;
  message: string;
}

/**
 * What changed between two reads of the same range: a scan that appeared, or
 * one whose outcome moved (in progress → finished). `seen` holds every key
 * already announced; the caller adds the returned keys to it, which is what
 * keeps a later poll from announcing the same change twice.
 */
export function scanNotices(prev: ScanLogSummary[], next: ScanLogSummary[], seen: ReadonlySet<string>): ScanNotice[] {
  const before = new Map(prev.map((l) => [l.id, scanOutcome(l)]));
  const notices: ScanNotice[] = [];
  for (const log of next) {
    const outcome = scanOutcome(log);
    const key = `${log.id}:${outcome}`;
    if (seen.has(key) || before.get(log.id) === outcome) continue;
    notices.push({ key, log, outcome, message: noticeMessage(log, outcome) });
  }
  return notices;
}

function noticeMessage(log: ScanLogSummary, outcome: ScanOutcome): string {
  const who = personName(log);
  switch (outcome) {
    case "in-progress":
      return `Scan started — ${who}`;
    case "success":
      return `Scan succeeded — ${who}: ${formatCount(log.newTokens)} new tokens uploaded`;
    case "no-usage":
      return `Scan succeeded — ${who}: no new usage`;
    case "partial":
      return `Scan partly succeeded — ${who}: ${diagnoseScan(log)?.problem ?? "completed with warnings"}`;
    case "failed":
      return `Scan failed — ${who}: ${diagnoseScan(log)?.problem ?? "scan stopped"}`;
    case "no-result":
      return `No result received — ${who}: the scan started but its result never arrived`;
  }
}

/** How often an open, visible Scan Logs page re-reads the range. */
export const SCAN_LOG_POLL_INTERVAL_MS = 15_000;
/** Faster while a scan in view is in progress — a scan takes seconds, so its result is worth seeing promptly (ADR-107). */
export const SCAN_LOG_ACTIVE_POLL_INTERVAL_MS = 5_000;
/** After failed refreshes the interval doubles from SCAN_LOG_POLL_INTERVAL_MS, up to this. */
export const SCAN_LOG_MAX_POLL_INTERVAL_MS = 60_000;

/** The next poll's delay: back off after failures, speed up while a scan runs, otherwise the normal pace. */
export function pollInterval(failures: number, anyRunning: boolean): number {
  if (failures > 0) return Math.min(SCAN_LOG_POLL_INTERVAL_MS * 2 ** failures, SCAN_LOG_MAX_POLL_INTERVAL_MS);
  return anyRunning ? SCAN_LOG_ACTIVE_POLL_INTERVAL_MS : SCAN_LOG_POLL_INTERVAL_MS;
}
