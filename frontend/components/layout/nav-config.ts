import type { Role } from "@/lib/auth/api";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { IconComponent } from "./icons";
import {
  BarChartIcon,
  CalendarCheckIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  LayersIcon,
  MegaphoneIcon,
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
   * Roles allowed to see this item — visible if the signed-in caller holds
   * ANY of these (ADR-016: an account can hold more than one role at once,
   * e.g. `admin` + `developer`), not just their single highest-ranked role.
   * Omitted means every signed-in user sees it. Listed roles are exact, not a
   * floor — the hierarchy that makes `super_admin` imply `admin` lives in the
   * backend's authorization rules, and duplicating it here would mean two
   * places to keep in step.
   */
  roles?: readonly Role[];
  /**
   * Opens in a new browser tab instead of navigating the current one, same
   * as the "View site" link pinned below the sections. For an item that is a
   * separate workspace rather than a step in the same flow, where replacing
   * the current tab's content would strand whatever the caller was doing.
   *
   * <p>No item sets it today. AX Renewal, the one that did, was removed from
   * the sidebar; the option stays because `Sidebar`'s `NavLink` still honours
   * it and the next separate-workspace link will want it.
   */
  newTab?: boolean;
};

export type NavSection = {
  label: string;
  items: NavItem[];
};

/** Standalone item above the grouped sections — the dashboard home. */
export const NAV_TOP: NavItem = { label: "Overview", href: "/overview", icon: HomeIcon };

/** String icon key (as stored by nav-api.ts) -> icon component. Reused by
 *  app/[productKey]/page.tsx for the same product icon shown here. */
export const PRODUCT_ICONS: Record<string, IconComponent> = {
  document: DocumentIcon,
  layers: LayersIcon,
  users: UsersIcon,
  database: DatabaseIcon,
  folder: FolderIcon,
  person: PersonIcon,
  pulse: PulseIcon,
  barChart: BarChartIcon,
};

/** The PRODUCTS section, built from the live nav structure (nav-api.ts)
 *  instead of a hardcoded list — sub-items are added directly from each
 *  product's own content-management page (ProductContentTable's "+ Add
 *  item"), not a separate nav-management screen. */
function productsSection(products: NavProduct[]): NavSection {
  return {
    label: "PRODUCTS",
    items: products.map((product) => ({
      label: product.label,
      href: `/${product.key}`,
      icon: PRODUCT_ICONS[product.icon] ?? LayersIcon,
      // Each product's page is content management — admin/super_admin only,
      // in RequireSession and in the /api/v1/admin/** floor behind it.
      roles: ["admin", "super_admin"] as const,
    })),
  };
}

const STATIC_SECTIONS: NavSection[] = [
  {
    label: "ADMINISTRATION",
    items: [
      // super_admin alone, not admin. Every call this page makes goes to
      // /api/v1/admin/accounts/** or /api/v1/admin/roles/**, and SecurityConfig
      // puts both at a super_admin floor per FR-AUTH-008 — an admin publishes
      // content; granting roles is a different kind of authority. Listing
      // "admin" here showed them a link to a page that 403s on every request.
      { label: "Users & Roles", href: "/users-roles", icon: UsersIcon, roles: ["super_admin"] },
      // super_admin alone (ADR-100): the whole team's clock-ins are personal
      // data about other people, not editorial work. The API under
      // /api/v1/admin/attendance/** sits at the same floor.
      { label: "Attendance", href: "/attendance", icon: CalendarCheckIcon, roles: ["super_admin"] },
      // super_admin alone (ADR-100), for the same reason as Attendance: the
      // team's spend and roster. An admin still sees their own usage in
      // Settings' Claude Usage section, like any other account. The personal
      // view (`/my-claude-usage`) is deliberately not listed here.
      { label: "Claude Usage", href: "/claude-usage", icon: BarChartIcon, roles: ["super_admin"] },
      // admin and super_admin: writing an announcement is editorial work, the
      // same /api/v1/admin/** admin floor publishing a page sits at (ADR-098).
      { label: "Announcements", href: "/announcements", icon: MegaphoneIcon, roles: ["admin", "super_admin"] },
    ],
  },
  // No DEVELOPER section any more. It existed to hold one item, the AX Renewal
  // workspace link, and both went together — a section left with no items is
  // dropped by `visibleNavSections` anyway, so keeping the heading behind would
  // have rendered nothing while still reading as live config.
  //
  // This removes the sidebar's advertisement of the workspace, not access to
  // it: /ax-renewal is still a route, and who may call it is still decided by
  // the backend on every request, not by what this file lists.
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
 * Whether any role in `roles` may see `item`. An unknown/empty set (still
 * loading, or a session that carries none) sees only unrestricted items —
 * the safer default, since the alternative flashes an admin link at everyone
 * for as long as `/api/v1/auth/me` takes to answer.
 *
 * <p>Every role held (ADR-016), not just the highest-ranked one — a plain
 * `user` who also holds `developer` sees a `developer`-listed item without
 * being promoted, and an `admin` sees it without needing `developer` too.
 */
export function isNavItemVisible(item: NavItem, roles: readonly Role[] | null | undefined): boolean {
  if (!item.roles) return true;
  if (roles == null) return false;
  return item.roles.some((r) => roles.includes(r));
}

/**
 * The sections these roles may see, with the items they may not see removed.
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
export function visibleNavSections(
  roles: readonly Role[] | null | undefined,
  products: NavProduct[],
): NavSection[] {
  return [productsSection(products), ...STATIC_SECTIONS]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isNavItemVisible(item, roles)),
    }))
    .filter((section) => section.items.length > 0);
}
