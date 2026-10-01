import { describe, expect, it } from "vitest";
import { formatCount, formatDuration, minusDays, presetRange, reportDate, topProjects } from "./activity";

describe("presetRange", () => {
  const today = "2026-09-30";

  it("covers today only, the last 7 days, or the last 30 days — each ending today", () => {
    expect(presetRange("today", today)).toEqual({ from: "2026-09-30", to: "2026-09-30" });
    expect(presetRange("7d", today)).toEqual({ from: "2026-09-24", to: "2026-09-30" });
    expect(presetRange("30d", today)).toEqual({ from: "2026-09-01", to: "2026-09-30" });
  });

  it("uses a custom range as given, swapped if backwards, and null until both dates exist", () => {
    expect(presetRange("custom", today, { from: "2026-09-01", to: "2026-09-15" })).toEqual({ from: "2026-09-01", to: "2026-09-15" });
    expect(presetRange("custom", today, { from: "2026-09-15", to: "2026-09-01" })).toEqual({ from: "2026-09-01", to: "2026-09-15" });
    expect(presetRange("custom", today, { from: "2026-09-01", to: "" })).toBeNull();
  });
});

describe("minusDays / reportDate", () => {
  it("does calendar arithmetic across month and year boundaries", () => {
    expect(minusDays("2026-03-01", 1)).toBe("2026-02-28");
    expect(minusDays("2026-01-03", 6)).toBe("2025-12-28");
  });

  it("reads the date in the team's zone, not the viewer's", () => {
    // 18:30 UTC on Sep 30 is already Oct 1 in Phnom Penh (UTC+7).
    expect(reportDate(new Date("2026-09-30T18:30:00Z"))).toBe("2026-10-01");
  });
});

describe("formatDuration / formatCount", () => {
  it("reads as hours and minutes", () => {
    expect(formatDuration(0)).toBe("0m");
    expect(formatDuration(30)).toBe("<1m");
    expect(formatDuration(27 * 60)).toBe("27m");
    expect(formatDuration(98 * 60)).toBe("1h 38m");
    expect(formatDuration(120 * 60)).toBe("2h");
  });

  it("shows not-reported as a dash, never as zero", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatCount(null)).toBe("—");
    expect(formatCount(0)).toBe("0");
    expect(formatCount(1234)).toBe("1,234");
  });
});

describe("topProjects", () => {
  it("keeps the largest few and folds the rest into one row", () => {
    const projects = ["a", "b", "c", "d"].map((name, i) => ({ name, totalTokens: 100 - i * 10 }));
    expect(topProjects(projects, 2)).toEqual([
      { name: "a", totalTokens: 100, rest: false },
      { name: "b", totalTokens: 90, rest: false },
      { name: "2 more projects", totalTokens: 150, rest: true },
    ]);
    expect(topProjects(projects, 4)).toHaveLength(4);
  });
});
