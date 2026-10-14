"use client";

import { type ReactNode } from "react";
import { MemberHeader } from "@/components/home/MemberHeader";
import { useProductStats } from "@/lib/docs/useProductStats";

/**
 * The `/home` header around a Store page — the listing and each app's page
 * share it, so both read as part of the member site. No footer: the Store
 * is a working page, not a landing page.
 */
export function StoreShell({ children }: { children: ReactNode }) {
  const productStats = useProductStats();

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      <MemberHeader products={productStats.status === "ready" ? productStats.products : []} />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 sm:pt-12">{children}</main>
    </div>
  );
}
