"use client";

import { useEffect, useState } from "react";
import { me, type Role } from "./api";

const ROLE_LABELS: Record<Role, string> = {
  GUEST: "Guest",
  USER: "User",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

/** First letter of up to the first two words of a display name, e.g. "Jane Admin" → "JA". */
function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!.charAt(0);
  const second = words.length > 1 ? words[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

export type CurrentUserDisplay = {
  name: string;
  role: string;
  initials: string;
};

/**
 * The signed-in caller's current name and role, straight from the session
 * (`GET /api/v1/auth/me`) — never a hardcoded placeholder.
 *
 * `null` while the request is in flight and for a visitor with no session;
 * callers fall back to their own placeholder for that case, same as they did
 * before this existed.
 */
export function useCurrentUser(): CurrentUserDisplay | null {
  const [user, setUser] = useState<CurrentUserDisplay | null>(null);

  useEffect(() => {
    let cancelled = false;

    me()
      .then((response) => {
        if (cancelled || !response.authenticated || !response.displayName) return;
        setUser({
          name: response.displayName,
          role: response.role ? (ROLE_LABELS[response.role] ?? response.role) : "",
          initials: initialsOf(response.displayName),
        });
      })
      .catch(() => {
        // Left null. Who is signed in is decoration here (the shell has no
        // route guard yet), not something worth surfacing a fetch failure for.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
