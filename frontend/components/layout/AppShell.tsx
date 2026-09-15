"use client";

import { useState, type ReactNode } from "react";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { RequireSession } from "./RequireSession";
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
    // Provider outside the guard: the guard reads the session it publishes,
    // and the sidebar and topbar inside read the same one answer rather than
    // asking the server again each.
    <SessionProvider>
      <RequireSession>
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
      </RequireSession>
    </SessionProvider>
  );
}
