"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldIcon } from "@/components/auth/icons";
import { MemberHeader } from "@/components/home/MemberHeader";
import { ProductGlanceCard } from "@/components/home/ProductGlanceCard";
import { RecentDocumentsPanel } from "@/components/home/RecentDocumentsPanel";
import { TasksPanel } from "@/components/home/TasksPanel";
import { ProductsStrip } from "@/components/home/ProductsStrip";
import { HomeFooter } from "@/components/home/HomeFooter";
import { ProfileModal } from "@/components/layout/ProfileModal";
import { NotificationsModal } from "@/components/home/NotificationsModal";
import { useSession } from "@/lib/auth/SessionProvider";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { useNavStructure } from "@/lib/docs/useNavStructure";
import { computeProductStats, computeRecentDocs, type ContentDocRow } from "@/lib/docs/content-stats";
import type { StatCardData } from "@/lib/mock/overview";
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
  const products = useNavStructure();
  const [stats, setStats] = useState<StatCardData[] | null>(null);
  const [recentDocs, setRecentDocs] = useState<ContentDocRow[] | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!products) return;
    computeProductStats(products).then(setStats);
    computeRecentDocs(products).then(setRecentDocs);
  }, [products]);

  useEffect(() => {
    fetchOpenTasks().then(setTasks);
  }, []);

  const canManage = user?.role === "admin" || user?.role === "super_admin";
  const firstName = currentUser?.name.split(" ")[0] ?? "there";
  const attention = products && stats ? mostAttentionProduct(products, stats) : null;
  const notWritten = stats ? totalNotWritten(stats) : 0;

  return (
    <div className="min-h-screen bg-white">
      <MemberHeader
        products={products ?? []}
        onOpenProfile={() => setShowProfile(true)}
        onOpenNotifications={() => setShowNotifications(true)}
      />

      <main>
        <section className="px-6 pb-16 pt-16 sm:pt-20">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-purple/10 px-3 py-1 text-xs font-semibold text-brand-purple">
              {stats === null
                ? "Loading your workspace…"
                : notWritten > 0
                  ? `${notWritten} document${notWritten === 1 ? "" : "s"} still need writing since your last visit`
                  : "Every document across your workspace is written"}
            </span>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-ink sm:text-5xl">
              Pick up where you left off, {firstName}.
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
              {attention
                ? `${attention.label} needs the most attention right now — pick up where the team left off.`
                : "Every product is fully documented. Browse what your team has written so far."}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={attention ? productHref(attention.key) : "#products"}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
              >
                {attention ? `Continue with ${attention.label}` : "Browse your products"}
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-page"
              >
                Browse all products
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
            </div>
            <div className="bg-page p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {(products ?? []).map((product) => {
                  const stat = stats?.find((s) => s.id === product.key);
                  return stat ? <ProductGlanceCard key={product.key} product={product} stat={stat} /> : null;
                })}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <RecentDocumentsPanel docs={recentDocs} />
                <TasksPanel tasks={tasks} />
              </div>
            </div>
          </div>
        </section>

        <ProductsStrip products={products ?? []} stats={stats ?? []} />

        <section className="mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold text-ink">Everything you need, in one place.</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-base text-muted">
            Your documents, your open tasks, and how the team is using the workspace.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RecentDocumentsPanel docs={recentDocs} />
            <TasksPanel tasks={tasks} />
            <Link
              href={productHref("usage")}
              className="flex flex-col justify-between rounded-2xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <h3 className="text-base font-semibold text-ink">Usage & reports</h3>
                <p className="mt-1 text-sm text-muted">See how your team is using the workspace.</p>
              </div>
              <span className="mt-4 text-sm font-semibold text-brand-purple">Open Usage →</span>
            </Link>
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-[url('/background-banner.jpg')] bg-cover bg-center px-6 py-14 text-center sm:px-16">
            {/* Scrim: the photo is bright enough that white text needs a dark
                layer under it to stay legible, same "decorative absolute div
                painted before the relative-positioned copy" pattern /welcome's
                own CTA band already uses for its blur circle. */}
            <div aria-hidden="true" className="absolute inset-0 bg-black/60" />
            {canManage ? (
              <>
                <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
                  {notWritten} document{notWritten === 1 ? "" : "s"} still need{notWritten === 1 ? "s" : ""} writing.
                </h2>
                <p className="relative mt-3 text-sm text-sidebar-muted sm:text-base">
                  Pick a product and fill in what&apos;s missing.
                </p>
                <Link
                  href={attention ? productHref(attention.key) : "#products"}
                  className="relative mt-7 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                >
                  New Document
                </Link>
              </>
            ) : (
              <>
                <h2 className="relative text-2xl font-bold text-white sm:text-3xl">
                  Spotted something missing or out of date?
                </h2>
                <p className="relative mt-3 text-sm text-white sm:text-base">
                  Your account can read every product&apos;s documentation, but editing is limited to admins.
                </p>
                <button
                  type="button"
                  className="relative mt-7 inline-flex items-center gap-2 justify-center rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                >
                  <ShieldIcon className="h-4 w-4 text-white/80" />
                  Ask an Admin for edit access
                </button>
              </>
            )}
          </div>
        </section>
      </main>

      <HomeFooter onOpenProfile={() => setShowProfile(true)} onOpenNotifications={() => setShowNotifications(true)} />

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showNotifications && <NotificationsModal onClose={() => setShowNotifications(false)} />}
    </div>
  );
}
