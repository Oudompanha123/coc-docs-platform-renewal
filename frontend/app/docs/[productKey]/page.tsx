"use client";

import { notFound, useParams } from "next/navigation";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { contentId } from "@/lib/docs/content-store";
import { useDocContent } from "@/lib/docs/useDocContent";
import { useNavStructure } from "@/lib/docs/useNavStructure";

/** A product's own index/overview route (empty slug) — replaces the static
 *  per-product page.tsx files (app/docs/jex2-0/page.tsx, coach/page.tsx,
 *  ...) that each hardcoded one productKey. jex3-0 is excluded: its content
 *  lives under /jex3-0/* (app/jex3-0/[slug]/page.tsx), not /docs/*. */
export default function DocsProductIndexPage() {
  const { productKey } = useParams<{ productKey: string }>();
  const products = useNavStructure();
  const product = productKey === "jex3-0" ? undefined : products?.find((p) => p.key === productKey);
  const item = product?.items.find((i) => i.slug === "");
  const content = useDocContent(contentId(productKey, ""));

  if (productKey === "jex3-0" || (products && (!product || !item))) {
    notFound();
  }
  if (!product || !item) return null;

  return content ? <ContentRenderer content={content} variant="docs" /> : <DocsStubPage header={product} item={item} />;
}
