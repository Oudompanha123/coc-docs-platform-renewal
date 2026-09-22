"use client";

import { useState, type ReactNode } from "react";
import { AxAssistantPanel } from "@/components/ax-renewal/AxAssistantPanel";
import { AxRenewalActivityBar } from "@/components/ax-renewal/AxRenewalActivityBar";
import { AxRenewalSidebar } from "@/components/ax-renewal/AxRenewalSidebar";
import { AxRenewalStatusBar } from "@/components/ax-renewal/AxRenewalStatusBar";
import { AxRenewalThemeSync } from "@/components/ax-renewal/AxRenewalThemeSync";
import { AxRenewalTopbar } from "@/components/ax-renewal/AxRenewalTopbar";
import { RequireSession } from "@/components/layout/RequireSession";
import { AxRenewalProjectProvider } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { SessionProvider } from "@/lib/auth/SessionProvider";

/**
 * A standalone shell for this route, not the admin app's `(shell)` layout —
 * AX Renewal always opens in its own browser tab (see the sidebar's
 * `newTab` nav item), so that tab should show only AX Renewal, not the
 * PRODUCTS/ADMINISTRATION/DEVELOPER navigation of the admin app it was
 * opened from.
 *
 * Mirrors CodeRenewalPlatform.html's own grid: a narrow activity bar, the
 * Explorer sidebar, the tabbed editor column, and the AX Assistant — the
 * last three sharing one `AxRenewalProjectProvider` instance (see that
 * file's comment) so a mutation made from the assistant panel is reflected
 * in the main content immediately, not just in the assistant's own view.
 */
function AxRenewalShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <RequireSession>
      <AxRenewalThemeSync />
      <AxRenewalProjectProvider>
        {/* Two rows, not one: content, then a footer spanning every column
            beneath it — matching CodeRenewalPlatform.html's own shell
            (a grid with `grid-template-rows: minmax(0,1fr) 26px` and
            `.status{grid-column:1/5}`) instead of nesting the status bar
            inside just the middle column, which left it running under the
            main content only while the activity bar/sidebar/assistant panel
            each ran the full viewport height beside it. Every sticky column
            below (`AxRenewalActivityBar`, `AxRenewalSidebar`,
            `AxAssistantPanel`) sizes itself to `calc(100vh-32px)` — the
            status bar's own height — for exactly this reason. */}
        <div data-shell="ax-renewal" className="flex min-h-screen flex-col bg-page">
          <div className="flex-1 lg:flex">
            <AxRenewalActivityBar />
            <AxRenewalSidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
            <div className="flex flex-1 flex-col lg:min-w-0">
              <AxRenewalTopbar onMenuClick={() => setMobileNavOpen(true)} />
              <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
            <AxAssistantPanel />
          </div>
          <AxRenewalStatusBar />
        </div>
      </AxRenewalProjectProvider>
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
