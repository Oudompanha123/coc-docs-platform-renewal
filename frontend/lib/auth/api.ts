/**
 * Thin client for the backend's login API (see docs/api/openapi.yaml).
 * // req: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, NFR-SEC-SESSION, ADR-014, ADR-017
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

/** `GET /api/v1/auth/me`'s shape — every field is null when nobody is signed in. */
export interface MeResponse {
  id: string | null;
  email: string | null;
  displayName: string | null;
  role: Role | null;
  /** When the account was created — the profile screen's "Joined". */
  createdAt: string | null;
  /** Profile picture URL from the identity provider, or null — see UserAvatar. */
  avatarUrl: string | null;
  authenticated: boolean;
}

/**
 * GET /api/v1/auth/me. 200 with `authenticated: false` for a visitor with no
 * session — not an error; this is the call the shell makes to find out who,
 * if anyone, is signed in, so it can show their current name instead of a
 * placeholder.
 */
export async function me(): Promise<MeResponse> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your account.");
  }
  return (await response.json()) as MeResponse;
}

interface NonceResponse {
  nonce: string;
}

/**
 * POST /api/v1/auth/nonce. Also sets the short-lived `coc_oidc_nonce` cookie the
 * backend reads back on `/google` — `credentials: "include"` is required both
 * to receive it here and to send it on the next call.
 */
export async function requestNonce(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/nonce`, {
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
 * POST /api/v1/auth/google. Verifies the ID token server-side — issued by
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
    response = await fetch(`${BACKEND_URL}/api/v1/auth/google`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  // 403 is the one sign-in refusal the backend names: the registration exists
  // and is waiting for approval. Everything else stays a single 401 with a
  // fixed message, so the endpoint cannot be used to tell a real address from
  // a made-up one.
  if (response.status === 403) {
    throw new RegistrationPendingError(
      "Your registration is waiting for an administrator to approve it. " +
        "You will be able to sign in once they do.",
    );
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
  /** "PENDING" — an administrator has to approve the application before sign-in works (ADR-017). */
  status: string;
  message: string;
}

/**
 * POST /api/v1/auth/register (ADR-014, as revised 2026-09-11). Creates an
 * account with a bcrypt-hashed password, status ACTIVE, role user. No session
 * cookie is set here — the caller still has to sign in via
 * {@link loginWithPassword} — but there is no admin approval gate to wait on.
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

/**
 * POST /api/v1/auth/forgot-password (ADR-017). Always resolves with the same
 * generic message, whatever actually happened server-side — an unknown
 * address, a Google-only account, and a genuinely emailed reset all look
 * identical from here (ADR-017 decision 3, the same {@code UC-004} E-3
 * anti-enumeration principle {@link loginWithPassword} follows). This
 * function does not try to tell those cases apart either.
 */
export async function forgotPassword(email: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    // Reached only for a malformed request (e.g. not an email at all) — the
    // eligibility question itself never produces a non-2xx response.
    throw new AuthApiError("Couldn't process that request. Check the address and try again.");
  }
  const body = (await response.json()) as { message: string };
  return body.message;
}

/**
 * POST /api/v1/auth/reset-password (ADR-017). Unlike {@link forgotPassword},
 * a rejected token here is reported plainly — the caller already holds a
 * value that came from their own email, so refusing it discloses nothing
 * about anyone else's account.
 */
export async function resetPassword(token: string, newPassword: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("This reset link is invalid or has expired. Request a new one.");
  }
  const body = (await response.json()) as { message: string };
  return body.message;
}

/**
 * POST /api/v1/auth/logout. Ends the session on the server and clears the
 * cookie.
 *
 * Calling this matters: the session is a row in `app_session`, not a token the
 * browser can invalidate by forgetting. Dropping the cookie client-side would
 * leave that row live until its TTL expires, so anyone holding a copy of the
 * cookie would still be signed in — which is the thing server-side sessions
 * exist to prevent (FR-AUTH-007).
 *
 * Never throws. Sign-out has to end the same way whatever the network did: the
 * caller sends the user to /login either way, and a failed request here is not
 * something to make them look at.
 */
export async function signOut(): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Deliberately swallowed — see above.
  }
}

/**
 * PATCH /api/v1/auth/me. Changes the caller's own display name.
 *
 * Name only. Email identifies the account and comes from the identity
 * provider; role and status are the server's to decide — a profile screen that
 * could change those would be an administration screen with no floor under it.
 *
 * Note for anyone who signs in with Google: the provider's name overwrites this
 * on the next sign-in.
 */
export async function updateProfile(displayName: string): Promise<MeResponse> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't save your profile. Please try again.");
  }
  return (await response.json()) as MeResponse;
}

/** One device the caller is signed in on — `GET /api/v1/auth/sessions`. */
export interface SessionSummary {
  /** Opaque; never the token hash. */
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  issuedAt: string;
  expiresAt: string;
  /** True for the session making this request. */
  current: boolean;
}

/** Where this account is signed in. Own sessions only — the server uses the caller's own id. */
export async function listSessions(): Promise<SessionSummary[]> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/sessions`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your sessions.");
  }
  return (await response.json()) as SessionSummary[];
}

/**
 * Ends one of the caller's own sessions.
 *
 * The server answers 204 whether or not a row was revoked — an id belonging to
 * someone else is indistinguishable from one that does not exist — so there is
 * nothing to report back beyond "it went through".
 */
export async function revokeSession(sessionId: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/sessions/${sessionId}`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't end that session.");
  }
}

/**
 * Thrown when the caller's Google identity is genuine but their registration
 * has not been approved yet (ADR-017).
 *
 * Distinct from AuthApiError on purpose. Every other sign-in failure here is
 * deliberately indistinguishable, so the endpoint cannot be used to discover
 * who has an account — but this one follows an action the person took on
 * purpose, with an address they have just proved they own, so telling them
 * discloses nothing and a generic error would read as the product being
 * broken.
 */
export class RegistrationPendingError extends AuthApiError {}
