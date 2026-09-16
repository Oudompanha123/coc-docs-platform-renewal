"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

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

  const setHeader = useCallback((h: PageHeader) => setHeaderState(h), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  return (
    <ShellContext.Provider value={{ header, setHeader, mobileNavOpen, openMobileNav, closeMobileNav }}>
      {children}
    </ShellContext.Provider>
  );
}

export function useShell(): ShellContextValue {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside <ShellProvider>");
  return ctx;
}
