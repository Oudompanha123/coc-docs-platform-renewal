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
    items: [{ label: "Users & Roles", href: "/users-roles", icon: UsersIcon }],
  },
];

/** Standalone item pinned above the user card at the bottom of the sidebar. */
export const NAV_BOTTOM: NavItem = { label: "Settings", href: "/settings", icon: SettingsIcon };

/** A nav item is active on an exact match or on any of its sub-routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
