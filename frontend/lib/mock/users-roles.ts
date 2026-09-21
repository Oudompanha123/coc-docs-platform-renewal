/** Mock data for Users & Roles. UI-only — no API yet, same convention as lib/mock/overview.ts. */

export type AccountRole = "user" | "admin" | "super_admin";
export type AccountStatus = "active" | "pending" | "deactivated";

/**
 * `AccountRole` plus three display-only roles with no backing in the real
 * `AppRole` ladder yet (`backend/.../account/AppRole.java`, the `app_role`
 * Postgres enum) — adding one for real is a deliberate schema/security
 * decision (see `V4__roles_and_permissions.sql`'s own comment to that effect,
 * and ADR-037, which kept "Developer" out of this ladder on purpose). Kept
 * separate from `AccountRole` itself so it can never leak into a write path
 * (Add User / Edit Role / Approve — all of which submit to the live backend
 * and would have the extra values rejected); use it for badges and filters
 * only.
 */
export type DisplayRole = AccountRole | "developer" | "lead" | "reviewer";

export type ManagedAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  status: AccountStatus;
  lastLogin: string;
  ipAddress: string;
  /** The `picture` claim from this account's own last Google/Keycloak sign-in (ADR-013), or null. */
  avatarUrl: string | null;
};

/**
 * Ordered lowest to highest privilege — mirrors the real backend's
 * `AppRole` ladder (guest < user < admin < super_admin), minus `guest`:
 * no real account is ever created at that role (every Google sign-in
 * auto-provisions at `user`), so it never appears in this table.
 */
export const ROLE_ORDER: AccountRole[] = ["user", "admin", "super_admin"];

/**
 * `ROLE_ORDER` plus the three display-only roles, in ladder position: PM
 * decision (2026-09-21) places Developer/Lead/Reviewer between User and
 * Admin, tied with each other. Only the three in `ROLE_ORDER` are backed by
 * the real `AppRole` enum today — see `DisplayRole`.
 */
export const DISPLAY_ROLE_ORDER: DisplayRole[] = [
  "user",
  "developer",
  "lead",
  "reviewer",
  "admin",
  "super_admin",
];

/** The three roles in `DISPLAY_ROLE_ORDER` that are not (yet) in `ROLE_ORDER`. */
export const UNENFORCED_ROLES: DisplayRole[] = ["developer", "lead", "reviewer"];

export const ROLE_LABELS: Record<DisplayRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
  developer: "Developer",
  lead: "Lead",
  reviewer: "Reviewer",
};

export const ROLE_HINTS: Record<DisplayRole, string> = {
  user: "Reads published content.",
  developer: "Intended: implements features. Not enforced by the backend yet.",
  lead: "Intended: oversees a team's content decisions. Not enforced by the backend yet.",
  reviewer: "Intended: reviews and approves content before publish. Not enforced by the backend yet.",
  admin: "Authors, validates and publishes content.",
  super_admin: "Everything Admin does, plus who may do it.",
};

/**
 * The single role actually sent to the backend when several are checked in
 * the multi-select. The live create/update API only accepts one `role` value
 * (`ApiDtos.CreateAccountRequest`/`UpdateAccountRequest`), and only the three
 * roles in `ROLE_ORDER` exist in the real `AppRole` enum — so this ignores
 * any role in `UNENFORCED_ROLES` and returns the highest-ranked real role
 * among `selected`, defaulting to "user" when none is checked.
 */
export function highestEnforcedRole(selected: DisplayRole[]): AccountRole {
  let highest: AccountRole = "user";
  for (const role of selected) {
    if (ROLE_ORDER.indexOf(role as AccountRole) > ROLE_ORDER.indexOf(highest)) {
      highest = role as AccountRole;
    }
  }
  return highest;
}

export const MANAGED_ACCOUNTS: ManagedAccount[] = [
  {
    id: "1",
    name: "System Admin",
    email: "system.admin@cocdocs.example",
    role: "super_admin",
    status: "active",
    lastLogin: "Today, 10:24 AM",
    ipAddress: "192.168.1.10",
    avatarUrl: null,
  },
  {
    id: "2",
    name: "Jane Admin",
    email: "jane.admin@cocdocs.example",
    role: "admin",
    status: "active",
    lastLogin: "Today, 09:12 AM",
    ipAddress: "192.168.1.25",
    avatarUrl: null,
  },
  {
    id: "3",
    name: "Maly Kim",
    email: "maly.kim@cocdocs.example",
    role: "user",
    status: "active",
    lastLogin: "Yesterday, 04:36 PM",
    ipAddress: "192.168.1.32",
    avatarUrl: null,
  },
  {
    id: "4",
    name: "Sok Dara",
    email: "sok.dara@cocdocs.example",
    role: "user",
    status: "active",
    lastLogin: "Yesterday, 11:20 AM",
    ipAddress: "192.168.1.18",
    avatarUrl: null,
  },
  {
    id: "5",
    name: "Former Contractor",
    email: "contractor@cocdocs.example",
    role: "user",
    status: "deactivated",
    lastLogin: "Jun 10, 2025, 02:14 PM",
    ipAddress: "192.168.1.45",
    avatarUrl: null,
  },
];

/** The signed-in actor, for the "can't deactivate your own account" rule — matches lib/mock/overview.ts's CURRENT_USER identity. */
export const CURRENT_ACCOUNT_ID = "1";

/**
 * Distinct solid avatar color per row, cycling through colors already
 * defined elsewhere in this app (components/dashboard/tone.ts's TONE_STYLES
 * palette + the two brand tokens) rather than inventing new ones.
 */
export const AVATAR_PALETTE = ["#6d3ce0", "#4c6ff0", "#1f9d6b", "#e0873c", "#d94f7c"] as const;

export function avatarColorFor(index: number): string {
  return AVATAR_PALETTE[index % AVATAR_PALETTE.length] as string;
}
