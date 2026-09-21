"use client";

import { EXPLORER_META, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { XIcon } from "@/components/layout/icons";

type AxRenewalTabBarProps = {
  tabs: AxRenewalExplorerKey[];
  /** Null once every tab has been closed — matches the prototype, which allows closing its last tab too (see explorerGroups.ts's NO_TAB_OPEN). */
  active: AxRenewalExplorerKey | null;
  onSelect: (key: AxRenewalExplorerKey) => void;
  onClose: (key: AxRenewalExplorerKey) => void;
};

/** The active tab's top accent bar — mirrors the prototype's `.tab.cur`/`.nw`/`.ot`: the "old" system's own brown for Understand (the code as it is today), the brand accent for Plan/Build (the renewal), muted for Workspace. `#9c4620` matches the same "old" accent already used for the Old column in page.tsx's Old → New table. */
function accentColor(group: string): string {
  if (group === "Understand") return "bg-[#9c4620]";
  if (group === "Workspace") return "bg-muted";
  return "bg-brand-purple";
}

/**
 * The open-tabs row across the top of the editor area, matching the
 * reference prototype's own compact `.tab` row — a small icon per tab, a
 * truncated label, a close × that only shows on hover/when active, and a 2px
 * accent bar on the active tab. Closing the active tab is handled by the
 * caller (it decides which neighboring tab becomes active).
 */
export function AxRenewalTabBar({ tabs, active, onSelect, onClose }: AxRenewalTabBarProps) {
  return (
    <div className="flex flex-1 overflow-x-auto border-b border-border bg-page">
      {tabs.map((key) => {
        const meta = EXPLORER_META[key];
        const isActive = key === active;
        return (
          <div
            key={key}
            className={`group relative flex max-w-[220px] shrink-0 items-center gap-1.5 border-r border-border py-1.5 pl-3 pr-2 text-xs ${
              isActive ? "bg-white font-semibold text-dash-ink" : "text-muted hover:bg-white/60 hover:text-dash-ink"
            }`}
          >
            {isActive && (
              <span className={`absolute inset-x-0 top-0 h-[2px] ${accentColor(meta.group)}`} aria-hidden="true" />
            )}
            <button type="button" onClick={() => onSelect(key)} className="flex min-w-0 flex-1 items-center gap-1.5">
              <meta.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-brand-purple" : "text-muted"}`} />
              <span className="truncate">{meta.label}</span>
            </button>
            <button
              type="button"
              onClick={() => onClose(key)}
              aria-label={`Close ${meta.label}`}
              className={`shrink-0 rounded p-0.5 text-muted opacity-0 transition-opacity hover:bg-page hover:text-dash-ink group-hover:opacity-100 ${
                isActive ? "opacity-100" : ""
              }`}
            >
              <XIcon className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
