"use client";

import type { AxRenewalProjectDetail } from "@/lib/ax-renewal/api";
import { EXPLORER_META, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";

type AxRenewalBreadcrumbProps = {
  /** Null once every tab has been closed (see explorerGroups.ts's NO_TAB_OPEN). */
  active: AxRenewalExplorerKey | null;
  detail: AxRenewalProjectDetail | null;
};

/**
 * One row under the tab bar: "Group / Item" plus a status chip — read only
 * for Understand, draft/confirmed for a gated Plan section, nothing for
 * Build/Workspace. Shows "no tab open" once every tab has been closed,
 * matching the reference prototype's own crumb in that state.
 */
export function AxRenewalBreadcrumb({ active, detail }: AxRenewalBreadcrumbProps) {
  if (active == null) {
    return (
      <div className="flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs text-muted">
        <span>no tab open</span>
      </div>
    );
  }

  const meta = EXPLORER_META[active];
  const confirmed = meta.section != null && detail?.confirmations[meta.section] != null;

  const chip =
    meta.group === "Understand" ? (
      <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-semibold text-muted">read only</span>
    ) : meta.section != null ? (
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          confirmed ? "bg-secondary text-foreground" : "bg-page text-muted"
        }`}
      >
        {confirmed ? "confirmed" : "draft"}
      </span>
    ) : null;

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs text-muted">
      <span>
        {meta.group} / {meta.label}
      </span>
      {chip}
    </div>
  );
}
