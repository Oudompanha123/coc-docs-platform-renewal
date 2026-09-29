import { describe, expect, it } from "vitest";
import type { HrmsAttendanceRow } from "@/lib/notify/activity";
import { actualTimeOrNull, computeAttendanceStats, statusKind } from "./stats";

function check(scheduled: string, actual: string, status: string) {
  return { scheduled, actual, status };
}

function row(name: string, outStatus: string, inStatus: string, outActual = "17:00", inActual = "08:00"): HrmsAttendanceRow {
  return {
    name,
    yesterdayCheckOut: check("17:00", outActual, outStatus),
    todayCheckIn: check("08:00", inActual, inStatus),
  };
}

describe("statusKind", () => {
  it("recognizes Normal", () => {
    expect(statusKind("Normal")).toBe("normal");
  });

  it("recognizes Late Check-In", () => {
    expect(statusKind("Late Check-In")).toBe("late");
  });

  it("recognizes a missed check, checked before the late/normal words", () => {
    expect(statusKind("Missed Check-Out")).toBe("missed");
    expect(statusKind("Missed Check-In")).toBe("missed");
  });

  it("is case-insensitive", () => {
    expect(statusKind("normal")).toBe("normal");
  });

  it("falls back to 'other' for a status this build has never heard of, rather than guessing", () => {
    expect(statusKind("On Leave")).toBe("other");
    expect(statusKind("")).toBe("other");
  });
});

describe("actualTimeOrNull", () => {
  it("passes through a real time", () => {
    expect(actualTimeOrNull(check("08:00", "08:04", "Late Check-In"))).toBe("08:04");
  });

  it("treats HRMS's own literal 00:00 as missing", () => {
    expect(actualTimeOrNull(check("17:00", "00:00", "Missed Check-Out"))).toBeNull();
  });

  it("treats an empty actual (the parser's own no-arrow fallback) as missing", () => {
    expect(actualTimeOrNull(check("17:00", "", "Missed Check-Out"))).toBeNull();
  });
});

describe("computeAttendanceStats", () => {
  it("matches the reference mockup's own numbers for 9 rows", () => {
    // Svay Kong: out Missed Check-Out (00:00 actual), in Normal
    // In Thythavarak: out Normal, in Late Check-In
    // Veth Sam Oeun: out Normal, in Late Check-In
    // Yean Bona: out Missed Check-Out (00:00), in Normal
    // Nuon Vakhim: out Normal, in Late Check-In
    // Sam Rathanak: out Normal, in Late Check-In
    // An Sovathna: out Normal, in Late Check-In
    // Pork Chantha: out Normal, in Missed Check-In (00:00 actual)
    // Chang Techkuang: out Missed Check-Out (00:00), in Late Check-In
    const rows: HrmsAttendanceRow[] = [
      row("Svay Kong", "Missed Check-Out", "Normal", "00:00", "07:50"),
      row("In Thythavarak", "Normal", "Late Check-In", "17:29", "08:04"),
      row("Veth Sam Oeun", "Normal", "Late Check-In", "17:02", "08:13"),
      row("Yean Bona", "Missed Check-Out", "Normal", "00:00", "07:50"),
      row("Nuon Vakhim", "Normal", "Late Check-In", "17:18", "08:03"),
      row("Sam Rathanak", "Normal", "Late Check-In", "17:06", "08:01"),
      row("An Sovathna", "Normal", "Late Check-In", "17:05", "08:03"),
      row("Pork Chantha", "Normal", "Missed Check-In", "17:29", "00:00"),
      row("Chang Techkuang", "Missed Check-Out", "Late Check-In", "00:00", "08:05"),
    ];

    const stats = computeAttendanceStats(rows);

    expect(stats.totalScheduled).toBe(9);
    expect(stats.onTime).toBe(2);
    expect(stats.onTimePct).toBe(22);
    expect(stats.lateCheckIn).toBe(6);
    expect(stats.lateCheckInPct).toBe(67);
    expect(stats.missedCheckIn).toBe(1);
    expect(stats.missedCheckOut).toBe(3);
    expect(stats.missedLogs).toBe(4);
    // The task's own acceptance criterion: these three sum to the total.
    expect(stats.onTime + stats.lateCheckIn + stats.missedCheckIn).toBe(stats.totalScheduled);
  });

  it("is all zeros for no rows, not NaN or a divide-by-zero", () => {
    const stats = computeAttendanceStats([]);
    expect(stats).toEqual({
      totalScheduled: 0,
      onTime: 0,
      onTimePct: 0,
      lateCheckIn: 0,
      lateCheckInPct: 0,
      missedCheckIn: 0,
      missedCheckOut: 0,
      missedLogs: 0,
    });
  });
});
