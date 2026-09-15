import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listPending, useSession } = vi.hoisted(() => ({
  listPending: vi.fn(),
  useSession: vi.fn(),
}));

vi.mock("@/lib/admin/accounts", () => ({ listPending }));
vi.mock("@/lib/auth/SessionProvider", () => ({ useSession }));

import { useNotifications } from "./useNotifications";

function signedInAs(role: string | null) {
  useSession.mockReturnValue({
    status: role ? "authenticated" : "anonymous",
    user: role ? { id: "1", role } : null,
  });
}

describe("useNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists who is actually waiting, not a fixed array", async () => {
    signedInAs("super_admin");
    listPending.mockResolvedValue([
      { id: "a", email: "dana@example.com", displayName: "Dana Lee", role: "GUEST", status: "PENDING" },
      { id: "b", email: "sam@example.com", displayName: "Sam Ray", role: "GUEST", status: "PENDING" },
    ]);

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.count).toBe(2));
    expect(result.current.items[0]?.detail).toContain("dana@example.com");
    // The badge and the message have to agree with the queue, which is the
    // whole reason this replaced a hardcoded list of three.
    expect(result.current.items).toHaveLength(result.current.count);
    expect(result.current.items[0]?.href).toBe("/users-roles?tab=pending");
  });

  it("shows nothing, and asks nothing, for a non-approver", async () => {
    signedInAs("user");

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.count).toBe(0));
    // The queue sits behind a super_admin floor, so asking as anyone else is a
    // guaranteed 403 on every page load.
    expect(listPending).not.toHaveBeenCalled();
  });

  it("asks nothing while the session is still loading", async () => {
    useSession.mockReturnValue({ status: "loading", user: null });

    const { result } = renderHook(() => useNotifications());

    await waitFor(() => expect(result.current.count).toBe(0));
    expect(listPending).not.toHaveBeenCalled();
  });

  it("empties rather than throwing when the queue cannot be read", async () => {
    signedInAs("super_admin");
    listPending.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useNotifications());

    // This drives the topbar, which is on every page: an error thrown here
    // takes the whole page down, and an empty bell does not.
    await waitFor(() => expect(result.current.count).toBe(0));
  });
});
