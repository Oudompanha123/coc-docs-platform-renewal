import type { IconComponent } from "./icons";
import {
  BarChartIcon,
  DocumentIcon,
  FolderIcon,
  GearIcon,
  HomeIcon,
  LayersIcon,
  PersonIcon,
  PulseIcon,
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
      { label: "Users & Roles", href: "/users-roles", icon: UsersIcon },
      { label: "Content", href: "/content", icon: DocumentIcon },
    ],
  },
];

/** Standalone item pinned above the user card at the bottom of the sidebar. */
export const NAV_BOTTOM: NavItem = { label: "Settings", href: "/settings", icon: GearIcon };

/** A nav item is active on an exact match or on any of its sub-routes. */
export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
