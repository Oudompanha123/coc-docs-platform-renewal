"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useAxRenewalProject } from "./useAxRenewalProject";

type AxRenewalProjectContextValue = ReturnType<typeof useAxRenewalProject>;

const AxRenewalProjectContext = createContext<AxRenewalProjectContextValue | null>(null);

/**
 * Shares one `useAxRenewalProject()` instance across the whole standalone
 * shell (activity bar, sidebar, topbar, status bar, page content, assistant
 * panel). Every one of those used to call the hook independently, which was
 * fine while they only ever *read* the project — each landed on the same
 * project because each read the same `project=` URL param. It stopped being
 * fine once the assistant panel moved out to the layout level (for full
 * height, alongside the sidebar) and started triggering the same mutations
 * the page's own buttons do: without a shared instance, confirming a
 * section from the assistant would refresh only the assistant's own copy of
 * `detail`, leaving the page's confirmation badge stale until an unrelated
 * navigation forced a re-fetch.
 */
export function AxRenewalProjectProvider({ children }: { children: ReactNode }) {
  const value = useAxRenewalProject();
  return <AxRenewalProjectContext.Provider value={value}>{children}</AxRenewalProjectContext.Provider>;
}

export function useAxRenewalProjectContext(): AxRenewalProjectContextValue {
  const value = useContext(AxRenewalProjectContext);
  if (!value) {
    throw new Error("useAxRenewalProjectContext must be used inside <AxRenewalProjectProvider>");
  }
  return value;
}
