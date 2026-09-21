/**
 * Theme preference — a data-attribute + localStorage toggle, not a library.
 * No app-wide theming mechanism existed before this (only an inert
 * `@media (prefers-color-scheme: dark)` override in globals.css that no
 * component could opt out of or trigger manually). This adds an explicit,
 * user-controlled override on top of that, following the same
 * CSS-custom-property approach globals.css already uses.
 *
 * `system` clears the explicit override so the existing media-query
 * fallback in globals.css governs — no new CSS needed, that fallback
 * already exists and already handles this case.
 *
 * // req: Settings — Appearance card
 */

export type Theme = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "coc-docs-theme";
const STORAGE_KEY = THEME_STORAGE_KEY;

/** Reads the persisted choice; "system" (not an explicit light/dark choice) if none is stored. */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

/** Applies the theme to the document and persists the choice. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  if (theme === "system") {
    delete document.documentElement.dataset.theme;
  } else {
    document.documentElement.dataset.theme = theme;
  }
  window.localStorage.setItem(STORAGE_KEY, theme);
}
