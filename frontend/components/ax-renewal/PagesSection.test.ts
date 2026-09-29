import { describe, expect, it } from "vitest";
import { toRows } from "./PagesSection";
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
