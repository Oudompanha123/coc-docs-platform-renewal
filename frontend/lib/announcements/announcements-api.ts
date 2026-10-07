import { AuthApiError, BACKEND_URL, SessionExpiredError } from "@/lib/auth/api";

/**
 * Announcements, as the user site reads them — `GET /api/v1/announcements`
 * (ADR-098). Only ever published, unexpired announcements: the backend answers
 * 404 for anything else, drafts included.
 */

export type AnnouncementCategory = "info" | "update" | "maintenance" | "important";

export const ANNOUNCEMENT_CATEGORIES: readonly AnnouncementCategory[] = ["info", "update", "maintenance", "important"];

export const CATEGORY_LABELS: Record<AnnouncementCategory, string> = {
  info: "Information",
  update: "Update",
  maintenance: "Maintenance",
  important: "Important",
};

export interface Announcement {
  id: string;
  title: string;
  /** Plain text. Line breaks are the author's and are kept when rendered; nothing here is HTML. */
  body: string;
  category: AnnouncementCategory;
  publishedAt: string;
  /** Null means it stays up until an admin unpublishes it. */
  expiresAt: string | null;
}

/** Thrown when the announcement is unknown, unpublished or expired — the backend does not say which. */
export class AnnouncementGoneError extends AuthApiError {}

async function request<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/announcements${path}`, { credentials: "include" });
  } catch {
    throw new AuthApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401) {
    throw new SessionExpiredError("Your session has ended. Please sign in again.");
  }
  if (response.status === 404) {
    throw new AnnouncementGoneError("This announcement is no longer available.");
  }
  if (!response.ok) {
    throw new AuthApiError("Couldn't load announcements.");
  }
  return (await response.json()) as T;
}

/** Live announcements, most recently published first. */
export function fetchAnnouncements(): Promise<Announcement[]> {
  return request<Announcement[]>("");
}

/** One live announcement — what a bell row opens. */
export function fetchAnnouncement(id: string): Promise<Announcement> {
  return request<Announcement>(`/${encodeURIComponent(id)}`);
}
