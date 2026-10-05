import { describe, expect, it } from "vitest";
import { landingPathFor } from "./landing";

/**
 * Where each role lands after signing in, and on the bare domain — one rule
 * for both. Developer, Reviewer and Lead land on the Member home, like a
 * plain user (ADR-090); ADR-086 keeps them off the Overview.
 */
describe("landingPathFor", () => {
  it.each(["admin", "super_admin"] as const)("sends a %s to the Overview dashboard", (role) => {
    expect(landingPathFor({ role })).toBe("/overview");
  });

  it.each(["developer", "reviewer", "lead"] as const)("sends a %s to the Member home, not the Overview dashboard", (role) => {
    expect(landingPathFor({ role })).toBe("/home");
  });

  it("still sends a Developer on a temporary password to replace it first", () => {
    expect(landingPathFor({ role: "developer", mustChangePassword: true })).toBe("/create-password");
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
