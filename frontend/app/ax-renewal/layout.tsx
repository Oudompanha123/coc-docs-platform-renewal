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
import { useResizableWidth } from "@/lib/ax-renewal/useResizableWidth";
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
  // Desktop-only "hide the whole Explorer panel" toggle — separate from the
  // mobile drawer's open/close above. Lifted here (not local to
  // AxRenewalSidebar) since the button that triggers it lives in the
  // always-visible icon rail, so it survives the panel collapsing to width
  // 0 and can bring it back.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sidebarResize = useResizableWidth({
    storageKey: "ax-renewal-sidebar-width",
    defaultWidth: 256,
    min: 200,
    max: 420,
    direction: 1,
  });
  const assistantResize = useResizableWidth({
    storageKey: "ax-renewal-assistant-width",
    defaultWidth: 360,
    min: 280,
    max: 520,
    direction: -1,
  });

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
            status bar's own height — for exactly this reason.

            h-screen + overflow-hidden here (not min-h-screen), so the PAGE
            itself never scrolls — previously it did, and every column's own
            `sticky top-0` unstuck itself once the page had scrolled further
            than that one column's own height (worst on a tall <main>,
            e.g. Attach source's full verification list), leaving the
            sidebar/rail detached mid-page with blank space trailing it.
            Each column now scrolls (or doesn't) entirely on its own within a
            frame that itself never moves — min-h-0 on both flex wrappers
            below is required for that: without it a flex child won't shrink
            past its content's natural height, so `overflow-y-auto` deeper in
            the tree (main, or AxRenewalSidebar's own nav) never actually
            triggers. */}
        <div data-shell="ax-renewal" className="flex h-screen flex-col overflow-hidden bg-white">
          <div className="min-h-0 flex-1 lg:flex">
            <AxRenewalActivityBar
              sidebarCollapsed={sidebarCollapsed}
              onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
            />
            <AxRenewalSidebar
              isOpen={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
              panelCollapsed={sidebarCollapsed}
              width={sidebarResize.width}
              onResizeStart={sidebarResize.startDrag}
              isResizing={sidebarResize.isDragging}
            />
            <div className="flex min-h-0 flex-1 flex-col lg:min-w-0">
              <AxRenewalTopbar onMenuClick={() => setMobileNavOpen(true)} />
              <main className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            </div>
            <AxAssistantPanel
              width={assistantResize.width}
              onResizeStart={assistantResize.startDrag}
              isResizing={assistantResize.isDragging}
            />
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
