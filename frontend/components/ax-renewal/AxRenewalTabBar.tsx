"use client";

import { EXPLORER_META, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { XIcon } from "@/components/layout/icons";

type AxRenewalTabBarProps = {
  tabs: AxRenewalExplorerKey[];
  active: AxRenewalExplorerKey;
  onSelect: (key: AxRenewalExplorerKey) => void;
  onClose: (key: AxRenewalExplorerKey) => void;
};

/** The open-tabs row across the top of the editor area, mirroring the reference prototype's tab bar — closing the active tab is handled by the caller (it decides which neighboring tab becomes active). */
export function AxRenewalTabBar({ tabs, active, onSelect, onClose }: AxRenewalTabBarProps) {
  return (
    <div className="flex flex-1 overflow-x-auto border-b border-border bg-page">
      {tabs.map((key) => {
        const meta = EXPLORER_META[key];
        const isActive = key === active;
        return (
          <div
            key={key}
            className={`group flex shrink-0 items-center gap-2 border-r border-border px-3 py-2 text-sm ${
              isActive ? "bg-white font-semibold text-dash-ink" : "text-muted hover:bg-white/60 hover:text-dash-ink"
            }`}
          >
            <button type="button" onClick={() => onSelect(key)} className="whitespace-nowrap">
              {meta.label}
            </button>
            {tabs.length > 1 && (
              <button
                type="button"
                onClick={() => onClose(key)}
                aria-label={`Close ${meta.label}`}
                className="rounded p-0.5 text-muted opacity-0 transition-opacity hover:bg-page hover:text-dash-ink group-hover:opacity-100"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
