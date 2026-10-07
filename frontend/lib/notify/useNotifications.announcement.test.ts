import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * An admin's announcement in the bell (ADR-098): how it reads, and that
 * opening it hands the id to the caller's modal. The same mocks as useNotifications.test.ts;
 * its own file so it stubs Storage itself rather than depending on the
 * ambient localStorage global, which is not a real Storage on every Node.
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

function announcement(overrides: Record<string, unknown> = {}) {
  return {
    id: "n21",
    type: "announcement.published",
    targetId: "announcement-7",
    payload: { body: "There is a new announcement", title: "Maintenance on Friday", category: "maintenance" },
    createdAt: "2026-10-07T09:00:00Z",
    readAt: null,
    ...overrides,
  };
}

describe("useNotifications — an announcement reaches every reader's bell (ADR-098)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", fakeStorage());
    useSession.mockReturnValue({ status: "authenticated", user: { id: "1", role: "user" }, refresh: vi.fn() });
    isNotificationsEnabled.mockReturnValue(true);
    ensureBackgroundPushRegistered.mockResolvedValue(undefined);
    subscribeToNotifications.mockReturnValue(() => {});
    listPending.mockResolvedValue([]);
    listSessions.mockResolvedValue([]);
    markNotificationRead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the announcement's title, not the lock-screen sentence", async () => {
    fetchInbox.mockResolvedValue({ items: [announcement()], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.title).toBe("Announcement");
    expect(result.current.items[0]?.detail).toBe("Maintenance on Friday");
    // Drives the bell's per-category icon.
    expect(result.current.items[0]?.category).toBe("maintenance");
  });

  it("falls back to the fixed sentence when the row carries no title", async () => {
    fetchInbox.mockResolvedValue({ items: [announcement({ payload: { body: "There is a new announcement" } })], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.detail).toBe("There is a new announcement");
  });

  it("opens the announcement by id, with no lookup on the way", async () => {
    fetchInbox.mockResolvedValue({ items: [announcement()], unreadCount: 1 });
    const onOpenAnnouncement = vi.fn();
    const { result } = renderHook(() => useNotifications({ onOpenAnnouncement }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.open(result.current.items[0]!));

    // The modal's own fetch is the check: a withdrawn announcement says so there.
    expect(onOpenAnnouncement).toHaveBeenCalledWith("announcement-7");
    expect(listSessions).not.toHaveBeenCalled();
    expect(listPending).not.toHaveBeenCalled();
  });
});
