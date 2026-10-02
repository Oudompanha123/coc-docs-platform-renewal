import { AuthApiError, SessionExpiredError } from "@/lib/auth/api";
import type { HrmsAttendanceReport } from "@/lib/notify/activity";

/**
 * The landing page's own personal Attendance API — `GET /api/v1/me/attendance`
 * (ADR-086). Reachable by any signed-in account (`USER` floor) — unlike
 * `lib/admin/attendance.ts`, which needs `admin`/`super_admin` and a
 * department to pick. There is no identifier to pass here beyond the date:
 * the backend resolves the caller from the session and narrows to their own
 * row, matched on `account.hrms_name` or email, the same rule the existing
 * HRMS report popup already uses.
 *
 * Reuses {@link HrmsAttendanceReport} as-is (`@/lib/notify/activity`) — the
 * wire shape is the same `ApiDtos.HrmsMailContentResponse` the admin
 * attendance endpoint and the activity feed's own report popup already
 * return, `scopedToViewer`/`viewerLinked` included.
 */
export type { HrmsAttendanceReport, HrmsAttendanceRow, HrmsAttendanceCheck } from "@/lib/notify/activity";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

/**
 * The caller's own attendance for one calendar date.
 *
 * <p>Always resolves — a day with nothing recorded or an account with no
 * HRMS link at all are both ordinary outcomes the response already
 * describes via {@code viewerLinked} and an empty {@code rows}, never a
 * thrown error. Only a genuinely failed request (network, session, server)
 * throws.
 *
 * @param date ISO `yyyy-MM-dd`
 */
export async function fetchMyAttendance(date: string): Promise<HrmsAttendanceReport> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/me/attendance?date=${encodeURIComponent(date)}`, {
      credentials: "include",
    });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    throw new SessionExpiredError("You're signed out. Sign in again to see your attendance.");
  }

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AuthApiError(detail ?? "Couldn't load attendance for that date.");
  }

  return (await response.json()) as HrmsAttendanceReport;
}
