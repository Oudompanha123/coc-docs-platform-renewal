import { describe, expect, it } from "vitest";
import { findRecommendation, recommendationStatus, sameRows, suggestRows } from "./StackMoveSection";
import type { AxRenewalAnalysis, AxRenewalStackRecommendation } from "@/lib/ax-renewal/api";

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

function recommendationOf(overrides: Partial<AxRenewalStackRecommendation>): AxRenewalStackRecommendation {
  return {
    layerKey: "Runtime",
    recommendedTarget: "Node.js 22 LTS",
    alternativeTargets: [],
    why: "Node 12 has been end of life for years — no security patches.",
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

  // suggestRows itself never seeds newTarget from a recommendation (see the
  // test above) -- the AI hint is looked up separately, at render time, by
  // findRecommendation below, so it stays visible even once a row's own
  // newTarget has been saved or hand-typed.
  it("still leaves newTarget blank even when a recommendation exists for that same layer", () => {
    const rows = suggestRows(
      analysisOf({
        runningOnToday: [{ label: "Runtime", note: "Node 12, end of life" }],
        recommendedStackMove: [recommendationOf({ layerKey: "Runtime", recommendedTarget: "Node.js 22 LTS" })],
      }),
    );
    expect(rows).toEqual([{ layerKey: "Runtime", oldTarget: "Node 12, end of life", newTarget: "" }]);
  });
});

describe("findRecommendation", () => {
  it("is null when nothing was recommended for this layer, e.g. the keyword-stub path's always-empty list", () => {
    expect(findRecommendation("Runtime", [])).toBeNull();
  });

  it("finds the one entry whose layerKey matches, e.g. Node.js 12 → Node.js 22 LTS", () => {
    const recommendations = [
      recommendationOf({ layerKey: "Runtime", recommendedTarget: "Node.js 22 LTS" }),
      recommendationOf({ layerKey: "Language", recommendedTarget: "TypeScript 5.6" }),
    ];

    expect(findRecommendation("Runtime", recommendations)).toEqual(
      recommendationOf({ layerKey: "Runtime", recommendedTarget: "Node.js 22 LTS" }),
    );
    expect(findRecommendation("Language", recommendations)?.recommendedTarget).toBe("TypeScript 5.6");
  });

  it("is null for a layer nothing was recommended for, even when other layers have one", () => {
    const recommendations = [recommendationOf({ layerKey: "Runtime" })];

    expect(findRecommendation("Styling", recommendations)).toBeNull();
  });
});

describe("recommendationStatus", () => {
  it("says to run analysis first when there is none at all", () => {
    const status = recommendationStatus("Runtime", null);

    expect(status).toEqual({ kind: "unavailable", reason: expect.stringContaining("Run analysis") });
  });

  it("says no model is connected on the keyword-stub path, even with layers to show", () => {
    const status = recommendationStatus(
      "Runtime",
      analysisOf({ modelConnected: false, runningOnToday: [{ label: "Runtime", note: "Node 12" }] }),
    );

    expect(status).toEqual({ kind: "unavailable", reason: expect.stringContaining("No AI model is connected") });
  });

  it("shows a real recommendation — Node.js 12 → Node.js 22 LTS — when the model gave one", () => {
    const status = recommendationStatus(
      "Runtime",
      analysisOf({
        recommendedStackMove: [
          recommendationOf({
            layerKey: "Runtime",
            recommendedTarget: "Node.js 22 LTS",
            alternativeTargets: ["Bun 1.2", "Deno 2"],
            why: "Node 12 has been end of life for years.",
          }),
        ],
      }),
    );

    expect(status).toEqual({
      kind: "recommended",
      recommendation: recommendationOf({
        layerKey: "Runtime",
        recommendedTarget: "Node.js 22 LTS",
        alternativeTargets: ["Bun 1.2", "Deno 2"],
        why: "Node 12 has been end of life for years.",
      }),
    });
  });

  it("uses the model's own reason when it explicitly reported no confident successor (recommendedTarget: null)", () => {
    const status = recommendationStatus(
      "Data access",
      analysisOf({
        recommendedStackMove: [
          recommendationOf({
            layerKey: "Data access",
            recommendedTarget: null,
            why: "Couldn't tell which ORM, if any, would fit without seeing the query patterns.",
          }),
        ],
      }),
    );

    expect(status).toEqual({
      kind: "unavailable",
      reason: "Couldn't tell which ORM, if any, would fit without seeing the query patterns.",
    });
  });

  it("falls back to a generic, still-honest reason when the model reported null with no why", () => {
    const status = recommendationStatus(
      "Data access",
      analysisOf({
        recommendedStackMove: [recommendationOf({ layerKey: "Data access", recommendedTarget: null, why: "" })],
      }),
    );

    expect(status).toEqual({
      kind: "unavailable",
      reason: expect.stringContaining("didn't have enough evidence"),
    });
  });

  it("falls back to the same generic reason when a connected model ran but never reported this layer at all", () => {
    const status = recommendationStatus(
      "Styling",
      analysisOf({ recommendedStackMove: [recommendationOf({ layerKey: "Runtime" })] }),
    );

    expect(status).toEqual({
      kind: "unavailable",
      reason: expect.stringContaining("didn't have enough evidence"),
    });
  });
});

describe("sameRows", () => {
  // The guard behind "Confirm refuses when there are unsaved changes": a
  // caller who picked a target pill (updating only the component's own
  // state) and went straight to Confirm, without pressing Save stack move
  // first, must not have that confirmed against the plan as it stood before
  // that pick — this is the exact comparison that catches it.
  it("is true for two lists with identical rows, in the same order", () => {
    const rows = [
      { layerKey: "Runtime", oldTarget: "Node 12", newTarget: "Node 22 LTS" },
      { layerKey: "Language", oldTarget: "JavaScript", newTarget: "" },
    ];
    expect(sameRows(rows, [...rows])).toBe(true);
  });

  it("is false once a row's newTarget differs — the exact shape a picked-but-unsaved pill leaves behind", () => {
    const persisted = [{ layerKey: "Runtime", oldTarget: "Node 12", newTarget: "" }];
    const picked = [{ layerKey: "Runtime", oldTarget: "Node 12", newTarget: "Node 22 LTS" }];
    expect(sameRows(picked, persisted)).toBe(false);
  });

  it("is false when the lists have different lengths", () => {
    expect(sameRows([{ layerKey: "Runtime", oldTarget: "Node 12", newTarget: "" }], [])).toBe(false);
  });

  it("is true for two empty lists", () => {
    expect(sameRows([], [])).toBe(true);
  });
});
