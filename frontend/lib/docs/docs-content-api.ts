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

/** A product's own index/overview sub-item has slug `""` (see `NavItem` —
 *  an empty path segment isn't legal in a URL), so every docs-content route
 *  addresses it as the literal segment/query value `"index"` instead — the
 *  same convention `nav-api.ts`'s `slugSegment` uses for nav routes. This is
 *  the one place that mapping happens for docs-content; every URL builder
 *  below goes through it instead of inlining `slug || "index"` separately. */
function wireSlug(slug: string): string {
  return slug || "index";
}

function urlFor(productKey: string, slug: string): string {
  return `${BACKEND_URL}/api/v1/docs-content/${productKey}/${wireSlug(slug)}`;
}

/** The bulk existence-check endpoint (`DocsContentController#existence`) —
 *  same product-scoped base as {@link urlFor}, but naming candidate slugs in
 *  a `slugs` query param instead of one slug in the path. Callers pass this
 *  their slugs already mapped through {@link wireSlug} — see
 *  {@link fetchSavedSlugs}/{@link fetchSavedSlugsOrThrow}. */
function existenceUrlFor(productKey: string, wireSlugs: string[]): string {
  const query = wireSlugs.length > 0 ? `?slugs=${encodeURIComponent(wireSlugs.join(","))}` : "";
  return `${BACKEND_URL}/api/v1/docs-content/${productKey}${query}`;
}

/** The write side lives under a different prefix (`AdminDocsContentController`,
 *  `admin`-role gated in `SecurityConfig`) — a distinct path from the public
 *  read endpoint above, not just a different method on the same one. */
function adminUrlFor(productKey: string, slug: string): string {
  return `${BACKEND_URL}/api/v1/admin/docs-content/${productKey}/${wireSlug(slug)}`;
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
 * Which of the given slugs already have a saved admin row for this
 * product — a real `docs_content` row, distinct from {@link
 * fetchDocContent}'s "saved, else seed, else nothing" resilience. That
 * fallback is right for *rendering* a page (so a visitor never sees blank),
 * but wrong for a "written/not written" status check: `docs_content` being
 * empty for a slug that happens to have seed placeholder text must not read
 * as "written," or every product would report content that was never
 * actually saved through the editor.
 *
 * <p>The bulk sibling of what used to be a one-slug-at-a-time `hasSavedDocContent`
 * (backed by `GET /api/v1/docs-content/{productKey}/{slug}`, still there and
 * unchanged for anyone reading a single slug): checking a whole product's
 * sub-items that way meant one 404-prone request per row — harmless, since a
 * 404 there means exactly "not written," but noisy in the browser's network
 * tab at N rows per page load. This instead calls the backend's
 * `DocsContentController#existence` route,
 * `GET /api/v1/docs-content/{productKey}?slugs=...`, which is always `200`
 * and lists only the slugs that were actually saved.
 *
 * <p>Resolves to an empty set, never throws, for an empty `slugs` list or if
 * the backend can't be reached — same resilience as every other read helper
 * in this file.
 */
export async function fetchSavedSlugs(productKey: string, slugs: string[]): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();
  const pairs = slugs.map((slug) => ({ slug, wire: wireSlug(slug) }));

  try {
    const response = await fetch(
      existenceUrlFor(
        productKey,
        pairs.map((p) => p.wire),
      ),
      { credentials: "include" },
    );
    if (response.ok) {
      const { savedSlugs } = (await response.json()) as { savedSlugs: string[] };
      const saved = new Set(savedSlugs);
      return new Set(pairs.filter((p) => saved.has(p.wire)).map((p) => p.slug));
    }
  } catch {
    // Backend unreachable — resolve to empty, same as "nothing saved".
  }
  return new Set();
}

/** Same request as {@link fetchSavedSlugs}, but throws (`DocsContentApiError`)
 *  instead of resolving to an empty set on failure — for a caller (Overview
 *  and Member Home's written/not-written counts) that needs to tell "nothing
 *  saved yet" apart from "couldn't check", rather than quietly reporting a
 *  backend outage as if every slug were unwritten. */
export async function fetchSavedSlugsOrThrow(productKey: string, slugs: string[]): Promise<Set<string>> {
  if (slugs.length === 0) return new Set();
  const pairs = slugs.map((slug) => ({ slug, wire: wireSlug(slug) }));

  let response: Response;
  try {
    response = await fetch(
      existenceUrlFor(
        productKey,
        pairs.map((p) => p.wire),
      ),
      { credentials: "include" },
    );
  } catch {
    throw new DocsContentApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new DocsContentApiError("Couldn't load content status. Please try again.");
  }
  const { savedSlugs } = (await response.json()) as { savedSlugs: string[] };
  const saved = new Set(savedSlugs);
  return new Set(pairs.filter((p) => saved.has(p.wire)).map((p) => p.slug));
}

/** Saves an admin edit. Requires an authenticated session with the admin role. */
export async function saveDocContent(id: string, content: DocContent): Promise<DocContent> {
  const { productKey, slug } = parseContentId(id);

  let response: Response;
  try {
    response = await fetch(adminUrlFor(productKey, slug), {
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
