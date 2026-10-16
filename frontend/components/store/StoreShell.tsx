"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { LockIcon } from "@/components/auth/icons";
import { MemberHeader } from "@/components/home/MemberHeader";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { NavMenu, NavMenuItem, productPagesBlurb } from "@/components/ui/nav-menu";
import { AuthGateDialog } from "@/components/welcome/AuthGateDialog";
import { ProductsNavDropdown } from "@/components/welcome/ProductsNavDropdown";
import { useSession } from "@/lib/auth/SessionProvider";
import { FALLBACK_NAV } from "@/lib/docs/nav-api";
import { useProductStats } from "@/lib/docs/useProductStats";

const LINK_CLASS =
  "inline-flex h-9 items-center rounded-3xl px-3.5 text-muted-foreground transition-colors outline-none hover:bg-muted-surface/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** The signed-in header: the `/home` one, with the product menu. */
function MemberStoreHeader() {
  const productStats = useProductStats();
  return <MemberHeader products={productStats.status === "ready" ? productStats.products : []} />;
}

/**
 * The header a visitor with no session sees on a public Store page: the logo
 * back to /welcome, Home, Store, Products (a locked preview — choosing a
 * product asks them to sign in, as on /welcome), and the two ways in. Below
 * md the links collapse into one "Menu" so a narrow window keeps them.
 */
function PublicStoreHeader({ onRequireAuth }: { onRequireAuth: (product: string) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Link href="/welcome" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
            <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-8 w-auto rounded-md" />
          </Link>
          <div className="md:hidden">
            <NavMenu label="Menu" panelClassName="w-[280px] grid-cols-1">
              <NavMenuItem title="Home" href="/welcome" />
              <NavMenuItem title="Store" href="/store" active />
              {FALLBACK_NAV.map((product) => (
                <NavMenuItem
                  key={product.key}
                  title={product.label}
                  description={productPagesBlurb(product.items) ?? "Documentation"}
                  onSelect={() => onRequireAuth(product.label)}
                  trailing={<LockIcon className="size-3 shrink-0 text-muted-foreground" />}
                />
              ))}
            </NavMenu>
          </div>
        </div>
        <nav className="ml-8 mr-auto hidden items-center gap-1 text-[15px] md:flex">
          <Link href="/welcome" className={LINK_CLASS}>
            Home
          </Link>
          <Link
            href="/store"
            aria-current="page"
            className="inline-flex h-9 items-center rounded-3xl px-3.5 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Store
          </Link>
          <ProductsNavDropdown products={FALLBACK_NAV} onRequireAuth={onRequireAuth} />
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
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
