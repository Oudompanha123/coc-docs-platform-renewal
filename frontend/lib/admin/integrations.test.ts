import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotPermittedError } from "@/lib/admin/accounts";
import {
  connectIntegration,
  disconnectIntegration,
  listDeliveries,
  listIntegrations,
  rotateSecret,
  testIntegration,
  updateIntegration,
} from "./integrations";

/**
 * The client's own decisions, same scope as `notifications.test.ts`: what it
 * puts on the wire, and what it makes of what comes back. The backend's
 * authorization floor and business rules are its own test suite's subject.
 */
describe("integrations client", () => {
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

  const INTEGRATION = {
    id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
    provider: "webhook",
    name: "#eng-docs",
    targetUrl: "https://hooks.example.com/abc",
    events: ["account.registered"],
    status: "connected",
    lastTestedAt: null,
    lastTestStatus: null,
    createdAt: "2026-09-01T00:00:00Z",
  };

  it("GETs the list with the session cookie", async () => {
    respondWith(200, [INTEGRATION]);

    await expect(listIntegrations()).resolves.toEqual([INTEGRATION]);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/admin\/integrations$/);
    expect(init).toMatchObject({ credentials: "include" });
  });

  it("POSTs provider, name, target URL and events to connect", async () => {
    respondWith(200, { integration: INTEGRATION, signingSecret: "s3cr3t" });

    await connectIntegration("webhook", "#eng-docs", "https://hooks.example.com/abc", ["account.registered"]);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/admin\/integrations$/);
    expect(init).toMatchObject({ method: "POST" });
    expect(JSON.parse(init.body as string)).toEqual({
      provider: "webhook",
      name: "#eng-docs",
      targetUrl: "https://hooks.example.com/abc",
      events: ["account.registered"],
    });
  });

  it("PATCHes name and events to update, without touching provider or target URL", async () => {
    respondWith(200, INTEGRATION);

    await updateIntegration(INTEGRATION.id, "renamed", []);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(new RegExp(`/api/v1/admin/integrations/${INTEGRATION.id}$`));
    expect(init).toMatchObject({ method: "PATCH" });
    expect(JSON.parse(init.body as string)).toEqual({ name: "renamed", events: [] });
  });

  it("POSTs to test and returns the delivery result", async () => {
    const delivery = {
      id: 1,
      eventType: "integration.test",
      httpStatus: 200,
      success: true,
      error: null,
      latencyMs: 42,
      attemptedAt: "2026-09-14T00:00:00Z",
    };
    respondWith(200, { result: delivery });

    await expect(testIntegration(INTEGRATION.id)).resolves.toEqual({ result: delivery });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(new RegExp(`/api/v1/admin/integrations/${INTEGRATION.id}/test$`));
    expect(init).toMatchObject({ method: "POST" });
  });

  it("POSTs to rotate-secret and returns the new plaintext secret", async () => {
    respondWith(200, { integration: INTEGRATION, signingSecret: "new-secret" });

    await expect(rotateSecret(INTEGRATION.id)).resolves.toEqual({
      integration: INTEGRATION,
      signingSecret: "new-secret",
    });

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(new RegExp(`/api/v1/admin/integrations/${INTEGRATION.id}/rotate-secret$`));
    expect(init).toMatchObject({ method: "POST" });
  });

  it("DELETEs to disconnect", async () => {
    respondWith(200, { ...INTEGRATION, status: "disabled" });

    await disconnectIntegration(INTEGRATION.id);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(new RegExp(`/api/v1/admin/integrations/${INTEGRATION.id}$`));
    expect(init).toMatchObject({ method: "DELETE" });
  });

  it("GETs delivery history for one integration", async () => {
    respondWith(200, []);

    await expect(listDeliveries(INTEGRATION.id)).resolves.toEqual([]);

    expect(fetchMock.mock.calls[0]![0]).toMatch(new RegExp(`/api/v1/admin/integrations/${INTEGRATION.id}/deliveries$`));
  });

  it("turns a 403 into NotPermittedError, not a generic failure", async () => {
    respondWith(403, {});

    await expect(listIntegrations()).rejects.toBeInstanceOf(NotPermittedError);
  });

  it("turns a 401 into NotPermittedError too", async () => {
    respondWith(401, {});

    await expect(connectIntegration("webhook", "x", "https://example.com", [])).rejects.toBeInstanceOf(
      NotPermittedError,
    );
  });

  it("surfaces the problem document's detail", async () => {
    respondWith(503, { detail: "encryption is not configured on this deployment" });

    await expect(connectIntegration("webhook", "x", "https://example.com", [])).rejects.toThrow(
      "encryption is not configured on this deployment",
    );
  });

  it("falls back to a generic message when the error body is not a problem document", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(listIntegrations()).rejects.toThrow("That change could not be saved. Please try again.");
  });

  it("reports an unreachable server as something the reader can act on", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(listIntegrations()).rejects.toThrow("Couldn't reach the server. Check your connection and try again.");
  });
});
