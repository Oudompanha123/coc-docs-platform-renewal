"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { fetchRecentActivity, type ActivityEntry } from "@/lib/docs/activity-api";
import { ActivityRow } from "./ActivityRow";

/** ~5 rows' worth of height at this row design's typical size — the shared
 *  fixed height Recent Documents' list also uses, so both panels stay the
 *  same outer height regardless of item count (Recent Activity's 5-row cap
 *  is the source of truth per ADR-033's follow-up). Rows vary a little
 *  (a role-change description can wrap to two lines), so this is a
 *  representative average, not a pixel-exact 5-row guarantee.
 *
 *  `no-scrollbar-arrows` (globals.css) is the app's one existing thin-
 *  scrollbar treatment (`scrollbar-width: thin` + a slim WebKit thumb,
 *  already used by the register page's scrollable form) — reused here
 *  rather than writing a second thin-scrollbar rule. */
export const RECENT_PANEL_LIST_HEIGHT = "max-h-[420px] overflow-y-auto no-scrollbar-arrows";

/**
 * Overview's "Recent Activity" panel — reads straight from `audit_log`
 * (`GET /api/v1/admin/audit/recent`), never fabricated data.
 *
 * <p>That endpoint sits at the `super_admin` floor (every row carries another
 * account's email, NFR-SEC-PII), so this hides itself entirely for anyone
 * else rather than rendering a disabled/error state — the same "hide what a
 * role can't use" choice already made for the "Users & Roles" sidebar link.
 *
 * <p>Reads `useSession()` itself rather than the Overview page reading it,
 * because `SessionProvider` is mounted inside `AppShell`: a hook call in the
 * page body (which renders `AppShell`) sits outside that provider, the same
 * reason `app/(shell)/users-roles/page.tsx` calls `me()` directly instead.
 * This component is rendered as a child of `AppShell`, so it's inside.
 *
 * <p>Capped to a fixed visible height with an internal scroll rather than
 * growing the page — the outer card's height is fixed as a side effect of
 * the list itself having a fixed max-height, not a height set on the card.
 */
export function RecentActivityPanel() {
  const { user } = useSession();
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);

  const visible = user?.role === "super_admin";

  useEffect(() => {
    if (!visible) return;
    fetchRecentActivity(10).then(setEntries);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white py-5 shadow-sm">
      <div>
        <div className="flex items-center justify-between pl-5 pr-[15px]">
          <h2 className="text-base font-bold text-dash-ink">Recent Activity</h2>
        </div>
        <div className={`mt-1 divide-y divide-border pl-5 pr-[20px] ${RECENT_PANEL_LIST_HEIGHT}`}>
          {entries === null ? (
            <p className="py-6 text-center text-sm text-muted">Loading…</p>
          ) : entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No recent activity yet</p>
          ) : (
            entries.map((entry, i) => <ActivityRow key={`${entry.occurredAt}-${i}`} data={entry} />)
          )}
        </div>
      </div>
    </div>
  );
}
