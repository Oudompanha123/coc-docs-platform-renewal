"use client";

import Link from "next/link";
import { type ReactNode } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/SessionProvider";
import { useProductStats } from "@/lib/docs/useProductStats";

/** The signed-in header: the `/home` one, with the product menu. */
function MemberStoreHeader() {
  const productStats = useProductStats();
  return <MemberHeader products={productStats.status === "ready" ? productStats.products : []} />;
}

/**
 * The header a visitor with no session sees on a public Store page: the logo
 * back to /welcome, and the two ways in. No product menu — the docs behind it
 * are members-only.
 */
function PublicStoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link href="/welcome" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
          {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
          <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-8 w-auto rounded-md" />
        </Link>
        <nav className="ml-8 mr-auto hidden items-center gap-1 text-[15px] md:flex">
          <Link
            href="/welcome"
            className="inline-flex h-9 items-center rounded-3xl px-3.5 text-muted-foreground transition-colors outline-none hover:bg-muted-surface/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Home
          </Link>
          <Link
            href="/store"
            aria-current="page"
            className="inline-flex h-9 items-center rounded-3xl px-3.5 text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            Store
          </Link>
        </nav>
        <div className="flex items-center gap-2">
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

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      {status === "anonymous" ? <PublicStoreHeader /> : <MemberStoreHeader />}
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">{children}</main>
    </div>
  );
}
