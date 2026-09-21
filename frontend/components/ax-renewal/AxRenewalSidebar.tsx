"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDownIcon, XIcon } from "@/components/layout/icons";
import { useSession } from "@/lib/auth/SessionProvider";
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
};

/**
 * The Understand/Plan/Build Explorer tree from CodeRenewalPlatform.html,
 * standalone rather than nested under an "AX Renewal" link in the main admin
 * sidebar (see Sidebar.tsx) — this page now opens in its own tab as a
 * dedicated workspace, so it gets its own dedicated nav instead of the
 * PRODUCTS/ADMINISTRATION/DEVELOPER sections that belong to the admin shell.
 */
export function AxRenewalSidebar({ isOpen, onClose }: AxRenewalSidebarProps) {
  const searchParams = useSearchParams();
  const { user } = useSession();
  const { projectId, detail } = useAxRenewalProjectContext();
  const groups = buildExplorerGroups(detail, user?.role);
  const active = resolveActiveSection(searchParams.get("section"));
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
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
        <div className="min-w-0">
          <h1 className="text-xs font-bold uppercase tracking-wider text-sidebar-muted/70">Explorer</h1>
          <p className="mt-1 truncate font-mono text-xs text-sidebar-muted" title={headerSubtitle}>
            {headerSubtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="rounded-lg p-1.5 text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue lg:hidden"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
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
              className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-sidebar-muted/70 transition-colors hover:text-white"
            >
              <ChevronDownIcon
                className={`h-2.5 w-2.5 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
              />
              <span
                className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ${
                  isOpen ? "bg-brand-purple/20 text-brand-purple" : "bg-white/10 text-sidebar-muted"
                }`}
              >
                <group.icon className="h-3 w-3" />
              </span>
              <span className="truncate">{group.label}</span>
              {group.badge && (
                <span
                  className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    isGroupComplete(group.badge) ? "bg-brand-purple/20 text-brand-purple" : "bg-white/10 text-white"
                  }`}
                >
                  {group.badge}
                </span>
              )}
            </button>
            {isOpen && (
            <div className="space-y-0.5">
              {group.items.map((sub) => {
                const subActive = active === sub.key;
                const href = `/ax-renewal?project=${projectId ?? ""}&section=${sub.key}`;
                const rowClasses = `flex items-center gap-2 border-l-2 py-1.5 pl-3 pr-2.5 text-[13px] transition-colors ${
                  sub.locked
                    ? "cursor-not-allowed border-transparent text-sidebar-muted/40"
                    : subActive
                      ? "border-brand-purple bg-white/5 font-semibold text-white"
                      : "border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                }`;
                return sub.locked ? (
                  <div key={sub.key} aria-disabled="true" title={lockedReason} className={rowClasses}>
                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                    <span className="ml-auto shrink-0 text-[9px]">locked</span>
                  </div>
                ) : (
                  <Link
                    key={sub.key}
                    href={href}
                    onClick={onClose}
                    aria-current={subActive ? "page" : undefined}
                    className={rowClasses}
                  >
                    <sub.icon className={`h-3.5 w-3.5 shrink-0 ${subActive ? "text-brand-purple" : ""}`} />
                    <span className="truncate">{sub.label}</span>
                    {sub.flag != null && (
                      <span
                        className={`ml-auto shrink-0 text-sm font-bold ${sub.flag ? "text-brand-purple" : "text-amber-600"}`}
                        aria-label={sub.flag ? "confirmed" : "draft"}
                      >
                        {sub.flag ? "✓" : "●"}
                      </span>
                    )}
                    {sub.count != null && (
                      <span className="ml-auto shrink-0 rounded-full bg-danger/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-danger">
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
    </div>
  );

  return (
    <>
      {/* Desktop: sticky, always visible — same pattern as the admin Sidebar. */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-0 h-screen w-64">{content}</div>
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
