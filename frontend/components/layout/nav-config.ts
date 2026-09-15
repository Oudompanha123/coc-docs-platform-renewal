import type { Role } from "@/lib/auth/api";
import type { IconComponent } from "./icons";
import {
  BarChartIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  LayersIcon,
  PersonIcon,
  PulseIcon,
  SettingsIcon,
  SparklesIcon,
  UsersIcon,
} from "./icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconComponent;
  /** Shown as an indented, always-visible list directly under this item
   *  whenever it (or one of these) is active — not a dropdown/tab, matching
   *  the sidebar's existing "everything visible" convention. */
  subItems?: { label: string; href: string }[];
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
 *  label without duplicating this list. */
export const JEX3_SUB_ITEMS_RAW = [
  { label: "Overview", slug: "" },
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

const JEX3_SUB_ITEMS = JEX3_SUB_ITEMS_RAW.map((item) => ({
  label: item.label,
  href: item.slug ? `/jex3-0/${item.slug}` : "/jex3-0",
}));

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
      { label: "Jex3.0", href: "/jex3-0", icon: LayersIcon, subItems: JEX3_SUB_ITEMS },
      { label: "Jex2.0", href: "/docs/jex2-0", icon: FolderIcon },
      { label: "Coach", href: "/docs/coach", icon: PersonIcon },
      { label: "IDEA", href: "/docs/idea", icon: SparklesIcon },
      { label: "Workflow", href: "/docs/workflow", icon: PulseIcon },
    ],
  },
  {
    label: "MONITORING",
    items: [{ label: "Usage", href: "/claude-usage", icon: BarChartIcon }],
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
      { label: "Content", href: "/content", icon: DocumentIcon },
    ],
  },
];

/** Standalone item pinned above the user card at the bottom of the sidebar. */
export const NAV_BOTTOM: NavItem = { label: "Settings", href: "/settings", icon: SettingsIcon };

/** A nav item is active on an exact match or on any of its sub-routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
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
