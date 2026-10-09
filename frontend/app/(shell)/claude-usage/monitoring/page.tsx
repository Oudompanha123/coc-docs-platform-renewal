"use client";

import { ScanLogsView } from "@/components/claude-usage/ScanLogsView";

/**
 * `/claude-usage/monitoring` — Scan Logs (ADR-096): the history of every reporter
 * scan, for troubleshooting. Admin/super_admin only, like `/claude-usage`
 * (`RequireSession`, and the `/api/v1/admin/**` floor behind it).
 */
export default function ClaudeUsageLogsPage() {
  return <ScanLogsView />;
}
