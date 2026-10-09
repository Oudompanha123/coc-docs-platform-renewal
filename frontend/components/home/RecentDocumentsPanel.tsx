"use client";

import { RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { DocumentRow } from "@/components/dashboard/DocumentRow";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ContentDocRow } from "@/lib/docs/content-stats";

/** Real "Recent Documents" list — `computeRecentDocs`, the same live data and
 *  `DocumentRow` the real Overview page uses. Same fixed-height, internally
 *  scrolling list as `TasksPanel`, so the two stay the same height together. */
export function RecentDocumentsPanel({ docs }: { docs: ContentDocRow[] | null }) {
  const { t } = useLanguage();
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-card py-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold text-foreground">{t.panels.recentDocs}</h2>
      </div>
      <div className={`mt-1 divide-y divide-surface-border px-4 ${RECENT_PANEL_LIST_HEIGHT}`}>
        {docs !== null && (
          <div className="animate-entrance">
            {docs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">{t.panels.nothingYet}</p>
            ) : (
              docs.map((doc) => <DocumentRow key={doc.id} data={doc} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
