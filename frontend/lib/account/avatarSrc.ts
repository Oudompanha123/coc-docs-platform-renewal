import { BACKEND_URL } from "@/lib/auth/api";

/**
 * What to put in an `<img src>` for a profile photo (ADR-101).
 *
 * <p>A self-uploaded photo now comes back from the API as a path on this
 * backend — `/api/v1/avatars/{accountId}/{file}` — which redirects to a
 * short-lived signed S3 URL. That keeps the bucket private, but a bare path
 * would resolve against the frontend's own origin, which serves no such route.
 *
 * <p>Anything already absolute is returned untouched: the identity provider's
 * `picture` URL is Google's and is a working address this app does not own.
 *
 * <p>Null for an empty value, so every caller's existing "fall back to
 * initials" branch keeps working unchanged.
 */
export function avatarSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("/api/") ? `${BACKEND_URL}${url}` : url;
}
