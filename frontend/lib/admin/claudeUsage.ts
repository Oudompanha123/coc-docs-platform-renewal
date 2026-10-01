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
/**
 * A roster row is active or removed, and nothing else. The third value,
 * `invited`, went with the invite feature — V36 deleted the stranded rows and
 * dropped it from the database's own check constraint, so the backend can no
 * longer send it.
 */
export type TrackingStatus = "active" | "removed";
export type Period = "day" | "week" | "month";
/** Soft-budget zone for the selected period — green/amber/red, computed server-side
 *  from `budgetPct` (ClaudeUsageMemberUsage#budgetStatus) so the near-limit stat,
 *  the table's progress bar, and the "hand off" nudge can never disagree. */
export type BudgetStatus = "green" | "amber" | "red";

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
  /** Read this rather than re-deriving thresholds client-side — see {@link BudgetStatus}. */
  budgetStatus: BudgetStatus;
  modelsUsed: string[];
  /** ISO instant of the latest report in range, or null if nothing was reported in this window. */
  lastActiveAt: string | null;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  /** Profile picture of the platform account with the same email, or null — show initials then. */
  avatarUrl: string | null;
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

/** One model's share of a reported day. `totalTokens` is input + output, the same definition as everywhere else here. */
export interface ClaudeUsageActivityModel {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  costUsd: number;
}

/**
 * One project's usage (ADR-074) — over the whole range in
 * {@link ClaudeUsageMemberActivity.projects}, or one day inside a day.
 * `name` is a repository folder name, never a path. `sessionCount` and
 * `activeSeconds` come from this project's own activity, so two projects
 * worked on in parallel can add up to more than the day.
 */
export interface ClaudeUsageActivityProject {
  name: string;
  /** Human turns — each time the person asked Claude something. */
  requestCount: number;
  /** Model responses — the unit tokens are summed over. */
  apiCallCount: number;
  conversationCount: number;
  sessionCount: number;
  activeSeconds: number;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  firstAt: string | null;
  lastAt: string | null;
}

/** One block of continuous activity — split after 30 minutes with no Claude activity. */
export interface ClaudeUsageActivitySession {
  date: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  requestCount: number;
  projects: string[];
}

/**
 * One reported day for one member. Tokens and cost come from the day's
 * running total. The activity fields (requests through sessions) are null
 * when the day was reported by a reporter older than ADR-074 — "not
 * reported", never zero.
 */
export interface ClaudeUsageActivityDay {
  date: string;
  /** When the reporter last uploaded this day's running total — not when any piece of work happened. */
  reportedAt: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  /** Null under a project filter — cost is not split by project. */
  costUsd: number | null;
  /** Empty under a project filter. */
  models: ClaudeUsageActivityModel[];
  requestCount: number | null;
  apiCallCount: number | null;
  conversationCount: number | null;
  sessionCount: number | null;
  activeSeconds: number | null;
  projects: ClaudeUsageActivityProject[] | null;
  sessions: ClaudeUsageActivitySession[] | null;
}

/** Range totals: tokens over every day; activity over the days that reported it, or null if none did. */
export interface ClaudeUsageActivitySummary {
  requestCount: number | null;
  apiCallCount: number | null;
  conversationCount: number | null;
  sessionCount: number | null;
  activeSeconds: number | null;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
}

/** The admin "User Activity" detail for one member over a date range (ADR-074). */
export interface ClaudeUsageMemberActivity {
  memberId: string;
  from: string;
  to: string;
  /** The project filter applied, or null for all projects. */
  project: string | null;
  summary: ClaudeUsageActivitySummary;
  /** Days with tokens but no activity — reported by an older reporter. */
  daysWithoutActivity: number;
  /** Largest total first. */
  projects: ClaudeUsageActivityProject[];
  /** Newest first. */
  sessions: ClaudeUsageActivitySession[];
  /** Newest first. */
  days: ClaudeUsageActivityDay[];
}

/** A User Activity date range: ISO calendar dates, inclusive, plus an optional project filter. */
export interface ActivityQuery {
  from: string;
  to: string;
  project?: string | null;
}

/** The roster mutations, all of which live under `/admin` and need that floor. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  return requestAt(`${BACKEND_URL}/api/v1/admin/claude-usage${path}`, init);
}

/**
 * One fetch, for a URL the caller gives in full.
 *
 * Split out because the dashboard read is no longer under `/admin` — it is open
 * to every signed-in role and scoped server-side — while everything else here
 * still is. One body, two prefixes, rather than two copies of the error
 * handling that would drift.
 */
async function requestAt<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    // Reached for the roster mutations, which are admin-only. The dashboard
    // read refuses nobody with a session — it answers with their own row.
    throw new NotPermittedError("Only an admin or super admin can change Claude usage tracking.");
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

/**
 * The dashboard for one period. `offset` is 0 or negative — periods back from
 * the current one.
 *
 * Not under `/admin`, unlike everything else in this file: an admin sees the
 * whole team and every other role sees only their own row, and the backend
 * decides which from the session (`ClaudeUsageService.dashboardFor`). There is
 * no scope argument here because there is none on the route.
 */
export function fetchDashboard(period: Period, offset = 0): Promise<ClaudeUsageDashboard> {
  return requestAt(`${BACKEND_URL}/api/v1/claude-usage?period=${period}&offset=${offset}`);
}

/**
 * One member's usage detail over `from`..`to` (inclusive), optionally narrowed
 * to one project (ADR-074). Admin-only — under `/admin`, unlike the dashboard read.
 */
export function fetchMemberActivity(memberId: string, query: ActivityQuery): Promise<ClaudeUsageMemberActivity> {
  const params = new URLSearchParams({ from: query.from, to: query.to });
  if (query.project) params.set("project", query.project);
  return request<ClaudeUsageMemberActivity>(`/members/${encodeURIComponent(memberId)}/activity?${params.toString()}`);
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
