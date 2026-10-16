"use client";

import { useEffect, useState, type ReactNode } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { AuthGateDialog } from "@/components/welcome/AuthGateDialog";
import { PublicHeader } from "@/components/welcome/PublicHeader";
import { useSession } from "@/lib/auth/SessionProvider";
import { useProductStats } from "@/lib/docs/useProductStats";
import { applyTheme, getResolvedTheme } from "@/lib/theme";

/** The signed-in header: the `/home` one, with the product menu. */
function MemberStoreHeader() {
  const productStats = useProductStats();
  return <MemberHeader products={productStats.status === "ready" ? productStats.products : []} />;
}

/**
 * The header a visitor with no session sees on a public Store page — the
 * same `PublicHeader` as /welcome, so the two read as one site. Its theme
 * toggle changes the shared preference (lib/theme.ts), which is what this
 * page's dark mode follows (`data-shell="home"`).
 */
function PublicStoreHeader({ onRequireAuth }: { onRequireAuth: (product: string) => void }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(getResolvedTheme() === "dark");
  }, []);

  function toggleTheme() {
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    setIsDark(next === "dark");
  }

  return (
    <PublicHeader
      active="store"
      isDark={isDark}
      onToggleTheme={toggleTheme}
      onRequireAuth={onRequireAuth}
      // The Store's page surface (see StoreShell's root), not --background:
      // in dark mode the shell paints bg-white a lighter grey than --background.
      surfaceClassName="bg-white"
    />
  );
}

/**
 * The header around a Store page — the listing and each app's page share it.
 * A signed-in caller gets the `/home` header; a visitor with no session gets
 * the public one, since the Store's public apps are open to everyone. No
 * footer: the Store is a working page, not a landing page.
 */
export function StoreShell({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const [authGate, setAuthGate] = useState<string | null>(null);

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      {status === "anonymous" ? <PublicStoreHeader onRequireAuth={setAuthGate} /> : <MemberStoreHeader />}
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">{children}</main>
      <AuthGateDialog product={authGate} onClose={() => setAuthGate(null)} />
    </div>
  );
}
