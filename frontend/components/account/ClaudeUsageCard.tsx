"use client";

import { MyClaudeUsageSection } from "@/components/claude-usage/MyClaudeUsageSection";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The Claude Usage section on `/account/settings` (ADR-094) — wraps the
 * existing `MyClaudeUsageSection` (unchanged in data/behavior) in this
 * page's own card chrome, rather than that component living on its own
 * route any more.
 *
 * <p>Hidden entirely — not just its `SettingsSideMenu` entry — for
 * `developer`/`reviewer`/`lead`: the same floor `/my-claude-usage`'s own
 * `RequireMemberSession` gate always enforced. Replicated here (same check
 * as `SettingsSideMenu`'s own) because this page itself is open to every
 * signed-in role, unlike that old one.
 */
export function ClaudeUsageCard() {
  const { user } = useSession();
  const canSee = user?.role === "user" || user?.role === "admin" || user?.role === "super_admin";
  if (!canSee) return null;

  return (
    <section id="claude-usage" className="scroll-mt-24 rounded-[10px] border border-border bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-dash-ink">Claude Usage</h2>
      <p className="mt-0.5 text-sm text-muted">Track your Claude token usage.</p>
      <div className="mt-5">
        {/* Scan Logs opens inside the admin shell, which a plain `user` can't enter (ADR-107). */}
        <MyClaudeUsageSection scanLogsHref={user?.role === "user" ? undefined : "/claude-usage/monitoring"} />
      </div>
    </section>
  );
}
