/**
 * Thin client for the backend's login API (see docs/api/openapi.yaml).
 * // req: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, NFR-SEC-SESSION, ADR-014
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** A user-facing failure from the auth API. `message` is always safe to show as-is. */
export class AuthApiError extends Error {}

/** A registration that already exists for that email (409). Distinguished from other failures so the form can point at the email field specifically. */
export class EmailAlreadyRegisteredError extends AuthApiError {}

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

/**
 * POST /api/v1/auth/login-password (ADR-014). Only succeeds for an approved
 * (status ACTIVE), non-deactivated, self-registered account.
 *
 * Same anti-enumeration shape as {@link loginWithIdToken} (UC-004 E-3): a
 * wrong password, an email with no account at all, and an email that only
 * ever signed in via Google/Keycloak (no password_hash set) all produce this
 * one generic failure — this client doesn't try to distinguish them either.
 */
export async function loginWithPassword(email: string, password: string): Promise<AuthenticatedAccount> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/login-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Login failed. Check your email and password, or your account may not be approved yet.");
  }
  return (await response.json()) as AuthenticatedAccount;
}

export interface RegisterResult {
  /** Always "PENDING" on success — registration never signs the caller in. */
  status: string;
  message: string;
}

/**
 * POST /api/v1/auth/register (ADR-014). Creates an account with a bcrypt-hashed
 * password, status PENDING, role user. No session cookie is set — the
 * account cannot sign in, by any path, until a super_admin approves it.
 */
export async function register(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<RegisterResult> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 409) {
    throw new EmailAlreadyRegisteredError("This email is already registered.");
  }
  if (!response.ok) {
    throw new AuthApiError("Registration failed. Please check your details and try again.");
  }
  return (await response.json()) as RegisterResult;
}
