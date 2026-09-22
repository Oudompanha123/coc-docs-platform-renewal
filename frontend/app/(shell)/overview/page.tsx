"use client";

import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { RecentActivityPanel, RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { EmptyContentIllustration } from "@/components/docs/editor/EmptyContentIllustration";
import { HomeIcon } from "@/components/layout/icons";
import { useProductStats } from "@/lib/docs/useProductStats";

export default function OverviewPage() {
  const productStats = useProductStats();

  return (
    <AppShell
      pageTitle="Overview"
      pageSubtitle="Your documentation workspace at a glance"
      titleIcon={<HomeIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      {productStats.status === "loading" && <p className="mt-6 text-sm text-muted">Loading your workspace…</p>}

      {productStats.status === "error" && (
        <div className="mt-6 rounded-[10px] border border-border bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#c94040]">{productStats.message}</p>
          <button
            type="button"
            onClick={productStats.refetch}
            className="mt-3 rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            Try again
          </button>
        </div>
      )}

      {productStats.status === "ready" && productStats.products.length === 0 && (
        <div className="animate-entrance mx-auto mt-10 max-w-md text-center">
          <EmptyContentIllustration />
          <h2 className="mt-6 text-lg font-bold text-dash-ink">No products yet.</h2>
          <p className="mt-2 text-sm text-muted">Ask an admin to add a product to see it here.</p>
        </div>
      )}

      {productStats.status === "ready" && productStats.products.length > 0 && (
        <>
          <div className="animate-entrance grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {productStats.stats.map((stat) => (
              <StatCard key={stat.id} data={stat} />
            ))}
          </div>

          <div className="animate-entrance mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[65fr_35fr] [animation-delay:70ms]">
            <div className="overflow-hidden rounded-[10px] border border-border bg-white py-5 shadow-sm">
              <div>
                <div className="flex items-center justify-between pl-5 pr-[15px]">
                  <h2 className="text-base font-bold text-dash-ink">Recent Documents</h2>
                  <a href="#" className="text-sm font-semibold text-brand-purple hover:underline">
                    View all
                  </a>
                </div>
                <div className={`mt-1 divide-y divide-border pl-5 pr-[20px] ${RECENT_PANEL_LIST_HEIGHT}`}>
                  {productStats.recentDocs.map((doc) => (
                    <DocumentRow key={doc.id} data={doc} />
                  ))}
                </div>
              </div>
            </div>

            <RecentActivityPanel />
          </div>
        </>
      )}
    </AppShell>
  );
}
