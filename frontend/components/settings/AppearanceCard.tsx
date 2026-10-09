"use client";

import { useEffect, useRef, useState } from "react";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { SunIcon, MoonIcon, MonitorIcon } from "@/components/layout/icons";
import type { IconComponent } from "@/components/layout/icons";

const THEME_OPTIONS: { value: Theme; label: string; Icon: IconComponent }[] = [
  { value: "light",  label: "Light",  Icon: SunIcon },
  { value: "dark",   label: "Dark",   Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

/**
 * A new key, not the old `coc-docs-accent-custom` (ADR-104 r2.0).
 *
 * This card writes `--color-brand-purple` onto <html> at runtime from
 * whatever is stored, which means a browser holding the old default would
 * paint the retired purple straight back over the neutral palette on every
 * load — the repaint would appear not to have happened, and only for people
 * who had used the app before. Changing the key retires those stored values
 * with the palette they belonged to. Anyone who had deliberately chosen an
 * accent picks it again once.
 */
const CUSTOM_KEY = "coc-docs-accent-v2";
const DEFAULT_HEX = "#171717";

/** Derive a complementary tone by shifting hue +30°. */
function deriveBlue(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  h = (h + 30 / 360) % 1;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  function hue2rgb(t: number) {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(hue2rgb(h + 1 / 3))}${toHex(hue2rgb(h))}${toHex(hue2rgb(h - 1 / 3))}`;
}

function applyAccentHex(hex: string): void {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--color-brand-purple", hex);
  document.documentElement.style.setProperty("--color-brand-blue", deriveBlue(hex));
  window.localStorage.setItem(CUSTOM_KEY, hex);
}

export function AppearanceCard() {
  const [theme, setTheme]       = useState<Theme>("system");
  const [customHex, setCustomHex] = useState(DEFAULT_HEX);
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    setTheme(storedTheme);

    const hex = (typeof window !== "undefined" && window.localStorage.getItem(CUSTOM_KEY)) || DEFAULT_HEX;
    setCustomHex(hex);
    applyAccentHex(hex);
  }, []);

  function selectTheme(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  function handleCustomChange(e: React.ChangeEvent<HTMLInputElement>) {
    const hex = e.target.value;
    setCustomHex(hex);
    applyAccentHex(hex);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Theme */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Theme</p>
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
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                theme === value
                  ? "border-primary bg-secondary text-foreground"
                  : "border-border text-dash-ink hover:bg-page"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Accent color */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Accent color</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Left alone on purpose, and worth a second look when someone
              touches this card: a <button> wrapping an <input type="color">
              is interactive content nested inside interactive content, which
              the HTML spec does not allow. Browsers tolerate it, assistive
              technology is less predictable. Fixing it means deciding how the
              swatch should open its picker, which is a design change, not a
              primitive swap — so it is reported rather than quietly altered
              here (ADR-104 §4.3). */}
          {/* eslint-disable-next-line react/forbid-elements */}
          <button
            type="button"
            onClick={() => colorInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-page focus-visible:outline-none"
            style={{ outline: `2px solid ${customHex}`, outlineOffset: "2px", color: customHex }}
          >
            <span
              className="h-4 w-4 rounded-full shadow-sm"
              style={{ background: customHex }}
              aria-hidden="true"
            />
            Choose color
            {/* eslint-disable-next-line react/forbid-elements */}
            <input
              ref={colorInputRef}
              type="color"
              value={customHex}
              onChange={handleCustomChange}
              className="sr-only"
              aria-hidden="true"
              tabIndex={-1}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
