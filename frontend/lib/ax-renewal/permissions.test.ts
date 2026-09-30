import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth/api";
import { axRenewalPermissions } from "./permissions";

/**
 * Role decides what, membership decides where (ADR-063). The backend is the
 * one that refuses; these pin that the workspace never *offers* something
 * the backend would refuse, and never hides something it would allow.
 */
describe("axRenewalPermissions", () => {
  const member = { member: true };
  const outsider = { member: false };

  function as(role: Role, roles: Role[] = [role]) {
    return { role, roles };
  }

  it("lets an Admin on the project edit, but not confirm", () => {
    expect(axRenewalPermissions(as("admin"), member)).toEqual({
      onProject: true,
      canCreate: true,
      canEdit: true,
      canConfirm: false,
    });
  });

  it("lets a Developer on the project confirm, but not edit", () => {
    const p = axRenewalPermissions(as("developer", ["user", "developer"]), member);
    expect(p.canConfirm).toBe(true);
    expect(p.canEdit).toBe(false);
  });

  it("gives an Admin who is not on the project nothing but the right to start a new one", () => {
    expect(axRenewalPermissions(as("admin", ["admin", "developer"]), outsider)).toEqual({
      onProject: false,
      canCreate: true,
      canEdit: false,
      canConfirm: false,
    });
  });

  it("lets a Super Admin act on any project, member or not", () => {
    const p = axRenewalPermissions(as("super_admin"), outsider);
    expect(p).toEqual({ onProject: true, canCreate: true, canEdit: true, canConfirm: true });
  });

  it.each(["reviewer", "lead"] as const)("gives a %s on the project neither edit nor confirm", (role) => {
    const p = axRenewalPermissions(as(role, ["user", role]), member);
    expect(p.canEdit).toBe(false);
    expect(p.canConfirm).toBe(false);
    expect(p.onProject).toBe(true);
  });

  it("does not let rank stand in for holding Developer", () => {
    // An Admin out-ranks Developer but does not hold it — ADR-039/062's
    // exactAuthority() rule, mirrored.
    expect(axRenewalPermissions(as("admin"), member).canConfirm).toBe(false);
  });

  it("offers nothing on a project it has not loaded yet", () => {
    expect(axRenewalPermissions(as("admin"), null)).toMatchObject({ onProject: false, canEdit: false, canConfirm: false });
  });
});
