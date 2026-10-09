"use client";

import { BACKEND_URL, SessionExpiredError, AuthApiError } from "@/lib/auth/api";

/**
 * The caller's own notifications — `GET /api/v1/notifications/inbox`.
 *
 * <p>Distinct from `/api/v1/notifications`, which is the activity feed derived
 * from `audit_log`. That answers "what has been happening"; this answers "what
 * was addressed to me, and have I read it" (ADR-034).
 */

/** One stored notification. The sentence is rendered from these, never sent. */
export interface InboxNotification {
  id: string;
  /** `NotificationType.key()` — "auth.new-device", "registration.pending", "ax-renewal.member-added", "ax-renewal.run-ready", "ax-renewal.comment-added", "ax-renewal.run-reviewed", "announcement.published". */
  type: string;
  /**
   * What it is about, for the deep link. Absent (or null) for one about
   * nothing in particular — the backend omits null fields from its JSON.
   */
  targetId?: string | null;
  /**
   * The facts its type needs. `body` is always present, so a build that does
   * not recognise `type` still has something true to show.
   */
  payload: { body?: string; iconUrl?: string } & Record<string, unknown>;
  createdAt: string;
  /**
   * When this account saw it; **absent** until then, because the backend
   * omits null fields from its JSON. Test with `!= null`, never `!== null`.
   * Server-side, so it follows the person.
   */
  readAt?: string | null;
}

export interface Inbox {
  items: InboxNotification[];
  /**
   * Every unread notification, not only those in `items` — the badge must not
   * drop because the list was capped.
   */
  unreadCount: number;
}

export async function fetchInbox(limit = 30): Promise<Inbox> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/notifications/inbox?limit=${limit}`, {
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401) {
    // Not "could not load" but "you are not signed in any more" — the caller
    // re-reads the session rather than showing an empty bell.
    throw new SessionExpiredError("Your session has ended. Please sign in again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your notifications.");
  }
  return (await response.json()) as Inbox;
}

/** One page of the bell's expanded "View all" list (ADR-104). */
export interface InboxPage {
  items: InboxNotification[];
  /** Whether another page follows — what decides "Load more". */
  hasMore: boolean;
  /** Same whole-inbox count the bell's badge shows. */
  unreadCount: number;
}

/**
 * One page of `GET /api/v1/notifications/inbox/history`, newest first.
 *
 * <p>Keyset paging: pass the last row already held as `after` to get the rows
 * older than it, so a notification arriving between two "Load more" clicks
 * neither repeats nor skips a row.
 */
export async function fetchInboxPage(
  options: { after?: { id: string; createdAt: string }; unreadOnly?: boolean; limit?: number } = {},
): Promise<InboxPage> {
  const params = new URLSearchParams({ limit: String(options.limit ?? 20) });
  if (options.unreadOnly) params.set("unread", "true");
  if (options.after) {
    params.set("before", options.after.createdAt);
    params.set("beforeId", options.after.id);
  }
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/notifications/inbox/history?${params}`, {
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401) {
    throw new SessionExpiredError("Your session has ended. Please sign in again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your notifications.");
  }
  return (await response.json()) as InboxPage;
}

/**
 * Marks one read.
 *
 * <p>The server answers 204 whether or not a row changed — an unknown id, one
 * already read and one belonging to somebody else are indistinguishable on
 * purpose — so there is nothing to report back beyond "it went through".
 */
export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${BACKEND_URL}/api/v1/notifications/inbox/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${BACKEND_URL}/api/v1/notifications/inbox/read-all`, {
    method: "POST",
    credentials: "include",
  });
}
