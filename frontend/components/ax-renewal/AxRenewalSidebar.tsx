"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type PointerEvent } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { ChevronDownIcon, MoonIcon, SunIcon, XIcon } from "@/components/layout/icons";
import { ResizeHandle } from "@/components/ax-renewal/ResizeHandle";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { applyTheme, getStoredTheme } from "@/lib/theme";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { buildExplorerGroups, resolveActiveSection } from "@/lib/ax-renewal/explorerGroups";

/** Mirrors the prototype's own `allConf() ? "ok" : ""` tint on a group's badge — a "0/4"-style count only turns green once both halves match. */
function isGroupComplete(badge: string): boolean {
  const match = /^(\d+)\/(\d+)$/.exec(badge);
  return match != null && match[1] === match[2];
}

type AxRenewalSidebarProps = {
  /** Mobile/tablet off-canvas drawer state — always visible at lg+ regardless of this. */
  isOpen: boolean;
  onClose: () => void;
  /** Desktop-only "hide the whole panel" state, toggled from the icon rail — unrelated to isOpen/onClose above. */
  panelCollapsed: boolean;
  /** Desktop-only drag-to-resize width, in pixels — lifted to the layout so the icon rail's collapse toggle and this panel's own resize handle share one width across a collapse/expand cycle. Optional (defaulting to the panel's original fixed width) so a render site that doesn't care about resizing is unaffected. */
  width?: number;
  onResizeStart?: (event: PointerEvent<HTMLDivElement>) => void;
  isResizing?: boolean;
};

/**
 * The Understand/Plan/Build Explorer tree from CodeRenewalPlatform.html,
 * standalone rather than nested under an "AX Renewal" link in the main admin
 * sidebar (see Sidebar.tsx) — this page now opens in its own tab as a
 * dedicated workspace, so it gets its own dedicated nav instead of the
 * PRODUCTS/ADMINISTRATION/DEVELOPER sections that belong to the admin shell.
 */
