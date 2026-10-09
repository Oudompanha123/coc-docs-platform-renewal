import { afterEach, describe, expect, it, vi } from "vitest";
import { NavApiError, fetchCurrentKeyForOldSlug, updateProduct } from "./nav-api";

function jsonResponse(body: unknown, init?: Partial<Response>): Response {
  return { ok: true, status: 200, json: async () => body, ...init } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("updateProduct", () => {
  it("sends the label/icon and returns the previous key alongside the renamed product", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ previousKey: "jex3-0", product: { key: "jex", label: "Jex", icon: "layers", minRole: "user" } }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateProduct("jex3-0", "Jex", "layers");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/admin/nav/products/jex3-0"),
      expect.objectContaining({ method: "PUT", body: JSON.stringify({ label: "Jex", icon: "layers" }) }),
    );
    expect(result).toEqual({
      previousKey: "jex3-0",
      product: { key: "jex", label: "Jex", icon: "layers", minRole: "user", items: [] },
    });
  });

  it("surfaces a 403 as a permission error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 403, json: async () => ({}) } as Response));

    await expect(updateProduct("jex3-0", "Jex", "layers")).rejects.toBeInstanceOf(NavApiError);
  });
});

describe("fetchCurrentKeyForOldSlug", () => {
  it("returns the current key for a slug that was retired by a rename", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ currentKey: "jex" })));

    await expect(fetchCurrentKeyForOldSlug("jex3-0")).resolves.toBe("jex");
  });

  it("returns null for a slug that was never a product's key — never redirects to a guess", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) } as Response));

    await expect(fetchCurrentKeyForOldSlug("made-up")).resolves.toBeNull();
  });

  it("returns null rather than throwing when the backend is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    );

    await expect(fetchCurrentKeyForOldSlug("jex3-0")).resolves.toBeNull();
  });
});
