import { describe, expect, it } from "vitest";
import { sameCleanedRows, toRows } from "./PagesSection";
import type { AxRenewalAnalysis } from "@/lib/ax-renewal/api";

function analysisOf(overrides: Partial<AxRenewalAnalysis>): AxRenewalAnalysis {
  return {
    stackDetected: {},
    findings: [],
    pagesDetected: [],
    indexed: {},
    runningOnToday: [],
    fileLayout: [],
    moduleCoupling: {},
    recommendedStackMove: [],
    modelConnected: true,
    analyzedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("toRows", () => {
  it("uses already-saved page mappings when they exist, ignoring analysis", () => {
    const rows = toRows(
      [{ oldPath: "/products", newPath: "/catalog", notes: "renamed", position: 0 }],
      analysisOf({ pagesDetected: [{ path: "/other", purpose: "should not appear" }] }),
    );
    expect(rows).toEqual([{ oldPath: "/products", newPath: "/catalog", notes: "renamed" }]);
  });

  it("seeds from real detected pages when nothing is saved yet, leaving newPath blank", () => {
    const rows = toRows(
      [],
      analysisOf({
        pagesDetected: [{ path: "GET /products", purpose: "Lists products from the db stub" }],
      }),
    );
    expect(rows).toEqual([{ oldPath: "GET /products", newPath: "", notes: "Lists products from the db stub" }]);
  });

  it("is genuinely empty when nothing is saved and analysis detected no pages", () => {
    expect(toRows([], analysisOf({}))).toEqual([]);
    expect(toRows([], null)).toEqual([]);
  });
});

describe("sameCleanedRows", () => {
  // The guard behind "Confirm refuses when there are unsaved changes" — a
  // caller who edited a row (or added/removed one) and went straight to
  // Confirm, without pressing Save pages first, must not sign off on the
  // mapping as it stood before that edit.
  it("is true for two lists with identical rows, in the same order", () => {
    const rows = [{ oldPath: "/products", newPath: "/catalog", notes: "renamed" }];
    expect(sameCleanedRows(rows, [...rows])).toBe(true);
  });

  it("is false once a row's newPath differs", () => {
    const persisted = [{ oldPath: "/products", newPath: null, notes: null }];
    const edited = [{ oldPath: "/products", newPath: "/catalog", notes: null }];
    expect(sameCleanedRows(edited, persisted)).toBe(false);
  });

  it("is false when the lists have different lengths, e.g. a row was added but not yet saved", () => {
    expect(sameCleanedRows([{ oldPath: "/products", newPath: null, notes: null }], [])).toBe(false);
  });

  it("is true for two empty lists", () => {
    expect(sameCleanedRows([], [])).toBe(true);
  });
});
