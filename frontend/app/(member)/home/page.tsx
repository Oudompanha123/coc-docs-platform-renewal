"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldIcon } from "@/components/auth/icons";
import { MemberHeader } from "@/components/home/MemberHeader";
import { ProductGlanceCard } from "@/components/home/ProductGlanceCard";
import { RecentDocumentsPanel } from "@/components/home/RecentDocumentsPanel";
import { TasksPanel } from "@/components/home/TasksPanel";
import { ProductsStrip } from "@/components/home/ProductsStrip";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ScrollReveal } from "@/components/welcome/ScrollReveal";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useProductStats } from "@/lib/docs/useProductStats";
import { fetchOpenTasks, type Task } from "@/lib/tasks/tasks-api";
import { mostAttentionProduct, productHref, totalNotWritten } from "@/lib/home/product-links";

/**
 * The Member (`user`-role) post-login home — reuses `/welcome`'s visual
 * structure (hero, framed preview, product strip, bento, CTA band, footer)
 * but every section reads this account's own real data instead of marketing
 * copy (ADR-033). Built as its own independent component tree rather than by
 * importing `/welcome`'s components, so nothing here can ever change that
 * page's behavior.
 */
export default function MemberHomePage() {
  const { user } = useSession();
  const currentUser = useCurrentUser();
  const productStats = useProductStats();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchOpenTasks().then(setTasks);
  }, []);

  const canManage = user?.role === "admin" || user?.role === "super_admin";
  const firstName = currentUser?.name.split(" ")[0] ?? "there";
  const attention =
    productStats.status === "ready" ? mostAttentionProduct(productStats.products, productStats.stats) : null;
  const notWritten = productStats.status === "ready" ? totalNotWritten(productStats.stats) : 0;

  return (
    <div data-shell="home" className="min-h-screen bg-background">
      <MemberHeader
        products={productStats.status === "ready" ? productStats.products : []}
        onOpenProfile={() => setShowProfile(true)}
      />

      <main>
        <section className="px-6 pb-12 pt-12 sm:pt-16">
          <div className="animate-entrance mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
              {productStats.status === "loading"
                ? "Loading your workspace…"
                : productStats.status === "error"
                  ? "Couldn't load your workspace."
                  : notWritten > 0
                    ? `${notWritten} document${notWritten === 1 ? "" : "s"} still need writing since your last visit`
                    : "Every document across your workspace is written"}
            </span>

            {productStats.status === "error" && (
              <p className="mt-2 text-xs font-medium text-destructive">
                {productStats.message}{" "}
                <button type="button" onClick={productStats.refetch} className="underline">
                  Try again
                </button>
              </p>
            )}

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {`Pick up where you left off, ${firstName}.`}
            </h1>

            <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
              {attention
                ? `${attention.label} needs the most attention right now — pick up where the team left off.`
                : "Every product is fully documented. Browse what your team has written so far."}
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href={attention ? productHref(attention.key) : "#products"}>
                  {attention ? `Continue with ${attention.label}` : "Browse all products"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#products">Browse all products</Link>
              </Button>
            </div>
          </div>

          <div className="animate-entrance relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-xl border border-surface-border bg-card [animation-delay:120ms]">
            <div className="flex items-center gap-1.5 border-b border-surface-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            {/* No entrance animation on this pane itself — it's a flat
                bg-muted-surface rectangle with no border/shadow of its own, so a
                slide+fade here has no visible edge to move and reads as
                nothing happening. The frame above and the two content
                groups below carry the visible motion instead. */}
            <div className="bg-muted-surface p-4 sm:p-5">
              {productStats.status === "ready" && (
                <>
                  {/* Staggered per-section entrance, not one flat block —
                      same fade-slide-up technique and cadence as the
                      overview page's own multi-group sequence. Delays start
                      at 500ms (the enclosing browser-frame's own 120ms delay
                      + its 380ms duration), so these actually slide in after
                      the frame appears rather than finishing invisibly
                      inside it before it's even visible. */}
                  <div className="animate-entrance grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 [animation-delay:500ms]">
                    {productStats.products.map((product) => {
                      const stat = productStats.stats.find((s) => s.id === product.key);
                      return stat ? <ProductGlanceCard key={product.key} product={product} stat={stat} /> : null;
                    })}
                  </div>

                  <div className="animate-entrance mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 [animation-delay:570ms]">
                    <RecentDocumentsPanel docs={productStats.recentDocs} />
                    <TasksPanel tasks={tasks} />
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {productStats.status === "ready" && (
          <ProductsStrip products={productStats.products} stats={productStats.stats} />
        )}

        <section className="mx-auto max-w-5xl px-6 py-16">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">Everything you need, in one place.</h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-base text-muted-foreground">
              Your documents and your open tasks.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={80} className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <RecentDocumentsPanel docs={productStats.status === "ready" ? productStats.recentDocs : null} />
            <TasksPanel tasks={tasks} />
          </ScrollReveal>
        </section>

        <section className="px-6 pb-16">
          <ScrollReveal className="relative mx-auto w-full max-w-5xl overflow-hidden rounded-xl bg-[url('/background-banner.jpg')] bg-cover bg-center px-6 py-12 text-center sm:px-16">
            {/* Scrim: the photo is bright enough that white text needs a dark
                layer under it to stay legible, same "decorative absolute div
                painted before the relative-positioned copy" pattern /welcome's
                own CTA band already uses for its blur circle. */}
            <div aria-hidden="true" className="absolute top-0 right-0 bottom-0 left-0 bg-black/60" />
            {canManage ? (
              <>
                <h2 className="relative text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  {productStats.status === "ready"
                    ? `${notWritten} document${notWritten === 1 ? "" : "s"} still need${notWritten === 1 ? "s" : ""} writing.`
                    : "Keep your knowledge base up to date."}
                </h2>
                <p className="relative mt-2 text-sm text-sidebar-muted sm:text-base">
                  Pick a product and fill in what&apos;s missing.
                </p>
                <Button asChild size="lg" className="relative mt-6">
                  <Link href={attention ? productHref(attention.key) : "#products"}>New Document</Link>
                </Button>
              </>
            ) : (
              <>
                <h2 className="relative text-xl font-semibold tracking-tight text-white sm:text-2xl">
                  Spotted something missing or out of date?
                </h2>
                <p className="relative mt-2 text-sm text-white sm:text-base">
                  Your account can read every product&apos;s documentation, but editing is limited to admins.
                </p>
                <Button type="button" size="lg" className="relative mt-6">
                  <ShieldIcon className="size-4 text-primary-foreground/80" />
                  Ask an Admin for edit access
                </Button>
              </>
            )}
          </ScrollReveal>
        </section>
      </main>

      <ScrollReveal>
        <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />
      </ScrollReveal>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
