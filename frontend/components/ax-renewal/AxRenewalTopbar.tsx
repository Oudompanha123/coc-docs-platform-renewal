"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MenuIcon } from "@/components/layout/icons";
import { useAxRenewalProject } from "@/lib/ax-renewal/useAxRenewalProject";
import { useAxRenewalTabs } from "@/lib/ax-renewal/tabs";
import type { AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { AxRenewalBreadcrumb } from "./AxRenewalBreadcrumb";
import { AxRenewalTabBar } from "./AxRenewalTabBar";

type AxRenewalTopbarProps = {
  onMenuClick: () => void;
};

/**
 * The top of the editor pane, mirroring CodeRenewalPlatform.html's own
 * `.tabs` + `.crumb` placement: open tabs and the current breadcrumb sit
 * right at the top of the shell, not nested inside a card further down the
 * page. Self-contained (reads the project via the same `project=`/
 * `section=` query params the sidebar and page already read independently,
 * per `useAxRenewalProject`'s own doc comment) so it needs no prop wiring
 * through the layout — same pattern as `AxRenewalSidebar`/`AxRenewalStatusBar`.
 */
export function AxRenewalTopbar({ onMenuClick }: AxRenewalTopbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projectId, detail } = useAxRenewalProject();
  const active = (searchParams.get("section") as AxRenewalExplorerKey | null) ?? "attach";
  const { tabs, closeTab } = useAxRenewalTabs(active);

  function openTab(section: AxRenewalExplorerKey) {
    if (projectId) router.push(`/ax-renewal?project=${projectId}&section=${section}`);
  }

  function handleCloseTab(key: AxRenewalExplorerKey) {
    const fallback = closeTab(key);
    if (fallback) openTab(fallback);
  }

  return (
    <div className="border-b border-border bg-white">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="shrink-0 p-3 text-dash-ink transition-colors hover:bg-brand-purple/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        {detail ? (
          <AxRenewalTabBar tabs={tabs} active={active} onSelect={openTab} onClose={handleCloseTab} />
        ) : (
          <div className="flex-1" />
        )}
      </div>
      {detail && <AxRenewalBreadcrumb active={active} detail={detail} />}
    </div>
  );
}
