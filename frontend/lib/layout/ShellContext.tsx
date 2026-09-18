"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

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
};

const ShellContext = createContext<ShellContextValue | null>(null);

export function ShellProvider({ children }: { children: ReactNode }) {
  const [header, setHeaderState] = useState<PageHeader>({ title: "", subtitle: "" });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
    () => ({ header, setHeader, mobileNavOpen, openMobileNav, closeMobileNav }),
    [header, mobileNavOpen, setHeader, openMobileNav, closeMobileNav],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
