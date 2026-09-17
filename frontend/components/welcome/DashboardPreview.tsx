import { AVATAR_GRADIENTS, TONE_STYLES } from "@/components/dashboard/tone";
import {
  BarChartIcon,
  BellIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentIcon,
  FolderIcon,
  HomeIcon,
  LayersIcon,
  MailIcon,
  MoonIcon,
  PersonIcon,
  PlugIcon,
  PlusIcon,
  PulseIcon,
  RingIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/layout/icons";
import { NAV_BOTTOM, NAV_TOP, PRODUCT_ICONS, type NavSection } from "@/components/layout/nav-config";
import { FALLBACK_NAV } from "@/lib/docs/nav-api";
import { QUICK_ACTIONS, type Tone } from "@/lib/mock/overview";

/** A static illustration of the sidebar's shape for this read-only preview.
 *  The PRODUCTS list itself comes straight from nav-api.ts's FALLBACK_NAV —
 *  the same fallback data the real sidebar renders when the backend is
 *  unreachable — rather than a second hardcoded copy of the product names. */
const ADMINISTRATION_SECTION: NavSection = {
  label: "ADMINISTRATION",
  items: [{ label: "Users & Roles", href: "/users-roles", icon: UsersIcon }],
};

/** The standalone workspace-dashboard link above PRODUCTS is labelled
 *  "Overview" in the real admin sidebar (NAV_TOP) — this public page uses
 *  "Home" instead, since a visitor here isn't inside the admin workspace
 *  the word "Overview" refers to. The icon is still NAV_TOP's own, just the
 *  text is overridden locally; NAV_TOP itself (and the real sidebar) is
 *  untouched. */
const HOME_LABEL = "Home";

/** Only one product renders expanded, so the mock stays proportioned to the
 *  main content panel beside it — the full per-product sub-item lists now
 *  live in the top nav's dropdowns instead (LandingHeader-equivalent nav in
 *  app/welcome/page.tsx), not here. Sub-items are FALLBACK_NAV's real
 *  jex3-0 titles (sliced to a representative handful, same reasoning
 *  PREVIEW_DOCS below only shows a slice of "recent" docs rather than every
 *  one), rendered as plain always-visible indented text — never a tab or a
 *  click-to-expand control. */
const EXPANDED_PRODUCT_KEY = "jex3-0";
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
  { key: "sss", label: "SSS", value: "0 / 0", trend: "0 not written", icon: DocumentIcon, tone: "green" },
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

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-2xl ${
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

          <div className="mt-4 flex-1 space-y-4">
            <span className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-2.5 py-1.5 text-[11px] font-semibold text-white">
              <NAV_TOP.icon className="h-3.5 w-3.5" />
              {HOME_LABEL}
            </span>

            <div className="flex flex-col gap-1">
              <p className="px-2.5 text-[9px] font-semibold tracking-wider text-sidebar-muted/70">PRODUCTS</p>
              {FALLBACK_NAV.map((product) => {
                const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;
                return (
                  <div key={product.key} className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted">
                      <Icon className="h-3.5 w-3.5" />
                      {product.label}
                    </span>
                    {product.key === EXPANDED_PRODUCT_KEY && (
                      <div className="ml-[13px] flex flex-col gap-0.5 border-l border-white/10 pl-3">
                        {product.items.slice(0, EXPANDED_ITEM_COUNT).map((item) => (
                          <span
                            key={item.slug || "index"}
                            className="truncate rounded-lg px-2 py-1 text-[10px] font-medium text-sidebar-muted/70"
                          >
                            {item.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1">
              <p className="px-2.5 text-[9px] font-semibold tracking-wider text-sidebar-muted/70">
                {ADMINISTRATION_SECTION.label}
              </p>
              {ADMINISTRATION_SECTION.items.map((item) => (
                <span
                  key={item.href}
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </span>
              ))}
            </div>
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

        <div className={`min-w-0 flex-1 p-4 sm:p-5 ${isDark ? "bg-[#161226]" : "bg-page"}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <HomeIcon className="h-4 w-4 shrink-0 text-brand-purple" />
              <div className="min-w-0">
                <h3 className={`text-sm font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Overview</h3>
                <p className={`truncate text-[9px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                  Your documentation workspace at a glance
                </p>
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

          <div className="mt-3 grid grid-cols-5 gap-2">
            {PREVIEW_STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className={`rounded-xl border p-2.5 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}
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
                  className={`flex items-center gap-1.5 rounded-xl border p-2 ${
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

          <div className="mt-3 grid grid-cols-[65%_35%] gap-2.5">
            <div className={`rounded-xl border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
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

            <div className={`rounded-xl border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
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
        </div>
      </div>
    </div>
  );
}
