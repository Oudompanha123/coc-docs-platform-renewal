import { describe, expect, it } from "vitest";
import { type AdminAccount } from "./accounts";
import { accountStatus, usersFileName, usersSheet } from "./export-users";

function account(overrides: Partial<AdminAccount> = {}): AdminAccount {
  return {
    id: "a1",
    email: "someone@example.com",
    displayName: "Someone",
    role: "user",
    active: true,
    roles: ["user"],
    createdAt: "2026-08-01T09:00:00Z",
    lastSignInAt: "2026-09-17T06:53:00Z",
    mustChangePassword: false,
    avatarUrl: null,
    ...overrides,
  };
}

/**
 * The single row a one-account sheet produces.
 *
 * <p>Throws rather than returning `undefined` so a test that stops producing
 * rows fails on the row it expected, not on an unrelated property of nothing.
 */
function onlyRow(overrides: Partial<AdminAccount> = {}) {
  const [row] = usersSheet([account(overrides)]).rows;
  if (!row) throw new Error("expected usersSheet to produce one row");
  return row;
}

/** Column order is fixed by `HEADERS`; naming the indices keeps the tests readable. */
const NAME = 0;
const ROLE = 2;
const ALL_ROLES = 3;
const STATUS = 4;
const LAST_SIGN_IN = 5;
const CREATED = 6;
const TEMP_PASSWORD = 7;

describe("accountStatus", () => {
  it("is deactivated when the backend says inactive, whatever else is true", () => {
    expect(accountStatus(account({ active: false }))).toBe("deactivated");
    expect(accountStatus(account({ active: false, mustChangePassword: true }))).toBe("deactivated");
  });

  /**
   * The distinction the page exists to make: an invite creates the account
   * already active, so "active" alone would claim someone has signed in when
   * nobody has ever used the account.
   */
  it("is pending for an invited account still on its temporary password", () => {
    expect(accountStatus(account({ active: true, mustChangePassword: true }))).toBe("pending");
  });

  it("is active once the temporary password has been replaced", () => {
    expect(accountStatus(account({ active: true, mustChangePassword: false }))).toBe("active");
  });
});

describe("usersSheet", () => {
  it("writes one row per account, under the expected headers", () => {
    const sheet = usersSheet([account(), account({ id: "a2", email: "other@example.com" })]);

    expect(sheet.headers[NAME]).toBe("Name");
    expect(sheet.headers[LAST_SIGN_IN]).toBe("Last sign-in");
    expect(sheet.rows).toHaveLength(2);
  });

  it("labels roles the way the page does", () => {
    const row = onlyRow({ role: "super_admin", roles: ["user", "admin", "super_admin"] });

    expect(row[ROLE]).toBe("Super Admin");
    expect(row[ALL_ROLES]).toBe("User, Admin, Super Admin");
  });

  /**
   * `guest` cannot reach this table in practice — every sign-in
   * auto-provisions at `user` — but the API type permits it, and a spreadsheet
   * that silently renamed it would be worse than one that said "Guest".
   */
  it("names a guest rather than mislabelling it", () => {
    const row = onlyRow({ role: "guest", roles: ["guest"] });
    expect(row[ROLE]).toBe("Guest");
  });

  it("agrees with accountStatus about the Status column", () => {
    const row = onlyRow({ active: false });
    expect(row[STATUS]).toBe("Deactivated");
  });

  /**
   * Real Dates, not the page's "Today, 2:03 PM". The display string cannot be
   * sorted or filtered, which is most of what a spreadsheet is for.
   */
  it("writes timestamps as Dates", () => {
    const row = onlyRow();

    expect(row[LAST_SIGN_IN]).toBeInstanceOf(Date);
    expect(row[CREATED]).toBeInstanceOf(Date);
  });

  it("says Never rather than leaving a blank for an account that has not signed in", () => {
    const row = onlyRow({ lastSignInAt: null });
    expect(row[LAST_SIGN_IN]).toBe("Never");
  });

  /** An unparseable timestamp becomes a blank, never the text "Invalid Date". */
  it("degrades an unparseable date to a blank cell", () => {
    const row = onlyRow({ createdAt: "not a date" });
    expect(row[CREATED]).toBeUndefined();
  });

  it("reports whether the account is still on its temporary password", () => {
    expect(onlyRow({ mustChangePassword: true })[TEMP_PASSWORD]).toBe("Yes");
    expect(onlyRow({ mustChangePassword: false })[TEMP_PASSWORD]).toBe("No");
  });

  it("survives an empty account list", () => {
    expect(usersSheet([]).rows).toHaveLength(0);
  });

  it("centres Status, Last sign-in, Created, and On temporary password", () => {
    const sheet = usersSheet([account()]);
    expect(sheet.centeredColumns).toEqual([STATUS, LAST_SIGN_IN, CREATED, TEMP_PASSWORD]);
  });
});

describe("usersFileName", () => {
  /** Dated YYYY-MM-DD so a folder of exports sorts chronologically by name. */
  it("carries the local date", () => {
    expect(usersFileName(new Date("2026-09-17T13:53:00"))).toBe("users-and-roles-2026-09-17.xlsx");
  });

  it("zero-pads single-digit months and days", () => {
    expect(usersFileName(new Date("2026-01-05T10:00:00"))).toBe("users-and-roles-2026-01-05.xlsx");
  });
});
