"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon } from "@/components/layout/icons";
import { CONTENT_REGISTRY, contentId, getContent, type ProductKey } from "@/lib/docs/content-store";

type Row = { id: string; label: string; hasContent: boolean };

/** A product's own content-management table — filtered to just its sub-items,
 *  reused across every product's admin landing page instead of duplicating
 *  this listing once per product. Extracted from the old standalone
 *  /content page, which showed every product's rows on one page. */
export function ProductContentTable({ productKey }: { productKey: ProductKey }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    setRows(
      CONTENT_REGISTRY.filter((item) => item.productKey === productKey).map((item) => {
        const id = contentId(item.productKey, item.slug);
        return { id, label: item.label, hasContent: getContent(id) !== undefined };
      }),
    );
  }, [productKey]);

  return (
    <div>
      <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3 text-sm text-dash-ink">
        Edits here are saved in this browser only (no backend is wired up for this content yet) — this is a
        working mock of the editing flow, not a shared, cross-device CMS.
      </div>

      {!rows && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {rows && (
        <div className="mt-6 rounded-2xl border border-border bg-white shadow-sm">
          <div className="divide-y divide-border">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-dash-ink">{row.label}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.hasContent ? "bg-[#e1f5ec] text-[#1f9d6b]" : "bg-page text-muted"
                    }`}
                  >
                    {row.hasContent ? "Has content" : "Not written"}
                  </span>
                  <Link
                    href={`/content/${row.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
                  >
                    {row.hasContent ? (
                      "Edit"
                    ) : (
                      <>
                        <PlusIcon className="h-3.5 w-3.5" />
                        Write
                      </>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
