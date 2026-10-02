import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  formatDisplayDate,
  formatShortDate,
  isFutureDate,
  isoRangeBetween,
  monthLabel,
  toIsoDate,
  weekRangeOf,
  yearMonthOf,
} from "./dates";

describe("toIsoDate", () => {
  it("pads month and day", () => {
    expect(toIsoDate(new Date(2026, 0, 7))).toBe("2026-01-07");
  });
});

describe("formatShortDate", () => {
  it("matches the middle date button's format", () => {
    expect(formatShortDate("2026-09-22")).toBe("Tue, 22 Sep");
  });

  it("does not pad the day", () => {
    expect(formatShortDate("2026-09-07")).toBe("Mon, 7 Sep");
  });
});

describe("formatDisplayDate", () => {
  it("matches the reference mockup's own format", () => {
    expect(formatDisplayDate("2026-09-07")).toBe("07-Sep-2026");
  });

  it("pads a single-digit day", () => {
    expect(formatDisplayDate("2026-01-05")).toBe("05-Jan-2026");
  });
});

describe("addDays", () => {
  it("moves forward a day", () => {
    expect(addDays("2026-09-07", 1)).toBe("2026-09-08");
  });

  it("moves backward a day", () => {
    expect(addDays("2026-09-07", -1)).toBe("2026-09-06");
  });

  it("crosses a month boundary", () => {
    expect(addDays("2026-09-30", 1)).toBe("2026-10-01");
  });

  it("crosses a year boundary", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("yearMonthOf", () => {
  it("reads year and a 0-based month out of an ISO date", () => {
    expect(yearMonthOf("2026-09-07")).toEqual({ year: 2026, month: 8 });
  });
});

describe("addMonths", () => {
  it("moves forward within a year", () => {
    expect(addMonths({ year: 2026, month: 8 }, 1)).toEqual({ year: 2026, month: 9 });
  });

  it("moves backward within a year", () => {
    expect(addMonths({ year: 2026, month: 8 }, -1)).toEqual({ year: 2026, month: 7 });
  });

  it("rolls over into the next year", () => {
    expect(addMonths({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
  });

  it("rolls back into the previous year", () => {
    expect(addMonths({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
  });
});

describe("monthLabel", () => {
  it("matches the popup's header format", () => {
    expect(monthLabel({ year: 2026, month: 8 })).toBe("September 2026");
  });
});

describe("isFutureDate", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 28)); // local Sep 28 2026
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("is false for today", () => {
    expect(isFutureDate("2026-09-28")).toBe(false);
  });

  it("is false for a past date", () => {
    expect(isFutureDate("2026-09-07")).toBe(false);
  });

  it("is true for a future date", () => {
    expect(isFutureDate("2026-09-29")).toBe(true);
  });

  it("is true for a date in a later month", () => {
    expect(isFutureDate("2026-10-01")).toBe(true);
  });
});

describe("isoRangeBetween", () => {
  it("is inclusive of both ends", () => {
    expect(isoRangeBetween("2026-09-07", "2026-09-10")).toEqual([
      "2026-09-07",
      "2026-09-08",
      "2026-09-09",
      "2026-09-10",
    ]);
  });

  it("gives the same result regardless of argument order", () => {
    expect(isoRangeBetween("2026-09-10", "2026-09-07")).toEqual(isoRangeBetween("2026-09-07", "2026-09-10"));
  });

  it("is a single day when both ends are the same date", () => {
    expect(isoRangeBetween("2026-09-07", "2026-09-07")).toEqual(["2026-09-07"]);
  });

  it("crosses a month boundary", () => {
    expect(isoRangeBetween("2026-09-29", "2026-10-02")).toEqual([
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ]);
  });
});

describe("weekRangeOf", () => {
  it("spans Monday to Sunday for a date in the middle of the week", () => {
    // 2026-09-09 is a Wednesday.
    expect(weekRangeOf("2026-09-09")).toEqual({ start: "2026-09-07", end: "2026-09-13" });
  });

  it("is its own start when the date is already a Monday", () => {
    expect(weekRangeOf("2026-09-07")).toEqual({ start: "2026-09-07", end: "2026-09-13" });
  });

  it("is its own end when the date is already a Sunday", () => {
    expect(weekRangeOf("2026-09-13")).toEqual({ start: "2026-09-07", end: "2026-09-13" });
  });

  it("crosses a month boundary correctly", () => {
    // 2026-09-30 is a Wednesday; that week runs into October.
    expect(weekRangeOf("2026-09-30")).toEqual({ start: "2026-09-28", end: "2026-10-04" });
  });
});

describe("buildMonthGrid", () => {
  it("pads leading blanks so the 1st lands on its real weekday (Monday-first)", () => {
    // 1 Sep 2026 is a Tuesday — one leading blank cell (Monday).
    const grid = buildMonthGrid({ year: 2026, month: 8 });
    expect(grid[0]).toBeNull();
    expect(grid[1]).toBe("2026-09-01");
    expect(grid).toHaveLength(1 + 30); // 1 leading blank + 30 days in September
    expect(grid.at(-1)).toBe("2026-09-30");
  });

  it("has no leading blanks when the 1st is already a Monday", () => {
    // 1 Jun 2026 is a Monday.
    const grid = buildMonthGrid({ year: 2026, month: 5 });
    expect(grid[0]).toBe("2026-06-01");
  });

  it("covers a 31-day month correctly, including a Sunday 1st", () => {
    // 1 Mar 2026 is a Sunday — six leading blanks (Mon–Sat).
    const grid = buildMonthGrid({ year: 2026, month: 2 });
    expect(grid.filter((c) => c !== null)).toHaveLength(31);
    expect(grid.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(grid[6]).toBe("2026-03-01");
  });
});
