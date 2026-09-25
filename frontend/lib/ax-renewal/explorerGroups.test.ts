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

  it("returns no groups at all when there is no project detail yet", () => {
    expect(buildExplorerGroups(null, "super_admin")).toEqual([]);
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
        beforeReport: null,
        afterReport: null,
        startedAt: "2026-01-02T00:00:00Z",
        completedAt: null,
        failureReason: null,
      }),
    ).toBe(true);
  });
});
