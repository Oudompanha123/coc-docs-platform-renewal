"use client";

import { AdminClaudeUsageView } from "@/components/claude-usage/AdminClaudeUsageView";

/**
 * `/claude-usage` — the team-wide dashboard (ADR-035), admin/super_admin
 * only, enforced by `RequireSession`. The personal view lives as a section
 * embedded directly on `/home` instead (ADR-052, further revised) — see
 * `components/claude-usage/MyClaudeUsageSection.tsx` — so this route is
 * unconditionally the admin view.
 */
export default function ClaudeUsagePage() {
  return <AdminClaudeUsageView />;
}
