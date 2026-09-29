import type { ClaudeUsageMember } from "@/lib/admin/claudeUsage";
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

/**
 * One model's usage over the selected window (ADR-058) — the same four
 * categories Claude Code's own usage page shows, kept separate rather than
 * folded into input/output. `costUsd` is priced server-side per model.
 */
export interface MyClaudeUsageModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
}

/** One (day, model) row of the "Recent Usage" table — reports are daily, so there is no time of day. */
export interface MyClaudeUsageDayModel extends MyClaudeUsageModel {
  date: string;
}

/** The windows `GET /api/v1/claude-usage/me?days=` accepts; anything else falls back to 7 server-side. */
export type MyUsageRangeDays = 1 | 7 | 30;

/** "Usage by Model" over the last `rangeDays` days. The totals are the sum of `byModel`. */
export interface MyClaudeUsageBreakdown {
  rangeDays: number;
  from: string;
  to: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  /** The same-length window just before `from`, for "from previous N days". */
  previousCostUsd: number;
  byModel: MyClaudeUsageModel[];
  recent: MyClaudeUsageDayModel[];
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
  /** The caller's own row rolled up over today, same shape as an admin per-user row; null until they first report. */
  todayUsage: ClaudeUsageMember | null;
  usage: MyClaudeUsageBreakdown;
}

/** The caller's own dashboard, with "Usage by Model" over the last `days` days. */
export async function fetchMyUsage(days: MyUsageRangeDays = 7): Promise<MyClaudeUsageDashboard> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/claude-usage/me?days=${days}`, { credentials: "include" });
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
