import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";

/**
 * The Claude Usage API — `/api/v1/admin/claude-usage` (ADR-035).
 *
 * Every call here needs `admin` or `super_admin`, enforced by the backend's
 * filter chain (the generic `/api/v1/admin/**` rule, not a fixed floor above
 * it the way `/admin/accounts` carries) — this screen manages a tracking
 * roster and its budgets, not `AppRole` itself, so it sits at the same floor
 * as everything else an admin manages. The screen hides what a caller cannot
 * use; the server decides what they may actually do.
 *
 * `credentials: "include"` on every request — the session is an httpOnly
 * cookie on a different origin, so without it the browser sends nothing and
 * the backend sees an anonymous caller.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type TeamRole = "admin" | "member";
export type TrackingStatus = "active" | "invited" | "removed";
export type Period = "day" | "week" | "month";

/** One roster member, rolled up over the requested period. */
export interface ClaudeUsageMember {
  id: string;
  email: string;
  displayName: string;
  teamRole: TeamRole;
  status: TrackingStatus;
  /** Null means "using the team default" — never a stand-in for zero. */
  budgetOverrideTokens: number | null;
  /** The soft budget for this exact period length, already scaled server-side. */
  effectiveBudgetTokens: number;
  /** `totalTokens / effectiveBudgetTokens`, rounded — read this directly rather than recomputing it. */
  budgetPct: number;
  modelsUsed: string[];
  /** ISO instant of the latest report in range, or null if nothing was reported in this window. */
  lastActiveAt: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
}

/** A roster row on its own, with no usage figures — what invite/role/budget/remove return. */
export interface ClaudeUsageMemberSummary {
  id: string;
  email: string;
  displayName: string;
  teamRole: TeamRole;
  status: TrackingStatus;
  budgetOverrideTokens: number | null;
  createdAt: string;
}

/** One day of the dashboard's stacked chart, keyed by member id for the per-teammate segments. */
export interface ClaudeUsageDailyPoint {
  date: string;
  total: number;
  byMember: Record<string, number>;
}

export interface ClaudeUsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
  totalTokens: number;
  costUsd: number;
}

/** Everything the screen renders for one period, read together so the pieces cannot disagree. */
export interface ClaudeUsageDashboard {
  period: Period;
  from: string;
  to: string;
  members: ClaudeUsageMember[];
  daily: ClaudeUsageDailyPoint[];
  totals: ClaudeUsageTotals;
  activeUsers: number;
  nearLimit: number;
  lastUpdated: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/claude-usage${path}`, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only an admin or super admin can view Claude usage.");
  }

  if (!response.ok) {
    // RFC 7807, and the backend's `detail` is written for a person to read.
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AdminApiError(detail ?? "That change could not be saved. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

/** The dashboard for one period. `offset` is 0 or negative — periods back from the current one. */
export function fetchDashboard(period: Period, offset = 0): Promise<ClaudeUsageDashboard> {
  return request<ClaudeUsageDashboard>(`?period=${period}&offset=${offset}`);
}

/**
 * Adds someone to the tracking roster, `invited` until their own machine
 * reports for the first time. Only adds them to this dashboard's tracking
 * list — never changes their actual Claude Code access.
 */
export function inviteMember(email: string, teamRole: TeamRole, displayName?: string): Promise<ClaudeUsageMemberSummary> {
  return request<ClaudeUsageMemberSummary>("/members", {
    method: "POST",
    body: JSON.stringify({ email, teamRole, displayName }),
  });
}

/** Changes the dashboard-scoped role — never the account system's own role. */
export function updateMemberRole(id: string, teamRole: TeamRole): Promise<ClaudeUsageMemberSummary> {
  return request<ClaudeUsageMemberSummary>(`/members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ teamRole }),
  });
}

/** Sets or clears (`null`) a member's weekly-equivalent soft-budget override. Takes effect immediately. */
export function updateMemberBudget(id: string, budgetOverrideTokens: number | null): Promise<ClaudeUsageMemberSummary> {
  return request<ClaudeUsageMemberSummary>(`/members/${id}/budget`, {
    method: "PUT",
    body: JSON.stringify({ budgetOverrideTokens }),
  });
}

/**
 * Takes a member off active tracking. Never deletes their usage history —
 * a former contractor's recorded cost stays visible and attributable.
 * Doesn't change their actual Claude Code access; that stays their choice.
 */
export function removeMember(id: string): Promise<ClaudeUsageMemberSummary> {
  return request<ClaudeUsageMemberSummary>(`/members/${id}/remove`, { method: "POST" });
}

/** Soft budget every member uses unless they have their own override — an estimate, not a hard cap. */
export const DEFAULT_SOFT_BUDGET_TOKENS = 1_200_000;

/** Distinct solid color per row/legend swatch — same rotating palette users-roles.ts already uses. */
export const AVATAR_PALETTE = ["#6d3ce0", "#4c6ff0", "#1f9d6b", "#e0873c", "#d94f7c"] as const;

export function avatarColorFor(index: number): string {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length] as string;
}

/**
 * "Never" is the honest answer for someone who has never reported. Same
 * convention as `users-roles`' own `formatLastLogin`.
 */
export function formatLastActive(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "Never";

  const dayMs = 24 * 60 * 60 * 1000;
  const elapsed = Date.now() - when.getTime();
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  if (elapsed < dayMs && when.getDate() === new Date().getDate()) return `Today, ${time}`;
  if (elapsed < 2 * dayMs) return `Yesterday, ${time}`;
  return when.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
