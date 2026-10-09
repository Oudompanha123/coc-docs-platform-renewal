import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NavProduct } from "@/lib/docs/nav-api";

const { fetchNavStructure, fetchCurrentKeyForOldSlug } = vi.hoisted(() => ({
  fetchNavStructure: vi.fn(),
  fetchCurrentKeyForOldSlug: vi.fn(),
}));
vi.mock("@/lib/docs/nav-api", () => ({ fetchNavStructure, fetchCurrentKeyForOldSlug }));

import { middleware, resetMiddlewareCacheForTests } from "./middleware";

function product(key: string): NavProduct {
  return { key, label: key, icon: "layers", minRole: "user", items: [] };
}

function request(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

beforeEach(() => {
  vi.clearAllMocks();
  resetMiddlewareCacheForTests();
  fetchNavStructure.mockResolvedValue([product("jex")]);
  fetchCurrentKeyForOldSlug.mockResolvedValue(null);
});

describe("middleware — product slug redirects", () => {
  it("passes a reserved top-level route straight through, with no backend call at all", async () => {
    const response = await middleware(request("/overview"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchNavStructure).not.toHaveBeenCalled();
    expect(fetchCurrentKeyForOldSlug).not.toHaveBeenCalled();
  });

  it("passes a live product key straight through", async () => {
    const response = await middleware(request("/jex"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(fetchCurrentKeyForOldSlug).not.toHaveBeenCalled();
  });

  it("308-redirects an old admin product slug to the current one", async () => {
    fetchCurrentKeyForOldSlug.mockResolvedValue("jex");

    const response = await middleware(request("/jex3-0"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/jex");
  });

  it("308-redirects an old landing docs product slug, keeping the rest of the path", async () => {
    fetchCurrentKeyForOldSlug.mockResolvedValue("jex");

    const response = await middleware(request("/docs/jex3-0/get-started"));

    expect(response.status).toBe(308);
    expect(response.headers.get("location")).toBe("http://localhost:3000/docs/jex/get-started");
  });

  it("keeps the query string across the redirect", async () => {
    fetchCurrentKeyForOldSlug.mockResolvedValue("jex");

    const response = await middleware(request("/docs/jex3-0?from=email"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/docs/jex?from=email");
  });

  it("passes through a slug that was never a product at all — an ordinary 404, not this middleware's concern", async () => {
    const response = await middleware(request("/totally-made-up"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("never treats the app's own static docs sub-pages (faq, get-started, …) as a product key", async () => {
    const response = await middleware(request("/docs/faq"));

    expect(response.status).toBe(200);
    expect(fetchNavStructure).not.toHaveBeenCalled();
    expect(fetchCurrentKeyForOldSlug).not.toHaveBeenCalled();
  });

  it("ignores the bare /docs index — nothing to look up there", async () => {
    const response = await middleware(request("/docs"));

    expect(response.status).toBe(200);
    expect(fetchNavStructure).not.toHaveBeenCalled();
  });

  it("ignores a multi-segment admin path — only the bare /:key shape is a product URL today", async () => {
    const response = await middleware(request("/content/abc123"));

    expect(response.status).toBe(200);
    // "content" is reserved anyway, so this also proves the reserved check
    // alone is enough to skip it without even reaching the segment-count rule.
    expect(fetchNavStructure).not.toHaveBeenCalled();
  });

  it("caches the live product keys across requests instead of fetching on every one", async () => {
    await middleware(request("/jex"));
    await middleware(request("/jex"));

    expect(fetchNavStructure).toHaveBeenCalledTimes(1);
  });

  it("resolves a rename chain (A -> B -> C) straight to the latest key in one lookup", async () => {
    fetchNavStructure.mockResolvedValue([product("jexxy")]);
    fetchCurrentKeyForOldSlug.mockResolvedValue("jexxy");

    const response = await middleware(request("/jex3-0"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/jexxy");
  });
});
