"use client";

import { useState, type ReactNode } from "react";
import { AxRenewalSidebar } from "@/components/ax-renewal/AxRenewalSidebar";
import { AxRenewalStatusBar } from "@/components/ax-renewal/AxRenewalStatusBar";
import { AxRenewalTopbar } from "@/components/ax-renewal/AxRenewalTopbar";
import { RequireSession } from "@/components/layout/RequireSession";
import { SessionProvider } from "@/lib/auth/SessionProvider";

/**
 * A standalone shell for this route, not the admin app's `(shell)` layout —
 * AX Renewal always opens in its own browser tab (see the sidebar's
 * `newTab` nav item), so that tab should show only AX Renewal, not the
 * PRODUCTS/ADMINISTRATION/DEVELOPER navigation of the admin app it was
 * opened from.
 */
function AxRenewalShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <RequireSession>
      <div data-shell="ax-renewal" className="min-h-screen bg-page lg:flex">
        <AxRenewalSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <div className="flex min-h-screen flex-1 flex-col lg:min-w-0">
          <AxRenewalTopbar onMenuClick={() => setMobileNavOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
          <AxRenewalStatusBar />
        </div>
      </div>
    </RequireSession>
  );
}

export default function AxRenewalLayout({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AxRenewalShell>{children}</AxRenewalShell>
    </SessionProvider>
  );
}
