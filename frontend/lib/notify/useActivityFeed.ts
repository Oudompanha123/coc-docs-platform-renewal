"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { listNotifications, type NotificationItem } from "@/lib/notify/activity";

/**
 * What the mail icon in the topbar shows, and which of it has been read.
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
 * <p><b>Read state is this browser's, and that is a compromise.</b> The badge
 * used to count every item in the window, so it never went down: the only way
 * to clear it was for the events to age out of the feed. That is not a number
 * anyone can act on, and it teaches people to ignore the one badge in the
 * topbar that is meant to mean something.
 *
 * <p>The honest fix is the server's, and {@link useNotifications} has it —
 * ADR-034 gave the bell a notification table with a `read_at` per person, so
 * reading an alert on a laptop clears it on a phone. This feed has no such
 * table to hang a mark on: it is projected from `audit_log`, which is
 * append-only by convention, and a `read_at` on an audit row would be a
 * mutable field on the one table in the schema that must not have one. Real
 * read state here means a table of its own — a schema decision and an ADR,
 * not a topbar tweak.
 *
 * <p>So the marks live in `localStorage` until then, with the limits that
 * implies stated plainly: they are per browser, another device shows the same
 * activity unread again, and clearing site data forgets them. That is a mild
 * wrong for a feed of things that have already happened and that nobody has to
 * act on — unlike the bell, where a lost mark means an approval nobody
 * remembers is still waiting. Keyed per account, because one browser is
 * regularly two people, and pruned to the feed window on every poll, because
 * an id that has aged out of a newest-first list can never come back.
 *
 * <p>Polls on the same unhurried 60-second interval as the bell, for the same
 * reason: the badge should not need a page reload to be right.
 */

const POLL_INTERVAL_MS = 60_000;
const FEED_LIMIT = 20;

/** Per account — one browser is regularly two people. */
const STORAGE_PREFIX = "coc.activity.read.";

export type ActivityItem = NotificationItem & { read: boolean };

export type ActivityFeed = {
  items: ActivityItem[];
  /** Badge count — unread only. Zero renders no badge. */
  count: number;
  /** Marks one item read, here and in storage. Takes the badge down by one. */
  markRead: (id: string) => void;
  /** Marks everything currently in the feed read — the header's shortcut. */
  markAllRead: () => void;
  refresh: () => Promise<void>;
};

/**
 * The ids this account has read in this browser.
 *
 * <p>Every access is guarded: `localStorage` throws rather than returning null
 * in a browser with site data switched off, and a feed decoration is never
 * worth taking the topbar down for. An unreadable store means everything shows
 * unread, which is the state this feature started in.
 */
function loadRead(accountId: string | null): Set<string> {
  if (!accountId) return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + accountId);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveRead(accountId: string | null, ids: ReadonlySet<string>): void {
  if (!accountId) return;
  try {
    window.localStorage.setItem(STORAGE_PREFIX + accountId, JSON.stringify([...ids]));
  } catch {
    // A full quota, or storage switched off. The marks then hold for the life
    // of the tab, which is worth strictly more than refusing to mark anything.
  }
}

export function useActivityFeed(): ActivityFeed {
  const { status, user } = useSession();
  const accountId = user?.id ?? null;
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [read, setRead] = useState<ReadonlySet<string>>(() => new Set<string>());

  // Mirrors `read` for the poll, which must not restart every time a row is
  // marked, and for markRead, which would otherwise close over a stale set.
  const readRef = useRef<ReadonlySet<string>>(new Set<string>());

  // Any signed-in role, unlike the bell's super_admin-only queue: everyone is
  // entitled to their own history, and the server decides how much that is.
  const signedIn = status === "authenticated";

  const apply = useCallback((next: ReadonlySet<string>, forAccount: string | null) => {
    readRef.current = next;
    setRead(next);
    saveRead(forAccount, next);
  }, []);

  // Loaded on mount rather than in a state initialiser: this renders on the
  // server too, where there is no localStorage at all. Re-runs when the
  // account changes, so signing out and back in as somebody else does not
  // leave the first person's marks on the second person's feed.
  useEffect(() => {
    const stored = loadRead(accountId);
    readRef.current = stored;
    setRead(stored);
  }, [accountId]);

  const refresh = useCallback(async () => {
    if (!signedIn) {
      setItems([]);
      return;
    }
    try {
      const next = await listNotifications(FEED_LIMIT);
      setItems(next);

      // Prune to what is still in the window. The feed is newest-first and
      // capped, so an id that has fallen out of it will never be rendered
      // again and its mark is dead weight — without this the stored list grows
      // for as long as the account exists.
      const live = new Set(next.map((item) => item.id));
      const kept = new Set([...readRef.current].filter((id) => live.has(id)));
      if (kept.size !== readRef.current.size) {
        apply(kept, accountId);
      }
    } catch {
      // This drives the topbar, which is on every page. An empty panel is
      // wrong but harmless; a thrown error in a layout component takes the
      // whole page down.
      setItems([]);
    }
  }, [signedIn, accountId, apply]);

  useEffect(() => {
    void refresh();
    if (!signedIn) return;

    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh, signedIn]);

  const markRead = useCallback(
    (id: string) => {
      if (readRef.current.has(id)) return;
      apply(new Set(readRef.current).add(id), accountId);
    },
    [accountId, apply],
  );

  const markAllRead = useCallback(() => {
    // Everything in the feed, not everything ever: the pruning above drops
    // anything older on the next poll regardless.
    apply(new Set(items.map((item) => item.id)), accountId);
  }, [items, accountId, apply]);

  const decorated = useMemo(
    () => items.map((item) => ({ ...item, read: read.has(item.id) })),
    [items, read],
  );

  const count = useMemo(() => decorated.filter((item) => !item.read).length, [decorated]);

  return { items: decorated, count, markRead, markAllRead, refresh };
}
