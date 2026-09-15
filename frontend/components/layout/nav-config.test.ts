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

  it("filters within a section rather than hiding the whole section", () => {
    // ADMINISTRATION used to vanish for a non-super-admin, because Users & Roles
    // was the only item in it. It now also holds Content, which carries no role
    // restriction, so the heading stays and only the restricted item goes.
    //
    // The empty-section path in visibleNavSections still exists and is still
    // wanted — no current section happens to exercise it, and saying so beats
    // an assertion that passes for the wrong reason.
    const adminSection = (role: Role) =>
      visibleNavSections(role).find((section) => section.label === "ADMINISTRATION");

    expect(adminSection("user")?.items.map((i) => i.label)).toEqual(["Content"]);
    expect(adminSection("super_admin")?.items.map((i) => i.label)).toEqual([
      "Users & Roles",
      "Content",
    ]);
  });

  it("leaves unrestricted items visible to every role", () => {
    for (const role of ["guest", "user", "admin", "super_admin"] as const) {
      expect(labelsFor(role)).toEqual(expect.arrayContaining(["Jex3.0", "Usage", "Content"]));
    }
  });
});
