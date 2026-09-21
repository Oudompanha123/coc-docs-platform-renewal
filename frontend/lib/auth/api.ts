/**
 * Thin client for the backend's login API (see docs/api/openapi.yaml).
 * // req: FR-AUTH-001, FR-AUTH-002, FR-AUTH-003, NFR-SEC-SESSION, ADR-014, ADR-017, ADR-018, ADR-019, ADR-021
 */

/** Also read by lib/notify/push.ts, which talks to the same backend. */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/** A user-facing failure from the auth API. `message` is always safe to show as-is. */
export class AuthApiError extends Error {}

/** A registration that already exists for that email (409). Distinguished from other failures so the form can point at the email field specifically. */
export class EmailAlreadyRegisteredError extends AuthApiError {}

/**
 * The server says this caller is not signed in (401), on a route that only a
 * signed-in caller can reach.
 *
 * <p>Distinguished from every other failure because it means something
 * different and needs a different answer: not "try again", but "you are not
 * signed in any more". A tab can be left holding a session that has since been
 * revoked — signing in again elsewhere in the same browser replaces it — and
 * the page goes on looking signed in while every request it makes is refused.
 * Silently. That is how a bell that showed nothing turned out to be a tab that
 * had been signed out for an hour.
 */
export class SessionExpiredError extends AuthApiError {}

/**
 * The backend renders a rejected request as an RFC 9457 problem body with a
 * `detail` field. Read only where that detail was deliberately authored to be
 * shown plainly (ADR-018 decision 3's precedent, extended by ADR-021) --
 * everywhere else in this file keeps its own fixed client-side string on
 * purpose, so wording stays centrally controlled here.
 */
async function readErrorDetail(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.json()) as { detail?: string };
    return body.detail;
  } catch {
    return undefined;
  }
}

/**
 * The role as the backend actually sends it: lower case.
 *
 * <p>`AppRole.wire()` lower-cases the Java enum for both the wire and the
 * `app_role` Postgres enum, so `super_admin` is what arrives here — not
 * `SUPER_ADMIN`. This type said the latter for a while, which typechecked
 * perfectly and matched nothing at runtime: every `Record<Role, …>` lookup
 * silently missed, which is why the sidebar rendered a raw `super_admin`
 * instead of "Super Admin".
 */
export type Role = "guest" | "user" | "admin" | "super_admin";

/**
 * A capability held in addition to `role` — layered on top of it, never
 * replacing it (ADR-037). "developer" grants AX Renewal regardless of the
 * base role it sits on top of.
 */
export type Capability = "developer";

export interface AuthenticatedAccount {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  /**
   * True while a super_admin-issued temporary password is still in force
   * (revision of ADR-017). The shell redirects to /create-password instead of
   * the normal workspace until this turns false.
   */
  mustChangePassword: boolean;
}

/** `GET /api/v1/auth/me`'s shape — every field is null when nobody is signed in. */
export interface MeResponse {
  id: string | null;
  email: string | null;
  displayName: string | null;
  role: Role | null;
  /** When the account was created — the profile screen's "Joined". */
  createdAt: string | null;
  /** Most recent sign-in; null when no session row exists. */
  lastSignInAt: string | null;
  /** Profile picture URL from the identity provider, or null — see UserAvatar. */
  avatarUrl: string | null;
  authenticated: boolean;
  /** See {@link AuthenticatedAccount.mustChangePassword}. False for an anonymous caller. */
  mustChangePassword: boolean;
  /**
   * Whether this account holds a password credential at all (ADR-030).
   * False for a Google-only account — "My Profile → Change Password" reads
   * this to decide whether to render a "Current Password" field, or offer
   * "Set a password" instead. False for an anonymous caller too.
   */
  hasPassword: boolean;
  /**
   * Capabilities held in addition to `role` (ADR-037) — e.g. `["developer"]`.
   * Empty, never null, so callers can `.includes(...)` without a guard; empty
   * for an anonymous caller too.
   */
  capabilities: Capability[];
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
 *
 * Since ADR-031: a correct password for an account with confirmed TOTP does
 * not resolve here at all — it throws {@link MfaRequiredError} instead,
 * carrying no session. The backend has already set the `coc_mfa_pending`
 * cookie by the time this rejects; the caller is expected to collect a code
 * and call {@link verifyMfaLogin} next.
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
  const body = (await response.json()) as AuthenticatedAccount | MfaRequiredBody;
  if ("mfaRequired" in body && body.mfaRequired) {
    throw new MfaRequiredError("Enter the 6-digit code from your authenticator app.");
  }
  return body as AuthenticatedAccount;
}

/** `POST /api/v1/auth/login-password`'s shape when the account has confirmed TOTP (ADR-031), instead of {@link AuthenticatedAccount}. */
interface MfaRequiredBody {
  mfaRequired: true;
  expiresInSeconds: number;
}

/**
 * Thrown by {@link loginWithPassword} when the password was correct but the
 * account has confirmed TOTP (ADR-031) — not a refusal. The caller should
 * switch to an "enter your code" step and call {@link verifyMfaLogin}.
 */
