/** Mock data for Users & Roles. UI-only — no API yet, same convention as lib/mock/overview.ts. */

/**
 * Mirrors the real backend `AppRole` ladder (ADR-039):
 * guest < user < developer < reviewer < lead < admin < super_admin, minus
 * `guest` — no real account is ever created at that role (every Google
 * sign-in auto-provisions at `user`), so it never appears here. `developer`
 * retired the old rank-independent capability of the same name (ADR-037/038)
 * and is now a real role like any other.
 */
export type AccountRole = "user" | "developer" | "reviewer" | "lead" | "admin" | "super_admin";
export type AccountStatus = "active" | "pending" | "deactivated";

/**
 * Kept as an alias, not removed, so a future role that genuinely isn't
 * backend-enforced yet (the way Reviewer/Lead briefly were) has somewhere to
 * go without every badge/filter/select call site changing again. Equal to
 * `AccountRole` today: every role in `ROLE_ORDER` is real.
 */
export type DisplayRole = AccountRole;

export type ManagedAccount = {
  id: string;
  name: string;
  email: string;
  /** The highest-ranked role held — what every badge/filter compared to a single role uses. */
  role: AccountRole;
  /** Every role this account holds (ADR-016) — `role` above is `roles`' highest rank, not a second value. */
  roles: AccountRole[];
  status: AccountStatus;
  lastLogin: string;
  ipAddress: string;
  /** The `picture` claim from this account's own last Google/Keycloak sign-in (ADR-013), or null. */
  avatarUrl: string | null;
};

/** Ordered lowest to highest privilege — see `AccountRole`'s own comment. */
export const ROLE_ORDER: AccountRole[] = ["user", "developer", "reviewer", "lead", "admin", "super_admin"];

/** Kept as an alias of `ROLE_ORDER` for the same reason as `DisplayRole`. */
export const DISPLAY_ROLE_ORDER: DisplayRole[] = ROLE_ORDER;

export const ROLE_LABELS: Record<DisplayRole, string> = {
  user: "User",
  developer: "Developer",
  reviewer: "Reviewer",
  lead: "Lead",
  admin: "Admin",
  super_admin: "Super Admin",
};

export const ROLE_HINTS: Record<DisplayRole, string> = {
  user: "Reads published content.",
  developer: "Implements AX Renewal plans; may confirm and start implementation there.",
  reviewer: "Reviews content and flags issues before publish.",
  lead: "Leads a team's content decisions, ranked above Reviewer.",
  admin: "Authors, validates and publishes content.",
  super_admin: "Everything Admin does, plus who may do it.",
};

/**
 * The single role sent on account *creation* — `POST /api/v1/admin/accounts`
 * still takes one `role`, unlike the PATCH path, which now accepts the whole
 * `roles` set (ADR-016/ADR-039). Returns the highest-ranked role among
 * `selected`, defaulting to "user" when none is checked.
 */
export function highestEnforcedRole(selected: DisplayRole[]): AccountRole {
  let highest: AccountRole = "user";
  for (const role of selected) {
    if (ROLE_ORDER.indexOf(role) > ROLE_ORDER.indexOf(highest)) {
      highest = role;
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
    roles: ["super_admin"],
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
    roles: ["admin"],
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
    roles: ["user"],
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
    roles: ["user"],
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
    roles: ["user"],
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
