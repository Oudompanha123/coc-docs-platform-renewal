import type { NavProduct } from "./nav-api";

/** Jex3.0's content lives under the authenticated admin shell (app/jex3-0/*),
 *  not the standalone /docs layout — the one hardcoded exception left now
 *  that the rest of the product/sub-item list is dynamic. */
export function hrefFor(productKey: string, slug: string): string {
  if (productKey === "jex3-0") {
    return slug ? `/jex3-0/${slug}` : "/jex3-0";
  }
  return slug ? `/docs/${productKey}/${slug}` : `/docs/${productKey}`;
}

/** Which product a docs pathname belongs to, if any. */
export function productForPathname(products: NavProduct[], pathname: string): NavProduct | undefined {
  return products.find((p) => {
    if (p.key === "jex3-0") {
      return pathname === "/jex3-0" || pathname.startsWith("/jex3-0/");
    }
    return pathname === `/docs/${p.key}` || pathname.startsWith(`/docs/${p.key}/`);
  });
}
