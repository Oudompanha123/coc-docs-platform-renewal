"use client";

import { ScanLogsView } from "@/components/claude-usage/ScanLogsView";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * `/claude-usage/monitoring` — Scan Logs (ADR-096, ADR-107): the history of
 * reporter scans, for troubleshooting.
 *
 * A super_admin sees every scan (`/api/v1/admin/claude-usage/scan-logs`, the
 * super_admin floor, ADR-100). Anyone else the shell admits sees only their
 * own (`/api/v1/claude-usage/me/scan-logs`), scoped server-side by the
 * session — this choice is presentation, the backend enforces both floors.
 */
export default function ClaudeUsageLogsPage() {
  const { user } = useSession();
  if (!user) return null;
  return <ScanLogsView key={user.role} scope={user.role === "super_admin" ? "team" : "mine"} />;
}
