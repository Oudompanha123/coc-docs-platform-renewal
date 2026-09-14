import type { Role } from "@/lib/auth/api";
import type { IconComponent } from "./icons";
import {
  FolderIcon,
  HeartIcon,
  HomeIcon,
  LayersIcon,
  PlugIcon,
  PulseIcon,
  SettingsIcon,
  SparklesIcon,
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

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "WORKSPACE",
    items: [
      { label: "Projects", href: "/projects", icon: FolderIcon },
      { label: "Workspaces", href: "/workspaces", icon: LayersIcon },
    ],
  },
  {
    label: "DEVELOPER",
    items: [
      { label: "Doc Studio", href: "/doc-studio", icon: SparklesIcon },
      { label: "Integrations", href: "/integrations", icon: PlugIcon },
    ],
  },
  {
    label: "MONITORING",
    items: [
      { label: "Activity", href: "/activity", icon: PulseIcon },
      { label: "System Health", href: "/system-health", icon: HeartIcon },
    ],
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
