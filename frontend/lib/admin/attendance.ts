import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";
import type { HrmsAttendanceReport } from "@/lib/notify/activity";

// Reuses HrmsAttendanceReport/HrmsAttendanceRow/HrmsAttendanceCheck as-is
// (@/lib/notify/activity) — the same shape the existing HRMS report popup
// already renders, not a parallel type for the same data.
export type { HrmsAttendanceReport, HrmsAttendanceRow, HrmsAttendanceCheck } from "@/lib/notify/activity";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/attendance${path}`, {
      credentials: "include",
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only an admin or super admin can view attendance.");
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AdminApiError(detail ?? "Couldn't load attendance for that date.");
  }

  return (await response.json()) as T;
}

/**
 * Every department's HRMS attendance report for one calendar date — one
 * entry per department HRMS sent a report for, empty if none did.
 *
 * @param date ISO `yyyy-MM-dd`
 */
export function fetchAttendanceReports(date: string): Promise<HrmsAttendanceReport[]> {
  return request<HrmsAttendanceReport[]>(`/reports?date=${encodeURIComponent(date)}`);
}
