"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchInboxPage, markNotificationRead } from "@/lib/notify/inbox-api";
import { toNotificationItem, type NotificationItem } from "@/lib/notify/useNotifications";

// req: FR-AUTH-008, ADR-106 — the bell's "View all": every notification, ten at a time.

export const HISTORY_PAGE_SIZE = 10;

export type NotificationHistory = {
  items: NotificationItem[];
  /** Whether the server has older rows than the last one held. */
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  /** Fetches the next page after the last row held. A no-op while one is in flight or at the end. */
  loadMore: () => void;
  /** Marks one row read here and on the server, then calls `onChanged`. */
  markRead: (id: string) => void;
  /** Marks every row held as read, locally only — the caller sends the write. */
  markAllReadLocal: () => void;
};

/**
 * The full inbox, paged from `GET /api/v1/notifications/inbox/history`.
 *
 * <p>Separate from {@link useNotifications} because that list answers "what
 * should the bell show" — the newest few plus every unread, polled — and this
 * one walks the whole history in order, only once somebody asks to see it.
 * Inactive (and empty) until `enabled`; re-reads from the top whenever it is
 * re-enabled or `unreadOnly` changes.
 *
 * @param onChanged called after a read written from here lands, so the bell's
 *     own list and badge can re-read
 */
export function useNotificationHistory(
  enabled: boolean,
  unreadOnly: boolean,
  onChanged?: () => void,
): NotificationHistory {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bumped on every restart, so an answer for a list the person has since
  // closed or re-filtered is dropped instead of appended.
  const generation = useRef(0);
  // In a ref as well as state: two scroll events in one frame must not both
  // see "not loading" and request the same page twice.
  const inFlight = useRef(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  const fetchPage = useCallback(
    async (after: NotificationItem | undefined) => {
      const mine = generation.current;
      inFlight.current = true;
      setLoading(true);
      setError(null);
      try {
        const page = await fetchInboxPage({ after, unreadOnly, limit: HISTORY_PAGE_SIZE });
        if (generation.current !== mine) return;
        const next = page.items.map(toNotificationItem);
        setItems((prev) => {
          const seen = new Set(prev.map((n) => n.id));
          return [...prev, ...next.filter((n) => !seen.has(n.id))];
        });
        setHasMore(page.hasMore);
      } catch (e) {
        if (generation.current !== mine) return;
        setError(e instanceof Error ? e.message : "Couldn't load your notifications.");
      } finally {
        if (generation.current === mine) {
          inFlight.current = false;
          setLoading(false);
        }
      }
    },
    [unreadOnly],
  );

  useEffect(() => {
    generation.current += 1;
    inFlight.current = false;
    setItems([]);
    setHasMore(false);
    setError(null);
    setLoading(false);
    if (enabled) void fetchPage(undefined);
  }, [enabled, fetchPage]);

  const loadMore = useCallback(() => {
    if (!enabled || inFlight.current || !hasMoreRef.current) return;
    const last = itemsRef.current[itemsRef.current.length - 1];
    if (last) void fetchPage(last);
  }, [enabled, fetchPage]);

  const markRead = useCallback((id: string) => {
    const target = itemsRef.current.find((n) => n.id === id);
    if (!target || target.read) return;
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    void markNotificationRead(id)
      .catch(() => undefined)
      .then(() => onChangedRef.current?.());
  }, []);

  const markAllReadLocal = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  return { items, hasMore, loading, error, loadMore, markRead, markAllReadLocal };
}
