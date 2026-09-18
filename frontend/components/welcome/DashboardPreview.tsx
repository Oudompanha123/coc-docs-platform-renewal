"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AVATAR_GRADIENTS, TONE_STYLES } from "@/components/dashboard/tone";
import {
  BarChartIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentIcon,
  FolderIcon,
  LayersIcon,
  MailIcon,
  MoonIcon,
  PersonIcon,
  PlugIcon,
  PlusIcon,
  PulseIcon,
  RingIcon,
  UserPlusIcon,
} from "@/components/layout/icons";
import { EmptyContentIllustration } from "@/components/docs/editor/EmptyContentIllustration";
import { NAV_BOTTOM, NAV_TOP, PRODUCT_ICONS, visibleNavSections } from "@/components/layout/nav-config";
import { FALLBACK_NAV, type NavProduct } from "@/lib/docs/nav-api";
import { QUICK_ACTIONS, type Tone } from "@/lib/mock/overview";

/** A hardcoded exception, not read from FALLBACK_NAV — "ssss" is local test
 *  data an admin created in this dev environment's real database, not a
 *  fixed nav entry the shared source knows about. Included here only
 *  because it was explicitly asked for after confirming FALLBACK_NAV has no
 *  such entry; it won't track a rename/removal of that real test product,
 *  unlike everything else in this file. No sub-items, matching what the
 *  real sidebar shows for it. */
const SSSS_PRODUCT: NavProduct = { key: "ssss", label: "ssss", icon: "document", minRole: "user", items: [] };

/** The PRODUCTS list this mock cycles through — FALLBACK_NAV plus the one
 *  hardcoded exception above. */
const MOCK_PRODUCTS: NavProduct[] = [...FALLBACK_NAV, SSSS_PRODUCT];

/** The real sidebar's ADMINISTRATION section, read via the same
 *  `visibleNavSections` the real sidebar calls — not a second hardcoded
 *  list — so an item added/removed there shows up here on next render with
 *  no edit needed in this file. "super_admin" because that's who
 *  `PREVIEW_ACCOUNT` below impersonates; every item in that section is
 *  visible to a super_admin, so nothing is filtered out that a real
 *  super_admin wouldn't also see. */
const ADMINISTRATION_SECTION = visibleNavSections("super_admin", FALLBACK_NAV).find(
  (section) => section.label === "ADMINISTRATION",
);

/** The full real menu order the active pill cycles through — Overview,
 *  then every PRODUCTS item (including the "ssss" exception above), then
 *  every ADMINISTRATION item. The real sidebar's "+ Add product" control
 *  is rendered separately, below, as a static (non-cycling) row in its
 *  real position — it's a permanent affordance, not a nav destination, so
 *  it was never meant to be one of the animated steps. */
const SIDEBAR_ITEMS = [
  NAV_TOP,
  ...MOCK_PRODUCTS.map((product) => ({
    label: product.label,
    href: `/${product.key}`,
    icon: PRODUCT_ICONS[product.icon] ?? LayersIcon,
  })),
  ...(ADMINISTRATION_SECTION?.items ?? []),
];

/** The standalone workspace-dashboard link above PRODUCTS is labelled
 *  "Overview" in the real admin sidebar (NAV_TOP) — this public page uses
 *  "Home" instead, since a visitor here isn't inside the admin workspace
 *  the word "Overview" refers to. The icon is still NAV_TOP's own, just the
 *  text is overridden locally; NAV_TOP itself (and the real sidebar) is
 *  untouched. */
const HOME_LABEL = "Home";

/** How many of a product's sub-items the content panel's document-list
 *  step shows — capped so a product with a long item list (Jex3.0 has 12)
 *  doesn't blow out the mock's proportions. The sidebar itself no longer
 *  expands sub-items under the active product (removed per request); this
 *  only bounds the content-area list. */
const EXPANDED_ITEM_COUNT = 6;

