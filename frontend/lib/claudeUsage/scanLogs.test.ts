import { describe, expect, it } from "vitest";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import {
  diagnoseScan,
  errorCode,
  filterLogs,
  formatDuration,
  formatScanTime,
  peopleIn,
  presetRange,
  resultText,
  scanOutcome,
  summarize,
} from "./scanLogs";
import { scanLog } from "./scanLogs.fixture";

// req: FR-USAGE-002, ADR-099

const NOW = new Date(2026, 9, 7, 12, 0);

describe("formatDuration", () => {
  it("reads like the table expects", () => {
    expect(formatDuration(400)).toBe("0.4s");
    expect(formatDuration(8_000)).toBe("8s");
    expect(formatDuration(65_000)).toBe("1m 05s");
    expect(formatDuration(-1)).toBe("—");
  });
});

describe("formatScanTime", () => {
  const time = (h: number, m: number) =>
    new Date(2026, 9, 7, h, m).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  it("says Today / Yesterday, and keeps the time on older days", () => {
    expect(formatScanTime(new Date(2026, 9, 7, 11, 0).toISOString(), NOW)).toBe(`Today, ${time(11, 0)}`);
    expect(formatScanTime(new Date(2026, 9, 6, 16, 0).toISOString(), NOW)).toBe(`Yesterday, ${time(16, 0)}`);
    expect(formatScanTime(new Date(2026, 9, 3, 11, 0).toISOString(), NOW)).toContain(time(11, 0));
  });
});

describe("summarize", () => {
  it("counts each outcome and finds the newest scan", () => {
    const newest = scanLog({ id: "c", startedAt: new Date(2026, 9, 7, 16, 0).toISOString() });
    const summary = summarize([
      scanLog({ id: "a" }),
      scanLog({ id: "b", status: "failed" }),
      newest,
      scanLog({ id: "d", status: "warning" }),
      scanLog({ id: "e", uploadStatus: "not-needed", newTokens: 0 }),
    ]);
    expect(summary).toMatchObject({ total: 5, success: 2, partial: 1, failed: 1, "no-usage": 1 });
    expect(summary.last?.id).toBe("c");
  });

  it("an empty range has no last scan", () => {
    expect(summarize([]).last).toBeNull();
  });
});

