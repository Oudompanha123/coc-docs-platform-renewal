"use client";

import { notFound, useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { MemberHeader } from "@/components/home/MemberHeader";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ProductTabBar } from "@/components/docs/ProductTabBar";
import { ProductDocsProvider } from "@/components/docs/ProductDocsContext";
import { useNavStructure } from "@/lib/docs/useNavStructure";

/**
 * Owns everything that should stay mounted across a tab click — header,
 * breadcrumb, page title, tab bar, footer — for every page under one
 * product (`/docs/[productKey]`, `/docs/[productKey]/[slug]`).
 *
 * `[slug]` is a child route's own segment, not this layout's — but
 * `useParams()` reads the *whole* current path's params from anywhere in the
 * tree, layout included, so this can resolve "which item is active" itself
 * rather than waiting for the page below to tell it. That's what makes the
 * tab bar's active pill and its scroll-into-view genuinely persistent: it is
 * the same mounted `ProductTabBar` instance reacting to a prop change, not a
 * fresh instance created by a fresh page.
 *
 * `{children}` — `ProductDocsPage`, now just the rendered content + meta
 * panel — is the only part that (cheaply) re-renders per tab, via
 * `ProductDocsProvider` so it doesn't need to re-resolve `product`/
 * `activeItem` itself.
 */
export default function ProductLayout({ children }: { children: ReactNode }) {
  const { productKey, slug } = useParams<{ productKey: string; slug?: string | string[] }>();
  const resolvedSlug = Array.isArray(slug) ? slug[0] : slug;

  const products = useNavStructure();
  const product = products?.find((p) => p.key === productKey);
  const activeItem =
    resolvedSlug !== undefined
      ? product?.items.find((i) => i.slug === resolvedSlug)
      : (product?.items.find((i) => i.slug === "") ?? product?.items[0]);

  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  if (products && (!product || (resolvedSlug !== undefined && !activeItem))) {
    notFound();
  }

  return (
    <div data-shell="home" className="min-h-screen bg-white">
      {/* Header stays in normal flow here (`static`, overriding its own
          `sticky` class) rather than staying pinned like it does on /home —
          once the tab bar below reaches the top of the viewport and pins
          itself there, a still-pinned header would stack on top of it. An
          ancestor with `overflow: hidden` also breaks `position: sticky`
          for everything inside it (the tab bar's containing block would be
          clipped to that box instead of the viewport), which is the reason
          the decorative blur circle below moved into its own clipping layer
          instead of clipping the whole `<main>` the way it used to. */}
      <div className="[&>header]:static">
        <MemberHeader
          products={products ?? []}
          onOpenProfile={() => setShowProfile(true)}
        />
      </div>

      <main className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-80 w-[640px] -translate-x-1/2 rounded-full bg-brand-purple/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-6 py-10">
          {product && activeItem ? (
            <>
              <p className="text-sm text-muted">
                <Link href="/home" className="hover:text-ink">
                  Products
                </Link>{" "}
                / <span className="font-semibold text-ink">{product.label}</span>
              </p>
              <h1 className="mt-1 text-3xl font-extrabold text-ink">{product.label} Documentation</h1>
              <p className="mt-1 text-sm text-muted">Browse guides and references for {product.label}</p>

              <div className="mt-6">
                <ProductTabBar productKey={product.key} items={product.items} activeSlug={activeItem.slug} />
              </div>

              <ProductDocsProvider value={{ product, activeItem }}>{children}</ProductDocsProvider>
            </>
          ) : null}
        </div>
      </main>

      <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
