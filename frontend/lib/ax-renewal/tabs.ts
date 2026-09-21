"use client";

import { useEffect, useState } from "react";
import { NO_TAB_OPEN, type AxRenewalExplorerKey } from "./explorerGroups";

/**
 * Which explorer sections are "open" as tabs across the top of the page,
 * mirroring the reference prototype's tab bar — but driven by the existing
 * `section=` query param rather than new URL state, so the sidebar's links
 * keep working exactly as they do today; this only tracks which of the
 * sections visited so far should still show a tab. `active` is null once
 * every tab has been closed (the caller has navigated to the `NO_TAB_OPEN`
 * sentinel) — matching the prototype, which allows closing its last tab too.
 */
export function useAxRenewalTabs(active: AxRenewalExplorerKey | null) {
  const [tabs, setTabs] = useState<AxRenewalExplorerKey[]>(active != null ? [active] : []);

  useEffect(() => {
    if (active == null) return;
    setTabs((prev) => (prev.includes(active) ? prev : [...prev, active]));
  }, [active]);

  /**
   * Closes one tab, regardless of how many remain open — unlike a browser
   * tab strip, this one can go all the way to zero. Returns:
   * - `null` when the closed tab wasn't the active one — nothing to navigate to.
   * - a key when the active tab closed and a neighboring tab should take its place.
   * - `NO_TAB_OPEN` when the active tab closed and none are left — the
   *   caller should navigate to that sentinel.
   */
  function closeTab(key: AxRenewalExplorerKey): AxRenewalExplorerKey | typeof NO_TAB_OPEN | null {
    const index = tabs.indexOf(key);
    if (index < 0) return null;
    const next = tabs.filter((t) => t !== key);
    setTabs(next);
    if (key !== active) return null;
    return next[index] ?? next[index - 1] ?? NO_TAB_OPEN;
  }

  return { tabs, closeTab };
}
