import { AuthApiError } from "@/lib/auth/api";

/**
 * The account administration API — `/api/v1/admin/accounts`.
 *
 * Every call here needs `super_admin`. That is enforced by the backend's
 * filter chain (`hasRole(SUPER_ADMIN)` on this path), not by anything in this
 * file: the screen hides what a caller cannot use, and the server decides what
 * they may actually do. A caller who is only `admin` gets 403 on all of it.
 *
 * `credentials: "include"` on every request — the session is an httpOnly
 * cookie on a different origin, so without it the browser sends nothing and
 * the backend sees an anonymous caller.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** Raised for a refusal the person can act on — a duplicate email, the last super admin. */
export class AdminApiError extends AuthApiError {}

/** Thrown when the caller is signed in but is not a super admin. */
export class NotPermittedError extends AdminApiError {}

export type AccountRole = "guest" | "user" | "admin" | "super_admin";

/** `/api/v1/admin/accounts`' shape. */
export interface AdminAccount {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
  active: boolean;
  /** Every role held, rank order. `role` is the highest of these. */
  roles: AccountRole[];
  createdAt: string;
  /** Absent when they have never signed in, or not since their last session was purged. */
  lastSignInAt: string | null;
  /** True while this account is still using the temporary password its invite issued (revision of ADR-017). */
  mustChangePassword: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/accounts${path}`, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only a super admin can manage accounts.");
  }

  if (!response.ok) {
    // The backend answers RFC 7807, and its `detail` is written to be read by
    // a person — "this is the only active super admin; promote someone else
    // before demoting them". Surfacing it beats a generic message, which
    // would leave the reader with no idea what to do differently.
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AdminApiError(detail ?? "That change could not be saved. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listAccounts(): Promise<AdminAccount[]> {
  return request<AdminAccount[]>("");
}

/**
 * Creates an account before its owner first signs in, so a role above `user`
 * can be waiting for them (revision of ADR-017). The backend generates a
 * temporary password, emails it to `email` along with the login URL, and
 * marks the account as requiring a password change on first login — the
 * plaintext password itself never appears in this response. The account can
 * also still be matched by Google sign-in later; the two are not exclusive.
 */
export function createAccount(email: string, role: AccountRole): Promise<AdminAccount> {
  return request<AdminAccount>("", {
    method: "POST",
    body: JSON.stringify({ email, role }),
  });
}

/**
 * Changes a role, an activation state, or both.
 *
 * Both in one call when both change: the backend applies them in a single
 * transaction, so a request that demotes and deactivates cannot half-succeed.
 */
export function updateAccount(
  id: string,
  changes: { role?: AccountRole; active?: boolean; displayName?: string },
): Promise<AdminAccount> {
  return request<AdminAccount>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify(changes),
  });
}

/** One role and what it grants — `/api/v1/admin/roles`. */
export interface RoleDetail {
  key: AccountRole;
  rank: number;
  description: string;
  permissions: string[];
  accountCount: number;
}

/**
 * The role catalogue, lowest rank first.
 *
 * Read-only by design: roles are seeded by migration and adding one is a
 * schema change (ADR-016), so there is no create or edit counterpart here.
 */
export async function listRoles(): Promise<RoleDetail[]> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/roles`, { credentials: "include" });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only a super admin can view roles.");
  }
  if (!response.ok) {
    throw new AdminApiError("Couldn't load roles.");
  }
  return (await response.json()) as RoleDetail[];
}

/** One application waiting for a decision — `GET /api/v1/admin/accounts/pending`. */
export interface PendingAccount {
  id: string;
  email: string;
  displayName: string;
  /** Always "GUEST" while pending: the role an applicant holds grants nothing. */
  role: string;
  status: string;
}

/** The approval queue, oldest first — somebody who applied on Monday should not sit behind Friday. */
export function listPending(): Promise<PendingAccount[]> {
  return request<PendingAccount[]>("/pending");
}

/**
 * Lets an applicant in, at a role chosen in the same call (ADR-017).
 *
 * One decision, not two: approving and then promoting would be two screens,
 * two audit entries, and a window in which someone is inside at a role nobody
 * chose.
 */
export function approveAccount(id: string, role: AccountRole): Promise<PendingAccount> {
  return request<PendingAccount>(`/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

/** Refuses an application. The row stays, so the trail still answers who was turned down. */
export function rejectAccount(id: string): Promise<PendingAccount> {
  return request<PendingAccount>(`/${id}/reject`, { method: "POST" });
}
