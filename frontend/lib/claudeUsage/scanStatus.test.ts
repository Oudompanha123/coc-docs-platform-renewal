import { describe, expect, it } from "vitest";
import {
  diagnoseScan,
  formatDuration,
  pollInterval,
  recordsText,
  resultText,
  SCAN_LOG_ACTIVE_POLL_INTERVAL_MS,
  SCAN_LOG_MAX_POLL_INTERVAL_MS,
  SCAN_LOG_POLL_INTERVAL_MS,
  scanNotices,
  scanOutcome,
  startedLate,
  triggerText,
  scanStages,
  statusMessage,
  summarize,
} from "./scanLogs";
import { scanLog } from "./scanLogs.fixture";

// req: FR-USAGE-002, ADR-107 — live scan status: running and incomplete scans, stages, notices, polling pace.

const running = scanLog({
  id: "run",
  status: "running",
  finishedAt: null,
  durationMs: null,
  uploadStatus: "not-attempted",
  transcriptFiles: null,
  responses: null,
  duplicates: null,
  newTokens: null,
  daysUploaded: null,
});
const incomplete = scanLog({ ...running, id: "inc", status: "incomplete" });
const uploadFailed = scanLog({
  id: "up",
  status: "failed",
  uploadStatus: "failed",
  errorStep: "upload",
  errorMessage: "upload failed for 2026-10-07: HTTP 503 Service Unavailable",
});
const transcriptsFailed = scanLog({
  id: "tr",
  status: "failed",
  uploadStatus: "not-attempted",
  transcriptFiles: null,
  responses: null,
  newTokens: null,
  errorStep: "find-transcripts",
  errorMessage: "usage directory not found: [path]",
});

describe("running and incomplete scans", () => {
  it("running is In Progress: never success, no diagnosis, no duration", () => {
    expect(scanOutcome(running)).toBe("in-progress");
    expect(diagnoseScan(running)).toBeNull();
    expect(resultText(running)).toBe("Scan in progress");
    expect(formatDuration(running.durationMs)).toBe("—");
  });

  it("incomplete is No Result — not Failed — with 'No result received' and a fix", () => {
    expect(scanOutcome(incomplete)).toBe("no-result");
    const diagnosis = diagnoseScan(incomplete)!;
    expect(diagnosis.code).toBe("NO_RESULT");
    expect(diagnosis.problem).toBe("No result received");
    expect(diagnosis.fix[0]!.command).toBe("claude-team-usage scan");
  });

  it("summarize counts in-progress scans on their own", () => {
    const summary = summarize([running, scanLog(), uploadFailed]);
    expect(summary["in-progress"]).toBe(1);
    expect(summary.success).toBe(1);
    expect(summary.partial).toBe(1);
  });
});

describe("scanStages — scan, upload and the scan record, separately", () => {
  const states = (log = scanLog()) => scanStages(log).map((s) => `${s.key}:${s.state}`);

  it("a full success: all three done", () => {
    expect(states()).toEqual(["scan:done", "upload:done", "log:done"]);
  });

  it("no new usage: the upload is done because nothing was needed", () => {
    const stages = scanStages(scanLog({ uploadStatus: "not-needed", newTokens: 0 }));
    expect(stages[1]).toMatchObject({ state: "done", detail: "Nothing new to upload" });
  });

  it("scanned but the upload failed: never a full success", () => {
    expect(states(uploadFailed)).toEqual(["scan:done", "upload:failed", "log:done"]);
  });

  it("stopped while reading usage: the scan failed and the upload was never reached", () => {
    expect(states(transcriptsFailed)).toEqual(["scan:failed", "upload:skipped", "log:done"]);
  });

  it("running: everything waiting; incomplete: unknown, and the record never arrived", () => {
    expect(states(running)).toEqual(["scan:waiting", "upload:waiting", "log:waiting"]);
    expect(states(incomplete)).toEqual(["scan:unknown", "upload:unknown", "log:unknown"]);
  });
});

