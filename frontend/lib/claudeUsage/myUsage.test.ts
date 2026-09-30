import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionExpiredError } from "@/lib/auth/api";
import { fetchMyUsage, type MyClaudeUsageDashboard } from "./myUsage";

describe("My Claude Usage client (ADR-052)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function respondWith(status: number, body: unknown) {
    fetchMock.mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    });
  }

  const DASHBOARD: MyClaudeUsageDashboard = {
    email: "a@cocdocs.example",
    displayName: "A",
    today: "2026-09-25",
    todayInputTokens: 100,
    todayOutputTokens: 50,
    todayTotalTokens: 150,
    daily: [],
    lastUpdated: null,
    todayUsage: null,
    usage: {
      rangeDays: 7,
      from: "2026-09-19",
      to: "2026-09-25",
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      costUsd: 0,
      previousCostUsd: 0,
      byModel: [],
      recent: [],
    },
    week: {
      from: "2026-09-21",
      to: "2026-09-25",
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      budgetTokens: 1_200_000,
      pctUsed: 0,
      remainingTokens: 1_199_850,
    },
    subscriptionUsdPerMonth: 25,
  };

  it("sends the request with the session cookie, and no id of any kind", async () => {
    respondWith(200, DASHBOARD);

    await fetchMyUsage();

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/claude-usage\/me\?days=7$/);
    expect(init).toMatchObject({ credentials: "include" });
  });

  it("asks for the chosen window, and only a window — never whose usage", async () => {
    respondWith(200, DASHBOARD);

    await fetchMyUsage(30);

    const [url] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/claude-usage\/me\?days=30$/);
  });

  it("returns the parsed dashboard", async () => {
    respondWith(200, DASHBOARD);

    await expect(fetchMyUsage()).resolves.toEqual(DASHBOARD);
  });

  it("turns a 401 into SessionExpiredError, distinct from a generic failure", async () => {
    respondWith(401, {});

    await expect(fetchMyUsage()).rejects.toBeInstanceOf(SessionExpiredError);
  });

  it("surfaces the problem document's detail on another failure", async () => {
    respondWith(400, { detail: "something went wrong" });

    await expect(fetchMyUsage()).rejects.toThrow("something went wrong");
  });

  it("reports an unreachable server as something the reader can act on", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(fetchMyUsage()).rejects.toThrow(
      "Couldn't reach the server. Check your connection and try again.",
    );
  });
});
