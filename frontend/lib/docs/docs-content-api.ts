/**
 * Real backend client for the docs-content store — replaces the earlier
 * localStorage-only mock (see git history for `content-store.ts`'s old
 * readStore/writeStore). Reads are public (`GET /api/v1/docs-content/**`);
 * writes require the admin role (`PUT /api/v1/admin/docs-content/**`),
 * enforced server-side in SecurityConfig, not here.
 */

import { BACKEND_URL } from "@/lib/auth/api";
import { parseContentId, SEED_CONTENT } from "./content-store";
import type { DocContent } from "./content-types";

export class DocsContentApiError extends Error {}

function urlFor(productKey: string, slug: string): string {
  return `${BACKEND_URL}/api/v1/docs-content/${productKey}/${slug || "index"}`;
}

/**
 * Fetches the content for a registry id — a saved backend row if one
 * exists, else the seed content, else `undefined`. Never throws: the same
 * "saved, else seed, else nothing" resilience the old localStorage-backed
 * `getContent` had, now also covering the backend being unreachable (e.g.
 * not running locally), not just "no row yet". Reads should always resolve
 * to *something* rather than surface an error; only writes (saveDocContent)
 * need to be able to fail loudly.
 */
export async function fetchDocContent(id: string): Promise<DocContent | undefined> {
  const { productKey, slug } = parseContentId(id);

  try {
    const response = await fetch(urlFor(productKey, slug), { credentials: "include" });
    if (response.ok) return (await response.json()) as DocContent;
  } catch {
    // Backend unreachable — fall through to the seed below.
  }
  return SEED_CONTENT[id];
}

/** The real `updated_at` for a saved row — the product docs page's "About
 *  this document" panel. A separate endpoint from {@link fetchDocContent}
 *  (`.../meta`), not a field folded into it: that response is read straight
 *  back as `DocContent` and re-sent verbatim on save, so a stray timestamp
 *  merged into it would round-trip into the stored body. Returns `undefined`
 *  for unsaved/unreachable, same resilience as `fetchDocContent`. */
export async function fetchDocContentMeta(id: string): Promise<{ updatedAt: string } | undefined> {
  const { productKey, slug } = parseContentId(id);

  try {
    const response = await fetch(`${urlFor(productKey, slug)}/meta`, { credentials: "include" });
    if (response.ok) return (await response.json()) as { updatedAt: string };
  } catch {
    // Backend unreachable — resolve to undefined, same as no saved row.
  }
  return undefined;
}

/**
 * Whether an admin has actually saved content for this registry id — a real
 * backend row, distinct from {@link fetchDocContent}'s "saved, else seed,
 * else nothing" resilience. That fallback is right for *rendering* a page
 * (so a visitor never sees blank), but wrong for a "written/not written"
 * status check: `docs_content` being empty for a slug that happens to have
 * seed placeholder text must not read as "written," or every product would
 * report content that was never actually saved through the editor.
 * Resolves `false`, never throws, if the backend can't be reached.
 */
export async function hasSavedDocContent(id: string): Promise<boolean> {
  const { productKey, slug } = parseContentId(id);

  try {
    const response = await fetch(urlFor(productKey, slug), { credentials: "include" });
    return response.ok;
  } catch {
    return false;
  }
}

/** Saves an admin edit. Requires an authenticated session with the admin role. */
export async function saveDocContent(id: string, content: DocContent): Promise<DocContent> {
  const { productKey, slug } = parseContentId(id);

  let response: Response;
  try {
    response = await fetch(urlFor(productKey, slug), {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(content),
    });
  } catch {
    throw new DocsContentApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new DocsContentApiError("You don't have permission to save content. Sign in as an admin and try again.");
  }
  if (!response.ok) {
    throw new DocsContentApiError("Couldn't save. Please try again.");
  }
  return (await response.json()) as DocContent;
}
