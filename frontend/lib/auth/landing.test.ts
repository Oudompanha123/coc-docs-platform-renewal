import { describe, expect, it } from "vitest";
import { landingPathFor } from "./landing";

/**
 * Where each role lands after signing in, and on the bare domain — one rule
 * for both (ADR-065). Developer, Reviewer and Lead used to match no branch
 * and fall through to the public page.
 */
describe("landingPathFor", () => {
  it.each(["admin", "super_admin"] as const)("sends a %s to the Overview dashboard", (role) => {
    expect(landingPathFor({ role })).toBe("/overview");
  });

  it.each(["developer", "reviewer", "lead"] as const)("sends a %s to the Overview dashboard, not the public page", (role) => {
    expect(landingPathFor({ role })).toBe("/overview");
  });

  it("keeps a plain user on the Member home", () => {
    expect(landingPathFor({ role: "user" })).toBe("/home");
  });

  it("sends a guest, or no role at all, to the public page", () => {
    expect(landingPathFor({ role: "guest" })).toBe("/welcome");
    expect(landingPathFor({ role: null })).toBe("/welcome");
  });

  it("sends anyone still on a temporary password to replace it first, whatever their role", () => {
    expect(landingPathFor({ role: "lead", mustChangePassword: true })).toBe("/create-password");
    expect(landingPathFor({ role: "super_admin", mustChangePassword: true })).toBe("/create-password");
  });
});
