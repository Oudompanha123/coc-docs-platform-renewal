import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "You were added to an AX Renewal project" in the bell (ADR-075): how it
 * reads, and where opening it leads. The same mocks as useNotifications.test.ts;
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

function memberAdded(overrides: Record<string, unknown> = {}) {
  return {
    id: "n7",
    type: "ax-renewal.member-added",
    targetId: "project-42",
    payload: { body: "You were added to an AX Renewal project" },
    createdAt: "2026-10-01T09:00:00Z",
    readAt: null,
    ...overrides,
  };
}

describe("useNotifications — added to an AX Renewal project (ADR-075)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", fakeStorage());
    useSession.mockReturnValue({ status: "authenticated", user: { id: "1", role: "developer" }, refresh: vi.fn() });
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

  it("reads as its own sentence, not the generic fallback", async () => {
    fetchInbox.mockResolvedValue({ items: [memberAdded()], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.title).toBe("Added to a project");
    expect(result.current.items[0]?.detail).toBe("You were added to an AX Renewal project");
  });

  it("still says something true when the row carries no body", async () => {
    fetchInbox.mockResolvedValue({ items: [memberAdded({ payload: {} })], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.detail).toBe("You were added to an AX Renewal project");
  });

  it("opens the project it is about", async () => {
    fetchInbox.mockResolvedValue({ items: [memberAdded()], unreadCount: 1 });
    const onOpenProject = vi.fn();
    const { result } = renderHook(() => useNotifications({ onOpenProject }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.open(result.current.items[0]!));

    expect(onOpenProject).toHaveBeenCalledWith("project-42");
    // No lookup on the way: the project page is the check (a removed member
    // or a deleted project gets its own "not available" message there).
    expect(listSessions).not.toHaveBeenCalled();
    expect(listPending).not.toHaveBeenCalled();
  });

  it("does nothing on open where the caller offers no way to get there", async () => {
    // The member area passes no callback — a plain user can never be added.
    fetchInbox.mockResolvedValue({ items: [memberAdded()], unreadCount: 1 });
    const { result } = renderHook(() => useNotifications());
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await expect(act(() => result.current.open(result.current.items[0]!))).resolves.not.toThrow();
  });

  it("leaves the other types' routing alone", async () => {
    const onOpenProject = vi.fn();
    fetchInbox.mockResolvedValue({
      items: [memberAdded({ id: "n8", type: "auth.new-device", targetId: "session-1", payload: { body: "Firefox" } })],
      unreadCount: 1,
    });
    const { result } = renderHook(() => useNotifications({ onOpenProject }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.open(result.current.items[0]!));

    expect(onOpenProject).not.toHaveBeenCalled();
    expect(listSessions).toHaveBeenCalled();
  });
});
