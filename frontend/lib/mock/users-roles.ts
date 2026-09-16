/** Mock data for Users & Roles. UI-only — no API yet, same convention as lib/mock/overview.ts. */

export type AccountRole = "user" | "admin" | "super_admin";
export type AccountStatus = "active" | "pending" | "deactivated";

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

export const ROLE_LABELS: Record<AccountRole, string> = {
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

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
