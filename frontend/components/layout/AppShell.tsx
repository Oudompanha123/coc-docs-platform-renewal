"use client";

import { useEffect, type ReactNode } from "react";
import { useShell } from "@/lib/layout/ShellContext";

type AppShellProps = {
  pageTitle: string;
  pageSubtitle: string;
  titleIcon?: ReactNode;
  children: ReactNode;
};

/**
 * Sets the shell header (title/subtitle/icon) for the current page and
 * renders its children into the shared layout's <main> area.
 *
 * The sidebar, topbar chrome, session guard, and mobile-nav state all live in
 * app/(shell)/layout.tsx, which stays mounted across navigations — this
 * component only tells that layout what the current page is called.
 */
export function AppShell({ pageTitle, pageSubtitle, titleIcon, children }: AppShellProps) {
  const { setHeader } = useShell();

  useEffect(() => {
    setHeader({ title: pageTitle, subtitle: pageSubtitle, titleIcon });
  }, [pageTitle, pageSubtitle, titleIcon, setHeader]);

  return <>{children}</>;
}
