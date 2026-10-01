import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * "Your AX Renewal implementation run was approved and applied" (or "…was
 * rejected") in the bell (ADR-081): how it reads, and where opening it leads. The same mocks as useNotifications.test.ts;
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

function runReviewed(overrides: Record<string, unknown> = {}) {
  return {
    id: "n11",
    type: "ax-renewal.run-reviewed",
    targetId: "project-42",
    payload: { body: "Your AX Renewal implementation run was approved and applied" },
    createdAt: "2026-10-01T09:00:00Z",
    readAt: null,
    ...overrides,
  };
}

describe("useNotifications — a run's starter is told how it was reviewed (ADR-081)", () => {
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
    fetchInbox.mockResolvedValue({ items: [runReviewed()], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.title).toBe("Run reviewed");
    expect(result.current.items[0]?.detail).toBe("Your AX Renewal implementation run was approved and applied");
  });

  it("says a rejection is a rejection — the outcome is the row", async () => {
    fetchInbox.mockResolvedValue({
      items: [runReviewed({ payload: { body: "Your AX Renewal implementation run was rejected" } })],
      unreadCount: 1,
    });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.detail).toBe("Your AX Renewal implementation run was rejected");
  });

  it("still says something true when the row carries no body", async () => {
    fetchInbox.mockResolvedValue({ items: [runReviewed({ payload: {} })], unreadCount: 1 });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.items).toHaveLength(1));
    expect(result.current.items[0]?.detail).toBe("Your AX Renewal implementation run was reviewed");
  });

  it("opens the project, whose run history says who reviewed it, with no lookup on the way", async () => {
    fetchInbox.mockResolvedValue({ items: [runReviewed()], unreadCount: 1 });
    const onOpenProject = vi.fn();
    const { result } = renderHook(() => useNotifications({ onOpenProject }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    await act(() => result.current.open(result.current.items[0]!));

    // The project page is the check: a member removed since, or a deleted
    // project, gets the same "not available" any non-member does (ADR-070).
    expect(onOpenProject).toHaveBeenCalledWith("project-42");
    expect(listSessions).not.toHaveBeenCalled();
    expect(listPending).not.toHaveBeenCalled();
  });
});
