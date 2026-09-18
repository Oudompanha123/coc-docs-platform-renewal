import type { Role } from "@/lib/auth/api";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { IconComponent } from "./icons";
import {
  BarChartIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  LayersIcon,
  PersonIcon,
  PlugIcon,
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
      // admin and super_admin: unlike Users & Roles, this page is a
      // team-wide usage/cost monitor, not an account-authority tool, so it
      // sits at the same floor as everything else an admin manages.
      { label: "Claude Usage", href: "/claude-usage", icon: BarChartIcon, roles: ["admin", "super_admin"] },
      // super_admin only, same floor as Users & Roles: every action on this
      // page (connect/test/rotate/disconnect) stores, rotates or discards a
      // signing secret, or makes a live outbound call to an admin-supplied
      // URL (ADR-037) — the backend enforces this at super_admin regardless,
      // but showing the link to a plain admin would land them on a page
      // where nothing is clickable except a read-only list.
      { label: "Integrations", href: "/integrations", icon: PlugIcon, roles: ["super_admin"] },
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
export function visibleNavSections(role: Role | null | undefined, products: NavProduct[]): NavSection[] {
  return [productsSection(products), ...STATIC_SECTIONS]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isNavItemVisible(item, role)),
    }))
    .filter((section) => section.items.length > 0);
}
