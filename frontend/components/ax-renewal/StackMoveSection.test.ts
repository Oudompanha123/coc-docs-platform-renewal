import { describe, expect, it } from "vitest";
import { suggestRows } from "./StackMoveSection";
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
    modelConnected: true,
    analyzedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("suggestRows", () => {
  it("is empty when there is no analysis at all", () => {
    expect(suggestRows(null)).toEqual([]);
  });

  it("prefers runningOnToday, using its real label/note and leaving newTarget blank", () => {
    const rows = suggestRows(
      analysisOf({
        runningOnToday: [
          { label: "Node.js (CommonJS modules)", note: "No engines field declared" },
          { label: "JavaScript, untyped", note: null },
        ],
      }),
    );
    expect(rows).toEqual([
      { layerKey: "Node.js (CommonJS modules)", oldTarget: "No engines field declared", newTarget: "" },
      { layerKey: "JavaScript, untyped", oldTarget: "JavaScript, untyped", newTarget: "" },
    ]);
  });

  it("falls back to stackDetected when runningOnToday is empty", () => {
    const rows = suggestRows(analysisOf({ stackDetected: { runtime: "Node.js", framework: "Express 4.17" } }));
    expect(rows).toEqual([
      { layerKey: "runtime", oldTarget: "Node.js", newTarget: "" },
      { layerKey: "framework", oldTarget: "Express 4.17", newTarget: "" },
    ]);
  });

  it("is empty when analysis exists but found nothing at all (keyword stub with no manifest match)", () => {
    expect(suggestRows(analysisOf({}))).toEqual([]);
  });
});
