"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon } from "@/components/layout/icons";
import { PRODUCT_ICONS } from "@/components/layout/nav-config";
import { ProductContentTable } from "@/components/docs/editor/ProductContentTable";
import { useNavStructure } from "@/lib/docs/useNavStructure";

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
