import type { NavProduct } from "./nav-api";

/**
 * Every product's real docs page — including Jex3.0, which used to be the
 * one exception routed to the authenticated admin shell (`/jex3-0/*`)
 * instead. That was never a real public page; visiting it landed inside
 * `AppShell`, gated to admin/super_admin. `/docs/jex3-0/*` was free the whole
 * time — `DocsProductIndexPage`/`DocsProductSubPage` just refused it by name
 * — so Jex3.0 now gets a real public page the same way the other four
 * always have, rather than a second URL scheme.
 */
export function hrefFor(productKey: string, slug: string): string {
  return slug ? `/docs/${productKey}/${slug}` : `/docs/${productKey}`;
}

/** Which product a docs pathname belongs to, if any. */
export function productForPathname(products: NavProduct[], pathname: string): NavProduct | undefined {
  return products.find((p) => pathname === `/docs/${p.key}` || pathname.startsWith(`/docs/${p.key}/`));
}

/** The small, fixed set of static `/docs/*` pages — everything else under
 *  `/docs/*` is a product's own page (`hrefFor`'s shape), so this is checked
 *  by exclusion rather than by matching the live, admin-editable product
 *  list. Kept as literal strings (same ones `DocsSidebar`/`DocsMobileNav`
 *  already hardcode as `DOCS_NAV`) rather than importing the live product
 *  list here, so `app/docs/layout.tsx` can decide its own shape without an
 *  async product fetch on every navigation. */
const STATIC_DOCS_PATHS = new Set(["/docs", "/docs/get-started", "/docs/how-to-use", "/docs/faq", "/docs/releases"]);

/** Whether a `/docs/*` pathname is one of a product's own pages (which get
 *  their own full-width header + tab bar, not the static pages' sidebar
 *  shell) rather than a static page or its `idea` sub-tree. */
export function isProductDocsRoute(pathname: string): boolean {
  if (!pathname.startsWith("/docs/")) return false;
  if (STATIC_DOCS_PATHS.has(pathname)) return false;
  if (pathname.startsWith("/docs/idea")) return false;
  return true;
}