export function AxRenewalSidebar({
  isOpen,
  onClose,
  panelCollapsed,
  width = 256,
  onResizeStart = () => {},
  isResizing = false,
}: AxRenewalSidebarProps) {
  const searchParams = useSearchParams();
  const { user } = useSession();
  const currentUser = useCurrentUser();
  const { projectId, detail } = useAxRenewalProjectContext();
  const groups = buildExplorerGroups(detail, user?.role);
  const active = resolveActiveSection(searchParams.get("section"));
  // Moved here from AxRenewalTopbar, which keeps the tab bar and
  // notifications bell as before — just this one control relocated.
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    setDarkMode(stored === "dark");
  }, []);

  function toggleTheme() {
    const next = darkMode ? "light" : "dark";
    applyTheme(next);
    setDarkMode(!darkMode);
  }
  // Mirrors the prototype's own locked-item toast copy
  // (`S.phase==="empty"?"Attach the source first":"Run the analysis first"`)
  // — shown here as a native tooltip on the locked row itself, since this
  // app has no global toast affordance to pop one from (see AttachSourceSection).
  const lockedReason = detail?.project.manifestAttachedAt == null ? "Attach the source first" : "Run analysis first";
  // Every group starts expanded, matching the reference prototype's default.
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  function toggleGroup(label: string) {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  // Matches the reference prototype's own Explorer header, which reads
  // `project.archive.name` (the attached folder's own top-level name) once
  // something is attached — not the dependency manifest's filename, which is
  // a different fact about the project and shown elsewhere (Codebase).
  // `manifestFilename` is a fallback only for a project attached before
  // `rootFolderName` existed on `attach_stats`.
  const headerSubtitle =
    detail?.project.manifestAttachedAt == null
      ? "no source attached"
      : `${detail.project.attachStats?.rootFolderName ?? detail.project.manifestFilename ?? "attached"}${
          detail.analysis == null ? " · not analysed" : ""
        }`;

  const content = (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3.5">
        <div className="min-w-0">
          <h1 className="text-xs font-bold uppercase tracking-wider text-dash-ink">Explorer</h1>
          <p className="mt-1 truncate font-mono text-xs text-sidebar-muted" title={headerSubtitle}>
            {headerSubtitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            aria-pressed={darkMode}
            className="shrink-0 rounded-xl bg-brand-purple/10 p-2 text-brand-purple transition-colors hover:bg-sidebar-hover hover:text-dash-ink"
          >
            {darkMode ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="rounded-[10px] p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue lg:hidden"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
        {groups.length === 0 && (
          <p className="px-2 text-xs text-sidebar-muted">Pick or create a project to see its plan.</p>
        )}
        {groups.map((group) => {
          const isOpen = !collapsed[group.label];
          return (
          <div key={group.label}>
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-purple transition-colors"
            >
              <ChevronDownIcon
                className={`h-[17px] w-[17px] shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
              <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <group.icon className="h-3 w-3" />
              </span>
              <span className="truncate">{group.label}</span>
              {group.badge && (
                <span
                  className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    isGroupComplete(group.badge) ? "bg-brand-purple/20 text-brand-purple" : "bg-page text-muted"
                  }`}
                >
                  {group.badge}
                </span>
              )}
            </button>
            {isOpen && (
            // pl-9 lines a sub-item's icon up under where the group label
            // above it starts (px-2 + chevron + gap + icon + gap = 48px) —
            // purely an outer offset on this wrapper, so every row's own
            // border-l-2/icon/label spacing (and their behavior) is
            // untouched.
            <div className="space-y-0.5 pl-9">
              {group.items.map((sub) => {
                const subActive = active === sub.key;
                const href = `/ax-renewal?project=${projectId ?? ""}&section=${sub.key}`;
                // Active is a solid full-width gradient pill (matching the
                // reference), not the previous thin left-border stripe —
                // this is the one row style that carries its own icon color
                // (white) instead of the default muted tone.
                const rowClasses = `flex items-center gap-2 rounded-[10px] py-1.5 pl-3 pr-2.5 text-[13px] transition-colors ${
                  sub.locked
                    ? "cursor-not-allowed text-sidebar-muted/40"
                    : subActive
                      ? "bg-gradient-to-r from-brand-purple to-brand-blue font-semibold text-white shadow-md"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-dash-ink"
                }`;
                return sub.locked ? (
                  <div key={sub.key} aria-disabled="true" title={lockedReason} className={rowClasses}>
                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                    <span className="ml-auto shrink-0 rounded-full bg-page px-2 py-0.5 text-[10px] text-muted">
                      locked
                    </span>
                  </div>
                ) : (
                  <Link
                    key={sub.key}
                    href={href}
                    onClick={onClose}
                    aria-current={subActive ? "page" : undefined}
                    className={rowClasses}
                  >
                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                    {sub.flag != null &&
                      (sub.flag ? (
                        <span className="ml-auto shrink-0 text-sm font-bold" aria-label="confirmed">
                          ✓
                        </span>
                      ) : (
                        <span
                          aria-label="draft"
                          className="ml-auto h-2 w-2 shrink-0 rounded-full bg-amber-500"
                        />
                      ))}
                    {sub.count != null && (
                      <span className="ml-auto shrink-0 rounded-full bg-danger px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                        {sub.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            )}
          </div>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-white/10 px-4 py-3">
        <UserAvatar
          avatarUrl={currentUser?.avatarUrl ?? null}
          initials={currentUser?.initials ?? "?"}
          name={currentUser?.name ?? "Guest"}
          // ax-renewal-avatar: a plain marker class, not a Tailwind utility —
          // AVATAR_GRADIENTS.purple is a shared arbitrary-value class used
          // app-wide (admin dashboard, document rows), so it can't be
          // scoped-overridden for dark-theme AX Renewal without either
          // fighting Tailwind's bracket-escaped selector or changing every
          // other avatar in the app. This gives globals.css a clean, stable
          // hook instead.
          className={`h-8 w-8 shrink-0 ax-renewal-avatar ${AVATAR_GRADIENTS.purple}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-dash-ink">{currentUser?.name ?? "Guest"}</p>
          <p className="truncate text-xs text-sidebar-muted">{currentUser?.role ?? ""}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: sticky, always visible — same pattern as the admin Sidebar.
          h-[calc(100vh-32px)], not h-screen: AxRenewalStatusBar now spans the
          full shell width as its own row below this one, so this stops
          short of the full viewport by that same height instead of running
          past where the status bar starts.

          The inner div keeps its full resizable width regardless of
          panelCollapsed — only the outer aside's own width animates, so the
          panel appears to slide away/back rather than its own content
          reflowing/wrapping mid-transition. overflow-hidden on the outer is
          what actually clips it during the animation. Width is inline style,
          not a Tailwind class, since it's a runtime drag value (see
          useResizableWidth) — the collapse transition is suppressed while
          actively dragging (isResizing) so the two don't fight over the
          `width` property mid-drag. */}
      <aside
        className={`hidden overflow-hidden lg:block lg:shrink-0 ${
          isResizing ? "" : "transition-[width] duration-200 ease-out motion-reduce:transition-none"
        }`}
        style={{ width: panelCollapsed ? 0 : width }}
      >
        <div className="sticky top-0 h-[calc(100vh-32px)] relative" style={{ width }}>
          {content}
          <ResizeHandle edge="right" onPointerDown={onResizeStart} isDragging={isResizing} label="Resize Explorer panel" />
        </div>
      </aside>

      {/* Mobile/tablet: off-canvas drawer */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-200 lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {content}
      </aside>
    </>
  );
}
