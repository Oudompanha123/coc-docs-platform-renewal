import { contentId } from "./content-store";
import { fetchSavedSlugsOrThrow } from "./docs-content-api";
import type { NavProduct } from "./nav-api";
import type { StatCardData, Tone } from "@/lib/mock/overview";

const TONES: Tone[] = ["purple", "green", "orange", "pink"];
const KNOWN_ICONS: StatCardData["icon"][] = [
  "document",
  "layers",
  "users",
  "database",
  "folder",
  "person",
  "pulse",
  "barChart",
];

function iconFor(icon: string): StatCardData["icon"] {
  return (KNOWN_ICONS as string[]).includes(icon) ? (icon as StatCardData["icon"]) : "document";
}

/** One stat card per product, computed live from the docs-content backend —
 *  one bulk `fetchSavedSlugsOrThrow` call per product (never one request per
 *  sub-item), and a real `docs_content` row is the only thing that counts as
 *  "written" — a slug that merely has frontend seed placeholder text is not.
 *  Client-only (hits the real API), so callers must only invoke this after
 *  mount, with the live product list from a nav fetch. Throws on a backend
 *  failure rather than silently reporting every slug as unwritten — callers
 *  are expected to catch and show a real error state. */
export async function computeProductStats(products: NavProduct[]): Promise<StatCardData[]> {
  return Promise.all(
    products.map(async (product, i) => {
      const saved = await fetchSavedSlugsOrThrow(
        product.key,
        product.items.map((item) => item.slug),
      );
      const written = product.items.filter((item) => saved.has(item.slug)).length;
      const total = product.items.length;
      const allWritten = total > 0 && written === total;
      return {
        id: product.key,
        label: product.label,
        value: `${written} / ${total}`,
        trend: allWritten ? "All written" : `${total - written} not written`,
        trendTone: allWritten ? "positive" : "neutral",
        icon: iconFor(product.icon),
        tone: TONES[i % TONES.length] ?? "purple",
      } satisfies StatCardData;
    }),
  );
}

export type ContentDocRow = {
  id: string;
  label: string;
  productLabel: string;
  hasContent: boolean;
  initials: string;
  tone: Tone;
};

function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`.toUpperCase();
  return label.slice(0, 2).toUpperCase();
}

/** A slice across every product's sub-items for the Overview page's
 *  "Documents" card — registry order (not fabricated recency, since the
 *  store tracks no timestamps), capped to keep the card the same rough
 *  height the old 4-row mock list had rather than dumping every sub-item
 *  across every product into it. One bulk existence call per distinct
 *  product represented in the slice, not one per row. Throws on a backend
 *  failure — same contract as {@link computeProductStats}. */
export async function computeRecentDocs(products: NavProduct[], limit = 6): Promise<ContentDocRow[]> {
  const flat = products.flatMap((product) => product.items.map((item) => ({ product, item })));
  const slice = flat.slice(0, limit);

  const slugsByProduct = new Map<string, { product: NavProduct; slugs: string[] }>();
  for (const { product, item } of slice) {
    const entry = slugsByProduct.get(product.key) ?? { product, slugs: [] };
    entry.slugs.push(item.slug);
    slugsByProduct.set(product.key, entry);
  }

  const savedByProduct = new Map<string, Set<string>>();
  await Promise.all(
    Array.from(slugsByProduct.values()).map(async ({ product, slugs }) => {
      savedByProduct.set(product.key, await fetchSavedSlugsOrThrow(product.key, slugs));
    }),
  );

  return slice.map(({ product, item }, i) => ({
    id: contentId(product.key, item.slug),
    label: item.label,
    productLabel: product.label,
    hasContent: savedByProduct.get(product.key)?.has(item.slug) ?? false,
    initials: initialsFor(item.label),
    tone: TONES[i % TONES.length] ?? "purple",
  }));
}
