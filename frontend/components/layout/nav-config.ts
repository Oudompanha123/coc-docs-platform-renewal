import type { Capability, Role } from "@/lib/auth/api";
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
  PulseIcon,
  RenewIcon,
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
  /**
   * Also grants visibility, independent of `roles` — evaluated as OR, so a
   * plain `user` holding this capability still sees the item without being
   * promoted (ADR-037). A section-less item with only a capability listed
   * would be visible to anyone holding it, regardless of role.
   */
  capability?: Capability;
  /**
   * Opens in a new browser tab instead of navigating the current one, same
   * as the "View site" link pinned below the sections. Set for AX Renewal:
   * it is a separate workspace from the admin/editing screens around it, not
   * a step in the same flow, so replacing the current tab's content would
   * strand whatever the caller was doing there.
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
    ],
  },
  {
    // Its own section, not folded into ADMINISTRATION: a plain `user` who
    // only holds the `developer` capability would otherwise see a section
    // literally titled "ADMINISTRATION" over just this one link, which reads
    // wrong for an account with no account-authority role at all (ADR-037).
    label: "DEVELOPER",
    items: [
      {
        label: "AX Renewal",
        href: "/ax-renewal",
        icon: RenewIcon,
        roles: ["admin", "super_admin"],
        capability: "developer",
        newTab: true,
      },
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
 * Whether `role` (or a held `capability`) may see `item`. An unknown role
 * (still loading, or a session that carries none) sees only unrestricted
 * items — the safer default, since the alternative flashes an admin link at
 * everyone for as long as `/api/v1/auth/me` takes to answer.
 *
 * <p>`roles` and `capability` are evaluated as OR (ADR-037): an item listing
 * both is visible to a caller matching either — a plain `user` holding the
 * capability sees it without being promoted, and an admin sees it without
 * needing the capability too. The default empty `capabilities` array keeps
 * every existing role-only item's behaviour byte-for-byte unchanged.
 */
export function isNavItemVisible(
  item: NavItem,
  role: Role | null | undefined,
  capabilities: readonly Capability[] = [],
): boolean {
  if (!item.roles && !item.capability) return true;
  const roleMatches = item.roles != null && role != null && item.roles.includes(role);
  const capabilityMatches = item.capability != null && capabilities.includes(item.capability);
  return roleMatches || capabilityMatches;
}

/**
 * The sections this role (and these capabilities) may see, with the items
 * they may not see removed.
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
  role: Role | null | undefined,
  products: NavProduct[],
  capabilities: readonly Capability[] = [],
): NavSection[] {
  return [productsSection(products), ...STATIC_SECTIONS]
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => isNavItemVisible(item, role, capabilities)),
    }))
    .filter((section) => section.items.length > 0);
}