describe("filterLogs", () => {
  const logs = [
    scanLog({ id: "a" }),
    scanLog({ id: "b", memberId: "m-2", email: "dara@example.com", displayName: "Dara", status: "failed", errorMessage: "Failed to connect" }),
    scanLog({ id: "c", memberId: null, email: "new@example.com", displayName: null, scanRef: "SCAN-20261006-160000-AB12" }),
  ];
  const all = { person: "all", status: "all" as const, search: "" };

  it("by person, status and search (name, email, scan ID, error)", () => {
    expect(filterLogs(logs, { ...all, person: "m-2" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterLogs(logs, { ...all, person: "new@example.com" }).map((l) => l.id)).toEqual(["c"]);
    expect(filterLogs(logs, { ...all, status: "failed" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterLogs(logs, { ...all, search: "connect" }).map((l) => l.id)).toEqual(["b"]);
    expect(filterLogs(logs, { ...all, search: "ab12" }).map((l) => l.id)).toEqual(["c"]);
    expect(filterLogs(logs, { ...all, search: "SREYLY" }).map((l) => l.id)).toEqual(["a"]);
  });

  it("lists people once each, a person off the roster by email", () => {
    expect(peopleIn([...logs, scanLog({ id: "d" })]).map((p) => p.name)).toEqual(["Dara", "new@example.com", "Sreyly"]);
  });
});

const AUTH_401 =
  "upload failed for 2026-10-07: rejected (401): your token is invalid or has been revoked. Run `claude-team-usage login` to sign in again.";
const UNREACHABLE = "upload failed for 2026-10-07: nothing is listening at https://docs.example/api/ingest. Is the Coc Docs backend running?";
const failedWith = (errorMessage: string | null, errorStep: ScanLogSummary["errorStep"] = "upload") =>
  scanLog({ status: "failed", uploadStatus: "failed", errorStep, errorMessage });

describe("scanOutcome", () => {
  it("success uploads, no-usage had nothing new, a warning is partial", () => {
    expect(scanOutcome(scanLog())).toBe("success");
    expect(scanOutcome(scanLog({ uploadStatus: "not-needed", newTokens: 0 }))).toBe("no-usage");
    expect(scanOutcome(scanLog({ status: "warning", uploadStatus: "not-needed" }))).toBe("partial");
  });

  it("an upload the next scan will retry is partial; one that needs a fix on the PC is failed", () => {
    expect(scanOutcome(failedWith(UNREACHABLE))).toBe("partial");
    expect(scanOutcome(failedWith("upload failed for 2026-10-07: HTTP 503 Service Unavailable"))).toBe("partial");
    expect(scanOutcome(failedWith(AUTH_401))).toBe("failed");
    expect(scanOutcome(failedWith(null, "find-transcripts"))).toBe("failed");
  });
});

describe("diagnoseScan", () => {
  it("nothing to diagnose when the scan worked", () => {
    expect(diagnoseScan(scanLog())).toBeNull();
    expect(diagnoseScan(scanLog({ uploadStatus: "not-needed", newTokens: 0 }))).toBeNull();
  });

  it("an expired login: plain problem, and login then scan to fix it", () => {
    const d = diagnoseScan(failedWith(AUTH_401))!;
    expect(d.problem).toBe("Authentication failed");
    expect(d.description).toBe("Your Claude Usage login has expired or is invalid.");
    expect(d.fix.map((s) => s.command)).toEqual(["claude-team-usage login", "claude-team-usage scan"]);
  });

  it.each([
    ["blocked by Vercel Deployment Protection, not by the app. Set VERCEL_AUTOMATION_BYPASS_SECRET", "BLOCKED_BY_HOST"],
    ["rejected (403): this token may only report usage for its own account", "WRONG_ACCOUNT"],
    ["a proxy or DLP agent on this machine is intercepting HTTPS ... set NODE_EXTRA_CA_CERTS", "CERTIFICATE_UNTRUSTED"],
    ["credentials.json is damaged. Run `claude-team-usage login`", "LOGIN_SETTINGS_DAMAGED"],
    ["no ingest route at https://docs.example/api/x. It should end with /api/ingest.", "WRONG_SERVER_ADDRESS"],
    ["cannot resolve the host in https://docs.example/api/ingest.", "SERVER_NOT_FOUND"],
    [UNREACHABLE, "SERVER_UNREACHABLE"],
    ["no response from https://docs.example/api/ingest within 15s", "SERVER_UNREACHABLE"],
    ["HTTP 500 Internal Server Error", "SERVER_ERROR"],
  ])("%s -> %s", (message, code) => {
    expect(diagnoseScan(failedWith(message))?.code).toBe(code);
  });

  it("an unknown error falls back on the step it stopped at, never on the raw message", () => {
    const trace = "TypeError: Cannot read properties of undefined (reading 'x')\n    at parse (usage-parser.js:12:5)";
    expect(diagnoseScan(failedWith(trace, "upload"))).toMatchObject({ code: "UPLOAD_FAILED", problem: "Upload failed" });
    expect(diagnoseScan(failedWith(trace, "parse-usage"))).toMatchObject({ code: "PROCESSING_FAILED" });
    expect(diagnoseScan(failedWith(trace, "find-transcripts"))).toMatchObject({ code: "TRANSCRIPTS_UNREADABLE" });
    expect(diagnoseScan(failedWith(trace, null))).toMatchObject({ code: "SCAN_STOPPED" });
    expect(diagnoseScan(failedWith(trace, "upload"))!.description).not.toContain("TypeError");
  });

  it("every fix has at least one step, and an error code carries its HTTP status", () => {
    const d = diagnoseScan(failedWith(AUTH_401))!;
    expect(errorCode(failedWith(AUTH_401), d)).toBe("AUTH_FAILED (HTTP 401)");
    expect(errorCode(failedWith(UNREACHABLE), diagnoseScan(failedWith(UNREACHABLE))!)).toBe("SERVER_UNREACHABLE");
  });
});

describe("resultText", () => {
  it("is short: uploaded, no usage, or the problem", () => {
    expect(resultText(scanLog())).toBe("Usage uploaded");
    expect(resultText(scanLog({ uploadStatus: "not-needed", newTokens: 0 }))).toBe("No usage found");
    expect(resultText(failedWith(AUTH_401))).toBe("Authentication failed");
    expect(resultText(failedWith(UNREACHABLE))).toBe("Upload failed — server unreachable");
  });
});

describe("presetRange", () => {
  it("today, last 7 and last 30 days, inclusive of today", () => {
    expect(presetRange("today", NOW)).toEqual({ from: "2026-10-07", to: "2026-10-07" });
    expect(presetRange("7d", NOW)).toEqual({ from: "2026-10-01", to: "2026-10-07" });
    expect(presetRange("30d", NOW)).toEqual({ from: "2026-09-08", to: "2026-10-07" });
    expect(presetRange("custom", NOW)).toBeNull();
  });
});
