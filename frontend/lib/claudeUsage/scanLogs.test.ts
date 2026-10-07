import { describe, expect, it } from "vitest";
import {
  filterLogs,
  formatDuration,
  formatScanTime,
  peopleIn,
  presetRange,
  resultMessage,
  summarize,
} from "./scanLogs";
import { scanLog } from "./scanLogs.fixture";

// req: FR-USAGE-002, ADR-096

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
  it("counts each status and finds the newest scan", () => {
    const newest = scanLog({ id: "c", startedAt: new Date(2026, 9, 7, 16, 0).toISOString() });
    const summary = summarize([
      scanLog({ id: "a" }),
      scanLog({ id: "b", status: "failed" }),
      newest,
      scanLog({ id: "d", status: "warning" }),
    ]);
    expect(summary).toMatchObject({ total: 4, success: 2, warning: 1, failed: 1 });
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

describe("resultMessage", () => {
  it("no new usage is a success, not a problem", () => {
    expect(resultMessage(scanLog({ uploadStatus: "not-needed", newTokens: 0 }))).toBe(
      "Scan completed successfully. No new usage found.",
    );
  });

  it("an upload reports its new tokens", () => {
    expect(resultMessage(scanLog())).toBe("Scan completed successfully. 15,240 new tokens reported.");
  });

  it("a failure names its step and error", () => {
    expect(
      resultMessage(scanLog({ status: "failed", errorStep: "upload", errorMessage: "Failed to connect to the Coc Docs server." })),
    ).toBe('Scan failed at "Upload Usage / Check-in". Failed to connect to the Coc Docs server.');
  });

  it("a warning still reads as completed", () => {
    expect(resultMessage(scanLog({ status: "warning", uploadStatus: "not-needed" }))).toBe(
      "Scan completed with warnings. No new usage found. See the timeline for details.",
    );
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
