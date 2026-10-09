import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth/api";
import type { NavGroupConfig, NavItemOverrideConfig, NavProduct } from "@/lib/docs/nav-api";
import { visibleNavSections } from "./nav-config";

const FIXTURE_PRODUCTS: NavProduct[] = [
  { key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [] },
  { key: "jex2-0", label: "Jex2.0", icon: "folder", minRole: "user", items: [] },
];

/** Every item label these roles (all held at once, ADR-016) would see in the sidebar, flattened. */
function labelsFor(
  roles: Role[] | null,
  products: NavProduct[] = FIXTURE_PRODUCTS,
  groups: NavGroupConfig[] = [],
  itemOverrides: NavItemOverrideConfig[] = [],
): string[] {
  return visibleNavSections(roles, products, groups, itemOverrides).flatMap((section) => section.items.map((item) => item.label));
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
  it("shows Attendance to a super admin only, not an admin (ADR-100)", () => {
    expect(labelsFor(["admin"])).not.toContain("Attendance");
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
      "Legal pages",
    ]);
    // A plain admin (not super_admin) sees Announcements and Legal pages —
    // the section survives with those, rather than dropping entirely.
    // Attendance/Claude Usage stay super_admin-only (ADR-100); Legal pages is
    // visible to admin too since it's read-only there, not a write surface.
    expect(adminSection(["admin"])?.items.map((i) => i.label)).toEqual(["Announcements", "Legal pages"]);
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
    it("shows Claude Usage to a super_admin only, not an admin (ADR-100)", () => {
      expect(labelsFor(["admin"])).not.toContain("Claude Usage");
      expect(labelsFor(["super_admin"])).toContain("Claude Usage");
    });

    it("hides Claude Usage from every non-admin role", () => {
      for (const roles of [["guest"], ["user"], ["developer"], ["reviewer"], ["lead"]] as const) {
        const labels = labelsFor([...roles]);
        expect(labels).not.toContain("Claude Usage");
        expect(labels).not.toContain("My Claude Usage");
      }
    });
  });

  describe("Legal pages in ADMINISTRATION", () => {
    // Both roles see the nav link — admin is read-only once inside
    // (LegalPagesAdminPage's own canEditLegalPages check, plus the backend
    // narrowing writes to super_admin); the sidebar only ever grants-or-hides
    // the whole page, never a read/write split within it.
    it("shows Legal pages to admin and super_admin", () => {
      expect(labelsFor(["admin"])).toContain("Legal pages");
      expect(labelsFor(["super_admin"])).toContain("Legal pages");
    });

    it("hides Legal pages from every non-admin role", () => {
      for (const roles of [["guest"], ["user"], ["developer"], ["reviewer"], ["lead"]] as const) {
        expect(labelsFor([...roles])).not.toContain("Legal pages");
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

  describe("sidebar kebab menu: groups + item overrides", () => {
    function group(overrides: Partial<NavGroupConfig> = {}): NavGroupConfig {
      return { id: "g1", name: "DEVELOPER", builtin: true, sortOrder: 2, ...overrides };
    }

    function override(overrides: Partial<NavItemOverrideConfig> = {}): NavItemOverrideConfig {
      return { itemKey: "/legal-pages", customLabel: null, groupId: null, sortOrder: null, ...overrides };
    }

    it("uses the custom label when an item has a rename override", () => {
      const labels = labelsFor(["super_admin"], FIXTURE_PRODUCTS, [], [override({ customLabel: "Legal Docs" })]);
      expect(labels).toContain("Legal Docs");
      expect(labels).not.toContain("Legal pages");
    });

    it("moves an item into a built-in group that would otherwise be empty and hidden", () => {
      const sections = visibleNavSections(
        ["super_admin"],
        FIXTURE_PRODUCTS,
        [group({ id: "dev-1", name: "DEVELOPER", builtin: true, sortOrder: 2 })],
        [override({ groupId: "dev-1" })],
      );
      const developer = sections.find((s) => s.label === "DEVELOPER");
      const administration = sections.find((s) => s.label === "ADMINISTRATION");
      expect(developer?.items.map((i) => i.label)).toContain("Legal pages");
      expect(administration?.items.map((i) => i.label)).not.toContain("Legal pages");
    });

    it("moves an item into a custom group", () => {
      const sections = visibleNavSections(
        ["super_admin"],
        FIXTURE_PRODUCTS,
        [group({ id: "custom-1", name: "LEGAL TEAM", builtin: false, sortOrder: 3 })],
        [override({ groupId: "custom-1" })],
      );
      expect(sections.find((s) => s.label === "LEGAL TEAM")?.items.map((i) => i.label)).toEqual(["Legal pages"]);
    });

    it("hides a group with no items moved into it, even though it exists", () => {
      const sections = visibleNavSections(
        ["super_admin"],
        FIXTURE_PRODUCTS,
        [group({ id: "custom-1", name: "EMPTY GROUP", builtin: false, sortOrder: 3 })],
        [],
      );
      expect(sections.map((s) => s.label)).not.toContain("EMPTY GROUP");
    });

    it("keeps default (never-moved) items in their natural code order ahead of anything moved in", () => {
      const sections = visibleNavSections(
        ["super_admin"],
        FIXTURE_PRODUCTS,
        [],
        [override({ itemKey: "/users-roles", groupId: null, customLabel: "People" })],
      );
      const administration = sections.find((s) => s.label === "ADMINISTRATION");
      // Renaming alone never moves an item — it stays at its original index.
      expect(administration?.items[0]?.label).toBe("People");
    });

    it("orders items moved into the same group by their assigned sortOrder", () => {
      const sections = visibleNavSections(
        ["super_admin"],
        FIXTURE_PRODUCTS,
        [group({ id: "custom-1", name: "LEGAL TEAM", builtin: false, sortOrder: 3 })],
        [
          override({ itemKey: "/announcements", groupId: "custom-1", sortOrder: 2 }),
          override({ itemKey: "/legal-pages", groupId: "custom-1", sortOrder: 1 }),
        ],
      );
      expect(sections.find((s) => s.label === "LEGAL TEAM")?.items.map((i) => i.label)).toEqual([
        "Legal pages",
        "Announcements",
      ]);
    });

    it("tags every ADMINISTRATION-block item and every product item for the kebab menu", () => {
      const sections = visibleNavSections(["super_admin"], FIXTURE_PRODUCTS);
      const administration = sections.find((s) => s.label === "ADMINISTRATION");
      const products = sections.find((s) => s.label === "PRODUCTS");
      expect(administration?.items.every((i) => i.kebab?.kind === "static")).toBe(true);
      expect(products?.items.every((i) => i.kebab?.kind === "product")).toBe(true);
    });

    it("never tags Overview or Settings for the kebab menu — they sit outside the scrollable group block", () => {
      // NAV_TOP/NAV_BOTTOM aren't part of visibleNavSections' output at all;
      // this just documents that nothing here can accidentally reintroduce one.
      const sections = visibleNavSections(["super_admin"], FIXTURE_PRODUCTS);
      const allLabels = sections.flatMap((s) => s.items.map((i) => i.label));
      expect(allLabels).not.toContain("Overview");
      expect(allLabels).not.toContain("Settings");
    });
  });
});
