import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/lib/auth/api";
import type { NotificationItem } from "@/lib/notify/activity";
import { myDataFileName, myDataSheet } from "./export-my-data";

const USER: MeResponse = {
  id: "acct-1",
  email: "dana@example.com",
  displayName: "Dana Lee",
  role: "user",
  createdAt: "2026-01-01T00:00:00Z",
  lastSignInAt: "2026-09-20T08:00:00Z",
  avatarUrl: null,
  authenticated: true,
  mustChangePassword: false,
  hasPassword: true,
  roles: ["user"],
};

const ACTIVITY: NotificationItem[] = [
  {
    id: "1",
    actorEmail: "dana@example.com",
    actorAvatarUrl: null,
    summary: "Saved a documentation section",
    occurredAt: "2026-09-21T10:00:00Z",
    actionType: "docs_content.save",
    targetType: "docs_content",
    targetId: "page-1",
    href: null,
  },
];

describe("myDataSheet", () => {
  it("carries the profile fields a person can actually see about themselves, as Field/Value rows", () => {
    const sheet = myDataSheet(USER, [], new Date("2026-09-22T12:00:00Z"));

    expect(sheet.sheetName).toBe("My data");
    expect(sheet.headers).toEqual(["Field", "Value"]);
    expect(sheet.rows.slice(0, 7)).toEqual([
      ["Email", "dana@example.com"],
      ["Display name", "Dana Lee"],
      ["Role", "User"],
      ["Joined", new Date("2026-01-01T00:00:00Z")],
      ["Last sign-in", new Date("2026-09-20T08:00:00Z")],
      ["Has password", "Yes"],
      ["Exported", new Date("2026-09-22T12:00:00Z")],
    ]);
  });

  it("says 'Never' rather than a blank cell for an account that has not signed in again since", () => {
    const sheet = myDataSheet({ ...USER, lastSignInAt: null }, []);

    expect(sheet.rows[4]).toEqual(["Last sign-in", "Never"]);
  });

  it("labels a super_admin's role in words, the same map Users & Roles uses", () => {
    const sheet = myDataSheet({ ...USER, role: "super_admin" }, []);

    expect(sheet.rows[2]).toEqual(["Role", "Super Admin"]);
  });

  it("appends activity after a spacer and its own inline sub-header, occurred-at first", () => {
    const sheet = myDataSheet(USER, ACTIVITY);

    expect(sheet.rows.slice(7)).toEqual([
      ["", ""],
      ["Recent activity", ""],
      ["Occurred at", "Summary"],
      [new Date("2026-09-21T10:00:00Z"), "Saved a documentation section"],
    ]);
  });

  it("still writes the 'Recent activity' section header for an account with no recorded activity", () => {
    const sheet = myDataSheet(USER, []);

    expect(sheet.rows.slice(7)).toEqual([
      ["", ""],
      ["Recent activity", ""],
      ["Occurred at", "Summary"],
    ]);
  });

  it("marks the 'Recent activity' banner and its sub-header as sectionRows, so they render shaded rather than as plain data", () => {
    const sheet = myDataSheet(USER, ACTIVITY);

    expect(sheet.rows[8]).toEqual(["Recent activity", ""]);
    expect(sheet.rows[9]).toEqual(["Occurred at", "Summary"]);
    expect(sheet.sectionRows).toEqual([8, 9]);
  });
});

describe("myDataFileName", () => {
  it("is dated YYYY-MM-DD from the local calendar date, as .xlsx", () => {
    expect(myDataFileName(new Date(2026, 8, 22))).toBe("my-data-2026-09-22.xlsx");
  });
});
