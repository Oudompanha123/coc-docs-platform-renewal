"use client";

import { useCallback, useEffect, useState } from "react";
import { listPending } from "@/lib/admin/accounts";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * What the bell in the topbar shows.
 *
 * <p>It used to render a hardcoded array from `lib/mock/overview` — three
 * invented items that never changed and told nobody anything. This returns the
 * one real thing the system currently has to say: who is waiting for approval
 * (ADR-017), which is also exactly what the push notification (ADR-025)
 * deep-links to. The badge and the message now agree with the queue.
 *
 * <p><b>Only a super admin sees anything.</b> The pending queue sits behind a
 * `super_admin` floor in `SecurityConfig` (FR-AUTH-008), so asking as anyone
 * else returns 403. The role is checked before the request rather than after,
 * so an ordinary user's console is not filled with denials on every page load.
 *
 * <p><b>This is not an inbox.</b> There is no read/unread state and nothing is
 * stored: the list is derived from the queue every time it is asked for, so it
 * is right by construction and cannot drift. When a second notification type
 * exists, that is the point to decide whether persisted notifications are worth
 * the read-state they bring with them — see ADR-025's "Alternatives
 * Considered".
 */
export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  /** Where clicking it goes. */
  href: string;
};

export type Notifications = {
  items: NotificationItem[];
  /** Badge count. Zero renders no badge at all. */
  count: number;
  /** Re-reads the queue — after approving somebody, say. */
  refresh: () => Promise<void>;
};

export function useNotifications(): Notifications {
  const { status, user } = useSession();
  const [items, setItems] = useState<NotificationItem[]>([]);

  const isApprover = status === "authenticated" && user?.role === "super_admin";

  const refresh = useCallback(async () => {
    if (!isApprover) {
      setItems([]);
      return;
    }
    try {
      const pending = await listPending();
      setItems(
        pending.map((account) => ({
          id: account.id,
          title: "New registration",
          detail: `${account.displayName} (${account.email}) is waiting for approval`,
          href: "/users-roles?tab=pending",
        })),
      );
    } catch {
      // A failure here must not break the topbar, which is on every page. An
      // empty bell is wrong but harmless; a thrown error in a layout component
      // takes the whole page down with it.
      setItems([]);
    }
  }, [isApprover]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { items, count: items.length, refresh };
}