/** Illustrative per-product documentation-coverage counts — the same "written
 *  / total sub-items" shape `computeProductStats` computes live on the real
 *  Overview page, reproduced here as static numbers since this preview is a
 *  decorative mock, not a live-fetching component (ADR-013: content/copy
 *  only, not a second live consumer of the real API). */
type PreviewStat = {
  key: string;
  label: string;
  value: string;
  trend: string;
  icon: typeof LayersIcon;
  tone: Tone;
};

const PREVIEW_STATS: PreviewStat[] = [
  { key: "jex3-0", label: "Jex3.0", value: "8 / 11", trend: "3 not written", icon: LayersIcon, tone: "purple" },
  { key: "jex2-0", label: "Jex2.0", value: "5 / 5", trend: "All written", icon: FolderIcon, tone: "green" },
  { key: "coach", label: "Coach", value: "0 / 10", trend: "10 not written", icon: PersonIcon, tone: "orange" },
  { key: "team", label: "Team", value: "0 / 7", trend: "7 not written", icon: PulseIcon, tone: "pink" },
  { key: "usage", label: "Usage", value: "0 / 3", trend: "3 not written", icon: BarChartIcon, tone: "purple" },
  { key: "ssss", label: "ssss", value: "0 / 0", trend: "0 not written", icon: DocumentIcon, tone: "green" },
];

/** The sidebar footer and header user chip show the real signed-in
 *  account's name/role rather than lib/mock/overview.ts's CURRENT_USER
 *  ("System Admin"), matching the real Overview page's current chip. Kept
 *  local to this component rather than changed on CURRENT_USER itself,
 *  since that constant also backs the unrelated Settings → Profile card. */
const PREVIEW_ACCOUNT = { initials: "NC", name: "Neo Chanthy", role: "Super Admin", tone: "purple" as Tone };

type PreviewActivityStatus = "signIn" | "signOut";

/** Illustrative sample rows, not live data (ADR-013) — generic ".example"
 *  emails (the same placeholder-domain convention CURRENT_USER's own mock
 *  email already uses), not another real account's actual address. */
const PREVIEW_ACTIVITY: {
  email: string;
  initials: string;
  tone: Tone;
  description: string;
  status: PreviewActivityStatus;
  timeAgo: string;
}[] = [
  { email: "admin@cocdocs.example", initials: "A", tone: "purple", description: "Signed in successfully", status: "signIn", timeAgo: "4m ago" },
  { email: "admin@cocdocs.example", initials: "A", tone: "purple", description: "Signed out", status: "signOut", timeAgo: "5m ago" },
  { email: "teammate@cocdocs.example", initials: "T", tone: "green", description: "Signed in successfully", status: "signIn", timeAgo: "6m ago" },
];

const ACTIVITY_STATUS_STYLE: Record<PreviewActivityStatus, { icon: typeof CheckCircleIcon; className: string }> = {
  signIn: { icon: CheckCircleIcon, className: "text-[#1f9d6b]" },
  signOut: { icon: RingIcon, className: "text-[#e0873c]" },
};

/** Illustrative accounts for the "Users & Roles" step's own content layout
 *  — not real accounts (ADR-013), generic .example emails matching the
 *  convention every other mock row in this file already uses. Shape
 *  mirrors AccountsTable's real columns (Name, Email, Role, Status, Last
 *  Login) condensed into one row each. */
const PREVIEW_ACCOUNTS: { name: string; email: string; role: string; status: string; lastLogin: string; tone: Tone }[] = [
  { name: "Neo Chanthy", email: "neo.chanthy@cocdocs.example", role: "Super Admin", status: "Active", lastLogin: "Today, 9:04", tone: "purple" },
  { name: "Admin User", email: "admin@cocdocs.example", role: "Admin", status: "Active", lastLogin: "Yesterday, 17:10", tone: "orange" },
  { name: "Sam Reader", email: "sam@cocdocs.example", role: "User", status: "Pending", lastLogin: "Never", tone: "green" },
];