export class MfaRequiredError extends AuthApiError {}

/** The material a TOTP setup wizard needs (ADR-031) — `GET`/`POST /api/v1/auth/mfa/setup/start`'s response shape. */
export interface MfaSetupMaterial {
  /** Base32 secret, for manual entry if scanning the QR code isn't possible. */
  secret: string;
  /** A `data:image/png;base64,...` URI — render directly in an `<img>`, no separate fetch. */
  qrCodeDataUri: string;
  issuer: string;
  accountLabel: string;
}

/**
 * POST /api/v1/auth/mfa/setup/start (ADR-031). Starts (or restarts) TOTP
 * enrollment for the signed-in caller's own account. Refused (409-shaped,
 * surfaced as a generic failure here) if this account already has confirmed
 * TOTP — disable it first.
 */
export async function startMfaSetup(): Promise<MfaSetupMaterial> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/mfa/setup/start`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't start two-factor setup. Please try again.");
  }
  return (await response.json()) as MfaSetupMaterial;
}

/**
 * POST /api/v1/auth/mfa/setup/verify (ADR-031). Confirms a pending
 * enrollment with a code from the authenticator app the QR/secret was just
 * added to. A wrong or expired-looking code is reported plainly — same
 * "the caller just looked at this value themselves" reasoning {@link
 * verifyRegistrationCode} already follows.
 */
export async function verifyMfaSetup(code: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/mfa/setup/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't verify that code. Please try again.");
  }
  const body = (await response.json()) as { message: string };
  return body.message;
}

/**
 * POST /api/v1/auth/mfa/disable (ADR-031). Turns TOTP off. Requires the
 * account's current password — verified server-side, same reasoning {@link
 * changePassword}'s current-password check already follows for a
 * security-lowering self-service action.
 */
export async function disableMfa(currentPassword: string): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/mfa/disable`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't turn off two-factor authentication.");
  }
  const body = (await response.json()) as { message: string };
  return body.message;
}

/** GET /api/v1/auth/mfa/status (ADR-031) — what `SecurityTab`'s toggle reflects on load. */
export async function getMfaStatus(): Promise<boolean> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/mfa/status`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load your two-factor authentication status.");
  }
  const body = (await response.json()) as { enabled: boolean };
  return body.enabled;
}

/**
 * POST /api/v1/auth/mfa/verify (ADR-031). Redeems the `coc_mfa_pending`
 * cookie {@link loginWithPassword} left behind against a TOTP code (or the
 * configured developer code, in test mode) — on success, sets the real
 * session cookie exactly as {@link loginWithPassword} would have.
 */
export async function verifyMfaLogin(code: string): Promise<AuthenticatedAccount> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/mfa/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "That code didn't work. Please try again.");
  }
  return (await response.json()) as AuthenticatedAccount;
}

export interface RegisterResult {
  /** "PENDING" — an administrator has to approve the application before sign-in works (ADR-017). */
  status: string;
  message: string;
}

/** Step 1 (and resend)'s response shape — no account exists yet, only a code in flight. */
export interface RegisterChallengeResult {
  message: string;
  /** Seconds until the emailed code expires (ADR-021: 600, i.e. 10 minutes). */
  expiresInSeconds: number;
}

/**
 * POST /api/v1/auth/register (ADR-021, revision of ADR-014/017). Step 1 of
 * three: mints a 6-digit code and emails it, rather than creating an account
 * directly. {@link verifyRegistrationCode} is the call that actually creates
 * one, once that code is confirmed.
 */
export async function register(input: {
  email: string;
  displayName: string;
  password: string;
}): Promise<RegisterChallengeResult> {
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
  if (response.status === 429) {
    // Resubmitting the form for an address already mid-verification is
    // treated like a resend and shares its cooldown (ADR-021) — the
    // backend's message already says how long to wait.
    throw new AuthApiError((await readErrorDetail(response)) ?? "Please wait a moment before trying again.");
  }
  if (!response.ok) {
    throw new AuthApiError("Registration failed. Please check your details and try again.");
  }
  return (await response.json()) as RegisterChallengeResult;
}

/**
 * POST /api/v1/auth/register/resend (ADR-021). Re-sends the code for a
 * registration already in flight — the "I didn't get it" / "it expired"
 * path — subject to the same 60-second cooldown as resubmitting the form.
 */
export async function resendRegistrationCode(email: string): Promise<RegisterChallengeResult> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/register/resend`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't resend the code. Please try again.");
  }
  return (await response.json()) as RegisterChallengeResult;
}

/**
 * POST /api/v1/auth/register/verify (ADR-021). Step 3: confirms the emailed
 * code and creates the account — {@code pending} until a super_admin
 * approves it (ADR-017), same outcome the old single-step register always
 * ended in.
 *
 * Unlike sign-in's deliberate genericism, a rejected code here is reported
 * plainly: expired, incorrect, and too-many-attempts are distinct,
 * backend-authored messages safe to show as-is — the same "the caller
 * already holds a value from their own mailbox" reasoning {@link
 * resetPassword} follows (ADR-018 decision 3, extended by ADR-021).
 */
