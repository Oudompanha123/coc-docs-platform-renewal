import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth/api";
import type { NavProduct } from "@/lib/docs/nav-api";
import { visibleNavSections } from "./nav-config";

const FIXTURE_PRODUCTS: NavProduct[] = [
  { key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [] },
  { key: "jex2-0", label: "Jex2.0", icon: "folder", minRole: "user", items: [] },
];

/** Every item label these roles (all held at once, ADR-016) would see in the sidebar, flattened. */
function labelsFor(roles: Role[] | null, products: NavProduct[] = FIXTURE_PRODUCTS): string[] {
  return visibleNavSections(roles, products).flatMap((section) => section.items.map((item) => item.label));
}

describe("visibleNavSections", () => {
  it("shows Users & Roles to a super admin", () => {
    expect(labelsFor(["super_admin"])).toContain("Users & Roles");
  });

  it("hides Users & Roles from an admin", () => {
    // Not an oversight. /api/v1/admin/accounts/** and /api/v1/admin/roles/**
    // sit at a super_admin floor in SecurityConfig (FR-AUTH-008), so an admin
    // shown this link reaches a page whose every request comes back 403. The
    // sidebar's job is to be honest about what the caller can actually do.
    expect(labelsFor(["admin"])).not.toContain("Users & Roles");
  });

  it("hides Users & Roles from an ordinary user", () => {
    expect(labelsFor(["user"])).not.toContain("Users & Roles");
  });

  it("hides Users & Roles from a guest", () => {
    expect(labelsFor(["guest"])).not.toContain("Users & Roles");
  });

  it("hides Users & Roles while the session is still loading", () => {
    // Roles arrive with GET /api/v1/auth/me, so they are null on first paint.
    // Defaulting to hidden keeps the link from flashing at everyone.
    expect(labelsFor(null)).not.toContain("Users & Roles");
  });

  it("shows Claude Usage to an admin and a super admin", () => {
    expect(labelsFor(["admin"])).toContain("Claude Usage");
    expect(labelsFor(["super_admin"])).toContain("Claude Usage");
  });

  it("hides Claude Usage from an ordinary user and a guest", () => {
    expect(labelsFor(["user"])).not.toContain("Claude Usage");
    expect(labelsFor(["guest"])).not.toContain("Claude Usage");
  });

  it("hides Claude Usage while the session is still loading", () => {
    expect(labelsFor(null)).not.toContain("Claude Usage");
  });

  it("drops the ADMINISTRATION heading rather than rendering it empty", () => {
    const headings = visibleNavSections(["user"], FIXTURE_PRODUCTS).map((section) => section.label);
    expect(headings).not.toContain("ADMINISTRATION");
    expect(visibleNavSections(["super_admin"], FIXTURE_PRODUCTS).map((s) => s.label)).toContain("ADMINISTRATION");

    const adminSection = (roles: Role[]) =>
      visibleNavSections(roles, FIXTURE_PRODUCTS).find((section) => section.label === "ADMINISTRATION");
    expect(adminSection(["super_admin"])?.items.map((i) => i.label)).toEqual([
      "Users & Roles",
      "Claude Usage",
      "Integrations",
    ]);
    expect(adminSection(["admin"])?.items.map((i) => i.label)).toEqual(["Claude Usage"]);
  });

  it("builds the PRODUCTS section from the live nav structure, not a hardcoded list", () => {
    for (const role of ["guest", "user", "admin", "super_admin"] as const) {
      expect(labelsFor([role])).toEqual(expect.arrayContaining(["Jex3.0", "Jex2.0"]));
    }

    const differentFixture: NavProduct[] = [
      { key: "brand-new", label: "Brand New", icon: "layers", minRole: "user", items: [] },
    ];
    expect(labelsFor(["user"], differentFixture)).toEqual(["Brand New"]);
  });

  it("drops the PRODUCTS heading when there are no products yet", () => {
    const headings = visibleNavSections(["user"], []).map((section) => section.label);
    expect(headings).not.toContain("PRODUCTS");
  });

  describe("AX Renewal (ADR-037, roles revised by ADR-039)", () => {
    it("shows it to an admin and a super admin with no other role needed", () => {
      expect(labelsFor(["admin"])).toContain("AX Renewal");
      expect(labelsFor(["super_admin"])).toContain("AX Renewal");
    });

    it("hides it from a plain user holding no other role", () => {
      expect(labelsFor(["user"])).not.toContain("AX Renewal");
    });

    it("shows it to a plain user who also holds the developer role", () => {
      expect(labelsFor(["user", "developer"])).toContain("AX Renewal");
    });

    it("does not promote a developer-role user into seeing admin-only items", () => {
      const labels = labelsFor(["user", "developer"]);
      expect(labels).not.toContain("Users & Roles");
      expect(labels).not.toContain("Claude Usage");
    });

    it("lives in its own DEVELOPER section, not folded into ADMINISTRATION", () => {
      const sections = visibleNavSections(["user", "developer"], FIXTURE_PRODUCTS);
      const developerSection = sections.find((s) => s.label === "DEVELOPER");
      expect(developerSection?.items.map((i) => i.label)).toEqual(["AX Renewal"]);
      expect(sections.map((s) => s.label)).not.toContain("ADMINISTRATION");
    });

    it("drops the DEVELOPER heading for a caller who holds none of the qualifying roles", () => {
      const headings = visibleNavSections(["user"], FIXTURE_PRODUCTS).map((s) => s.label);
      expect(headings).not.toContain("DEVELOPER");
    });

    it("opens in a new tab rather than replacing the current one", () => {
      const sections = visibleNavSections(["super_admin"], FIXTURE_PRODUCTS);
      const developerSection = sections.find((s) => s.label === "DEVELOPER");
      const axRenewal = developerSection?.items.find((i) => i.label === "AX Renewal");
      expect(axRenewal?.newTab).toBe(true);
    });
  });
});
