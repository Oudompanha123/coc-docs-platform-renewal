import { AuthApiError, SessionExpiredError } from "@/lib/auth/api";

/**
 * The personal "My Claude Usage" API — `GET /api/v1/claude-usage/me` (ADR-052).
 *
 * Reachable by any signed-in account (`USER` floor) — unlike
 * `lib/admin/claudeUsage.ts`, which needs `admin`/`super_admin`. There is no
 * id/email parameter to pass here: the backend resolves the caller from the
 * session, so this file has nothing to send but the request itself.
 *
 * `credentials: "include"` on every request — the session is an httpOnly
 * cookie on a different origin, so without it the browser sees an anonymous
 * caller.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** One day of the caller's own 30-day history — no per-member breakdown, unlike the admin dashboard's chart points. */
export interface MyClaudeUsagePoint {
  date: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/** Everything the "My Claude Usage" screen renders, read together in one call. */
export interface MyClaudeUsageDashboard {
  email: string;
  displayName: string;
  today: string;
  todayInputTokens: number;
  todayOutputTokens: number;
  todayTotalTokens: number;
  daily: MyClaudeUsagePoint[];
  lastUpdated: string | null;
}

/** The caller's own dashboard. */
export async function fetchMyUsage(): Promise<MyClaudeUsageDashboard> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/claude-usage/me`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    throw new SessionExpiredError("You're signed out. Sign in again to see your usage.");
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AuthApiError(detail ?? "Couldn't load your Claude usage. Please try again.");
  }

  return (await response.json()) as MyClaudeUsageDashboard;
}
