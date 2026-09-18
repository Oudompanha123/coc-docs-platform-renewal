"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { RenewIcon, XIcon } from "@/components/layout/icons";
import { buildExplorerGroups, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { useAxRenewalProject } from "@/lib/ax-renewal/useAxRenewalProject";

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
  const { projectId, detail } = useAxRenewalProject();
  const groups = buildExplorerGroups(detail);
  const active = (searchParams.get("section") as AxRenewalExplorerKey | null) ?? "attach";

  const content = (
    <div className="flex h-full flex-col bg-sidebar px-4 py-5">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5 text-white">
          <RenewIcon className="h-6 w-6 text-brand-purple" />
          <span className="text-sm font-bold">AX Renewal</span>
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

      <nav className="mt-6 flex-1 space-y-4 overflow-y-auto">
        {groups.length === 0 && (
          <p className="px-2 text-xs text-sidebar-muted">Pick or create a project to see its plan.</p>
        )}
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted/70">
              <group.icon className="h-3 w-3 shrink-0" />
              <span className="truncate">{group.label}</span>
              {group.badge && (
                <span className="ml-auto shrink-0 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                  {group.badge}
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              {group.items.map((sub) => {
                const subActive = active === sub.key;
                const href = `/ax-renewal?project=${projectId ?? ""}&section=${sub.key}`;
                const rowClasses = `flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-colors ${
                  sub.locked
                    ? "cursor-not-allowed text-sidebar-muted/40"
                    : subActive
                      ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white shadow"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
                }`;
                return sub.locked ? (
                  <div key={sub.key} aria-disabled="true" className={rowClasses}>
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
                    <sub.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                    {sub.done && <span className="ml-auto shrink-0 text-xs text-brand-purple">✓</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
