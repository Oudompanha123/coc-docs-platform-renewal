import { describe, expect, it } from "vitest";

import { avatarSrc } from "./avatarSrc";
import { BACKEND_URL } from "@/lib/auth/api";

/**
 * // req: FR-AUTH-005, ADR-101
 */
describe("avatarSrc", () => {
  it("sends an API path to the backend, not the frontend origin", () => {
    const path = "/api/v1/avatars/11111111-2222-3333-4444-555555555555/photo.png";

    expect(avatarSrc(path)).toBe(`${BACKEND_URL}${path}`);
  });

  /** Google's picture URL is already a working absolute address. */
  it("leaves an absolute URL untouched", () => {
    const google = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";

    expect(avatarSrc(google)).toBe(google);
  });

  it("is null for nothing, so callers fall back to initials", () => {
    expect(avatarSrc(null)).toBeNull();
    expect(avatarSrc(undefined)).toBeNull();
    expect(avatarSrc("")).toBeNull();
  });

  /** A path that is not ours must not be rewritten onto the backend. */
  it("only prefixes paths under /api/", () => {
    expect(avatarSrc("/static/default.png")).toBe("/static/default.png");
  });
});
