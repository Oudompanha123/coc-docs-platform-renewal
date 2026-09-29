import { describe, expect, it } from "vitest";
import { loopbackCallbackUrl, parseCliAuthorizeRequest, safeNextPath } from "./cliAuthorize";

// req: FR-USAGE-002, NFR-SEC-CHANNEL, ADR-060

const S = "s".repeat(43);
const C = "c".repeat(43);

describe("safeNextPath — /login?next= is not an open redirect", () => {
  it("allows the CLI authorize page, with or without a query", () => {
    expect(safeNextPath("/cli/authorize")).toBe("/cli/authorize");
    expect(safeNextPath(`/cli/authorize?port=5000&state=${S}`)).toBe(`/cli/authorize?port=5000&state=${S}`);
  });

  it.each([
    "https://evil.example.com/cli/authorize",
    "//evil.example.com/cli/authorize",
    "/\\evil.example.com",
    "/cli/authorize/../../overview",
    "/cli/authorizeX",
    "/overview",
    "javascript:alert(1)",
    "/cli/authorize\n",
    "",
    null,
  ])("rejects %j", (next) => {
    expect(safeNextPath(next)).toBeNull();
  });
});

describe("parseCliAuthorizeRequest", () => {
  const params = (o: Record<string, string>) => new URLSearchParams(o);

  it("accepts a genuine CLI request and cleans the device name", () => {
    expect(parseCliAuthorizeRequest(params({ port: "53123", state: S, code_challenge: C, device: "dana\u0007-laptop" }))).toEqual({
      port: 53123,
      state: S,
      codeChallenge: C,
      device: "dana-laptop",
    });
  });

  it.each([
    { port: "80", state: S, code_challenge: C },
    { port: "70000", state: S, code_challenge: C },
    { port: "5000x", state: S, code_challenge: C },
    { port: "5000", state: "short", code_challenge: C },
    { port: "5000", state: S, code_challenge: "plain" },
  ])("rejects %j", (o) => {
    expect(parseCliAuthorizeRequest(params(o))).toBeNull();
  });
});

describe("loopbackCallbackUrl", () => {
  it("always targets 127.0.0.1 on the given port, carrying code, state and the backend origin", () => {
    const url = new URL(loopbackCallbackUrl(53123, { code: "abc", state: S, api: "https://docs.example.com" }));
    expect(url.origin).toBe("http://127.0.0.1:53123");
    expect(url.pathname).toBe("/callback");
    expect(url.searchParams.get("code")).toBe("abc");
    expect(url.searchParams.get("state")).toBe(S);
    expect(url.searchParams.get("api")).toBe("https://docs.example.com");
  });

  it("reports a cancel without any code", () => {
    const url = new URL(loopbackCallbackUrl(53123, { error: "access_denied", state: S }));
    expect(url.searchParams.get("error")).toBe("access_denied");
    expect(url.searchParams.has("code")).toBe(false);
  });
});
