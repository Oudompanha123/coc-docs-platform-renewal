import { contentId } from "./content-store";
import { fetchDocContent } from "./docs-content-api";
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
 *  the same "has this sub-item been written" check ProductContentTable
 *  uses. Client-only (hits the real API), so callers must only invoke this
 *  after mount, with the live product list from useNavStructure. */
export async function computeProductStats(products: NavProduct[]): Promise<StatCardData[]> {
  return Promise.all(
    products.map(async (product, i) => {
      const results = await Promise.all(
        product.items.map((item) => fetchDocContent(contentId(product.key, item.slug)).catch(() => undefined)),
      );
      const written = results.filter((content) => content !== undefined).length;
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
 *  across every product into it. */
export async function computeRecentDocs(products: NavProduct[], limit = 6): Promise<ContentDocRow[]> {
  const flat = products.flatMap((product) => product.items.map((item) => ({ product, item })));
  const slice = flat.slice(0, limit);
  return Promise.all(
    slice.map(async ({ product, item }, i) => {
      const id = contentId(product.key, item.slug);
      const content = await fetchDocContent(id).catch(() => undefined);
      return {
        id,
        label: item.label,
        productLabel: product.label,
        hasContent: content !== undefined,
        initials: initialsFor(item.label),
        tone: TONES[i % TONES.length] ?? "purple",
      };
    }),
  );
}
