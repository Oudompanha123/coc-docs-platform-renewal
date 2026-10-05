import { describe, expect, it } from "vitest";
import { landingPathFor } from "./landing";

/**
 * Where each role lands after signing in, and on the bare domain — one rule
 * for both. Developer, Reviewer and Lead briefly landed on the Overview
 * dashboard (ADR-071); ADR-086 retired that, so they fell through to the
 * public page, same as before ADR-071. ADR-092 then split that trio again:
 * Developer now lands on the Member home alongside `user`; Reviewer and
 * Lead still fall through to the public page.
 */
describe("landingPathFor", () => {
  it.each(["admin", "super_admin"] as const)("sends a %s to the Overview dashboard", (role) => {
    expect(landingPathFor({ role })).toBe("/overview");
  });

  it.each(["reviewer", "lead"] as const)("sends a %s to the public page, not the Overview dashboard", (role) => {
    expect(landingPathFor({ role })).toBe("/welcome");
  });

  it.each(["user", "developer"] as const)("sends a %s to the Member home", (role) => {
    expect(landingPathFor({ role })).toBe("/home");
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
