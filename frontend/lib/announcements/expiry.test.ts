import { describe, expect, it } from "vitest";
import { isExpiryPast, joinExpiry, presetExpiry, relativeExpiry, splitExpiry, timeOptions } from "./expiry";

describe("announcement expiry helpers", () => {
  it("round-trips a local day and time through an ISO instant", () => {
    const iso = joinExpiry("2026-10-09", "18:30");
    expect(iso).not.toBeNull();
    expect(splitExpiry(iso!)).toEqual({ date: "2026-10-09", time: "18:30" });
  });

  it("returns nothing rather than a wrong date for garbage", () => {
    expect(joinExpiry("not-a-date", "18:30")).toBeNull();
    expect(joinExpiry("2026-10-09", "")).toBeNull();
    expect(splitExpiry("not-a-date")).toBeNull();
  });

  it("puts a preset the right number of days out, rounded up to the next half hour", () => {
    const now = new Date(2026, 9, 7, 14, 7);
    expect(splitExpiry(presetExpiry("1d", now))).toEqual({ date: "2026-10-08", time: "14:30" });
    expect(splitExpiry(presetExpiry("7d", now))).toEqual({ date: "2026-10-14", time: "14:30" });
    expect(splitExpiry(presetExpiry("30d", new Date(2026, 9, 7, 9, 0)))).toEqual({ date: "2026-11-06", time: "09:00" });
  });

  it("offers every half hour, plus an off-grid time already saved", () => {
    expect(timeOptions()).toHaveLength(48);
    expect(timeOptions()[0]).toBe("00:00");
    expect(timeOptions("18:07")).toContain("18:07");
    expect(timeOptions("18:07").indexOf("18:07")).toBe(timeOptions("18:07").indexOf("18:00") + 1);
  });

  it("describes how long is left in words", () => {
    const now = new Date(2026, 9, 7, 12, 0);
    expect(relativeExpiry(new Date(2026, 9, 7, 12, 45).toISOString(), now)).toBe("in 45 minutes");
    expect(relativeExpiry(new Date(2026, 9, 7, 18, 0).toISOString(), now)).toBe("in 6 hours");
    expect(relativeExpiry(new Date(2026, 9, 10, 12, 0).toISOString(), now)).toBe("in 3 days");
    expect(relativeExpiry(new Date(2026, 9, 7, 11, 0).toISOString(), now)).toBe("already passed");
  });

  it("flags an expiry that is not in the future, and never a missing one", () => {
    const now = new Date(2026, 9, 7, 12, 0);
    expect(isExpiryPast(new Date(2026, 9, 7, 11, 59).toISOString(), now)).toBe(true);
    expect(isExpiryPast(new Date(2026, 9, 7, 12, 1).toISOString(), now)).toBe(false);
    expect(isExpiryPast(null, now)).toBe(false);
  });
});
