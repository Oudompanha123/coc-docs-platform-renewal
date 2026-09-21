"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { RecentActivityPanel, RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { EmptyContentIllustration } from "@/components/docs/editor/EmptyContentIllustration";
import { HomeIcon } from "@/components/layout/icons";
import { QUICK_ACTIONS } from "@/lib/mock/overview";
import { useProductStats } from "@/lib/docs/useProductStats";
import { mostAttentionProduct } from "@/lib/home/product-links";
import { me, type Role } from "@/lib/auth/api";

/**
 * Where each Quick Action card actually goes. Computed here rather than
 * baked into `QUICK_ACTIONS` (`lib/mock/overview.ts`) because two of the
 * four depend on runtime state that module has no access to: which product
 * most needs writing, and this caller's own role (`admin` cannot use
 * Invite Teammate or Connect Integration — both are `super_admin`-only on
 * the backend, same floor `nav-config.ts` already hides their sidebar links
 * behind). `QUICK_ACTIONS` itself is unchanged and still backs the
 * decorative `/welcome` preview, which never navigates anywhere.
 */
function quickActionHrefs(attentionProductKey: string | null, role: Role | null): Record<string, string | null> {
  return {
    "new-document": attentionProductKey ? `/${attentionProductKey}` : null,
    "invite-teammate": role === "super_admin" ? "/users-roles" : null,
    "connect-integration": role === "super_admin" ? "/integrations" : null,
    "view-reports": "/claude-usage",
  };
}

export default function OverviewPage() {
  const productStats = useProductStats();
  // Not useSession(): SessionProvider is mounted inside AppShell, which this
  // page renders, so a hook call up here sits outside that provider — same
  // reasoning app/(shell)/users-roles/page.tsx already gives for calling
  // me() directly instead.
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    void me()
      .then((session) => setRole(session.role))
      .catch(() => {
        // Leave it null — every role-gated quick action then hides itself,
        // the safer default while /auth/me is unreachable.
      });
  }, []);

  const attention =
    productStats.status === "ready" ? mostAttentionProduct(productStats.products, productStats.stats) : null;
  const attentionProductKey =
    attention?.key ?? (productStats.status === "ready" ? (productStats.products[0]?.key ?? null) : null);
  const hrefs = quickActionHrefs(attentionProductKey, role);
  const quickActions = QUICK_ACTIONS.filter((action) => hrefs[action.id] != null);

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

          <div className="animate-entrance mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 [animation-delay:70ms]">
            {quickActions.map((action) => (
              <QuickActionCard key={action.id} data={action} href={hrefs[action.id]!} />
            ))}
          </div>

          <div className="animate-entrance mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[65fr_35fr] [animation-delay:140ms]">
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
