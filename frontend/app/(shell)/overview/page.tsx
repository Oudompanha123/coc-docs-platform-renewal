"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { RecentActivityPanel, RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { HomeIcon } from "@/components/layout/icons";
import { QUICK_ACTIONS, type StatCardData } from "@/lib/mock/overview";
import { computeProductStats, computeRecentDocs, type ContentDocRow } from "@/lib/docs/content-stats";
import { useNavStructure } from "@/lib/docs/useNavStructure";

export default function OverviewPage() {
  const products = useNavStructure();
  const [stats, setStats] = useState<StatCardData[] | null>(null);
  const [recentDocs, setRecentDocs] = useState<ContentDocRow[] | null>(null);

  useEffect(() => {
    if (!products) return;
    computeProductStats(products).then(setStats);
    computeRecentDocs(products).then(setRecentDocs);
  }, [products]);

  return (
    <AppShell
      pageTitle="Overview"
      pageSubtitle="Your documentation workspace at a glance"
      titleIcon={<HomeIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="animate-entrance grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        {(stats ?? []).map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>

      <div className="animate-entrance mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 [animation-delay:70ms]">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard key={action.id} data={action} />
        ))}
      </div>

      <div className="animate-entrance mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[65%_35%] [animation-delay:140ms]">
        <div className="overflow-hidden rounded-2xl border border-border bg-white py-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between pl-5 pr-[15px]">
              <h2 className="text-base font-bold text-dash-ink">Recent Documents</h2>
              <a href="#" className="text-sm font-semibold text-brand-purple hover:underline">
                View all
              </a>
            </div>
            <div className={`mt-1 divide-y divide-border pl-5 pr-[20px] ${RECENT_PANEL_LIST_HEIGHT}`}>
              {(recentDocs ?? []).map((doc) => (
                <DocumentRow key={doc.id} data={doc} />
              ))}
            </div>
          </div>
        </div>

        <RecentActivityPanel />
      </div>
    </AppShell>
  );
}
