"use client";

import { notFound, useParams } from "next/navigation";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { contentId } from "@/lib/docs/content-store";
import { useDocContent } from "@/lib/docs/useDocContent";
import { useNavStructure } from "@/lib/docs/useNavStructure";

/** A product's named sub-items — replaces the static per-item files
 *  (app/docs/jex2-0/faq/page.tsx, ...) and the old per-product [slug] stub
 *  catch-alls, now that the sub-item list itself is admin-editable rather
 *  than a fixed set of files. jex3-0 is excluded: its content lives under
 *  /jex3-0/* (app/jex3-0/[slug]/page.tsx), not /docs/*. */
export default function DocsProductSubPage() {
  const { productKey, slug } = useParams<{ productKey: string; slug: string }>();
  const products = useNavStructure();
  const product = productKey === "jex3-0" ? undefined : products?.find((p) => p.key === productKey);
  const item = product?.items.find((i) => i.slug === slug);
  const content = useDocContent(contentId(productKey, slug));

  if (productKey === "jex3-0" || (products && (!product || !item))) {
    notFound();
  }
  if (!product || !item) return null;

  return content ? <ContentRenderer content={content} variant="docs" /> : <DocsStubPage header={product} item={item} />;
}
