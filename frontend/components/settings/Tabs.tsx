"use client";

export type Tab = { id: string; label: string };

/** No tab-bar primitive exists elsewhere in this app yet — built for Settings' 4 tabs. */
export function Tabs({ tabs, active, onChange }: { tabs: Tab[]; active: string; onChange: (id: string) => void }) {
  return (
    <div role="tablist" className="flex gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 text-sm transition-colors focus-visible:outline-none ${
              isActive ? "font-bold text-dash-ink" : "font-medium text-muted hover:text-dash-ink"
            }`}
          >
            {tab.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue" />
            )}
          </button>
        );
      })}
    </div>
  );
}
