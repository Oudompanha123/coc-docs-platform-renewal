"use client";

import { type ReactNode } from "react";
import { ShellProvider, useShell } from "@/lib/layout/ShellContext";
import { SessionProvider } from "@/lib/auth/SessionProvider";
import { LogoutLoadingDim } from "@/components/layout/LogoutLoadingDim";
import { RequireSession } from "@/components/layout/RequireSession";
import { ShellSkeleton } from "@/components/layout/ShellSkeleton";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

function ShellContent({ children }: { children: ReactNode }) {
  const { mobileNavOpen, openMobileNav, closeMobileNav, sidebarCollapsed, toggleSidebar, sidebarWidth, setSidebarWidth } =
    useShell();

  return (
    <SessionProvider>
      <LogoutLoadingDim />
      <RequireSession fallback={<ShellSkeleton />}>
        {/* h-screen + overflow-hidden, not min-h-screen: the page itself
            never scrolls, so Topbar's own border-b stays put at the top
            instead of scrolling away with the rest of the page — only
            <main> scrolls now. min-h-0 on both flex wrappers below is
            required for that: without it a flex child won't shrink past
            its content's natural height, so <main>'s own overflow-y-auto
            never actually triggers. */}
        <div data-shell="admin" className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
          <Sidebar
            isOpen={mobileNavOpen}
            onClose={closeMobileNav}
            collapsed={sidebarCollapsed}
            width={sidebarWidth}
            onResize={setSidebarWidth}
            onCollapse={toggleSidebar}
          />
          <div className="flex min-h-0 flex-1 flex-col lg:min-w-0">
            <Topbar onMenuClick={openMobileNav} />
            <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
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
