import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth/api";
import { visibleNavSections } from "./nav-config";

/** Every item label a role would see in the sidebar, flattened. */
function labelsFor(role: Role | null): string[] {
  return visibleNavSections(role).flatMap((section) => section.items.map((item) => item.label));
}

describe("visibleNavSections", () => {
  it("shows Users & Roles to a super admin", () => {
    expect(labelsFor("super_admin")).toContain("Users & Roles");
  });

  it("hides Users & Roles from an admin", () => {
    // Not an oversight. /api/v1/admin/accounts/** and /api/v1/admin/roles/**
    // sit at a super_admin floor in SecurityConfig (FR-AUTH-008), so an admin
    // shown this link reaches a page whose every request comes back 403. The
    // sidebar's job is to be honest about what the caller can actually do.
    expect(labelsFor("admin")).not.toContain("Users & Roles");
  });

  it("hides Users & Roles from an ordinary user", () => {
    expect(labelsFor("user")).not.toContain("Users & Roles");
  });

  it("hides Users & Roles from a guest", () => {
    expect(labelsFor("guest")).not.toContain("Users & Roles");
  });

  it("hides Users & Roles while the session is still loading", () => {
    // The role arrives with GET /api/v1/auth/me, so it is null on first paint.
    // Defaulting to hidden keeps the link from flashing at everyone.
    expect(labelsFor(null)).not.toContain("Users & Roles");
  });

  it("drops the ADMINISTRATION heading rather than rendering it empty", () => {
    // Content moved out of ADMINISTRATION and into its own per-product admin
    // pages, so Users & Roles is the section's only item again — meaning it's
    // the empty-section path (not the filter-within-a-section one) that's
    // actually exercised for a non-super-admin now.
    const headings = visibleNavSections("user").map((section) => section.label);
    expect(headings).not.toContain("ADMINISTRATION");
    expect(visibleNavSections("super_admin").map((s) => s.label)).toContain("ADMINISTRATION");

    const adminSection = (role: Role) =>
      visibleNavSections(role).find((section) => section.label === "ADMINISTRATION");
    expect(adminSection("super_admin")?.items.map((i) => i.label)).toEqual(["Users & Roles"]);
  });

  it("leaves unrestricted items visible to every role", () => {
    for (const role of ["guest", "user", "admin", "super_admin"] as const) {
      expect(labelsFor(role)).toEqual(expect.arrayContaining(["Jex3.0", "Usage"]));
    }
  });
});
