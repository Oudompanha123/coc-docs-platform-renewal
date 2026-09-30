import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotPermittedError } from "@/lib/admin/accounts";
import {
  addMember,
  AxRenewalNotFoundError,
  confirmSection,
  connectDatabase,
  fetchProjectDetail,
  setDestination,
  updateArchitecture,
  updateDatabasePlan,
  updatePages,
  removeMember,
  updateStackMove,
} from "./api";

/**
 * Stale-edit protection, the client's half (ADR-067): every plan edit and
 * every Confirm must put the revision it was given on the wire, and a 409
 * must reach the caller as the backend's own words rather than a generic
 * "could not be saved". The comparison itself is AxRenewalStaleEditTest's
 * subject, on the backend.
 */
describe("AX Renewal client — plan revision and members", () => {
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

  function sentBody(): Record<string, unknown> {
    const [, init] = fetchMock.mock.calls[0]!;
    return JSON.parse((init as RequestInit).body as string) as Record<string, unknown>;
  }

  it.each([
    ["stack move", () => updateStackMove("p1", [], 7)],
    ["architecture", () => updateArchitecture("p1", "summary", null, 7)],
    ["pages", () => updatePages("p1", [], 7)],
    ["database plan", () => updateDatabasePlan("p1", [], 7)],
    [
      "database connect",
      () => connectDatabase("p1", { engine: "postgres", host: null, port: null, databaseName: null, schemaName: null }, 7),
    ],
    ["destination", () => setDestination("p1", { kind: "git_repo", target: "repo", branch: null, notes: null }, 7)],
  ])("%s sends the revision it was given", async (_name, call) => {
    respondWith(200, []);

    await call();

    expect(sentBody().revision).toBe(7);
  });

  it("keeps the edit's own fields alongside the revision, not in place of them", async () => {
    respondWith(200, {});

    await setDestination("p1", { kind: "git_repo", target: "repo", branch: "main", notes: null }, 3);

    expect(sentBody()).toEqual({ kind: "git_repo", target: "repo", branch: "main", notes: null, revision: 3 });
  });

  it("confirm sends the revision as a JSON body", async () => {
    respondWith(200, {});

    await confirmSection("p1", "pages", 5);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/ax-renewal\/projects\/p1\/plan\/pages\/confirm$/);
    expect((init as RequestInit).method).toBe("POST");
    expect((init as RequestInit).headers).toEqual({ "Content-Type": "application/json" });
    expect(sentBody()).toEqual({ revision: 5 });
  });

  it("adds a member by email", async () => {
    respondWith(200, []);

    await addMember("p1", "teammate@example.com");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/ax-renewal\/projects\/p1\/members$/);
    expect((init as RequestInit).method).toBe("POST");
    expect(sentBody()).toEqual({ email: "teammate@example.com" });
  });

  it("removes a member by account id", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });

    await removeMember("p1", "acct-9");

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/projects\/p1\/members\/acct-9$/);
    expect((init as RequestInit).method).toBe("DELETE");
  });

  it("surfaces a 403's own explanation — a non-member is told how to get added, not just 'no access'", async () => {
    respondWith(403, { detail: "you are not a member of this project … Workspace → Members." });

    await expect(updatePages("p1", [], 0)).rejects.toThrow(/not a member of this project/);
    await expect(updatePages("p1", [], 0)).rejects.toBeInstanceOf(NotPermittedError);
  });

  it("surfaces a 404 as its own error type, so the workspace can say 'doesn't exist, or you're not a member'", async () => {
    // A non-member's 404 is identical to a missing project's (ADR-070); the
    // client can't tell them apart either, and must not pretend to.
    respondWith(404, { detail: "project not found" });

    await expect(fetchProjectDetail("p1")).rejects.toBeInstanceOf(AxRenewalNotFoundError);
  });

  it("falls back to the generic line for a 403 with no problem document", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => {
        throw new SyntaxError("not json");
      },
    });

    await expect(updatePages("p1", [], 0)).rejects.toThrow("You don't have access to AX Renewal.");
  });

  it("surfaces a 409 as the backend's own explanation, so the person knows to reload", async () => {
    respondWith(409, {
      detail:
        "this project's plan was changed by someone else since you opened it (you have revision 3, the current plan is revision 4). Reload to see their changes before saving.",
    });

    await expect(updatePages("p1", [], 3)).rejects.toThrow(/changed by someone else.*Reload/);
  });
});
