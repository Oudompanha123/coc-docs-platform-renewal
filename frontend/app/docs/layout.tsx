"use client";

import { usePathname } from "@/lib/i18n/navigation";
import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import { DocsMobileNav } from "@/components/docs/DocsMobileNav";
import { isProductDocsRoute } from "@/lib/docs/nav-routing";
import { SessionProvider } from "@/lib/auth/SessionProvider";

/**
 * A product's own page (`/docs/[productKey]`, `/docs/[productKey]/[slug]`)
 * draws its own full-width header and tab bar (`ProductDocsPage`), reusing
 * `MemberHeader` — which needs a `SessionProvider` ancestor, same as `/home`
 * has via `app/(member)/layout.tsx`. Provided here, at the layout, so
 * switching tabs within a product doesn't re-fetch `/auth/me` on every
 * navigation the way mounting it inside the page itself would.
 *
 * The static pages' sidebar-plus-narrow-column shell doesn't apply on a
 * product route. This check is by pathname alone (no product-list fetch),
 * so it never flashes the sidebar shell for an instant before switching away.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isProductDocsRoute(pathname)) {
    return <SessionProvider>{children}</SessionProvider>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DocsSidebar />
      <div className="min-w-0 flex-1">
        <DocsMobileNav />
        <main className="mx-auto max-w-3xl px-6 py-10 sm:py-12">{children}</main>
      </div>
    </div>
  );
}
