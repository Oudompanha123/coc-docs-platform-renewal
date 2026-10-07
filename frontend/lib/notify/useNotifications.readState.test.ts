import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The bell's read state (Unread / All tabs): the badge never drifts, a failed
 * poll never empties it, and a refresh that raced a click never puts a read
 * row back into Unread. The same mocks as useNotifications.test.ts; its own
 * file so it stubs Storage itself.
 */

const {
  listPending,
  listSessions,
  useSession,
  isNotificationsEnabled,
  ensureBackgroundPushRegistered,
  subscribeToNotifications,
  fetchInbox,
  markNotificationRead,
  markAllNotificationsRead,
} = vi.hoisted(() => ({
  listPending: vi.fn(),
  listSessions: vi.fn(),
  useSession: vi.fn(),
  isNotificationsEnabled: vi.fn(),
  ensureBackgroundPushRegistered: vi.fn(),
  subscribeToNotifications: vi.fn(),
  fetchInbox: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("@/lib/admin/accounts", () => ({ listPending }));
vi.mock("@/lib/auth/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth/api")>("@/lib/auth/api");
  return { ...actual, listSessions };
});
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));
vi.mock("@/lib/notify/push", () => ({ isNotificationsEnabled, ensureBackgroundPushRegistered }));
vi.mock("@/lib/notify/stream", () => ({ subscribeToNotifications }));
vi.mock("@/lib/notify/inbox-api", () => ({ fetchInbox, markNotificationRead, markAllNotificationsRead }));

import { useNotifications } from "./useNotifications";

function fakeStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

function row(id: string, read: boolean) {
  return {
    id,
    type: "announcement.published",
    targetId: `a-${id}`,
    payload: { body: "There is a new announcement", title: `Title ${id}` },
    createdAt: "2026-10-07T09:00:00Z",
    readAt: read ? "2026-10-07T09:05:00Z" : null,
  };
}

describe("useNotifications — Unread and All stay honest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", fakeStorage());
    useSession.mockReturnValue({ status: "authenticated", user: { id: "1", role: "user" }, refresh: vi.fn() });
    isNotificationsEnabled.mockReturnValue(false);
    ensureBackgroundPushRegistered.mockResolvedValue(undefined);
    subscribeToNotifications.mockReturnValue(() => {});
    listPending.mockResolvedValue([]);
    listSessions.mockResolvedValue([]);
    markNotificationRead.mockResolvedValue(undefined);
    markAllNotificationsRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an unread row as the server really sends it — with no readAt at all — is unread", async () => {
    // The backend omits null fields, so this is the actual JSON of an unread
    // notification. Treating the missing field as "read" hid every unread
    // row from the Unread tab while the badge still counted them.
    const unreadOnTheWire: Record<string, unknown> = { ...row("u", false) };
    delete unreadOnTheWire.readAt;
    fetchInbox.mockResolvedValue({ items: [unreadOnTheWire, row("r", true)], unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    expect(result.current.items.find((n) => n.id === "u")?.read).toBe(false);
    expect(result.current.items.find((n) => n.id === "r")?.read).toBe(true);
    expect(result.current.items.filter((n) => !n.read)).toHaveLength(result.current.unreadCount);
  });

  it("clicking a row that is already read changes nothing — the badge does not drift", async () => {
    fetchInbox.mockResolvedValue({ items: [row("u", false), row("r", true)], unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    act(() => result.current.markRead("r"));

    expect(result.current.unreadCount).toBe(1);
    expect(markNotificationRead).not.toHaveBeenCalled();
  });

  it("clicking an unread row reads it, takes one off the badge, and confirms with the server", async () => {
    fetchInbox.mockResolvedValue({ items: [row("u", false), row("v", false)], unreadCount: 2 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    fetchInbox.mockResolvedValue({ items: [row("u", true), row("v", false)], unreadCount: 1 });

    act(() => result.current.markRead("u"));

    expect(result.current.unreadCount).toBe(1);
    expect(result.current.items.filter((n) => !n.read).map((n) => n.id)).toEqual(["v"]);
    expect(markNotificationRead).toHaveBeenCalledWith("u");
    // The follow-up refresh after the write lands.
    await waitFor(() => expect(fetchInbox).toHaveBeenCalledTimes(2));
    expect(result.current.unreadCount).toBe(1);
  });

  it("a refresh that was in flight during the click does not put the row back into Unread", async () => {
    fetchInbox.mockResolvedValueOnce({ items: [row("u", false)], unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    // A poll starts, and answers with the state from before the click.
    let answerStale!: (v: unknown) => void;
    fetchInbox.mockImplementationOnce(() => new Promise((resolve) => (answerStale = resolve)));
    let inFlight!: Promise<void>;
    act(() => {
      inFlight = result.current.refresh();
    });
    // The write never lands in this test, so its own refresh never runs.
    markNotificationRead.mockImplementation(() => new Promise(() => {}));
    act(() => result.current.markRead("u"));

    await act(async () => {
      answerStale({ items: [row("u", false)], unreadCount: 1 });
      await inFlight;
    });

    expect(result.current.items[0]?.read).toBe(true);
    expect(result.current.unreadCount).toBe(0);
  });

  it("Read all clears the badge and every row", async () => {
    fetchInbox.mockResolvedValue({ items: [row("u", false), row("v", false)], unreadCount: 2 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    fetchInbox.mockResolvedValue({ items: [row("u", true), row("v", true)], unreadCount: 0 });

    act(() => result.current.markAllRead());

    expect(result.current.unreadCount).toBe(0);
    expect(result.current.items.every((n) => n.read)).toBe(true);
    expect(markAllNotificationsRead).toHaveBeenCalled();
  });

  it("a failed poll keeps the list and the badge instead of showing 'all caught up'", async () => {
    fetchInbox.mockResolvedValueOnce({ items: [row("u", false), row("r", true)], unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(2));

    fetchInbox.mockRejectedValueOnce(new Error("network down"));
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.unreadCount).toBe(1);
  });
});
