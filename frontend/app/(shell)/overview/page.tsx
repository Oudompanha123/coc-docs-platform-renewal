"use client";

import { SkeletonCard, SkeletonGroup, SkeletonList, SkeletonStatCards } from "@/components/ui/skeleton";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { RecentActivityPanel, RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { EmptyContentIllustration } from "@/components/docs/editor/EmptyContentIllustration";
import { HomeIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { useProductStats } from "@/lib/docs/useProductStats";

export default function OverviewPage() {
  const productStats = useProductStats();

  return (
    <AppShell
      pageTitle="Overview"
      pageSubtitle="Your documentation workspace at a glance"
      titleIcon={<HomeIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      {productStats.status === "loading" && (
        <SkeletonGroup label="Loading your workspace">
          <SkeletonStatCards count={5} className="md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5" />
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[65fr_35fr]">
            <div className="rounded-xl border border-surface-border bg-card px-4 py-4">
              <SkeletonList rows={5} />
            </div>
            <SkeletonCard lines={5} />
          </div>
        </SkeletonGroup>
      )}

      {productStats.status === "error" && (
        <div className="mt-6 rounded-xl border border-surface-border bg-card p-4">
          <p className="text-sm font-medium text-destructive">{productStats.message}</p>
          <Button
            type="button"
            onClick={productStats.refetch}
            variant="outline"
            size="sm"
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      )}

      {productStats.status === "ready" && productStats.products.length === 0 && (
        <div className="animate-entrance mx-auto mt-10 max-w-md text-center">
          <EmptyContentIllustration />
          <h2 className="mt-6 text-lg font-semibold text-foreground">No products yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ask an admin to add a product to see it here.</p>
        </div>
      )}

      {productStats.status === "ready" && productStats.products.length > 0 && (
        <>
          <div className="animate-entrance grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
            {productStats.stats.map((stat) => (
              <StatCard key={stat.id} data={stat} />
            ))}
          </div>

          <div className="animate-entrance mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[65fr_35fr] [animation-delay:70ms]">
            <div className="overflow-hidden rounded-xl border border-surface-border bg-card py-4">
              <div>
                <div className="flex h-8 items-center justify-between px-4">
                  <h2 className="text-sm font-semibold text-foreground">Recent Documents</h2>
                  <a href="#" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                    View all
                  </a>
                </div>
                <div className={`mt-1 divide-y divide-surface-border px-4 ${RECENT_PANEL_LIST_HEIGHT}`}>
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
