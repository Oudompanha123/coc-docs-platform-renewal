import type { Role } from "@/lib/auth/api";
import type { IconComponent } from "./icons";
import {
  BarChartIcon,
  FolderIcon,
  HomeIcon,
  LayersIcon,
  PersonIcon,
  PulseIcon,
  SettingsIcon,
  UsersIcon,
} from "./icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconComponent;
  /**
   * Roles allowed to see this item. Omitted means every signed-in user sees
   * it. Listed roles are exact, not a floor — the hierarchy that makes
   * `super_admin` imply `admin` lives in the backend's authorization rules,
   * and duplicating it here would mean two places to keep in step.
   */
  roles?: readonly Role[];
};

/** Jex3.0's real sub-item labels, verified against content/en/jex3.0.tsx
 *  during the Phase 1 audit. Slugs match the routes under app/jex3-0/.
 *  Exported (with `slug`) so app/jex3-0/[slug]/page.tsx can look up a
 *  label without duplicating this list. Not rendered in the admin sidebar
 *  itself (that's the /jex3-0 management table's job) — this list only
 *  feeds the stub-page lookup and the content-editor registry. */
export const JEX3_SUB_ITEMS_RAW = [
  { label: "Overview", slug: "overview" },
  { label: "Get started", slug: "get-started" },
  { label: "How to use", slug: "how-to-use" },
  { label: "Flow", slug: "flow" },
  { label: "Structure", slug: "structure" },
  { label: "Updating", slug: "updating" },
  { label: "Releases", slug: "releases" },
  { label: "FAQ", slug: "faq" },
  { label: "Prerequisites", slug: "prerequisites" },
  { label: "Run configs", slug: "run-configs" },
  { label: "From scratch", slug: "from-scratch" },
  { label: "Verify", slug: "verify" },
];

export type NavSection = {
  label: string;
  items: NavItem[];
};

/** Standalone item above the grouped sections — the dashboard home. */
export const NAV_TOP: NavItem = { label: "Overview", href: "/overview", icon: HomeIcon };

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "PRODUCTS",
    items: [
      { label: "Jex3.0", href: "/jex3-0", icon: LayersIcon },
      { label: "Jex2.0", href: "/jex2-0", icon: FolderIcon },
      { label: "Coach", href: "/coach", icon: PersonIcon },
      { label: "Team", href: "/team", icon: PulseIcon },
    ],
  },
  {
    label: "MONITORING",
    // Repoints to the content-management table for the "Usage" product
    // (Dashboard/Setup guide/Configuration) — the real Claude Code Usage
    // dashboard still exists at /claude-usage, just no longer linked here,
    // per explicit confirmation.
    items: [{ label: "Usage", href: "/usage", icon: BarChartIcon }],
  },
  {
    label: "ADMINISTRATION",
    items: [
      // super_admin alone, not admin. Every call this page makes goes to
      // /api/v1/admin/accounts/** or /api/v1/admin/roles/**, and SecurityConfig
      // puts both at a super_admin floor per FR-AUTH-008 — an admin publishes
      // content; granting roles is a different kind of authority. Listing
      // "admin" here showed them a link to a page that 403s on every request.
      { label: "Users & Roles", href: "/users-roles", icon: UsersIcon, roles: ["super_admin"] },
    ],
  },
];

/** Standalone item pinned above the user card at the bottom of the sidebar. */
export const NAV_BOTTOM: NavItem = { label: "Settings", href: "/settings", icon: SettingsIcon };

/** A nav item is active on an exact match, on any of its sub-routes, or —
 *  for a product item — while editing one of that product's own sub-items.
 *  The edit form lives at /content/<productKey>--<slug>, a route that
 *  shares no URL prefix with the product's own pages (/jex3-0, /jex2-0,
 *  ...), so without this the sidebar goes dark the moment you click Edit. */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href || pathname.startsWith(`${href}/`)) return true;
  const editMatch = pathname.match(/^\/content\/([^/]+)--/);
  return editMatch != null && href === `/${editMatch[1]}`;
}

/**
 * Whether `role` may see `item`. An unknown role (still loading, or a session
 * that carries none) sees only the unrestricted items — the safer default,
 * since the alternative flashes an admin link at everyone for as long as
 * `/api/v1/auth/me` takes to answer.
 */
export function isNavItemVisible(item: NavItem, role: Role | null | undefined): boolean {
  if (!item.roles) return true;
  return role != null && item.roles.includes(role);
}

/**
 * The sections this role may see, with the items they may not see removed.
 *
 * <p>A section left with no items is dropped rather than rendered empty,
 * otherwise a `user` would still see the "ADMINISTRATION" heading standing
 * alone over nothing — which advertises the existence of the very thing being
 * hidden.
 *
 * <p><b>Presentation only.</b> Hiding a link is not authorization: the routes
 * behind these items are enforced server-side on every request, where the role
 * is read from the `account` row rather than taken from the client. This makes
 * the sidebar honest about what the caller can actually do; it is not what
 * stops them doing it.
 */
export function visibleNavSections(role: Role | null | undefined): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => isNavItemVisible(item, role)),
  })).filter((section) => section.items.length > 0);
}
