import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { WorkspaceCard } from "@/components/dashboard/WorkspaceCard";
import { HomeIcon, PlusIcon } from "@/components/layout/icons";
import { QUICK_ACTIONS, RECENT_ACTIVITY, RECENT_DOCUMENTS, STAT_CARDS, WORKSPACES } from "@/lib/mock/overview";

export default function OverviewPage() {
  return (
    <AppShell
      pageTitle="Overview"
      pageSubtitle="Your documentation workspace at a glance"
      titleIcon={<HomeIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex justify-end">
        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
        >
          <PlusIcon className="h-4 w-4" />
          New Document
        </button>
      </div>

      <div className="animate-entrance mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((stat) => (
          <StatCard key={stat.id} data={stat} />
        ))}
      </div>

      <div className="animate-entrance mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 [animation-delay:70ms]">
        {QUICK_ACTIONS.map((action) => (
          <QuickActionCard key={action.id} data={action} />
        ))}
      </div>

      <div className="animate-entrance mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3 [animation-delay:140ms]">
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-dash-ink">Recent Documents</h2>
            <a href="#" className="text-sm font-semibold text-brand-purple hover:underline">
              View all
            </a>
          </div>
          <div className="mt-1 divide-y divide-border">
            {RECENT_DOCUMENTS.map((doc) => (
              <DocumentRow key={doc.id} data={doc} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-dash-ink">Recent Activity</h2>
          <ul className="mt-4">
            {RECENT_ACTIVITY.map((item, i) => (
              <ActivityItem key={item.id} data={item} isLast={i === RECENT_ACTIVITY.length - 1} />
            ))}
          </ul>
        </div>
      </div>

      <div className="animate-entrance mt-5 rounded-2xl border border-border bg-white p-5 shadow-sm [animation-delay:210ms]">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-dash-ink">Workspaces</h2>
          <a href="#" className="text-sm font-semibold text-brand-purple hover:underline">
            Manage all
          </a>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WORKSPACES.map((workspace) => (
            <WorkspaceCard key={workspace.id} data={workspace} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
