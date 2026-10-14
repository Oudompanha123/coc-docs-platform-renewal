/**
 * Client for the Legal pages API (`LegalController`/`AdminLegalController`).
 * Reads are public (`GET /api/v1/legal/{slug}`); the admin draft/publish/
 * history/restore routes require a session, writes narrowed to super_admin
 * server-side (`SecurityConfig`) — enforced there, not here.
 */

import { BACKEND_URL } from "@/lib/auth/api";
import type { LegalDocumentContent } from "./legal-document";

export class LegalApiError extends Error {
  constructor(
    message: string,
    /** Set for a 409 — "someone else changed it since you opened it" — so a
     *  caller can offer "Reload" specifically rather than a generic retry. */
    public readonly conflict = false,
  ) {
    super(message);
  }
}

export type LegalSlug = "terms" | "privacy";

/** `content` is the one legal-page shape both slugs share since V81
 *  (`LegalDocumentContent`). */
export type LegalVersionMeta<T = LegalDocumentContent> = {
  id: string;
  slug: LegalSlug;
  status: "draft" | "published" | "archived";
  content: T;
  versionNo: number;
  publishedAt: string | null;
  publishedById: string | null;
  publishedByName: string | null;
  /** Set only at the moment a draft is promoted (task spec §G's optional
   *  "Publish note") — null for a draft, or for a row published before this
   *  field existed. */
  publishNote: string | null;
  updatedAt: string;
};

export type LegalVersionSummary = {
  id: string;
  status: "draft" | "published" | "archived";
  versionNo: number;
  publishedAt: string | null;
  publishedByName: string | null;
  publishNote: string | null;
};

function adminUrl(slug: LegalSlug, path = ""): string {
  return `${BACKEND_URL}/api/v1/admin/legal/${slug}${path}`;
}

async function parseJsonOrThrow<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (response.status === 409) {
    const body = await response.json().catch(() => null);
    throw new LegalApiError(
      typeof body?.message === "string" ? body.message : "This page was changed by someone else. Reload and try again.",
      true,
    );
  }
  if (response.status === 401 || response.status === 403) {
    throw new LegalApiError("You don't have permission to do that. Sign in as a super admin and try again.");
  }
  if (response.status === 422) {
    const body = await response.json().catch(() => null);
    throw new LegalApiError(
      typeof body?.message === "string" ? body.message : "This content didn't pass validation.",
    );
  }
  if (!response.ok) {
    throw new LegalApiError(fallbackMessage);
  }
  return (await response.json()) as T;
}

/** The public read — what `/terms` and `/privacy` render. Never throws:
 *  resolves to `undefined` so the page can fall back to its last-good
 *  content instead of showing an error for a momentary network hiccup. */
export async function fetchPublicLegalPage<T = LegalDocumentContent>(slug: LegalSlug): Promise<T | undefined> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/legal/${slug}`);
    if (response.ok) {
      const body = (await response.json()) as { slug: LegalSlug; content: T };
      return body.content;
    }
  } catch {
    // Network/backend unreachable — fall through to undefined.
  }
  return undefined;
}

/** Opens the current draft for editing — creates one from the published
 *  version if none exists yet. GET: this almost never creates a row in
 *  practice (the seed migration always leaves one), unlike `PageService`'s
 *  own `/open`, which is a POST because it usually does. */
export async function fetchLegalDraft<T = LegalDocumentContent>(slug: LegalSlug): Promise<LegalVersionMeta<T>> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, "/draft"), { credentials: "include" });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't load this page's draft.");
}

export async function saveLegalDraft<T = LegalDocumentContent>(
  slug: LegalSlug,
  content: T,
  versionNo: number,
): Promise<LegalVersionMeta<T>> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, "/draft"), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, versionNo }),
    });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't save. Please try again.");
}

/** `note` is the task spec's optional "Publish note" (max 200, enforced
 *  server-side) — omitting it (every call site before that field existed)
 *  sends no request body at all, exactly as before. */
export async function publishLegalPage<T = LegalDocumentContent>(slug: LegalSlug, note?: string): Promise<LegalVersionMeta<T>> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, "/publish"), {
      method: "POST",
      credentials: "include",
      ...(note ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note }) } : {}),
    });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't publish. Please try again.");
}

export async function fetchLegalVersions(slug: LegalSlug): Promise<LegalVersionSummary[]> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, "/versions"), { credentials: "include" });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't load version history.");
}

/** One specific version's full content — the History panel's "Preview", which (unlike restore) never touches the draft. */
export async function fetchLegalVersion<T = LegalDocumentContent>(slug: LegalSlug, versionId: string): Promise<LegalVersionMeta<T>> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, `/versions/${versionId}`), { credentials: "include" });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't load that version.");
}

export async function restoreLegalVersion<T = LegalDocumentContent>(slug: LegalSlug, versionId: string): Promise<LegalVersionMeta<T>> {
  let response: Response;
  try {
    response = await fetch(adminUrl(slug, `/versions/${versionId}/restore`), {
      method: "POST",
      credentials: "include",
    });
  } catch {
    throw new LegalApiError("Couldn't reach the server. Check your connection and try again.");
  }
  return parseJsonOrThrow(response, "Couldn't restore that version. Please try again.");
}
