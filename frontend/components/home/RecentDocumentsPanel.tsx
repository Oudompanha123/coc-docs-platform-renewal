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
    <div className="overflow-hidden rounded-[10px] border border-border bg-white py-5 shadow-sm">
      <div className="flex items-center justify-between pl-5 pr-[15px]">
        <h2 className="text-base font-bold text-dash-ink">{t.panels.recentDocs}</h2>
      </div>
      <div className={`mt-1 divide-y divide-border pl-5 pr-[20px] ${RECENT_PANEL_LIST_HEIGHT}`}>
        {docs !== null && (
          <div className="animate-entrance">
            {docs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">{t.panels.nothingYet}</p>
            ) : (
              docs.map((doc) => <DocumentRow key={doc.id} data={doc} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}
