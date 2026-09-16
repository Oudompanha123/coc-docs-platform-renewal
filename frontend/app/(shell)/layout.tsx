"use client";

import { type ReactNode } from "react";
import { ShellProvider, useShell } from "@/lib/layout/ShellContext";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { RequireSession } from "@/components/layout/RequireSession";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

function ShellContent({ children }: { children: ReactNode }) {
  const { mobileNavOpen, openMobileNav, closeMobileNav } = useShell();

  return (
    <SessionProvider>
      <RequireSession>
        <div data-shell="admin" className="min-h-screen bg-page lg:flex">
          <Sidebar isOpen={mobileNavOpen} onClose={closeMobileNav} />
          <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
            <Topbar onMenuClick={openMobileNav} />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </RequireSession>
    </SessionProvider>
  );
}

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <ShellProvider>
      <ShellContent>{children}</ShellContent>
    </ShellProvider>
  );
}
