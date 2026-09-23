import { describe, expect, it } from "vitest";
import { suggestSummary } from "./ArchitectureSection";
import type { AxRenewalAnalysis, AxRenewalStackLayer } from "@/lib/ax-renewal/api";

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

describe("suggestSummary", () => {
  it("is empty when there is no analysis and no decided stack layers", () => {
    expect(suggestSummary(null, [])).toBe("");
  });

  it("lists only layers where a real newTarget decision was actually entered", () => {
    const layers: AxRenewalStackLayer[] = [
      { layerKey: "Runtime", oldTarget: "Node 12", newTarget: "Node 22 LTS", position: 0 },
      { layerKey: "Styling", oldTarget: "Bootstrap 3", newTarget: "Bootstrap 3", position: 1 },
      { layerKey: "Testing", oldTarget: null, newTarget: null, position: 2 },
    ];
    const summary = suggestSummary(null, layers);
    expect(summary).toContain("Runtime: Node 12 → Node 22 LTS");
    expect(summary).not.toContain("Styling");
    expect(summary).not.toContain("Testing");
  });

  it("includes real hubs and cycles a connected model actually traced", () => {
    const summary = suggestSummary(
      analysisOf({
        moduleCoupling: {
          modules: ["src/db.js", "controllers/orders.js", "controllers/users.js"],
          hubs: [0],
          cycles: [[1, 2]],
        },
      }),
      [],
    );
    expect(summary).toContain("src/db.js is a hub");
    expect(summary).toContain("controllers/orders.js and controllers/users.js import each other");
  });

  it("never references an index the model didn't actually name a module for", () => {
    const summary = suggestSummary(analysisOf({ moduleCoupling: { hubs: [0], cycles: [[0, 1]] } }), []);
    expect(summary).toBe("");
  });
});