/** Illustrative per-teammate token usage for the "Claude Usage" step's own
 *  content layout — same non-live illustrative status as everything else
 *  in this file, not any of the real names/emails the real page's own
 *  screenshot showed. */
const PREVIEW_USAGE_ROWS: { name: string; email: string; tokens: string; tone: Tone }[] = [
  { name: "Neo Chanthy", email: "neo.chanthy@cocdocs.example", tokens: "1.2M", tone: "purple" },
  { name: "Admin User", email: "admin@cocdocs.example", tokens: "480K", tone: "orange" },
  { name: "Sam Reader", email: "sam@cocdocs.example", tokens: "95K", tone: "green" },
];

/** The condensed stat row for the "Claude Usage" step — same 4 metrics the
 *  real page leads with, illustrative numbers. */
const CLAUDE_USAGE_STATS: { label: string; value: string }[] = [
  { label: "Total tokens", value: "360.6K" },
  { label: "API cost", value: "$29.47" },
  { label: "Active users", value: "5 of 5" },
  { label: "Near limit", value: "0" },
];

/** The condensed "Daily tokens by user" mini bar chart's days and legend —
 *  illustrative, not a real week's data. */
const CLAUDE_USAGE_CHART_DAYS: { day: string; pct: number }[] = [
  { day: "Mon", pct: 18 },
  { day: "Tue", pct: 32 },
  { day: "Wed", pct: 14 },
  { day: "Thu", pct: 95 },
  { day: "Fri", pct: 40 },
];

const CLAUDE_USAGE_LEGEND: { name: string; tone: Tone }[] = [
  { name: "Teammate A", tone: "purple" },
  { name: "Teammate B", tone: "green" },
  { name: "Teammate C", tone: "orange" },
];

const QUICK_ACTION_ICONS = {
  plus: PlusIcon,
  userPlus: UserPlusIcon,
  plug: PlugIcon,
  barChart: BarChartIcon,
} as const;

/** Jex3.0's real first four sub-items (nav-api.ts's FALLBACK_NAV), shown as
 *  already-written — an illustrative snapshot, not a live read. */
const PREVIEW_DOCS: { title: string; initials: string; tone: Tone }[] = [
  { title: "Overview", initials: "OV", tone: "purple" },
  { title: "Get started", initials: "GS", tone: "green" },
  { title: "How to use", initials: "HT", tone: "orange" },
  { title: "Flow", initials: "FL", tone: "pink" },
];

/** How long the active pill dwells on each of `SIDEBAR_ITEMS`' entries
 *  before sliding to the next — shorter than a 2-3-item loop would need, so
 *  a full pass around all of them doesn't feel like it's dragging, but
 *  still long enough each stop reads as a deliberate pause rather than a
 *  flicker. The content panel below now follows this same index rather
 *  than cycling on its own timer, so this is the only pacing knob left. */
const SIDEBAR_DWELL_MS = 2600;

/** The content panel's header subtitle for whichever `SIDEBAR_ITEMS` index
 *  is currently active — illustrative copy per item, not pulled from real
 *  data (there's nothing to read: a subtitle is presentation, not a nav
 *  data field). Products get the same "Manage X's knowledge base content"
 *  wording the real per-product admin page uses; Administration items get
 *  their own real page's subtitle; Overview keeps its existing copy. */
function subtitleForNavIndex(index: number): string {
  if (index === 0) return "Your documentation workspace at a glance";
  const productIndex = index - 1;
  const product = MOCK_PRODUCTS[productIndex];
  if (product) return `Manage ${product.label}'s knowledge base content`;
  const adminItem = ADMINISTRATION_SECTION?.items[index - 1 - MOCK_PRODUCTS.length];
  if (adminItem?.label === "Users & Roles") return "Manage who has access to Coc Docs Platform and what they can do";
  if (adminItem?.label === "Claude Usage") {
    return "Track opt-in Claude Code usage and estimated API-equivalent cost across your team";
  }
  return "";
}

/** Which `PREVIEW_STATS` card reads as "in focus" for the active index —
 *  only the product rows have a matching stat card; Overview and the
 *  Administration items highlight nothing. */
