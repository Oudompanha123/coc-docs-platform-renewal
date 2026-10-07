import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";
import { BACKEND_URL } from "@/lib/auth/api";
import type { AnnouncementCategory } from "@/lib/announcements/announcements-api";

/**
 * Announcement management — `/api/v1/admin/announcements` (ADR-098). Admin
 * and super_admin only; the backend enforces that on every request, this
 * module only turns its answers into messages.
 */

export type AnnouncementStatus = "draft" | "published" | "archived";

/** The admin's view: every field, every state. */
export interface AdminAnnouncement {
  id: string;
  title: string;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  /** Published but past its expiry — hidden from readers. Computed by the server. */
  expired: boolean;
  expiresAt: string | null;
  /** Sent back on every edit; a stale one is refused with 409. */
  versionNo: number;
  publishedAt: string | null;
  publishedByName: string | null;
  createdAt: string;
  updatedAt: string;
  updatedByName: string | null;
}

export interface AnnouncementInput {
  title: string;
  body: string;
  category: AnnouncementCategory;
  /** ISO instant, or null for "until unpublished". */
  expiresAt: string | null;
}

/** Thrown on 409 — someone else changed it, or it is already in the state asked for. */
export class AnnouncementConflictError extends AdminApiError {}

async function request<T>(path: string, init: RequestInit = {}, fallback: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/announcements${path}`, {
      credentials: "include",
      ...init,
      headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only an admin or super admin can manage announcements.");
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    const message = detail ? capitalise(detail) : fallback;
    throw response.status === 409 ? new AnnouncementConflictError(message) : new AdminApiError(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

/** The server's details are written mid-sentence ("an announcement needs a title"); a banner starts with a capital. */
function capitalise(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function listAnnouncements(): Promise<AdminAnnouncement[]> {
  return request<AdminAnnouncement[]>("", {}, "Couldn't load announcements.");
}

/** Saves a new draft. Nobody is notified until it is published. */
export function createAnnouncement(input: AnnouncementInput): Promise<AdminAnnouncement> {
  return request<AdminAnnouncement>("", { method: "POST", body: JSON.stringify(input) }, "Couldn't save the announcement.");
}

export function updateAnnouncement(id: string, input: AnnouncementInput, versionNo: number): Promise<AdminAnnouncement> {
  return request<AdminAnnouncement>(
    `/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify({ ...input, versionNo }) },
    "Couldn't save the announcement.",
  );
}

/** Publishes it and notifies every active account except the caller. */
export function publishAnnouncement(id: string): Promise<AdminAnnouncement> {
  return request<AdminAnnouncement>(`/${encodeURIComponent(id)}/publish`, { method: "POST" }, "Couldn't publish the announcement.");
}

/** Hides it from readers and removes it from every bell. */
export function unpublishAnnouncement(id: string): Promise<AdminAnnouncement> {
  return request<AdminAnnouncement>(
    `/${encodeURIComponent(id)}/unpublish`,
    { method: "POST" },
    "Couldn't unpublish the announcement.",
  );
}

export function deleteAnnouncement(id: string): Promise<void> {
  return request<void>(`/${encodeURIComponent(id)}`, { method: "DELETE" }, "Couldn't delete the announcement.");
}
