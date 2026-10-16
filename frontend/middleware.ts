import { NextResponse, type NextRequest } from "next/server";
import { fetchCurrentKeyForOldSlug, fetchNavStructure } from "@/lib/docs/nav-api";
import { RESERVED_DOCS_SUBROUTES, RESERVED_TOP_LEVEL_SEGMENTS } from "@/lib/docs/reserved-product-keys";

/**
 * Permanent (308) redirects from a product's old URL slug to its current
 * one, after a rename (task: "product rename ... URL slug follows the new
 * name, with redirects"). Handles both shapes a product key ever appears in:
 * the admin page (`/{key}`) and the landing docs pages (`/docs/{key}`,
 * `/docs/{key}/{slug}`).
 *
 * <p>This is new infrastructure, not a wire-up of something already there —
 * Step 1's investigation found no `middleware.ts` in this repo, and every
 * consumer of a product key (`app/(shell)/[productKey]`, `app/docs/
 * [productKey]/layout.tsx`) is a `"use client"` component matching it
 * against `GET /api/v1/nav` after mount, with no server-side seam a redirect
 * could hook into otherwise.
 *
 * <p>The query string survives automatically (only `pathname` is rewritten
 * below); a URL fragment (`#...`) is never sent to the server at all, so
 * there is nothing here to forward for it — the browser keeps it across any
 * same-origin redirect on its own.
 *
 * <p>Live product keys are cached for a few seconds (module scope) so an
 * ordinary admin page view costs one `GET /api/v1/nav` at most, not one per
 * request — this assumes `middleware.ts` runs in a process that keeps that
 * module alive between requests (true for `next dev` and for a standard
 * Node server deployment; a true multi-instance edge deployment would need
 * a shared cache instead, but no specific hosting target is chosen yet for
 * this app per ADR-012).
 */
let liveKeysCache: { keys: Set<string>; expiresAt: number } | null = null;
const LIVE_KEYS_TTL_MS = 10_000;

/** Test-only: clears the live-keys cache so each test starts from a clean,
 *  unfetched state instead of inheriting a previous test's mocked result. */
export function resetMiddlewareCacheForTests(): void {
  liveKeysCache = null;
}

async function liveProductKeys(): Promise<Set<string>> {
  if (liveKeysCache && liveKeysCache.expiresAt > Date.now()) {
    return liveKeysCache.keys;
  }
  const products = await fetchNavStructure();
  const keys = new Set(products.map((p) => p.key));
  liveKeysCache = { keys, expiresAt: Date.now() + LIVE_KEYS_TTL_MS };
  return keys;
}

/** The path's product-key candidate and where to splice a new one back in,
 *  or `null` for a shape this middleware doesn't act on at all (every other
 *  route — multi-segment admin paths, the bare `/docs` index, `/docs`'s own
 *  static sub-pages, anything not naming a product key at all). */
function productKeyCandidate(segments: string[]): { key: string; index: number } | null {
  if (segments.length === 1) {
    return { key: segments[0]!, index: 0 };
  }
  if (segments[0] === "docs" && segments.length >= 2 && !RESERVED_DOCS_SUBROUTES.has(segments[1]!)) {
    return { key: segments[1]!, index: 1 };
  }
  return null;
}

/**
 * Earlier addresses of a Store app's page — `/store-<number>` and
 * `/store/<number>`. The page now lives at `/store/app-<number>`
 * (`app/(member)/store/[slug]`); these redirect there so old links work.
 */
const STORE_APP_LEGACY = /^\/store(?:-|\/)(\d+)\/?$/;

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Ahead of the product-key logic below: `/store-3` is one top-level
  // segment, so it would otherwise be looked up as a product key.
  const legacy = STORE_APP_LEGACY.exec(request.nextUrl.pathname);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = `/store/app-${legacy[1]}`;
    return NextResponse.redirect(url, 308);
  }

  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const candidate = productKeyCandidate(segments);
  if (!candidate) {
    return NextResponse.next();
  }
  const { key, index } = candidate;
  if (RESERVED_TOP_LEVEL_SEGMENTS.has(key)) {
    return NextResponse.next();
  }

  const liveKeys = await liveProductKeys();
  if (liveKeys.has(key)) {
    return NextResponse.next();
  }

  const currentKey = await fetchCurrentKeyForOldSlug(key);
  if (!currentKey) {
    // Never a product key at all, live or retired — an ordinary 404, not
    // this middleware's concern.
    return NextResponse.next();
  }

  segments[index] = currentKey;
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/" + segments.join("/");
  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  // Skips Next's own internals and any request for a literal file (assets,
  // favicons, …) — everything else is a page route this app renders, which
  // is the universe `productKeyCandidate` needs to inspect.
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
