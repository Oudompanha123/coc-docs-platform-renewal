"use client";

import { useEffect, useState } from "react";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { DocsStubPage } from "@/components/docs/DocsStubPage";
import { DocumentMetaPanel } from "@/components/docs/DocumentMetaPanel";
import { useProductDocsContext } from "@/components/docs/ProductDocsContext";
import { contentId } from "@/lib/docs/content-store";
import { fetchDocContentMeta } from "@/lib/docs/docs-content-api";
import { useDocContent } from "@/lib/docs/useDocContent";
import { hrefFor } from "@/lib/docs/nav-routing";

/**
 * The part of a product's docs page that actually changes per tab — the
 * rendered content (via `ContentRenderer`, the same renderer the admin
 * editor's Live Preview uses) and its meta panel. Everything that should
 * stay put across a tab click — header, breadcrumb, tab bar, footer — lives
 * one level up in `app/docs/[productKey]/layout.tsx`, which resolves "which
 * product/item is active" and hands it down via `ProductDocsProvider`
 * rather than this component re-deriving it from the URL a second time.
 */
export function ProductDocsPage() {
  const { product, activeItem } = useProductDocsContext();

  const [updatedAt, setUpdatedAt] = useState<string | undefined>(undefined);

  const id = contentId(product.key, activeItem.slug);
  const content = useDocContent(id);
  // Same source the admin's per-product list reads (`fetchDocContent`,
  // via this same `useDocContent` call) — not a second, stricter check.
  // Two different answers to "is this written?" is the bug this replaced:
  // the admin list said "Has content" for anything `fetchDocContent`
  // resolves (a real save, or its seed fallback), while this page's status
  // used to ask a real-row-only endpoint and could disagree with what was
  // rendered right above it.
  const hasSaved = content !== undefined;

  useEffect(() => {
    let cancelled = false;
    fetchDocContentMeta(id).then((meta) => {
      if (!cancelled) setUpdatedAt(meta?.updatedAt);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <div className="relative mt-5">
        <div key={activeItem.slug} className="animate-tab-content relative rounded-xl">
          {content ? (
            <ContentRenderer content={content} variant="docs" />
          ) : (
            <DocsStubPage header={product} item={activeItem} />
          )}
        </div>
      </div>

      <DocumentMetaPanel
        hasSavedContent={hasSaved}
        updatedAt={updatedAt}
        path={hrefFor(product.key, activeItem.slug)}
      />
    </>
  );
}
