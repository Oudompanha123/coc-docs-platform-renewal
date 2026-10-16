"use client";

import { useEffect, useState } from "react";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/layout/icons";
import type { IconComponent } from "@/components/layout/icons";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { LanguagePicker } from "@/components/settings/LanguagePicker";

const THEME_OPTIONS: { value: Theme; label: string; Icon: IconComponent }[] = [
  { value: "light", label: "Light", Icon: SunIcon },
  { value: "dark", label: "Dark", Icon: MoonIcon },
  { value: "system", label: "System", Icon: MonitorIcon },
];

/**
 * A mini sidebar + 3 content lines, in one theme's own fixed colors —
 * deliberately literal, not read from the page's own theme tokens, since
 * the whole point is showing what Light looks like while the page itself is
 * in Dark (and vice versa). `half` clips it to its left or right half, for
 * the System tile below, which shows both at once rather than guessing
 * which one the OS prefers.
 */
function MiniPreview({
  sidebar,
  content,
  lineStrong,
  lineMuted,
  half,
}: {
  sidebar: string;
  content: string;
  lineStrong: string;
  lineMuted: string;
  half?: boolean;
}) {
  return (
    <div className={`flex h-16 ${half ? "w-1/2" : "w-full"}`}>
      <div className="w-[30%] shrink-0" style={{ backgroundColor: sidebar }} aria-hidden="true" />
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-2" style={{ backgroundColor: content }}>
        <div className="h-1.5 rounded-full" style={{ backgroundColor: lineStrong, width: "75%" }} />
        <div className="h-1.5 rounded-full" style={{ backgroundColor: lineMuted, width: "90%" }} />
        <div className="h-1.5 rounded-full" style={{ backgroundColor: lineMuted, width: "55%" }} />
      </div>
    </div>
  );
}

const LIGHT = { sidebar: "#eef0ff", content: "#ffffff", lineStrong: "#c7d2fe", lineMuted: "#e5e7eb" };
const DARK = { sidebar: "#15152b", content: "#1e2030", lineStrong: "#4f46e5", lineMuted: "#2f3247" };

/** Clipped to the card's own rounded corners by the wrapping `div` in `AppearanceCard` below. */
function ThemePreview({ value }: { value: Theme }) {
  if (value === "light") return <MiniPreview {...LIGHT} />;
  if (value === "dark") return <MiniPreview {...DARK} />;
  return (
    <div className="flex h-16 w-full">
      <MiniPreview {...LIGHT} half />
      <MiniPreview {...DARK} half />
    </div>
  );
}

/**
 * This page's own Appearance card — not a reuse of the admin shell's
 * `components/settings/AppearanceCard.tsx` (different visual style here,
 * larger radio-style tiles matching this page's own mockup, and no accent-
 * color picker, which isn't in this task's scope). Reads and writes the
 * exact same `getStoredTheme`/`applyTheme` pair and `localStorage` key as
 * that one, so picking a theme here and the admin shell's own toggle always
 * agree — there is no separate state to keep in sync, just one shared key.
 */
export function AppearanceCard() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function select(next: Theme) {
    applyTheme(next);
    setTheme(next);
  }

  return (
    <section id="appearance" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Appearance</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">Choose how the site looks for you, and its language.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          // A selection card, not a button: it holds a preview image, a label
          // and a radio dot, and it is one of three mutually exclusive
          // choices. It shares no styling with any Button variant — forcing it
          // through one would mean overriding the border, padding, alignment
          // and layout, which is a longer way of writing this element. It
          // belongs to a RadioGroup primitive, scheduled with the other form
          // controls (ADR-104 §4.3).
          // eslint-disable-next-line react/forbid-elements
          <button
            key={value}
            type="button"
            onClick={() => select(value)}
            aria-pressed={theme === value}
            // Selected reads as one quiet change — a slightly stronger border and
            // a faint fill — rather than a near-black border plus a 3px halo,
            // which drew two outlines and in dark mode flipped to near-white.
            // The halo is kept for keyboard focus only.
            className={`rounded-xl border p-3 text-left transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 ${
              theme === value
                ? "border-foreground/40 bg-muted-surface/60"
                : "border-surface-border hover:border-foreground/20 hover:bg-accent/50"
            }`}
          >
            <div className="overflow-hidden rounded-lg border border-surface-border">
              <ThemePreview value={value} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                <Icon className="size-4 shrink-0" />
                {label}
              </span>
              <span
                aria-hidden="true"
                // A radio, drawn as one: a ring with a centre dot when chosen,
                // instead of a solid disc.
                className={`size-4 shrink-0 rounded-full transition-[border-width,border-color] ${
                  theme === value ? "border-[5px] border-primary bg-background" : "border border-foreground/25"
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-5">
        <LanguagePicker />
      </div>
    </section>
  );
}
