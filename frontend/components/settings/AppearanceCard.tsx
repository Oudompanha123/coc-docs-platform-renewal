"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
];

/**
 * Theme picking is real (applyTheme()/lib/theme.ts — data-attribute +
 * localStorage). Accent color is shown as information only, not a control:
 * this app has exactly one brand accent today and no way to change it, so a
 * selector here would be a setting that doesn't exist yet.
 */
export function AppearanceCard() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = getStoredTheme();
    applyTheme(stored);
    setTheme(stored);
  }, []);

  function select(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Theme</p>
        <div className="mt-2 flex gap-2">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => select(option.value)}
              aria-pressed={theme === option.value}
              className={`flex-1 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple ${
                theme === option.value
                  ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                  : "border-border text-dash-ink hover:bg-page"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Accent color</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-dash-ink">
          <span className="h-3 w-3 rounded-full bg-brand-purple" aria-hidden="true" />
          Indigo
        </p>
      </div>
    </div>
  );
}
