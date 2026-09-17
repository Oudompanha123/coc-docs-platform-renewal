import { ProductDocsPage } from "@/components/docs/ProductDocsPage";

/** A product's own index route (no sub-item slug) — "which sub-item is
 *  active" is resolved one level up, in `app/docs/[productKey]/layout.tsx`,
 *  and handed down via `ProductDocsProvider`. */
export default function DocsProductIndexPage() {
  return <ProductDocsPage />;
}
