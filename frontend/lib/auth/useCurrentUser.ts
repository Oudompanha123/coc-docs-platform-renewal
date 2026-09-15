"use client";

import { useSession } from "./SessionProvider";
import type { Role } from "./api";

/**
 * The signed-in user, shaped for display.
 *
 * <p>Reads the one session {@link useSession} already resolved rather than
 * calling `/api/v1/auth/me` itself. It used to do its own fetch, which meant
 * the sidebar and the topbar each asked the server the same question on every
 * page load and each independently decided what a failure meant.
 *
 * <p>Returns null while the answer is still loading and for a visitor with no
 * session. Inside the admin shell the second case does not arise — the guard
 * has already redirected — but this hook is usable outside it.
 */

const ROLE_LABELS: Record<Role, string> = {
  guest: "Guest",
  user: "User",
  admin: "Admin",
  super_admin: "Super Admin",
};

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!.charAt(0);
  const second = words.length > 1 ? words[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

export type CurrentUserDisplay = {
  /** Null for a password account, or when the provider sent no picture. */
  avatarUrl: string | null;
  name: string;
  role: string;
  initials: string;
};

export function useCurrentUser(): CurrentUserDisplay | null {
  const { status, user } = useSession();

  if (status !== "authenticated" || !user?.displayName) {
    return null;
  }

  return {
    name: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    role: user.role ? (ROLE_LABELS[user.role] ?? user.role) : "",
    initials: initialsOf(user.displayName),
  };
}
