import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import {
  BarChartIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  LayersIcon,
  PersonIcon,
  PulseIcon,
  UsersIcon,
} from "@/components/layout/icons";
import { NAV_BOTTOM, NAV_TOP, type NavSection } from "@/components/layout/nav-config";
import { CURRENT_USER, RECENT_DOCUMENTS, STAT_CARDS } from "@/lib/mock/overview";

/** A static illustration of the sidebar's shape for this read-only preview —
 *  the real PRODUCTS section is admin-editable now (nav-api.ts), so there's
 *  no single hardcoded list left to import here; this preview was never
 *  meant to reflect live edits anyway. */
const PREVIEW_SECTIONS: NavSection[] = [
  {
    label: "PRODUCTS",
    items: [
      { label: "Jex3.0", href: "/jex3-0", icon: LayersIcon },
      { label: "Jex2.0", href: "/jex2-0", icon: FolderIcon },
      { label: "Coach", href: "/coach", icon: PersonIcon },
    ],
  },
  {
    label: "ADMINISTRATION",
    items: [{ label: "Users & Roles", href: "/users-roles", icon: UsersIcon }],
  },
];

const STAT_ICONS = {
  document: DocumentIcon,
  layers: LayersIcon,
  users: UsersIcon,
  database: DatabaseIcon,
  folder: FolderIcon,
  person: PersonIcon,
  pulse: PulseIcon,
  barChart: BarChartIcon,
} as const;

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
              {NAV_TOP.label}
            </span>

            {PREVIEW_SECTIONS.map((section) => (
              <div key={section.label} className="flex flex-col gap-1">
                <p className="px-2.5 text-[9px] font-semibold tracking-wider text-sidebar-muted/70">
                  {section.label}
                </p>
                {section.items.map((item) => (
                  <span
                    key={item.href}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted"
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </span>
                ))}
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <span className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-sidebar-muted">
              <NAV_BOTTOM.icon className="h-3.5 w-3.5" />
              {NAV_BOTTOM.label}
            </span>

            <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-semibold text-white ${AVATAR_GRADIENTS[CURRENT_USER.tone]}`}
              >
                {CURRENT_USER.initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold text-white">{CURRENT_USER.name}</p>
                <p className="truncate text-[9px] text-sidebar-muted">{CURRENT_USER.role}</p>
              </div>
            </div>
          </div>
        </div>

        <div className={`min-w-0 flex-1 p-4 sm:p-5 ${isDark ? "bg-[#161226]" : "bg-page"}`}>
          <h3 className={`text-sm font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Overview</h3>
          <p className={`text-xs ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>Your documentation workspace at a glance</p>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {STAT_CARDS.map((stat) => {
              const Icon = STAT_ICONS[stat.icon];
              return (
                <div
                  key={stat.id}
                  className={`rounded-xl border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-purple/15 text-brand-purple">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <p
                    className={`mt-2 truncate text-[10px] font-semibold uppercase tracking-wide ${
                      isDark ? "text-[#a79fc9]" : "text-muted"
                    }`}
                  >
                    {stat.label}
                  </p>
                  <p className={`text-base font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>{stat.value}</p>
                  <p className={`truncate text-[10px] font-semibold ${isDark ? "text-[#3ddb9c]" : "text-[#1f9d6b]"}`}>
                    {stat.trend}
                  </p>
                </div>
              );
            })}
          </div>

          <div className={`mt-3 rounded-xl border p-3 ${isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"}`}>
            <p className={`text-xs font-bold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>Recent Documents</p>
            <div className={`mt-2 divide-y ${isDark ? "divide-[#332e4d]" : "divide-border"}`}>
              {RECENT_DOCUMENTS.slice(0, 3).map((doc) => (
                <div key={doc.id} className="flex items-center justify-between gap-2 py-1.5">
                  <div className="min-w-0">
                    <p className={`truncate text-[11px] font-semibold ${isDark ? "text-[#f2effa]" : "text-dash-ink"}`}>
                      {doc.title}
                    </p>
                    <p className={`truncate text-[10px] ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>{doc.updatedAgo}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      doc.status === "Published"
                        ? isDark
                          ? "bg-[#1f9d6b]/20 text-[#3ddb9c]"
                          : "bg-[#e1f5ec] text-[#1f9d6b]"
                        : isDark
                          ? "bg-[#e0873c]/20 text-[#f4a862]"
                          : "bg-[#fdece0] text-[#e0873c]"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
