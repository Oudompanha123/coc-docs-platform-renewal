"use client";

import { useEffect, useState } from "react";
import type { AxRenewalExplorerKey } from "./explorerGroups";

/**
 * Which explorer sections are "open" as tabs across the top of the page,
 * mirroring the reference prototype's tab bar — but driven by the existing
 * `section=` query param rather than new URL state, so the sidebar's links
 * keep working exactly as they do today; this only tracks which of the
 * sections visited so far should still show a tab.
 */
export function useAxRenewalTabs(active: AxRenewalExplorerKey) {
  const [tabs, setTabs] = useState<AxRenewalExplorerKey[]>([active]);

  useEffect(() => {
    setTabs((prev) => (prev.includes(active) ? prev : [...prev, active]));
  }, [active]);

  /** Closing the active tab leaves the caller to navigate to `nextActive` (a neighboring tab); closing the last open tab is a no-op. */
  function closeTab(key: AxRenewalExplorerKey): AxRenewalExplorerKey | null {
    if (tabs.length <= 1) return null;
    const index = tabs.indexOf(key);
    if (index < 0) return null;
    const next = tabs.filter((t) => t !== key);
    setTabs(next);
    if (key !== active) return null;
    return next[index] ?? next[index - 1] ?? next[0]!;
  }

  return { tabs, closeTab };
}
