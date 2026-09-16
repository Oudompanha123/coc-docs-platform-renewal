/**
 * Real backend client for the "Recent Activity" panel — reads straight from
 * `audit_log` via `GET /api/v1/admin/audit/recent` (see `AuditRepository`).
 * No mock/placeholder data exists here on purpose: a caller who can't reach
 * this endpoint gets an empty list, never fabricated rows.
 *
 * <p>Gated at the `super_admin` role server-side (every row carries another
 * account's `actor_email`, NFR-SEC-PII) — the same floor `/api/v1/admin/accounts/**`
 * uses. A 401/403 here means the panel should simply not render, not show an
 * error, matching how the rest of this app hides UI a role can't use rather
 * than showing it disabled.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export type ActivityEntry = {
  actorEmail: string;
  action: string;
  targetType: string;
  detail: Record<string, unknown>;
  occurredAt: string;
};

const ACTIVITY_URL = `${BACKEND_URL}/api/v1/admin/audit/recent`;

/** Never throws — an unreachable backend or a non-super_admin session both
 *  resolve to an empty list, so the panel can render its honest empty state
 *  rather than an error. */
export async function fetchRecentActivity(limit = 10): Promise<ActivityEntry[]> {
  try {
    const response = await fetch(`${ACTIVITY_URL}?limit=${limit}`, { credentials: "include" });
    if (response.ok) return (await response.json()) as ActivityEntry[];
  } catch {
    // Backend unreachable — fall through to the empty list below.
  }
  return [];
}
