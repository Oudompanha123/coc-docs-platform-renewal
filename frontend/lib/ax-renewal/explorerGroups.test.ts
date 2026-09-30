import { describe, expect, it } from "vitest";
import { buildExplorerGroups } from "./explorerGroups";
import type { AxRenewalProjectDetail } from "./api";

const BASE_DETAIL: AxRenewalProjectDetail = {
  project: {
    id: "p1",
    name: "Test",
    description: null,
    status: "draft",
    manifestFilename: null,
    manifestAttachedAt: null,
    attachStats: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    revision: 0,
    member: true,
  },
  analysis: null,
  stackLayers: [],
  architecture: null,
  pageMappings: [],
  dbChanges: [],
  dbConnection: null,
  destination: null,
  confirmations: {},
  latestImplementationRun: null,
  comments: [],
  members: [],
};

function workspaceItems(role?: "guest" | "user" | "admin" | "super_admin" | null) {
  const groups = buildExplorerGroups(BASE_DETAIL, role);
  return groups.find((g) => g.label === "Workspace")?.items.map((i) => i.key) ?? [];
}

describe("buildExplorerGroups — Workspace group", () => {
  it("always includes AI engine, regardless of role", () => {
    expect(workspaceItems("user")).toContain("ai-engine");
    expect(workspaceItems(null)).toContain("ai-engine");
    expect(workspaceItems("super_admin")).toContain("ai-engine");
  });

  it("includes Audit trail only for a super admin", () => {
    expect(workspaceItems("super_admin")).toContain("audit-trail");
  });

  it("hides Audit trail from an admin, a plain user, and an unknown role", () => {
    expect(workspaceItems("admin")).not.toContain("audit-trail");
    expect(workspaceItems("user")).not.toContain("audit-trail");
    expect(workspaceItems(null)).not.toContain("audit-trail");
    expect(workspaceItems(undefined)).not.toContain("audit-trail");
  });

  it("includes Members for every role — a reader not on the team needs to know who to ask (ADR-069)", () => {
    for (const role of ["user", "admin", "super_admin", null] as const) {
      expect(workspaceItems(role)).toContain("members");
    }
  });

  it("counts the project's members on the Members item", () => {
    const detail: AxRenewalProjectDetail = {
      ...BASE_DETAIL,
      members: [
        { accountId: "u1", displayName: "Dara", addedAt: "2026-09-01T00:00:00Z" },
        { accountId: "u2", displayName: "Sokha", addedAt: "2026-09-02T00:00:00Z" },
      ],
    };
    const members = buildExplorerGroups(detail, "user")
      .find((g) => g.label === "Workspace")
      ?.items.find((i) => i.key === "members");
    expect(members?.count).toBe(2);
  });

  it("returns no groups at all when there is no project detail yet", () => {
    expect(buildExplorerGroups(null, "super_admin")).toEqual([]);
  });
});

describe("buildExplorerGroups — Understand group's Pages item", () => {
  function pagesItem(analysis: AxRenewalProjectDetail["analysis"]) {
    const groups = buildExplorerGroups({ ...BASE_DETAIL, analysis }, "super_admin");
    return groups.find((g) => g.label === "Understand")?.items.find((i) => i.key === "understand-pages");
  }

  it("stays locked with no undefined count before analysis has ever run", () => {
    const item = pagesItem(null);
    expect(item?.locked).toBe(true);
    expect(item?.count).toBeUndefined();
  });

  it("unlocks and shows a real count — even zero — once analysis has run", () => {
    const item = pagesItem({
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
    });
    expect(item?.locked).toBe(false);
    expect(item?.count).toBe(0);
  });

  it("counts every page analysis actually detected", () => {
    const item = pagesItem({
      stackDetected: {},
      findings: [],
      pagesDetected: [
        { path: "/products", purpose: "Product listing" },
        { path: "/checkout", purpose: "Checkout flow" },
      ],
      indexed: {},
      runningOnToday: [],
      fileLayout: [],
      moduleCoupling: {},
      recommendedStackMove: [],
      modelConnected: true,
      analyzedAt: "2026-01-01T00:00:00Z",
    });
    expect(item?.count).toBe(2);
  });
});

describe("buildExplorerGroups — Build group's Run Locally lock (ADR-048)", () => {
  function runLocallyLocked(latestImplementationRun: AxRenewalProjectDetail["latestImplementationRun"]) {
    const groups = buildExplorerGroups({ ...BASE_DETAIL, latestImplementationRun }, "super_admin");
    const item = groups.find((g) => g.label === "Build")?.items.find((i) => i.key === "run-locally");
    return item?.locked;
  }

  it("stays locked with no implementation run at all", () => {
    expect(runLocallyLocked(null)).toBe(true);
  });

  it("stays locked while a run is only awaiting review, not yet applied", () => {
    expect(
      runLocallyLocked({
        id: "r1",
        status: "awaiting_review",
        runKind: "plan",
        instruction: null,
        beforeReport: null,
        afterReport: null,
        startedAt: "2026-01-01T00:00:00Z",
        completedAt: null,
        failureReason: null,
      }),
    ).toBe(true);
  });

  it("unlocks once the latest run has actually reached applied", () => {
    expect(
      runLocallyLocked({
        id: "r1",
        status: "applied",
        runKind: "plan",
        instruction: null,
        beforeReport: null,
        afterReport: null,
        startedAt: "2026-01-01T00:00:00Z",
        completedAt: "2026-01-01T00:05:00Z",
        failureReason: null,
      }),
    ).toBe(false);
  });

  it("re-locks once a rebuild starts, even though an earlier run was applied", () => {
    // The rebuild itself is "the latest run" now, and it is not applied yet --
    // the destination is presumed mid-change again until it is.
    expect(
      runLocallyLocked({
        id: "r2",
        status: "generating",
        runKind: "plan",
        instruction: null,
        beforeReport: null,
        afterReport: null,
        startedAt: "2026-01-02T00:00:00Z",
        completedAt: null,
        failureReason: null,
      }),
    ).toBe(true);
  });
});
