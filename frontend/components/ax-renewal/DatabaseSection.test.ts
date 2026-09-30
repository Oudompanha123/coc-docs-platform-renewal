import { describe, expect, it } from "vitest";
import { sameCleanedChangeRows } from "./DatabaseSection";

describe("sameCleanedChangeRows", () => {
  // The guard behind "Confirm refuses when there are unsaved changes" — a
  // caller who edited a planned-change row (or added/removed one) and went
  // straight to Confirm, without pressing Save planned changes first, must
  // not sign off on the plan as it stood before that edit.
  it("is true for two lists with identical rows, in the same order", () => {
    const rows = [{ changeType: "add_column", tableName: "orders", rationale: "track cancellation reason" }];
    expect(sameCleanedChangeRows(rows, [...rows])).toBe(true);
  });

  it("is false once a row's rationale differs", () => {
    const persisted = [{ changeType: "add_column", tableName: "orders", rationale: null }];
    const edited = [{ changeType: "add_column", tableName: "orders", rationale: "track cancellation reason" }];
    expect(sameCleanedChangeRows(edited, persisted)).toBe(false);
  });

  it("is false when the lists have different lengths, e.g. a row was added but not yet saved", () => {
    expect(
      sameCleanedChangeRows([{ changeType: "add_index", tableName: "orders", rationale: null }], []),
    ).toBe(false);
  });

  it("is true for two empty lists", () => {
    expect(sameCleanedChangeRows([], [])).toBe(true);
  });
});
