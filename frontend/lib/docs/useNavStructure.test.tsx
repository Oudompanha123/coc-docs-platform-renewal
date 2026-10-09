import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyProductRename, peekRedirectHint, refreshNavStructure, resetNavStructureForTests, useNavStructure } from "./useNavStructure";
import type { NavProduct } from "./nav-api";

const { fetchNavStructure } = vi.hoisted(() => ({ fetchNavStructure: vi.fn() }));
vi.mock("./nav-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./nav-api")>()),
  fetchNavStructure,
}));

function product(overrides: Partial<NavProduct> = {}): NavProduct {
  return { key: "jex3-0", label: "Jex3.0", icon: "layers", minRole: "user", items: [], ...overrides };
}

beforeEach(() => {
  vi.clearAllMocks();
  resetNavStructureForTests();
  fetchNavStructure.mockResolvedValue([product()]);
});

describe("useNavStructure (shared store)", () => {
  it("starts null, then resolves to the fetched products", async () => {
    const { result } = renderHook(() => useNavStructure());

    expect(result.current).toBeNull();
    await waitFor(() => expect(result.current).toEqual([product()]));
  });

  it("fetches only once no matter how many components are mounted at once", async () => {
    const a = renderHook(() => useNavStructure());
    const b = renderHook(() => useNavStructure());

    await waitFor(() => expect(a.result.current).not.toBeNull());
    await waitFor(() => expect(b.result.current).not.toBeNull());

    expect(fetchNavStructure).toHaveBeenCalledTimes(1);
  });

  it("a later-mounted component sees the already-fetched cache immediately, with no second fetch", async () => {
    const first = renderHook(() => useNavStructure());
    await waitFor(() => expect(first.result.current).not.toBeNull());

    const second = renderHook(() => useNavStructure());
    expect(second.result.current).toEqual([product()]);
    expect(fetchNavStructure).toHaveBeenCalledTimes(1);
  });

  it("refreshNavStructure re-fetches and pushes the new result to every mounted consumer", async () => {
    const a = renderHook(() => useNavStructure());
    const b = renderHook(() => useNavStructure());
    await waitFor(() => expect(a.result.current).not.toBeNull());

    fetchNavStructure.mockResolvedValue([product({ label: "Renamed" })]);
    await refreshNavStructure();

    expect(a.result.current).toEqual([product({ label: "Renamed" })]);
    expect(b.result.current).toEqual([product({ label: "Renamed" })]);
  });

  it("applyProductRename updates the cache with no fetch at all, pushed to every mounted consumer", async () => {
    const a = renderHook(() => useNavStructure());
    await waitFor(() => expect(a.result.current).not.toBeNull());
    fetchNavStructure.mockClear();

    act(() => applyProductRename("jex3-0", product({ key: "jex", label: "Jex" })));

    expect(a.result.current).toEqual([product({ key: "jex", label: "Jex" })]);
    expect(fetchNavStructure).not.toHaveBeenCalled();
  });

  it("applyProductRename is a no-op if nothing has been fetched into the cache yet", () => {
    expect(() => applyProductRename("jex3-0", product({ key: "jex" }))).not.toThrow();
  });

  describe("peekRedirectHint", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns the new key once a rename actually changed the slug", () => {
      applyProductRename("jex3-0", product({ key: "jex" }));
      expect(peekRedirectHint("jex3-0")).toBe("jex");
    });

    it("returns null when the rename kept the same slug — nothing to redirect", () => {
      applyProductRename("jex3-0", product({ key: "jex3-0", label: "Jex3.0 again" }));
      expect(peekRedirectHint("jex3-0")).toBeNull();
    });

    it("returns null for a key that was never renamed", () => {
      expect(peekRedirectHint("made-up")).toBeNull();
    });

    it("does not consume the hint — it can be checked more than once before the route change lands", () => {
      applyProductRename("jex3-0", product({ key: "jex" }));
      expect(peekRedirectHint("jex3-0")).toBe("jex");
      expect(peekRedirectHint("jex3-0")).toBe("jex");
    });

    it("expires after a few seconds, so a later unrelated 404 for the same key isn't masked forever", () => {
      vi.useFakeTimers();
      applyProductRename("jex3-0", product({ key: "jex" }));
      expect(peekRedirectHint("jex3-0")).toBe("jex");

      vi.advanceTimersByTime(10_000);

      expect(peekRedirectHint("jex3-0")).toBeNull();
    });
  });
});
