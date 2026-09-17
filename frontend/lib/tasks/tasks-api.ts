/**
 * Real backend client for the Task list (ADR-033) — `GET /api/v1/admin/tasks`
 * is open to any signed-in role (SecurityConfig), so this is safe for the
 * Member landing page's read-only "Your Tasks" list, not just the admin
 * shell. Create/complete stay admin+ only and have no client here — this
 * page only reads.
 */

import { BACKEND_URL } from "@/lib/auth/api";

export type Task = {
  id: string;
  title: string;
  dueDate: string | null;
  status: "open" | "done";
  createdAt: string;
};

const TASKS_URL = `${BACKEND_URL}/api/v1/admin/tasks`;

/** Never throws — an unreachable backend or a role without access both
 *  resolve to an empty list, so a caller can render its honest empty state
 *  rather than an error. */
export async function fetchOpenTasks(limit = 10): Promise<Task[]> {
  try {
    const response = await fetch(`${TASKS_URL}?limit=${limit}`, { credentials: "include" });
    if (response.ok) return (await response.json()) as Task[];
  } catch {
    // Backend unreachable — fall through to the empty list below.
  }
  return [];
}