export async function verifyRegistrationCode(email: string, code: string): Promise<RegisterResult> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/register/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't verify that code. Please try again.");
  }
  return (await response.json()) as RegisterResult;
}

/**
 * POST /api/v1/auth/forgot-password (ADR-018, revised by ADR-019). Resolves
 * with the same generic message for every case except one: a Google-only
 * account and a genuinely emailed reset are still indistinguishable from
 * here (ADR-018 decision 3, the same {@code UC-004} E-3 anti-enumeration
 * principle {@link loginWithPassword} follows) — but an address with no
 * account at all is now a 404, and this function throws that message
 * plainly rather than folding it into the generic case (ADR-019).
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
  if (response.status === 404) {
    throw new AuthApiError("No account found with this email address.");
  }
  if (!response.ok) {
    // Reached only for a malformed request (e.g. not an email at all).
    throw new AuthApiError("Couldn't process that request. Check the address and try again.");
  }
  const body = (await response.json()) as { message: string };
  return body.message;
}

/**
 * POST /api/v1/auth/reset-password (ADR-018). Unlike {@link forgotPassword},
 * a rejected token here is reported plainly — the caller already holds a
 * value that came from their own email, so refusing it discloses nothing
 * about anyone else's account.
 *
 * Also how a Google-only account sets its first password, since ADR-029 —
 * the backend decides which of "set" or "reset" this is and returns the
 * resolved message worded accordingly; this function is agnostic to which.
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
 * POST /api/v1/auth/change-password (revision of ADR-017; current-password
 * check added by ADR-022, made unconditional for an existing hash by
 * ADR-024, given a third caller by ADR-030). Three callers share this one
 * function:
 *
 * - The first-login completion step (`/create-password`): the caller already
 *   holds a session issued on a temporary password, and passes that same
 *   temporary password as `currentPassword` — a second proof of it,
 *   immediately before it is retired (ADR-024).
 * - The voluntary "My Profile" / Settings → Security change (ADR-022):
 *   `currentPassword` is the account's existing password.
 * - That same screen, for a Google-only account setting its first password
 *   (ADR-030): there is no current password, so `currentPassword` is
 *   omitted — not sent as an empty string — and the server-side branch on
 *   {@link MeResponse.hasPassword} is what actually decides the field isn't
 *   needed, not this client.
 *
 * When present, `currentPassword` is verified server-side against the
 * stored hash. Unlike {@link resetPassword}, this never ends the caller's
 * own session.
 */
export async function changePassword(
  newPassword: string,
  confirmPassword: string,
  currentPassword?: string,
): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/change-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        currentPassword === undefined ? { newPassword, confirmPassword } : { currentPassword, newPassword, confirmPassword },
      ),
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AuthApiError(detail ?? "Couldn't set your new password. Please try again.");
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

/**
 * POST /api/v1/auth/me/avatar (ADR-026). Uploads the caller's own profile
 * photo — multipart, since this is a binary file, not a JSON field. Once
 * set, this survives a later Google/Keycloak sign-in; only {@link
 * removeAvatar} reverts to the identity provider's picture.
 *
 * Rejections (wrong file type, too large, not actually an image) come back
 * from the backend with wording meant to be shown as-is — the same {@code
 * detail}-reading convention {@link changePassword} follows.
 */
export async function uploadAvatar(file: File): Promise<MeResponse> {
  let response: Response;
  try {
    const body = new FormData();
    body.append("file", file);
    response = await fetch(`${BACKEND_URL}/api/v1/auth/me/avatar`, {
      method: "POST",
      credentials: "include",
      // No Content-Type header: the browser sets multipart/form-data with
      // the correct boundary itself, and overriding it here would drop
      // that boundary and leave the backend unable to parse the body.
      body,
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't upload that photo. Please try again.");
  }
  return (await response.json()) as MeResponse;
}

/**
 * DELETE /api/v1/auth/me/avatar (ADR-026). Removes a previously uploaded
 * photo, reverting to the identity provider's picture (or initials) on the
 * next sign-in.
 */
export async function removeAvatar(): Promise<MeResponse> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/auth/me/avatar`, {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new AuthApiError((await readErrorDetail(response)) ?? "Couldn't remove that photo. Please try again.");
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
  /**
   * Browser and platform, as the server reads them — "Chrome on Windows".
   *
   * The frontend used to derive this from `userAgent` itself. Two copies of
   * those rules meant the list could describe a device one way while the push
   * notification about that same device described it another, which is the
   * sort of disagreement that makes a person distrust both.
   */
  device: string;
  /** True when this sign-in was the first from a device like it (ADR-027). */
  newDevice: boolean;
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
  if (response.status === 401) {
    // Not a failure to load — a failure to still be signed in. The caller
    // needs to act on it rather than show an empty list, which is what it did
    // and which made a revoked session indistinguishable from having no other
    // devices.
    throw new SessionExpiredError("Your session has ended. Please sign in again.");
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
