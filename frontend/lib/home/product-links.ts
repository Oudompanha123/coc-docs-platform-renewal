import { hrefFor } from "@/lib/docs/nav-routing";
import type { NavProduct } from "@/lib/docs/nav-api";
import type { StatCardData } from "@/lib/mock/overview";

/** Where a product's own real, tabbed docs page lives — `hrefFor`'s own
 *  top-level `/[productKey]` route, the single source for this across the
 *  app (nav-routing.ts). Kept as a thin re-export so this Member-page module
 *  doesn't need every caller importing from two places. */
export function productHref(productKey: string): string {
  return hrefFor(productKey, "");
}

/** A specific sub-item's real docs page. */
export function productItemHref(productKey: string, slug: string): string {
  return hrefFor(productKey, slug);
}

/**
 * The product most worth this Member's attention: the one with the most
 * not-yet-written sub-items, computed from the same live `computeProductStats`
 * numbers the glance cards render — not a separate guess. A product with
 * nothing written and nothing missing (no sub-items at all) never wins; ties
 * keep the earlier product, matching the stable order `computeProductStats`
 * already returns.
 */
export function mostAttentionProduct(
  products: NavProduct[],
  stats: StatCardData[],
): NavProduct | null {
  let best: { product: NavProduct; notWritten: number } | null = null;

  for (const product of products) {
    const stat = stats.find((s) => s.id === product.key);
    if (!stat || product.items.length === 0) continue;
    const written = Number(stat.value.split("/")[0]?.trim() ?? "0");
    const notWritten = product.items.length - written;
    if (notWritten > 0 && (best === null || notWritten > best.notWritten)) {
      best = { product, notWritten };
    }
  }

  return best?.product ?? null;
}

/** Total not-yet-written sub-items across every product — the real,
 *  honestly-computable number this page's hero eyebrow uses in place of a
 *  per-user "since your last visit" figure the schema has no timestamp for. */
export function totalNotWritten(stats: StatCardData[]): number {
  return stats.reduce((sum, stat) => {
    const [writtenRaw, totalRaw] = stat.value.split("/");
    const written = Number(writtenRaw?.trim() ?? "0");
    const total = Number(totalRaw?.trim() ?? "0");
    return sum + Math.max(0, total - written);
  }, 0);
}
