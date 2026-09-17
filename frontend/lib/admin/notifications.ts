import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";

/**
 * The notification API — `/api/v1/admin/notifications`.
 *
 * `super_admin` only, and enforced by the backend's filter chain rather than
 * by anything here: the mail this sends carries page titles and the names and
 * addresses of the people who edited them, and it puts mail in other people's
 * inboxes, neither of which is editorial work. The screen hides what a caller
 * cannot use; the server decides what they may actually do. An `admin` gets
 * 403 on all of it.
 *
 * `credentials: "include"` for the same reason as every other admin call — the
 * session is an httpOnly cookie on a different origin.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * What a send did.
 *
 * `sent: false` is a normal answer, not an error — see {@link DigestResult.reason},
 * which the backend writes to be read by a person.
 */
export interface DigestResult {
  /** The day reported on, `YYYY-MM-DD`. */
  day: string;
  /** Whether a message was handed to the mail transport. */
  sent: boolean;
  pagesChanged: number;
  sections: number;
  recipients: number;
  /** Why it was or was not sent: "sent", "no page activity on this day", and so on. */
  reason: string;
}

/**
 * Sends the content-activity digest for one day.
 *
 * @param day `YYYY-MM-DD`, or omitted for yesterday — the same day the
 *   scheduled 08:00 run would have covered. The backend resolves "yesterday"
 *   in its own configured timezone, which is why this does not compute a date
 *   here: the browser's timezone is not the one the report is written in.
 */
export async function sendActivityDigest(day?: string): Promise<DigestResult> {
  const query = day ? `?day=${encodeURIComponent(day)}` : "";

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/notifications/digest${query}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only a super admin can send the activity digest.");
  }

  if (!response.ok) {
    // RFC 7807, and the backend's `detail` is written for a person to read —
    // "day must be a date in YYYY-MM-DD form", "cannot send a digest for
    // 2026-09-20, which is in the future". Both say what to do differently,
    // so they beat a generic message.
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AdminApiError(detail ?? "The digest could not be sent. Please try again.");
  }

  return (await response.json()) as DigestResult;
}
