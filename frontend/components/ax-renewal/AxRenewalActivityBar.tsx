"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { FolderIcon, GearIcon, LayersIcon, PlayIcon } from "@/components/layout/icons";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
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
  { icon: GearIcon, label: "Workspace", defaultKey: "ai-engine", gatedByAnalysis: false },
];

const GROUP_OF: Record<AxRenewalExplorerKey, string> = {
  attach: "Understand",
  codebase: "Understand",
  "understand-architecture": "Understand",
  findings: "Understand",
  "old-new": "Plan",
  "stack-move": "Plan",
  "plan-architecture": "Plan",
  pages: "Plan",
  database: "Plan",
  output: "Plan",
  implementation: "Build",
  "run-locally": "Build",
  "ai-engine": "Workspace",
  "audit-trail": "Workspace",
};

export function AxRenewalActivityBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, detail } = useAxRenewalProjectContext();
  const currentUser = useCurrentUser();
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
      <div className="sticky top-0 flex h-[calc(100vh-32px)] w-[52px] flex-col items-center gap-1 bg-sidebar py-3">
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
              className={`relative flex h-10 w-10 items-center justify-center rounded-[5px] transition-colors ${
                locked
                  ? "cursor-not-allowed text-sidebar-muted opacity-30"
                  : isActive
                    ? "bg-sidebar-hover text-white"
                    : "text-sidebar-muted hover:bg-sidebar-hover hover:text-white"
              }`}
            >
              {isActive && !locked && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-brand-purple" aria-hidden="true" />
              )}
              <group.icon className="h-[18px] w-[18px]" />
            </button>
          );
        })}

        <div className="mt-auto">
          <UserAvatar
            avatarUrl={currentUser?.avatarUrl ?? null}
            initials={currentUser?.initials ?? "?"}
            name={currentUser?.name ?? "Guest"}
            className={`h-8 w-8 ${AVATAR_GRADIENTS.purple}`}
          />
        </div>
      </div>
    </aside>
  );
}
