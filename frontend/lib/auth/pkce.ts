/**
 * PKCE (RFC 7636) helpers for the Keycloak-brokered sign-in flow (ADR-013).
 * Hand-rolled against the Web Crypto API rather than pulling in an OIDC
 * client library, so the exact request going to Keycloak's token endpoint
 * stays small and auditable.
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** A cryptographically random, URL-safe string — used for both `state` and the PKCE code verifier. */
export function randomUrlSafeString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** The "S256" PKCE code challenge for a given code verifier. */
export async function codeChallengeFor(codeVerifier: string): Promise<string> {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}
