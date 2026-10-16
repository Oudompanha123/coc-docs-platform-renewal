"use client";

import { useEffect, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { SunIcon, MoonIcon, MonitorIcon } from "@/components/layout/icons";
import type { IconComponent } from "@/components/layout/icons";
import { LanguagePicker } from "@/components/settings/LanguagePicker";

const THEME_OPTIONS: { value: Theme; label: string; Icon: IconComponent }[] = [
  { value: "light",  label: "Light",  Icon: SunIcon },
  { value: "dark",   label: "Dark",   Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

/**
 * The dashboard Settings page's Appearance card: the theme and the language
 * (ADR-116).
 *
 * The Accent color picker that used to sit below it is gone, at the product
 * owner's request — not needed for now. It was the only thing that wrote
 * `--color-brand-purple`/`--color-brand-blue` onto <html> from the stored
 * `coc-docs-accent-v2` value, so with it removed every browser renders the
 * default neutral palette again; the stored value is simply never read.
 */
export function AppearanceCard() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    setTheme(storedTheme);
  }, []);

  function selectTheme(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Theme */}
      <div>
        <p className="text-xs font-medium text-muted-foreground">Theme</p>
        <div className="mt-2 flex gap-2">
          {THEME_OPTIONS.map(({ value, label, Icon }) => (
            // A single-choice chip group, styled from the selection rather
            // than a variant — ToggleGroup, with the other form controls
            // (ADR-104 §4.3).
            // eslint-disable-next-line react/forbid-elements
            <button
              key={value}
              type="button"
              onClick={() => selectTheme(value)}
              aria-pressed={theme === value}
              className={`flex h-10 flex-1 items-center justify-center gap-1.5 rounded-control border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                theme === value
                  ? "border-foreground/40 bg-muted-surface/60 text-foreground"
                  : "border-surface-border text-muted-foreground hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <LanguagePicker />
    </div>
  );
}
