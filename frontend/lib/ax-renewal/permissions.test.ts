import { describe, expect, it } from "vitest";
import type { Role } from "@/lib/auth/api";
import { axRenewalPermissions } from "./permissions";

/**
 * Role decides what, membership decides where (ADR-069). The backend is the
 * one that refuses; these pin that the workspace never *offers* something
 * the backend would refuse, and never hides something it would allow.
 */
describe("axRenewalPermissions", () => {
  const member = { member: true };
  const outsider = { member: false };

  function as(role: Role, roles: Role[] = [role]) {
    return { role, roles };
  }

  it("lets an Admin on the project edit and confirm — the backend's floor since ADR-086", () => {
    expect(axRenewalPermissions(as("admin"), member)).toEqual({
      onProject: true,
      canCreate: true,
      canEdit: true,
      canConfirm: true,
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
    // Reviewer and Lead out-rank Developer but do not hold it — the
    // exactAuthority() rule (ADR-090), mirrored.
    expect(axRenewalPermissions(as("lead", ["user", "lead"]), member).canConfirm).toBe(false);
    expect(axRenewalPermissions(as("reviewer", ["user", "reviewer"]), member).canConfirm).toBe(false);
  });

  it("gives a Developer who is not on the project nothing", () => {
    expect(axRenewalPermissions(as("developer", ["user", "developer"]), outsider)).toEqual({
      onProject: false,
      canCreate: false,
      canEdit: false,
      canConfirm: false,
    });
  });

  it("offers nothing on a project it has not loaded yet", () => {
    expect(axRenewalPermissions(as("admin"), null)).toMatchObject({ onProject: false, canEdit: false, canConfirm: false });
  });
});
