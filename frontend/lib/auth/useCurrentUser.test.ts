import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionProvider } from "./SessionProvider";
import { useCurrentUser } from "./useCurrentUser";

/**
 * The hook no longer fetches. It reads the one session `SessionProvider`
 * resolves, so these render it inside the provider and drive the same `me()`
 * mock as before — the behaviour under test is unchanged, only where the
 * answer comes from.
 */

const { me, signOut } = vi.hoisted(() => ({ me: vi.fn(), signOut: vi.fn() }));
vi.mock("./api", () => ({ me, signOut }));

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function wrapper({ children }: { children: ReactNode }) {
  return createElement(SessionProvider, null, children);
}

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

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() =>
      expect(result.current).toEqual({
        name: "Jane Admin",
        role: "Admin",
        initials: "JA",
        // Absent from the /me payload above, as it is for a password account:
        // null, not undefined, so the avatar component's fallback triggers.
        avatarUrl: null,
      }),
    );
  });

  it("carries the profile picture through when the provider sent one", async () => {
    me.mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      displayName: "Jane Admin",
      role: "ADMIN",
      avatarUrl: "https://lh3.googleusercontent.com/a/example",
      authenticated: true,
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() =>
      expect(result.current?.avatarUrl).toBe("https://lh3.googleusercontent.com/a/example"),
    );
    // Still computed: the avatar falls back to initials if the image fails.
    expect(result.current?.initials).toBe("JA");
  });

  it("stays null for a visitor with no session", async () => {
    me.mockResolvedValue({
      id: null,
      email: null,
      displayName: null,
      role: null,
      authenticated: false,
    });

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(me).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("stays null when the /me request fails, rather than throwing", async () => {
    me.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useCurrentUser(), { wrapper });

    await waitFor(() => expect(me).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it("asks the server once, however many components read the session", async () => {
    me.mockResolvedValue({
      id: "1",
      email: "jane@example.com",
      displayName: "Jane Admin",
      role: "ADMIN",
      authenticated: true,
    });

    // Two readers, as the sidebar and the topbar are. Before the provider,
    // this was two requests for one answer.
    const { result } = renderHook(
      () => [useCurrentUser(), useCurrentUser()] as const,
      { wrapper },
    );

    await waitFor(() => expect(result.current[0]).not.toBeNull());
    expect(me).toHaveBeenCalledTimes(1);
  });
});
