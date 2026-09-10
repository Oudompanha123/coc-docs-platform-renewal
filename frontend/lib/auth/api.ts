/**
 * Thin client for the backend's login API (see docs/api/openapi.yaml).
 * // req: FR-AUTH-001, FR-AUTH-002, NFR-SEC-SESSION
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** A user-facing failure from the auth API. `message` is always safe to show as-is. */
export class AuthApiError extends Error {}

export type Role = "GUEST" | "USER" | "ADMIN" | "SUPER_ADMIN";

export interface AuthenticatedAccount {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

interface NonceResponse {
  nonce: string;
}

/**
 * POST /api/auth/nonce. Also sets the short-lived `coc_oidc_nonce` cookie the
 * backend reads back on `/login` — `credentials: "include"` is required both
 * to receive it here and to send it on the next call.
 */
export async function requestNonce(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/auth/nonce`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't start Google sign-in. Please try again.");
  }
  const body = (await response.json()) as NonceResponse;
  return body.nonce;
}

/**
 * POST /api/auth/login. Verifies the ID token server-side — issued by
 * Keycloak, which brokers Google upstream (ADR-013) — and, on success, sets
 * the session cookie.
 *
 * The backend deliberately returns the same generic failure whether the
 * token was invalid, the nonce didn't match, no account is provisioned for
 * that email, or the account is deactivated (UC-004 E-3) — this client never
 * tries to distinguish those cases either.
 */
export async function loginWithIdToken(idToken: string): Promise<AuthenticatedAccount> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Login failed. Your Google account may not have access yet.");
  }
  return (await response.json()) as AuthenticatedAccount;
}
