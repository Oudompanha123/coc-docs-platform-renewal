/**
 * Theme preference — a data-attribute + localStorage toggle, not a library.
 *
 * `<html data-theme>` always carries the *resolved* theme, "light" or
 * "dark", never "system". Every dark rule in globals.css — the `dark:`
 * variant and the per-shell overrides — is keyed on `data-theme="dark"`, so
 * "system" used to clear the attribute and leave only the two root colours
 * that `@media (prefers-color-scheme: dark)` covers: a half-dark page. Now
 * "system" asks the OS which one it is, writes that, and follows the OS live
 * while the choice stays "system". The stored choice is still "system", so
 * Settings → Appearance shows what the person picked, not what it resolved to.
 *
 * // req: Settings — Appearance card
 */

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "coc-docs-theme";
const STORAGE_KEY = THEME_STORAGE_KEY;
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Reads the persisted choice; "system" (not an explicit light/dark choice) if none is stored. */
export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "system") return stored;
  return "system";
}

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

/** What `theme` looks like right now — "system" answered by the OS. */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

/** The theme actually on screen, for a toggle button's icon. */
export function getResolvedTheme(): ResolvedTheme {
  return resolveTheme(getStoredTheme());
}

let systemListener: ((e: MediaQueryListEvent) => void) | null = null;

function followSystem(follow: boolean): void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  const mql = window.matchMedia(DARK_QUERY);
  if (systemListener) {
    mql.removeEventListener?.("change", systemListener);
    systemListener = null;
  }
  if (!follow) return;
  systemListener = (e) => {
    document.documentElement.dataset.theme = e.matches ? "dark" : "light";
  };
  mql.addEventListener?.("change", systemListener);
}

/** Applies the theme to the document and persists the choice. */
export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = resolveTheme(theme);
  followSystem(theme === "system");
  window.localStorage.setItem(STORAGE_KEY, theme);
}