function highlightStatKeyForNavIndex(index: number): string {
  return MOCK_PRODUCTS[index - 1]?.key ?? "";
}

/**
 * Miniature, read-only replica of the real admin sidebar + Overview page —
 * built from the same nav-config.ts and lib/mock/overview.ts the actual
 * pages render, so this hero visual updates itself instead of going stale
 * next to the real app.
 *
 * The sidebar column stays dark regardless of `theme`, matching the real
 * app (its sidebar is always dark navy, in both admin light and dark mode).
 * Only the browser-frame chrome and main content panel switch — using
 * literal hex rather than the admin's data-theme tokens, since this public
 * page sits outside [data-shell="admin"], the only scope those target; the
 * dark values reuse the exact hex the admin toggle already defines.
 */
export function DashboardPreview({ theme }: { theme: "light" | "dark" }) {
  const isDark = theme === "dark";

  const navColumnRef = useRef<HTMLDivElement>(null);
  // Keyed by each item's index in SIDEBAR_ITEMS rather than one named ref
  // per item — the list is built dynamically from real nav data, so its
  // length (and which row is which index) isn't fixed at write time.
  const navItemRefs = useRef<Map<number, HTMLSpanElement>>(new Map());
  const [navPositions, setNavPositions] = useState<{ top: number; height: number }[]>([]);
  const [activeNavIndex, setActiveNavIndex] = useState(0);

  function setNavItemRef(index: number, el: HTMLSpanElement | null) {
    if (el) navItemRefs.current.set(index, el);
    else navItemRefs.current.delete(index);
  }

  useLayoutEffect(() => {
    function measure() {
      const positions = SIDEBAR_ITEMS.map((_, index) => {
        const el = navItemRefs.current.get(index);
        return el ? { top: el.offsetTop, height: el.offsetHeight } : null;
      });
      if (positions.some((p) => p === null)) return;
      setNavPositions(positions as { top: number; height: number }[]);
    }
    measure();
    const column = navColumnRef.current;
    if (!column) return;
    const observer = new ResizeObserver(measure);
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  // Skipped outright under reduced-motion, rather than just dropping the
  // CSS transition on an unchanged interval — the requirement is one
  // static state and no cycling, not a snap instead of a slide. The
  // content panel has no interval of its own: it derives everything below
  // from `activeNavIndex` directly, so it switches in lockstep with the
  // sidebar pill rather than drifting on a separate timer.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setActiveNavIndex((i) => (i + 1) % SIDEBAR_ITEMS.length), SIDEBAR_DWELL_MS);
    return () => clearInterval(id);
  }, []);

  const activeItem = SIDEBAR_ITEMS[activeNavIndex] ?? NAV_TOP;
  const FrameIcon = activeItem.icon;
  // The real Claude Usage page's own <h1> reads "Claude Code Usage" — one
  // word longer than the sidebar nav label ("Claude Usage") that links to
  // it. The sidebar row below reads `item.label` directly, so this override
  // only affects the content header, never the nav link's own text.
  const frameTitle =
    activeNavIndex === 0
      ? HOME_LABEL
      : activeItem.label === "Claude Usage"
        ? "Claude Code Usage"
        : activeItem.label;
  const frameSubtitle = subtitleForNavIndex(activeNavIndex);
  const highlightStatKey = highlightStatKeyForNavIndex(activeNavIndex);

  // Which of the three content layouts is active — the stat-card dashboard
  // (Overview only), a product's own document list, or one of the two
  // Administration mini-mocks. Exactly one of these three is ever defined
  // for a given `activeNavIndex`, since SIDEBAR_ITEMS' three sections don't
  // overlap.
  const isOverviewStep = activeNavIndex === 0;
  const activeProduct = MOCK_PRODUCTS[activeNavIndex - 1];
  const activeAdminItem = ADMINISTRATION_SECTION?.items[activeNavIndex - 1 - MOCK_PRODUCTS.length];

  return (
    <div
      className={`overflow-hidden rounded-[10px] border shadow-2xl ${
        isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
      }`}
    >
      <div
        className={`flex items-center gap-1.5 border-b px-4 py-2.5 ${
          isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
        }`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>

      <div className="flex">
        <div className="hidden w-40 shrink-0 flex-col bg-sidebar px-3 py-4 sm:flex">
          <div className="flex items-center gap-2 px-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-purple to-brand-blue text-[9px] font-bold text-white">
              CD
            </div>
            <span className="truncate text-[11px] font-semibold text-white">Coc Docs Platform</span>
          </div>

          <div ref={navColumnRef} className="relative mt-4 flex-1 space-y-4">
            {navPositions[activeNavIndex] && (
              <span
                aria-hidden="true"
                className="absolute right-0 left-0 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue transition-[top,height] duration-500 ease-in-out"
                style={{ top: navPositions[activeNavIndex].top, height: navPositions[activeNavIndex].height }}
              />
            )}

            <span
              ref={(el) => setNavItemRef(0, el)}
              className={`relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors duration-300 ${
                activeNavIndex === 0 ? "text-white" : "text-sidebar-muted"
              }`}
            >
              <NAV_TOP.icon className="h-3.5 w-3.5" />
              {HOME_LABEL}
            </span>

            <div className="flex flex-col gap-1">
              <p className="px-2.5 text-[9px] font-semibold tracking-wider text-sidebar-muted/70">PRODUCTS</p>
              {MOCK_PRODUCTS.map((product, productIndex) => {
                const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
                // +1: index 0 in SIDEBAR_ITEMS is Home/Overview, so the
                // first product is index 1.
                const navIndex = 1 + productIndex;
                const isActive = activeNavIndex === navIndex;
                return (
                  <span
                    key={product.key}
                    ref={(el) => setNavItemRef(navIndex, el)}
                    className={`relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-300 ${
                      isActive ? "text-white" : "text-sidebar-muted"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {product.label}
                  </span>
                );
              })}

              {/* Static, non-cycling — the real "+ Add product" affordance
                  is a permanent control, not a nav destination, so it was
                  never one of the animated steps. */}
              <span className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted">
                <PlusIcon className="h-3.5 w-3.5" />
                Add product
              </span>
            </div>

            {ADMINISTRATION_SECTION && (
              <div className="flex flex-col gap-1">
                <p className="px-2.5 text-[9px] font-semibold tracking-wider text-sidebar-muted/70">
                  {ADMINISTRATION_SECTION.label}
                </p>
                {ADMINISTRATION_SECTION.items.map((item, itemIndex) => {
                  // +1 for Home, + MOCK_PRODUCTS.length for the PRODUCTS
                  // rows already counted above.
                  const navIndex = 1 + MOCK_PRODUCTS.length + itemIndex;
                  const isActive = activeNavIndex === navIndex;
                  return (
                    <span
                      key={item.href}
                      ref={(el) => setNavItemRef(navIndex, el)}
                      className={`relative flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors duration-300 ${
                        isActive ? "text-white" : "text-sidebar-muted"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <span className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted">
              <NAV_BOTTOM.icon className="h-3.5 w-3.5" />
              {NAV_BOTTOM.label}
            </span>

            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[PREVIEW_ACCOUNT.tone]}`}
              >
                {PREVIEW_ACCOUNT.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-white">{PREVIEW_ACCOUNT.name}</p>
                <p className="truncate text-[9px] text-sidebar-muted">{PREVIEW_ACCOUNT.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${isDark ? "bg-[#161226]" : "bg-page"}`}>
          <div key={activeNavIndex} className="animate-entrance flex flex-1 flex-col">
          {/* Distinct white header bar with a bottom border, matching the
              real admin shell's own Topbar (components/layout/Topbar.tsx:
              "flex items-center justify-between border-b border-border
              bg-white px-4 py-4 ...") — previously this row just floated on
              the same gray body background as the content below it. */}
          <div
            className={`flex items-center justify-between gap-2 border-b px-4 py-2.5 sm:px-5 ${
              isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
            }`}
          >
            <div className="flex min-w-0 items-center gap-2">
              <FrameIcon className="h-4 w-4 shrink-0 text-brand-purple" />
              <div className="min-w-0">
                <h3 className={`text-sm font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>{frameTitle}</h3>
                <p className={`truncate text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{frameSubtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md ${isDark ? "bg-white/10 text-[#a79fc9]" : "bg-gray-100 text-dash-ink/70"}`}
              >
                <MoonIcon className="h-3 w-3" />
              </div>
              <div
                className={`relative flex h-5 w-5 items-center justify-center rounded-md ${isDark ? "bg-white/10 text-[#a79fc9]" : "bg-gray-100 text-dash-ink/70"}`}
              >
                <BellIcon className="h-3 w-3" />
                <span className="absolute -right-0.5 -top-0.5 flex h-[10px] min-w-[10px] items-center justify-center rounded-full bg-danger text-[6px] font-bold text-white">
                  5
                </span>
              </div>
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-md ${isDark ? "bg-white/10 text-[#a79fc9]" : "bg-gray-100 text-dash-ink/70"}`}
              >
                <MailIcon className="h-3 w-3" />
              </div>
              <div className={`ml-1 flex items-center gap-1 rounded-md px-1 py-0.5 ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[7px] font-semibold text-white ${AVATAR_GRADIENTS[PREVIEW_ACCOUNT.tone]}`}
                >
                  {PREVIEW_ACCOUNT.initials}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className={`truncate text-[8px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                    {PREVIEW_ACCOUNT.name}
                  </p>
                  <p className={`truncate text-[7px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{PREVIEW_ACCOUNT.role}</p>
                </div>
                <ChevronDownIcon className={`hidden h-2.5 w-2.5 shrink-0 sm:block ${isDark ? "text-[#a79fc9]" : "text-muted"}`} />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5">

          {isOverviewStep && (
          <>
          <div className="grid grid-cols-5 gap-2">
            {PREVIEW_STATS.map((stat) => {
              const Icon = stat.icon;
              const isHighlighted = stat.key === highlightStatKey;
              return (
                <div
                  key={stat.key}
                  className={`rounded-[10px] border p-2.5 transition-all duration-300 ${
                    isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
                  } ${isHighlighted ? "scale-[1.04] ring-2 ring-brand-purple shadow-md" : ""}`}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-white ${AVATAR_GRADIENTS[stat.tone]}`}
                    >
                      <Icon className="h-3 w-3" />
                    </div>
                    <p
                      className={`truncate text-[8px] font-semibold uppercase tracking-wide ${
                        isDark ? "text-[#a79fc9]" : "text-muted"
                      }`}
                    >
                      {stat.label}
                    </p>
                  </div>
                  <p className={`mt-1.5 truncate text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                    {stat.value}
                  </p>
                  <p className={`truncate text-[8px] font-semibold ${isDark ? "text-[#3ddb9c]" : "text-[#1f9d6b]"}`}>
                    {stat.trend}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = QUICK_ACTION_ICONS[action.icon];
              const tone = TONE_STYLES[action.tone];
              return (
                <div
                  key={action.id}
                  className={`flex items-center gap-1.5 rounded-[10px] border p-2 ${
                    isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
                  }`}
                >
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${tone.bg} ${tone.fg}`}>
                    <Icon className="h-3 w-3" />
                  </div>
                  <p className={`truncate text-[9px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                    {action.title}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-[65fr_35fr] gap-2.5">
            <div className={`rounded-[10px] border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Recent Documents</p>
                <span className="text-[9px] font-semibold text-brand-purple">View all</span>
              </div>
              <div className={`mt-2 divide-y ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
                {PREVIEW_DOCS.map((doc) => (
                  <div key={doc.title} className="flex items-center gap-2 py-1.5">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[doc.tone]}`}
                    >
                      {doc.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[11px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                        {doc.title}
                      </p>
                      <p className={`truncate text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>Jex3.0</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        isDark ? "bg-[#1f9d6b]/20 text-[#3ddb9c]" : "bg-[#e1f5ec] text-[#1f9d6b]"
                      }`}
                    >
                      Has content
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-[10px] border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
              <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Recent Activity</p>
              <div className={`mt-2 divide-y ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
                {PREVIEW_ACTIVITY.map((activity, i) => {
                  const StatusIcon = ACTIVITY_STATUS_STYLE[activity.status].icon;
                  return (
                    <div key={i} className="flex items-start gap-2 py-1.5">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[activity.tone]}`}
                      >
                        {activity.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[10px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                          {activity.email}
                        </p>
                        <p className={`truncate text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{activity.description}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[8px] text-muted">
                          <StatusIcon className={`h-2.5 w-2.5 shrink-0 ${ACTIVITY_STATUS_STYLE[activity.status].className}`} />
                          {activity.timeAgo}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          </>
          )}

          {activeProduct && (
            <div className={`rounded-[10px] border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
              <div className="flex items-center justify-between">
                <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>{activeProduct.label} items</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-2 py-1 text-[9px] font-semibold text-white">
                  <PlusIcon className="h-2.5 w-2.5" />
                  Add Item
                </span>
              </div>
              {/* Empty state matches the real per-product admin page's own
                  empty state exactly (same illustration component, same
                  copy from ProductContentTable.tsx) — not a generic "no
                  items" placeholder — scaled down to fit the mock. */}
              {activeProduct.items.length === 0 && (
                <div className="scale-[0.55] py-1 text-center [transform-origin:top]">
                  <EmptyContentIllustration />
                  <h4 className={`mt-3 text-sm font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>No content found</h4>
                  <p className={`mx-auto mt-1 max-w-[220px] text-xs ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                    Start building &quot;{activeProduct.label}&quot;&apos;s knowledge base by adding your first content
                    item. You can create a new page, upload a document, or embed a resource.
                  </p>
                </div>
              )}

              <div className={`mt-2 divide-y ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
                {activeProduct.items.slice(0, EXPANDED_ITEM_COUNT).map((item, i, arr) => {
                  const hasContent = i < arr.length - 1;
                  return (
                    <div key={item.slug || "index"} className="flex items-center justify-between gap-2 py-1.5">
                      <p className={`truncate text-[10px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                        {item.label}
                      </p>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            hasContent
                              ? isDark
                                ? "bg-[#1f9d6b]/20 text-[#3ddb9c]"
                                : "bg-[#e1f5ec] text-[#1f9d6b]"
                              : isDark
                                ? "bg-white/10 text-[#a79fc9]"
                                : "bg-page text-muted"
                          }`}
                        >
                          {hasContent ? "Has content" : "Not written"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                            isDark ? "border-[#332e4d] text-[#f2effa]" : "border-border text-dash-ink"
                          }`}
                        >
                          {hasContent ? "Edit" : "+ Write"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeAdminItem && activeAdminItem.label === "Users & Roles" && (
            <div className={`rounded-[10px] border ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
              {/* Tab row — Users active, matching the real page's tab bar */}
              <div className={`flex items-center gap-4 border-b px-3 pt-2.5 ${isDark ? "border-[#332e4d]" : "border-border"}`}>
                <span className="relative pb-2 text-[10px] font-bold text-brand-purple">
                  Users
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
                </span>
                <span className={`pb-2 text-[10px] font-medium ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>Pending</span>
                <span className={`pb-2 text-[10px] font-medium ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>Roles</span>
              </div>

              {/* Search + Add user row */}
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span
                  className={`flex-1 truncate rounded-lg border px-2 py-1 text-[8px] ${
                    isDark ? "border-[#332e4d] text-[#a79fc9]" : "border-border text-muted"
                  }`}
                >
                  Search by name, email, or role…
                </span>
                <span className="shrink-0 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-2 py-1 text-[8px] font-semibold text-white">
                  + Add user
                </span>
              </div>

              <div className={`divide-y px-3 pb-2 ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
                {PREVIEW_ACCOUNTS.map((account) => (
                  <div key={account.email} className="flex items-center gap-2 py-1.5">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[account.tone]}`}
                    >
                      {account.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[10px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                        {account.name}
                      </p>
                      <p className={`truncate text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{account.email}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                        account.status === "Active"
                          ? isDark
                            ? "bg-[#1f9d6b]/20 text-[#3ddb9c]"
                            : "bg-[#e1f5ec] text-[#1f9d6b]"
                          : isDark
                            ? "bg-[#e0873c]/20 text-[#e0873c]"
                            : "bg-[#fdf1de] text-[#c98a2c]"
                      }`}
                    >
                      {account.status}
                    </span>
                    <span
                      className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold sm:inline-block ${
                        isDark ? "bg-brand-purple/20 text-[#c4b5fd]" : "bg-brand-purple/10 text-brand-purple"
                      }`}
                    >
                      {account.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeAdminItem && activeAdminItem.label === "Claude Usage" && (
            <div className="space-y-2.5">
              {/* Period control row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                    Day
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-2 py-1 text-[9px] font-semibold text-white">
                    Week
                  </span>
                  <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                    Month
                  </span>
                </div>
                <span className={`text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>This week</span>
              </div>

              {/* Disclaimer — real wording, not paraphrased */}
              <div
                className={`rounded-lg border px-2.5 py-1.5 text-[8px] leading-relaxed ${
                  isDark ? "border-brand-purple/30 bg-brand-purple/10 text-[#c4b5fd]" : "border-brand-purple/20 bg-brand-purple/5 text-brand-purple"
                }`}
              >
                Token counts and API-equivalent cost below are <strong>soft-budget estimates</strong>, not a real invoice
                or a hard usage limit — actual billing depends on the plan and models each person uses.
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-2">
                {CLAUDE_USAGE_STATS.map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-[10px] border p-2 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}
                  >
                    <p
                      className={`truncate text-[7px] font-semibold uppercase tracking-wide ${
                        isDark ? "text-[#a79fc9]" : "text-muted"
                      }`}
                    >
                      {stat.label}
                    </p>
                    <p className={`mt-1 truncate text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Daily tokens by user — mini bar chart, div-based (no charting library) */}
              <div className={`rounded-[10px] border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
                <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Daily tokens by user</p>
                <div className="mt-3 flex h-16 items-end gap-2">
                  {CLAUDE_USAGE_CHART_DAYS.map((d) => (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-brand-purple to-brand-blue"
                        style={{ height: `${d.pct}%` }}
                      />
                      <span className={`text-[7px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{d.day}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  {CLAUDE_USAGE_LEGEND.map((legendItem) => (
                    <span
                      key={legendItem.name}
                      className={`flex items-center gap-1 text-[8px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${AVATAR_GRADIENTS[legendItem.tone]}`} />
                      {legendItem.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Per-user usage — condensed to name/tokens/status, not every real column */}
              <div className={`rounded-[10px] border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
                <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Per-user usage</p>
                <div className={`mt-2 divide-y ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
                  {PREVIEW_USAGE_ROWS.map((row) => (
                    <div key={row.email} className="flex items-center gap-2 py-1.5">
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[row.tone]}`}
                      >
                        {row.name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[10px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                          {row.name}
                        </p>
                        <p className={`truncate text-[8px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{row.tokens} tokens · Member</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                          isDark ? "bg-[#1f9d6b]/20 text-[#3ddb9c]" : "bg-[#e1f5ec] text-[#1f9d6b]"
                        }`}
                      >
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soft budget overrides — summarized in one line rather than a
                  full editable-per-person section, per this task's own
                  "may be summarized in one line" allowance. */}
              <p className={`text-[8px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                Soft budget overrides available per person — defaults to 1.2M tokens/week, takes effect immediately.
              </p>
            </div>
          )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
