import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "./useCurrentUser";

const { me } = vi.hoisted(() => ({ me: vi.fn() }));

vi.mock("./api", () => ({ me }));

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves the caller's display name, role label and initials from /me", async () => {
    me.mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      displayName: "Jane Admin",
      role: "ADMIN",
      authenticated: true,
    });

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() =>
      expect(result.current).toEqual({ name: "Jane Admin", role: "Admin", initials: "JA" }),
    );
  });

  it("stays null for a visitor with no session", async () => {
    me.mockResolvedValue({ id: null, email: null, displayName: null, role: null, authenticated: false });

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(me).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("stays null when the /me request fails, rather than throwing", async () => {
    me.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(me).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });
});