describe("statusMessage", () => {
  it("no scan is No Recent Scan", () => {
    expect(statusMessage(null)).toMatchObject({ indicator: "no-recent", title: "No recent scan" });
  });

  it("success says what was uploaded; failure gives the plain problem, never the raw error", () => {
    expect(statusMessage(scanLog())).toMatchObject({
      indicator: "success",
      message: "Usage scanned and 15,240 new tokens uploaded.",
    });
    const failed = statusMessage(transcriptsFailed);
    expect(failed).toMatchObject({ indicator: "failed", title: "Couldn't read Claude Code history" });
    expect(failed.message).not.toContain("usage directory not found");
  });

  it("running is in progress, never a success", () => {
    expect(statusMessage(running)).toMatchObject({ indicator: "in-progress", title: "Scan in progress" });
  });
});

describe("scanNotices — each change announced once", () => {
  it("a scan that moves from running to finished is one notice", () => {
    const done = scanLog({ id: "run" });
    const notices = scanNotices([running], [done], new Set(["run:in-progress"]));
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({ key: "run:success", outcome: "success" });
    expect(notices[0]!.message).toBe("Scan succeeded — Sreyly: 15,240 new tokens uploaded");
  });

  it("an unchanged scan, or a change already seen, is not news", () => {
    expect(scanNotices([scanLog()], [scanLog()], new Set())).toEqual([]);
    expect(scanNotices([running], [scanLog({ id: "run" })], new Set(["run:success"]))).toEqual([]);
  });

  it("a new scan is news, with a plain-language failure", () => {
    const [notice] = scanNotices([], [uploadFailed], new Set());
    expect(notice!.outcome).toBe("partial");
    expect(notice!.message).toBe("Scan partly succeeded — Sreyly: Upload failed — server error");
  });
});

describe("recordsText", () => {
  it("files and responses, or a dash before the scan counted anything", () => {
    expect(recordsText(scanLog())).toBe("118 files · 127 responses");
    expect(recordsText(scanLog({ transcriptFiles: 1, responses: 1 }))).toBe("1 file · 1 response");
    expect(recordsText(running)).toBe("—");
  });
});

describe("pollInterval", () => {
  it("normal pace, faster while a scan runs, and backs off after failures up to a ceiling", () => {
    expect(pollInterval(0, false)).toBe(SCAN_LOG_POLL_INTERVAL_MS);
    expect(pollInterval(0, true)).toBe(SCAN_LOG_ACTIVE_POLL_INTERVAL_MS);
    expect(pollInterval(1, true)).toBe(SCAN_LOG_POLL_INTERVAL_MS * 2);
    expect(pollInterval(2, false)).toBe(SCAN_LOG_POLL_INTERVAL_MS * 4);
    expect(pollInterval(10, false)).toBe(SCAN_LOG_MAX_POLL_INTERVAL_MS);
  });
});

describe("scheduled scans that started late", () => {
  // Times in the team's reporting zone (Asia/Phnom_Penh, UTC+7), whatever zone the test runs in.
  const at = (time: string, trigger: "scheduled" | "manual" = "scheduled") => ({
    trigger,
    startedAt: `2026-10-16T${time}+07:00`,
  });

  it("on time within 15 minutes after 11:00 or 16:00, the boundary included", () => {
    for (const time of ["11:00:01", "11:15:00", "16:00:02", "16:15:59"]) {
      expect(startedLate(at(time)), time).toBe(false);
      expect(triggerText(at(time))).toBe("Scheduled");
    }
  });

  it("late otherwise — including the early-morning catch-up runs and anything before a slot", () => {
    for (const time of ["11:16:00", "16:16:00", "07:59:26", "08:05:20", "10:59:00", "23:30:00"]) {
      expect(startedLate(at(time)), time).toBe(true);
      expect(triggerText(at(time))).toBe("Scheduled · started late");
    }
  });

  it("a manual scan is just Manual, whenever it ran", () => {
    expect(startedLate(at("08:05:20", "manual"))).toBe(false);
    expect(triggerText(at("08:05:20", "manual"))).toBe("Manual");
  });
});
