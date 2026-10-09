"use client";

import { notFound, useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { LayersIcon, TagIcon } from "@/components/layout/icons";
import { ContentRenderer } from "@/components/docs/ContentRenderer";
import { contentId } from "@/lib/docs/content-store";
import { useDocContent } from "@/lib/docs/useDocContent";
import { useNavStructure } from "@/lib/docs/useNavStructure";

/** Every Jex3.0 sub-item, real content or not-written-yet — replaces the
 *  static per-item pages (overview/page.tsx, get-started/page.tsx, ...)
 *  plus the old stub-only catch-all, now that the sub-item list itself is
 *  admin-editable. Lives under /jex3-0/* rather than /docs/jex3-0/*: its
 *  content is under the authenticated admin shell, not the public /docs
 *  layout (see nav-routing.ts's hrefFor). */
export default function Jex30SubPage() {
  const { slug } = useParams<{ slug: string }>();
  const products = useNavStructure();
  const product = products?.find((p) => p.key === "jex3-0");
  const item = product?.items.find((i) => i.slug === slug);
  const content = useDocContent(contentId("jex3-0", slug));

  if (products && !item) {
    notFound();
  }
  if (!item) return null;

  if (content) {
    return (
      <AppShell
        pageTitle={`Jex3.0 — ${item.label}`}
        pageSubtitle="jexmcp3.0"
        titleIcon={<LayersIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
      >
        <ContentRenderer content={content} variant="admin" />
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle={`Jex3.0 — ${item.label}`}
      pageSubtitle="Not written yet"
      titleIcon={<LayersIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />}
    >
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-muted-surface/50 px-6 py-12 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg border border-surface-border bg-card text-muted-foreground">
          <TagIcon className="size-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">Jex3.0 — {item.label} isn&apos;t written yet</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Real content gets cloned from the jexmcp3.0 source in a future pass, one sub-item at a time.
        </p>
      </div>
    </AppShell>
  );
}
