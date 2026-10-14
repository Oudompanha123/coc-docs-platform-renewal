"use client";

export type Tab = { id: string; label: string };

/** No tab-bar primitive exists elsewhere in this app yet — built for Settings' 4 tabs. */
export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-surface-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          // role="tab" with an underline indicator — a tab, not a button.
          // Phase 3's Tabs primitive replaces this file outright, along with
          // the roving-tabindex keyboard handling it does not yet implement
          // (ADR-104 §2.5).
          // eslint-disable-next-line react/forbid-elements
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative pb-2.5 text-sm transition-colors focus-visible:outline-none ${
              isActive ? "font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
