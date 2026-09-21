"use client";

import { useEffect } from "react";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY } from "@/lib/theme";

/**
 * Applies the Main Dashboard's stored theme choice (lib/theme.ts,
 * Settings → Appearance) to this standalone tab — same mount-time apply
 * Topbar.tsx does for every admin page, needed here too since AX Renewal is
 * a genuinely separate document, not just a different route in the same one.
 *
 * Also listens for the `storage` event, which every other same-origin tab
 * receives when one of them calls `localStorage.setItem` — so a caller who
 * toggles dark mode in the Main Dashboard tab while this one is already open
 * sees it change live, not just on this tab's next load.
 */
export function AxRenewalThemeSync() {
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
