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

  // Claude Usage's own visibility rules are covered in more depth by the
  // dedicated "Claude Usage in ADMINISTRATION" describe block below —
  // not duplicated here.
  it("shows Attendance to an admin and a super admin", () => {
    expect(labelsFor(["admin"])).toContain("Attendance");
    expect(labelsFor(["super_admin"])).toContain("Attendance");
  });

  it("hides Attendance from an ordinary user and a guest", () => {
    expect(labelsFor(["user"])).not.toContain("Attendance");
    expect(labelsFor(["guest"])).not.toContain("Attendance");
  });

  it("hides Attendance while the session is still loading", () => {
    expect(labelsFor(null)).not.toContain("Attendance");
  });

  it("drops the ADMINISTRATION heading rather than rendering it empty", () => {
    const headings = visibleNavSections(["user"], FIXTURE_PRODUCTS).map((section) => section.label);
    expect(headings).not.toContain("ADMINISTRATION");
    expect(visibleNavSections(["super_admin"], FIXTURE_PRODUCTS).map((s) => s.label)).toContain("ADMINISTRATION");

    const adminSection = (roles: Role[]) =>
      visibleNavSections(roles, FIXTURE_PRODUCTS).find((section) => section.label === "ADMINISTRATION");
    expect(adminSection(["super_admin"])?.items.map((i) => i.label)).toEqual([
      "Users & Roles",
      "Attendance",
      "Claude Usage",
      "Announcements",
    ]);
    // A plain admin (not super_admin) sees everything but Users & Roles — the
    // section survives without it, rather than dropping entirely.
    expect(adminSection(["admin"])?.items.map((i) => i.label)).toEqual([
      "Attendance",
      "Claude Usage",
      "Announcements",
    ]);
  });

  it("shows Announcements to admins only — readers get them in the bell, not the sidebar (ADR-098)", () => {
    expect(labelsFor(["admin"])).toContain("Announcements");
    expect(labelsFor(["super_admin"])).toContain("Announcements");
    expect(labelsFor(["user"])).not.toContain("Announcements");
  });

  it("builds the PRODUCTS section from the live nav structure, not a hardcoded list", () => {
    for (const role of ["admin", "super_admin"] as const) {
      expect(labelsFor([role])).toEqual(expect.arrayContaining(["Jex3.0", "Jex2.0"]));
    }

    const differentFixture: NavProduct[] = [
      { key: "brand-new", label: "Brand New", icon: "layers", minRole: "user", items: [] },
    ];
    const products = visibleNavSections(["admin"], differentFixture).find((s) => s.label === "PRODUCTS");
    expect(products?.items.map((i) => i.label)).toEqual(["Brand New"]);
  });

  it("shows PRODUCTS only to admin and super_admin — each product page is content management", () => {
    for (const role of ["guest", "user", "developer", "reviewer", "lead"] as const) {
      const headings = visibleNavSections(["user", role], FIXTURE_PRODUCTS).map((s) => s.label);
      expect(headings).not.toContain("PRODUCTS");
    }
  });

  it.each(["developer", "reviewer", "lead"] as const)(
    "leaves a %s with no sidebar sections at all (ADR-086 retired every carve-out)",
    (role) => {
      expect(visibleNavSections(["user", role], FIXTURE_PRODUCTS)).toEqual([]);
    },
  );

  it("drops the PRODUCTS heading when there are no products yet", () => {
    const headings = visibleNavSections(["admin"], []).map((section) => section.label);
    expect(headings).not.toContain("PRODUCTS");
  });

  describe("Claude Usage in ADMINISTRATION (ADR-052, further revised again)", () => {
    // Re-added under ADMINISTRATION on direct developer instruction, as a
    // second path to /claude-usage alongside MemberHeader's own role-branched
    // link (MemberHeader.test.tsx) — not a replacement of it. "My Claude
    // Usage" (the personal view, /my-claude-usage) still has no sidebar entry
    // of its own; that gap is deliberate, same reasoning as before.
    it("shows Claude Usage to admin and super_admin", () => {
      expect(labelsFor(["admin"])).toContain("Claude Usage");
      expect(labelsFor(["super_admin"])).toContain("Claude Usage");
    });

    it("hides Claude Usage from every non-admin role", () => {
      for (const roles of [["guest"], ["user"], ["developer"], ["reviewer"], ["lead"]] as const) {
        const labels = labelsFor([...roles]);
        expect(labels).not.toContain("Claude Usage");
        expect(labels).not.toContain("My Claude Usage");
      }
    });

    it("the MY WORK section no longer exists", () => {
      for (const roles of [["user"], ["admin"], ["super_admin"]] as const) {
        expect(visibleNavSections([...roles], FIXTURE_PRODUCTS).map((s) => s.label)).not.toContain("MY WORK");
      }
    });
  });

  describe("AX Renewal is gone from the sidebar", () => {
    // It used to sit alone under a DEVELOPER heading, admin/super_admin only,
    // opening in a new tab. Both the item and the section that existed to hold
    // it were removed together.
    //
    // These assert the removal rather than deleting the old cases outright: an
    // item re-added by accident — or a DEVELOPER section revived for something
    // else — should fail here and be a deliberate decision, not a silent one.
    //
    // Note what is *not* claimed. Removing the link removed no access: the
    // /ax-renewal route still exists and the backend still decides who may
    // call it, per the "Presentation only" contract on visibleNavSections.
    it.each([["super_admin"], ["admin"], ["user"], ["guest"]] as const)(
      "shows no AX Renewal item to a caller holding %s",
      (role) => {
        expect(labelsFor([role])).not.toContain("AX Renewal");
      },
    );

    it("has no DEVELOPER section for any role", () => {
      for (const roles of [["super_admin"], ["admin"], ["user"], ["developer"]] as const) {
        const headings = visibleNavSections([...roles], FIXTURE_PRODUCTS).map((s) => s.label);
        expect(headings).not.toContain("DEVELOPER");
      }
    });

    it("leaves ADMINISTRATION standing — only the one section below it went", () => {
      const headings = visibleNavSections(["super_admin"], FIXTURE_PRODUCTS).map((s) => s.label);
      expect(headings).toContain("ADMINISTRATION");
    });
  });
});
