"use client";

import { BACKEND_URL } from "@/lib/auth/api";

/**
 * The live connection behind the bell.
 *
 * <p><b>Why this exists.</b> The bell polled once a minute, and the immediate
 * path was a Firebase push — which needs a project, credentials and granted
 * permission, none of which most people here have. So in practice nothing was
 * immediate, and the answer to "why did my notification not appear" was
 * "wait, or reload". A server-sent event stream needs none of that: it is an
 * HTTP response that stays open, authenticated by the session cookie every
 * other call already sends.
 *
 * <p><b>The event is a nudge, not the news.</b> Its payload is a type key and
 * the handler re-reads the queue and the session list. Carrying the content
 * would make the stream a second source of truth that can disagree with those
 * two, and one that a sleeping tab can miss entirely.
 *
 * <p><b>Reconnection is the browser's, not ours.</b> EventSource retries on its
 * own, with its own backoff, and resumes when a laptop wakes. Writing that here
 * would mean writing it worse. The server closes each connection after thirty
 * minutes, which is a reconnect the browser handles without being told.
 */
export function subscribeToNotifications(onEvent: () => void): () => void {
  // Server-side render, or a browser old enough not to have it. The poll in
  // useNotifications is still running, so the bell degrades to what it was
  // rather than to nothing.
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    return () => {};
  }

  let source: EventSource;
  try {
    // withCredentials, or the session cookie is not sent and the stream is a
    // 401 the browser then retries for ever. The backend allows exactly this
    // origin with credentials (SecurityConfig.corsConfigurationSource).
    source = new EventSource(`${BACKEND_URL}/api/v1/notifications/stream`, {
      withCredentials: true,
    });
  } catch {
    return () => {};
  }

  source.addEventListener("notification", () => onEvent());

  // Deliberately no onerror handler that closes the connection. An error here
  // is usually a dropped connection, and EventSource is already retrying;
  // closing it would turn a blip into a tab that never updates again until it
  // is reloaded.

  return () => source.close();
}
