"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";
import { peekRedirectHint, useNavStructure } from "@/lib/docs/useNavStructure";

/** A product's admin content-management page — replaces the 5 near-identical
 *  static files this used to be (app/jex3-0/page.tsx, app/coach/page.tsx,
 *  ...), one per product, each hardcoding its own productKey/label/icon.
 *  Adding a product through the Navigation admin page now makes this route
 *  work for it immediately, with no new file. */
export default function ProductManagePage() {
  const { productKey } = useParams<{ productKey: string }>();
  const products = useNavStructure();
  const product = products?.find((p) => p.key === productKey);

  if (products && !product) {
    // The sidebar's own rename just swapped this URL's key out of the shared
    // cache and is in the middle of `router.replace`-ing to the new one — the
    // cache update and the route change are two independently-scheduled
    // state changes, so this render can land in between them. Rendering
    // nothing for that one instant (rather than a 404) is what makes the
    // rename feel instant instead of flashing a wrong page first.
    if (peekRedirectHint(productKey)) return null;
    notFound();
  }
  if (!product) return null;

  const Icon = PRODUCT_ICONS[product.icon] ?? LayersIcon;

  return (
    <AppShell
      pageTitle={product.label}
      pageSubtitle={`Manage ${product.label}'s knowledge base content`}
      titleIcon={<Icon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <ProductContentTable productKey={product.key} productLabel={product.label} />
    </AppShell>
  );
}
