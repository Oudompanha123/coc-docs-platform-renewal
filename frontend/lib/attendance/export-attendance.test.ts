import { describe, expect, it } from "vitest";
import type { HrmsAttendanceRow } from "@/lib/notify/activity";
import { attendanceFileName, attendanceSheet } from "./export-attendance";

function row(overrides: Partial<HrmsAttendanceRow> = {}): HrmsAttendanceRow {
  return {
    name: "Svay Kong",
    yesterdayCheckOut: { scheduled: "17:00", actual: "00:00", status: "Missed Check-Out" },
    todayCheckIn: { scheduled: "08:00", actual: "07:50", status: "Normal" },
    ...overrides,
  };
}

const NAME = 0;
const OUT_SCHEDULED = 1;
const OUT_ACTUAL = 2;
const OUT_STATUS = 3;
const IN_SCHEDULED = 4;
const IN_ACTUAL = 5;
const IN_STATUS = 6;

describe("attendanceSheet", () => {
  it("writes one row per person, under the expected headers", () => {
    const sheet = attendanceSheet("COOCON Department", [row(), row({ name: "In Thythavarak" })]);

    expect(sheet.headers[NAME]).toBe("Name");
    expect(sheet.sheetName).toBe("COOCON Department");
    expect(sheet.rows).toHaveLength(2);
  });

  it("writes both scheduled times and both statuses as-is", () => {
    const [sheetRow] = attendanceSheet("Dept", [row()]).rows;
    if (!sheetRow) throw new Error("expected attendanceSheet to produce one row");

    expect(sheetRow[NAME]).toBe("Svay Kong");
    expect(sheetRow[OUT_SCHEDULED]).toBe("17:00");
    expect(sheetRow[OUT_STATUS]).toBe("Missed Check-Out");
    expect(sheetRow[IN_SCHEDULED]).toBe("08:00");
    expect(sheetRow[IN_STATUS]).toBe("Normal");
  });

  /**
   * Same 00:00-means-missing rule the on-screen table renders with — the
   * file must never disagree with the screen about who actually checked in
   * or out.
   */
  it("treats HRMS's own 00:00 as missing, same as the table", () => {
    const [sheetRow] = attendanceSheet("Dept", [row()]).rows;
    if (!sheetRow) throw new Error("expected attendanceSheet to produce one row");

    expect(sheetRow[OUT_ACTUAL]).toBe("--:--");
  });

  it("passes through a real actual time", () => {
    const [sheetRow] = attendanceSheet("Dept", [row()]).rows;
    if (!sheetRow) throw new Error("expected attendanceSheet to produce one row");

    expect(sheetRow[IN_ACTUAL]).toBe("07:50");
  });

  it("centres the six check columns", () => {
    const sheet = attendanceSheet("Dept", [row()]);
    expect(sheet.centeredColumns).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("survives an empty row list", () => {
    expect(attendanceSheet("Dept", []).rows).toHaveLength(0);
  });

  it("falls back to a generic sheet name for a department the parser couldn't read", () => {
    expect(attendanceSheet("", []).sheetName).toBe("Attendance");
  });
});

describe("attendanceFileName", () => {
  it("carries the department and the page's own selected date", () => {
    expect(attendanceFileName("COOCON Department", "2026-09-07")).toBe("attendance-coocon-department-2026-09-07.xlsx");
  });

  it("slugifies punctuation in the department name", () => {
    expect(attendanceFileName("R&D / QA", "2026-09-07")).toBe("attendance-r-d-qa-2026-09-07.xlsx");
  });

  it("never leaves a bare department segment for one the parser couldn't read", () => {
    expect(attendanceFileName("", "2026-09-07")).toBe("attendance-attendance-2026-09-07.xlsx");
  });
});
