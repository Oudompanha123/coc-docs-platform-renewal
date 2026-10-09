"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type PageHeader = {
  title: string;
  subtitle: string;
  titleIcon?: ReactNode;
};

type ShellContextValue = {
  header: PageHeader;
  setHeader: (h: PageHeader) => void;
  mobileNavOpen: boolean;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  /** Desktop only: the sidebar folded to its icon rail (ADR-104 r2.9). */
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

/** A per-viewer convenience, so browser storage rather than anything shared. */
const SIDEBAR_STORAGE_KEY = "coc-docs-sidebar-collapsed";

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeader>({ title: "", subtitle: "" });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  // Starts expanded on the server and the first client render alike, then
  // picks up the stored choice — reading storage during render would make the
  // two disagree and fail hydration.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    try {
      if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "1") setSidebarCollapsed(true);
    } catch {
      // Storage blocked (private window, site data off): stay expanded.
    }
  }, []);
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // Not remembered this time; the toggle itself still works.
      }
      return next;
    });
  }, []);

  // Bails out when the incoming header is the same title/subtitle/icon as
  // the current one. Without this, a page whose own re-render recreates its
  // titleIcon JSX (a new object every time, even with identical props) calls
  // this on every one of its renders; each call still updates state and
  // forces every useShell() consumer to re-render, which is otherwise
  // harmless but can compound into a much larger cascade than the one
  // actual change warranted.
  const setHeader = useCallback((h: PageHeader) => {
    setHeaderState((prev) =>
      prev.title === h.title && prev.subtitle === h.subtitle && prev.titleIcon === h.titleIcon ? prev : h,
    );
  }, []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  // Memoized so a re-render of this provider that changes neither `header`
  // nor `mobileNavOpen` (e.g. triggered by a parent re-rendering for an
  // unrelated reason) does not hand every useShell() consumer a new object
  // reference and force them all to re-render regardless.
  const value = useMemo(
    () => ({ header, setHeader, mobileNavOpen, openMobileNav, closeMobileNav, sidebarCollapsed, toggleSidebar }),
    [header, mobileNavOpen, setHeader, openMobileNav, closeMobileNav, sidebarCollapsed, toggleSidebar],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
