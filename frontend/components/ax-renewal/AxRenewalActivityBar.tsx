"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon, FolderIcon, LayersIcon, PlayIcon, RenewIcon } from "@/components/layout/icons";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { resolveActiveSection, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";

/**
 * The narrow icon rail from CodeRenewalPlatform.html, left of Explorer — one
 * button per Explorer group (Understand/Plan/Build/Workspace; no Appearance,
 * per direct instruction), jumping to that group's default tab. Desktop
 * only: mobile keeps today's single hamburger + Explorer drawer, since a
 * second always-visible column has nowhere to go on a narrow screen.
 */
const GROUPS: { icon: typeof FolderIcon; label: string; defaultKey: AxRenewalExplorerKey; gatedByAnalysis: boolean }[] = [
  { icon: FolderIcon, label: "Understand", defaultKey: "attach", gatedByAnalysis: false },
  { icon: LayersIcon, label: "Plan", defaultKey: "old-new", gatedByAnalysis: true },
  { icon: PlayIcon, label: "Build", defaultKey: "implementation", gatedByAnalysis: true },
  { icon: ClockIcon, label: "Workspace", defaultKey: "ai-engine", gatedByAnalysis: false },
];

const GROUP_OF: Record<AxRenewalExplorerKey, string> = {
  attach: "Understand",
  codebase: "Understand",
  "understand-architecture": "Understand",
  findings: "Understand",
  "understand-pages": "Understand",
  "old-new": "Plan",
  "stack-move": "Plan",
  "plan-architecture": "Plan",
  pages: "Plan",
  database: "Plan",
  output: "Plan",
  implementation: "Build",
  "run-locally": "Build",
  "ai-engine": "Workspace",
  members: "Workspace",
  "audit-trail": "Workspace",
};

export function AxRenewalActivityBar({
  sidebarCollapsed,
  onToggleSidebar,
}: {
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, detail } = useAxRenewalProjectContext();
  const active = resolveActiveSection(searchParams.get("section"));
  const activeGroup = active != null ? GROUP_OF[active] : null;
  const analyzed = detail?.analysis != null;

  function goToGroup(defaultKey: AxRenewalExplorerKey) {
    if (projectId) router.push(`/ax-renewal?project=${projectId}&section=${defaultKey}`);
  }

  return (
    <aside className="hidden w-[52px] shrink-0 lg:block">
      {/* h-[calc(100vh-32px)], not h-screen: AxRenewalStatusBar (h-8,
          border-box) now spans the full shell width as its own row below
          this one, instead of running only under the main content — so
          this stops short of the full viewport by exactly that height
          rather than overlapping it. */}
      <div className="sticky top-0 flex h-[calc(100vh-32px)] w-[52px] flex-col items-center gap-[20px] bg-sidebar py-3">
        {/* Purely decorative app mark — the avatar (the one real, functional
            user element) now lives in the wide Explorer panel's own footer
            instead, alongside the name/role/settings row the reference
            shows there; keeping a second one here as well would just be a
            real duplicate, not a style choice. */}
        <span
          aria-hidden="true"
          className="mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white shadow-md"
        >
          <RenewIcon className="h-5 w-5" />
        </span>
        {GROUPS.map((group) => {
          const isActive = group.label === activeGroup;
          const locked = group.gatedByAnalysis && !analyzed;
          return (
            <button
              key={group.label}
              type="button"
              onClick={() => {
                if (!locked) goToGroup(group.defaultKey);
              }}
              title={locked ? "Run analysis first" : group.label}
              aria-label={group.label}
              aria-current={isActive}
              aria-disabled={locked}
              className={`relative flex h-10 w-10 items-center justify-center rounded-[10px] transition-colors ${
                locked
                  ? "cursor-not-allowed text-sidebar-muted opacity-30"
                  : isActive
                    ? "bg-sidebar-hover text-brand-purple"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-dash-ink"
              }`}
            >
              {isActive && !locked && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-purple" aria-hidden="true" />
              )}
              <group.icon className="h-[30px] w-[30px]" />
            </button>
          );
        })}

        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Show Explorer" : "Hide Explorer"}
          aria-label={sidebarCollapsed ? "Show Explorer panel" : "Hide Explorer panel"}
          aria-pressed={sidebarCollapsed}
          className="mt-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-purple/10 text-brand-purple transition-colors hover:bg-sidebar-hover hover:text-dash-ink"
        >
          {sidebarCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
