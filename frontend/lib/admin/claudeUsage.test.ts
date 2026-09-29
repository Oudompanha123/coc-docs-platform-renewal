import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotPermittedError } from "@/lib/admin/accounts";
import {
  avatarColorFor,
  fetchDashboard,
  formatLastActive,
  inviteMember,
  removeMember,
  updateMemberBudget,
  updateMemberRole,
  type ClaudeUsageDashboard,
} from "./claudeUsage";

/**
 * The client's own decisions: what it puts on the wire, and what it makes of
 * what comes back. The backend's own behaviour (ClaudeUsageService, ADR-035)
 * is that suite's subject.
 */
describe("Claude Usage admin client", () => {
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

  const DASHBOARD: ClaudeUsageDashboard = {
    period: "week",
    from: "2026-09-14",
    to: "2026-09-17",
    members: [],
    daily: [],
    totals: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0, totalTokens: 0, costUsd: 0 },
    activeUsers: 0,
    nearLimit: 0,
    lastUpdated: null,
  };

  describe("fetchDashboard", () => {
    it("sends the period and offset as query parameters, with the session cookie", async () => {
      respondWith(200, DASHBOARD);

      await fetchDashboard("month", -1);

      const [url, init] = fetchMock.mock.calls[0]!;
      // Not under /admin, unlike every other call in this file: the read is
      // open to any signed-in role and scoped server-side to what they may
      // see. The path is the assertion — routing it back under /admin would
      // silently lock a plain user out again.
      expect(url).toMatch(/\/api\/v1\/claude-usage\?period=month&offset=-1$/);
      expect(url).not.toMatch(/\/admin\//);
      expect(init).toMatchObject({ credentials: "include" });
    });

    it("defaults offset to 0", async () => {
      respondWith(200, DASHBOARD);

      await fetchDashboard("day");

      expect(fetchMock.mock.calls[0]![0]).toMatch(/\?period=day&offset=0$/);
    });

    it("turns a 401 or 403 into NotPermittedError", async () => {
      respondWith(401, {});
      await expect(fetchDashboard("week")).rejects.toBeInstanceOf(NotPermittedError);

      respondWith(403, {});
      await expect(fetchDashboard("week")).rejects.toBeInstanceOf(NotPermittedError);
    });

    it("surfaces the problem document's detail", async () => {
      respondWith(400, { detail: "period must be day, week, or month" });

      await expect(fetchDashboard("week")).rejects.toThrow("period must be day, week, or month");
    });

    it("reports an unreachable server as something the reader can act on", async () => {
      fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

      await expect(fetchDashboard("week")).rejects.toThrow(
        "Couldn't reach the server. Check your connection and try again.",
      );
    });
  });

  describe("inviteMember", () => {
    it("POSTs email and teamRole as JSON", async () => {
      respondWith(201, { id: "1", email: "a@cocdocs.example" });

      await inviteMember("a@cocdocs.example", "admin", "A");

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(/\/api\/v1\/admin\/claude-usage\/members$/);
      expect(init).toMatchObject({ method: "POST" });
      expect(JSON.parse(init.body)).toEqual({ email: "a@cocdocs.example", teamRole: "admin", displayName: "A" });
    });

    it("surfaces a duplicate-email conflict as a readable message", async () => {
      respondWith(409, { detail: "a@cocdocs.example is already tracked on this dashboard" });

      await expect(inviteMember("a@cocdocs.example", "member")).rejects.toThrow(
        "a@cocdocs.example is already tracked on this dashboard",
      );
    });
  });

  describe("updateMemberRole", () => {
    it("PATCHes teamRole", async () => {
      respondWith(200, {});

      await updateMemberRole("member-1", "admin");

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(/\/members\/member-1$/);
      expect(init).toMatchObject({ method: "PATCH" });
      expect(JSON.parse(init.body)).toEqual({ teamRole: "admin" });
    });
  });

  describe("updateMemberBudget", () => {
    it("PUTs a number to set an override", async () => {
      respondWith(200, {});

      await updateMemberBudget("member-1", 2_000_000);

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(/\/members\/member-1\/budget$/);
      expect(init).toMatchObject({ method: "PUT" });
      expect(JSON.parse(init.body)).toEqual({ budgetOverrideTokens: 2_000_000 });
    });

    it("PUTs null to clear an override", async () => {
      respondWith(200, {});

      await updateMemberBudget("member-1", null);

      const init = fetchMock.mock.calls[0]![1];
      expect(JSON.parse(init.body)).toEqual({ budgetOverrideTokens: null });
    });
  });

  describe("removeMember", () => {
    it("POSTs to the remove action, never DELETE — the row survives", async () => {
      respondWith(200, {});

      await removeMember("member-1");

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toMatch(/\/members\/member-1\/remove$/);
      expect(init).toMatchObject({ method: "POST" });
    });
  });

  describe("avatarColorFor", () => {
    it("cycles through the palette rather than throwing past its length", () => {
      expect(avatarColorFor(0)).toBe(avatarColorFor(5));
    });
  });

  describe("formatLastActive", () => {
    it("reads null as Never", () => {
      expect(formatLastActive(null)).toBe("Never");
    });

    it("reads an unparsable string as Never rather than 'Invalid Date'", () => {
      expect(formatLastActive("not-a-date")).toBe("Never");
    });
  });
});
