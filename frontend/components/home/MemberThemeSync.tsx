"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Applies the stored theme choice (lib/theme.ts, Settings → Appearance) to
 * `data-shell="home"` pages on mount — the same thing `AxRenewalThemeSync`
 * does for its shell and `Topbar.tsx` does for the admin app. Without this,
 * a fresh load of `/home`, `/account/settings`, or `/reports/attendance`
 * leaves `<html>` at whatever it already was (no attribute, so the OS
 * preference) even though Appearance already shows "Dark" selected — the
 * control reflects localStorage, but nothing had applied it to this page.
 *
 * Also listens for the `storage` event, so toggling the theme in one tab
 * updates another already-open tab live, not just on its next load.
 */
export function MemberThemeSync() {
  useEffect(() => {
    applyTheme(getStoredTheme());

    function onStorage(e: StorageEvent) {
      if (e.key === THEME_STORAGE_KEY || e.key === null) {
        applyTheme(getStoredTheme());
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
