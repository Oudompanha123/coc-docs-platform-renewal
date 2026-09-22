import { AuthApiError } from "@/lib/auth/api";

/**
 * The activity feed behind the topbar's message icon — `GET /api/v1/notifications`.
 *
 * How much comes back is the server's decision, not this file's: a `super_admin`
 * receives everyone's activity, every other role receives only their own. The
 * request is identical either way, and there is no parameter here that could
 * widen it — the scope is a row filter applied server-side from the session.
 *
 * Not to be confused with `POST /api/v1/admin/notifications/digest`, which
 * *sends* the digest email to every administrator and is not idempotent. This
 * one only reads, which is what makes it safe to call when a menu opens.
 *
 * `credentials: "include"` because the session is an httpOnly cookie on a
 * different origin; without it the backend sees an anonymous caller.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** `/api/v1/notifications`' shape. */
export interface NotificationItem {
  id: string;
  /** Null when the actor was the system rather than a person. */
  actorEmail: string | null;
  /**
   * The actor's current picture, read live server-side rather than stored —
   * null for no picture, a since-deleted account, or no actor at all (an
   * HRMS report arrival). {@link ApplicantAvatar} already falls back to
   * initials for null, same as everywhere else in this app that shows one.
   */
  actorAvatarUrl: string | null;
  /** The action in words, e.g. "Approved a registration". */
  summary: string;
  /** ISO-8601 instant. Formatted for display by {@link timeAgo}, never by the server. */
  occurredAt: string;
  /** The raw audit action key, e.g. `"account.role_change"`. Null for an HRMS report arrival — nobody here did it. */
  actionType: string | null;
  /** What kind of thing this is about, e.g. `"account"` or `"page"`. Null when there is no target — same cases as {@link actionType}. */
  targetType: string | null;
  /** The target's id. Present whenever {@link targetType} is, whether or not {@link href} could be built for it. */
  targetId: string | null;
  /**
   * Where to navigate on click, or null when there is nowhere to send the
   * reader — no destination exists for this target type yet, or the caller
   * could not open it anyway. The backend decides this, not this client: see
   * `NotificationFeedService.hrefFor`. A present value is not a guarantee the
   * target still exists — the destination page is what has to answer that
   * gracefully (e.g. a deleted account just does not open).
   */
  href: string | null;
}

/**
 * Recent activity, newest first.
 *
 * Returns an empty list rather than throwing when the caller has no session or
 * is refused: this drives a decoration in the topbar, and a signed-out or
 * unlucky caller should see an empty menu, not an error boundary over the whole
 * shell. A genuine outage is still reported so a caller can show a retry.
 */
export async function listNotifications(limit = 20): Promise<NotificationItem[]> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/notifications?limit=${limit}`, {
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server.");
  }

  if (response.status === 401 || response.status === 403) {
    return [];
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your notifications.");
  }
  return (await response.json()) as NotificationItem[];
}

/**
 * "5m ago", from an absolute instant.
 *
 * Done on the client on purpose: the server does not know the reader's clock,
 * and a relative string baked into a response goes stale the moment it is
 * cached. Anything older than a week becomes a date, because "63d ago" is not
 * a thing anyone reads as a duration.
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  // A clock skew between browser and server can put an event slightly in the
  // future. "in 3 seconds" for something that just happened reads as a bug.
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** The name to show for an item — the address' local part, or "System". */
export function actorName(item: NotificationItem): string {
  if (!item.actorEmail) return "System";
  return item.actorEmail.split("@")[0] ?? item.actorEmail;
}

/** Up to two initials for the avatar bubble. */
export function actorInitials(item: NotificationItem): string {
  const name = actorName(item);
  const parts = name.split(/[.\-_\s]+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "?";
  const second = parts.length > 1 ? (parts[1]?.charAt(0) ?? "") : "";
  return (first + second).toUpperCase();
}
