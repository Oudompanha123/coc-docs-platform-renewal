import type { NavProduct } from "@/lib/docs/nav-api";
import type { StatCardData } from "@/lib/mock/overview";

/**
 * Where a product's own real docs page lives for a signed-in Member —
 * `/docs/[productKey]` (frontend/app/docs/[productKey]/page.tsx), the one
 * product page that isn't gated to admin/super_admin.
 *
 * Jex3.0 is the one exception: its real content renderer only exists inside
 * the admin shell (`app/(shell)/jex3-0/[slug]/page.tsx`), and `/docs/jex3-0`
 * itself calls `notFound()` unconditionally — a pre-existing gap in the app,
 * not something introduced here. It's still routed the same way as every
 * other product for consistency (this page's own nav/strip/hero all read
 * from the same real product list), and is worth fixing separately.
 */
export function productHref(productKey: string): string {
  return `/docs/${productKey}`;
}

/** A specific sub-item's real docs page. An empty slug is a product's own
 *  index item (`DocsProductIndexPage`), which lives at the product's own URL
 *  rather than a `/undefined`-shaped child route. */
export function productItemHref(productKey: string, slug: string): string {
  return slug ? `/docs/${productKey}/${slug}` : productHref(productKey);
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
