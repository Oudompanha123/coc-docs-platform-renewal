"use client";

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import { fetchNavStructure, type NavProduct } from "./nav-api";

/**
 * The live product/sub-item tree, shared by every caller rather than
 * fetched independently per component (task: "update the shared product
 * state/cache — the same source used by the sidebar and the page header").
 * Before this, the sidebar renaming a product and the product page showing
 * its own header were two unrelated `fetch` calls on two unrelated timers —
 * a rename in one never reached the other without a full reload.
 *
 * <p>One cache, module-level rather than in React state, because the thing
 * that needs to update "at the same moment" is every mounted consumer at
 * once, not just the component that triggered the change.
 */
let cache: NavProduct[] | null = null;
let inFlight: Promise<NavProduct[]> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): NavProduct[] | null {
  return cache;
}

/** Nothing is rendered server-side from this cache — every consumer is a
 *  client component that fetches after mount, same as the hook this
 *  replaces did with its own `useState(null)` initial value. */
function getServerSnapshot(): NavProduct[] | null {
  return null;
}

/** Re-fetches from the backend and pushes the result to every mounted
 *  `useNavStructure()` caller — for a write this module has no cheaper way
 *  to reflect (create/delete/reorder), unlike a rename (see {@link
 *  applyProductRename}), which already has everything it needs in its own
 *  response. */
export async function refreshNavStructure(): Promise<NavProduct[]> {
  const products = await fetchNavStructure();
  cache = products;
  notify();
  return products;
}

/**
 * Applies a product rename to the shared cache immediately, with no
 * network round-trip — the rename response already carries the product's
 * new label/key, so every subscriber (the sidebar, the product page's
 * header/subtitle) sees it the instant the save succeeds rather than after
 * a follow-up fetch (task: "no window.location.reload()").
 *
 * <p>When the slug itself changed, also records a short-lived redirect hint
 * (see {@link peekRedirectHint}) — the caller's own `router.replace` to the
 * new URL and this cache update are two independent, differently-scheduled
 * state changes (an external store's listeners vs. Next's router), so there
 * can be one render in between where the URL still names the old key but
 * the cache no longer has a product under it. Without the hint, the product
 * page would read that as "this product doesn't exist" and 404 for an
 * instant before the URL catches up.
 */
export function applyProductRename(previousKey: string, renamed: NavProduct): void {
  if (cache) {
    cache = cache.map((p) => (p.key === previousKey ? { ...renamed, items: p.items } : p));
    notify();
  }
  if (previousKey !== renamed.key) {
    redirectHints.set(previousKey, { to: renamed.key, expiresAt: Date.now() + REDIRECT_HINT_TTL_MS });
  }
}

const REDIRECT_HINT_TTL_MS = 5000;
const redirectHints = new Map<string, { to: string; expiresAt: number }>();

/** Whether `key` was just renamed away — consulted (not consumed) so a
 *  product page can render nothing for the one instant described in {@link
 *  applyProductRename} instead of 404ing. Self-expiring rather than
 *  one-shot: the check can legitimately run more than once before the
 *  route change lands, and a later, UNRELATED 404 for the same key (the
 *  product was since deleted) must not be masked forever by a stale hint. */
export function peekRedirectHint(key: string): string | null {
  const hint = redirectHints.get(key);
  if (!hint) return null;
  if (hint.expiresAt < Date.now()) {
    redirectHints.delete(key);
    return null;
  }
  return hint.to;
}

/** Test-only: clears the shared cache, in-flight fetch, and redirect hints
 *  back to a clean slate. A module-level cache is deliberately NOT reset by
 *  components unmounting (that's the entire point of sharing it), which
 *  means a test suite must reset it explicitly between tests itself, or a
 *  later test can silently render whatever an earlier one's mocked fetch
 *  left behind instead of its own. */
export function resetNavStructureForTests(): void {
  cache = null;
  inFlight = null;
  redirectHints.clear();
}

/** The live product/sub-item tree. `null` while the first fetch anywhere in
 *  the app is in flight — callers render a loading state or nothing for
 *  that instant, same pattern as `useDocContent`/`ProductContentTable`. */
export function useNavStructure(): NavProduct[] | null {
  const products = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (cache != null || inFlight) return;
    inFlight = fetchNavStructure().then((result) => {
      inFlight = null;
      cache = result;
      notify();
      return result;
    });
  }, []);

  return products;
}
