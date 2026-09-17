"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { listNotifications, type NotificationItem } from "@/lib/notify/activity";

/**
 * What the mail icon in the topbar shows.
 *
 * <p>It used to render a hardcoded array from `lib/mock/overview` — "Jane
 * Admin", "Maly Kim", five invented messages that never changed and never
 * matched anybody real. This reads `GET /api/v1/notifications`, which projects
 * the audit trail into a feed.
 *
 * <p><b>How much comes back is the server's decision.</b> A `super_admin` sees
 * everyone's activity; every other role sees only their own. Nothing here asks
 * for a scope and nothing here could widen one — the filter is applied to the
 * rows before they are serialised, so a non-super_admin's response simply does
 * not contain anybody else (NFR-SEC-PII).
 *
 * <p><b>These are not messages.</b> Despite the icon, there is no inbox and no
 * sender writing to you: each line is something that happened. Calling the
 * panel "Activity" rather than "Messages" is part of this change, because a
 * mail icon over a list of audit events invites people to hit Reply on it.
 *
 * <p><b>No unread state, deliberately.</b> `audit_log` is append-only by
 * convention, so "seen" would need a table of its own — the same conclusion
 * {@link useNotifications} reached for the bell, and the same honest fix
 * deferred to when a real notification table exists. The badge therefore counts
 * recent items, not unread ones.
 *
 * <p>Polls on the same unhurried 60-second interval as the bell, for the same
 * reason: the badge should not need a page reload to be right.
 */

const POLL_INTERVAL_MS = 60_000;
const FEED_LIMIT = 20;

export type ActivityFeed = {
  items: NotificationItem[];
  /** Badge count. Zero renders no badge. */
  count: number;
  refresh: () => Promise<void>;
};

export function useActivityFeed(): ActivityFeed {
  const { status } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);

  // Any signed-in role, unlike the bell's super_admin-only queue: everyone is
  // entitled to their own history, and the server decides how much that is.
  const signedIn = status === "authenticated";

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setItems([]);
      return;
    }
    try {
      setItems(await listNotifications(FEED_LIMIT));
    } catch {
      // This drives the topbar, which is on every page. An empty panel is
      // wrong but harmless; a thrown error in a layout component takes the
      // whole page down.
      setItems([]);
    }
  }, [signedIn]);

  useEffect(() => {
    void refresh();
    if (!signedIn) return;

    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh, signedIn]);

  return { items, count: items.length, refresh };
}
