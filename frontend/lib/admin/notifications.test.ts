import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotPermittedError } from "@/lib/admin/accounts";
import { sendActivityDigest } from "./notifications";

/**
 * The client's own decisions: what it puts on the wire, and what it makes of
 * what comes back. The backend's behaviour is the backend's test suite's
 * subject — what matters here is that a 403 becomes something the screen can
 * act on, and that a refusal's wording survives the trip.
 */
describe("sendActivityDigest", () => {
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

  const RESULT = {
    day: "2026-09-14",
    sent: true,
    pagesChanged: 3,
    sections: 2,
    recipients: 4,
    reason: "sent",
  };

  it("POSTs with the session cookie and no day parameter when none is given", async () => {
    respondWith(200, RESULT);

    await expect(sendActivityDigest()).resolves.toEqual(RESULT);

    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toMatch(/\/api\/v1\/admin\/notifications\/digest$/);
    expect(init).toMatchObject({ method: "POST", credentials: "include" });
  });

  it("passes the day through as a query parameter", async () => {
    respondWith(200, RESULT);

    await sendActivityDigest("2026-09-01");

    expect(fetchMock.mock.calls[0]![0]).toMatch(/\?day=2026-09-01$/);
  });

  it("encodes the day, so a junk value cannot alter the URL", async () => {
    respondWith(200, RESULT);

    await sendActivityDigest("2026-09-01&foo=bar");

    expect(fetchMock.mock.calls[0]![0]).toMatch(/\?day=2026-09-01%26foo%3Dbar$/);
  });

  it("turns a 403 into NotPermittedError", async () => {
    respondWith(403, {});

    await expect(sendActivityDigest()).rejects.toBeInstanceOf(NotPermittedError);
  });

  it("turns a 401 into NotPermittedError too — the screen treats both the same", async () => {
    respondWith(401, {});

    await expect(sendActivityDigest()).rejects.toBeInstanceOf(NotPermittedError);
  });

  it("surfaces the problem document's detail, which is written to be read", async () => {
    respondWith(400, { detail: "day must be a date in YYYY-MM-DD form, not '14-09-2026'" });

    await expect(sendActivityDigest("14-09-2026")).rejects.toThrow(
      "day must be a date in YYYY-MM-DD form, not '14-09-2026'",
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

    await expect(sendActivityDigest()).rejects.toThrow("The digest could not be sent. Please try again.");
  });

  it("reports an unreachable server as something the reader can act on", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    await expect(sendActivityDigest()).rejects.toThrow(
      "Couldn't reach the server. Check your connection and try again.",
    );
  });
});
