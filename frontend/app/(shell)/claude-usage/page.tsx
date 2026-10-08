"use client";

import { AdminClaudeUsageView } from "@/components/claude-usage/AdminClaudeUsageView";
import { RequireSession } from "@/components/layout/RequireSession";
import { SUPER_ADMIN_ROLES } from "@/lib/auth/landing";

/**
 * `/claude-usage` — the team-wide dashboard (ADR-035), super_admin only
 * (ADR-100), enforced by `RequireSession`; an admin is sent to /overview. The personal view lives as a section
 * embedded directly on `/home` instead (ADR-052, further revised) — see
 * `components/claude-usage/MyClaudeUsageSection.tsx` — so this route is
 * unconditionally the admin view.
 */
export default function ClaudeUsagePage() {
  return (
    <RequireSession allowRoles={SUPER_ADMIN_ROLES} deniedPath="/overview">
      <AdminClaudeUsageView />
    </RequireSession>
  );
}
