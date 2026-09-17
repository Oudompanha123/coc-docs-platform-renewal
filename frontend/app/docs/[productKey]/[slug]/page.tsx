import { ProductDocsPage } from "@/components/docs/ProductDocsPage";

/** A product's named sub-item route. Jex3.0 is no longer excluded here —
 *  its content was always public at the API layer (`GET
 *  /api/v1/docs-content/jex3-0/**` is `permitAll`); only this frontend route
 *  refused it by name. "Which sub-item is active" is resolved one level up,
 *  in `app/docs/[productKey]/layout.tsx`, and handed down via
 *  `ProductDocsProvider`. */
export default function DocsProductSubPage() {
  return <ProductDocsPage />;
}
