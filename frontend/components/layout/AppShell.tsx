"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

type AppShellProps = {
  pageTitle: string;
  pageSubtitle: string;
  titleIcon?: React.ReactNode;
  children: ReactNode;
};

/** Reusable authenticated shell (sidebar + topbar) for every admin page. */
export function AppShell({ pageTitle, pageSubtitle, titleIcon, children }: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div data-shell="admin" className="min-h-screen bg-page lg:flex">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
        <Topbar
          title={pageTitle}
          subtitle={pageSubtitle}
          titleIcon={titleIcon}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
