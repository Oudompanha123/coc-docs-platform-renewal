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
