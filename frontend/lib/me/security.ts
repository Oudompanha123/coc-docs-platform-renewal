import { AuthApiError, SessionExpiredError } from "@/lib/auth/api";

/**
 * The Settings page's Security card (ADR-090) — `GET /api/v1/me/security`.
 * Reachable by any signed-in account (`USER` floor); the backend resolves
 * the caller from the session, so there is nothing here to widen.
 *
 * `recentSignIns` carries no IP address at all — the audit row behind it
 * never captured one, so there is nothing to mask here, unlike the (separate,
 * already-real) Sessions list, whose `SessionSummary.ipAddress` is real.
 */
export type SignInEvent = {
  /** The raw audit action key — "auth.sign_in" or "auth.sign_out". */
  action: string;
  occurredAt: string;
  /** Blank, never missing, for a sign-out event, which has no device field. */
  device: string;
};

export type MySecurity = {
  signInMethod: string;
  email: string;
  recentSignIns: SignInEvent[];
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function fetchMySecurity(): Promise<MySecurity> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/me/security`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    throw new SessionExpiredError("You're signed out. Sign in again to see this.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your security info.");
  }

  return (await response.json()) as MySecurity;
}
