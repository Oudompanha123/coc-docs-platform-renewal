"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DocumentIcon, PlusIcon } from "@/components/layout/icons";
import { CONTENT_REGISTRY, contentId, getContent } from "@/lib/docs/content-store";

type Row = { id: string; productKey: string; productLabel: string; label: string; hasContent: boolean };

export default function ContentListPage() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    setRows(
      CONTENT_REGISTRY.map((item) => {
        const id = contentId(item.productKey, item.slug);
        return {
          id,
          productKey: item.productKey,
          productLabel: item.productLabel,
          label: item.label,
          hasContent: getContent(id) !== undefined,
        };
      }),
    );
  }, []);

  const grouped = rows
    ? Object.values(
        rows.reduce<Record<string, { productLabel: string; items: Row[] }>>((acc, row) => {
          (acc[row.productKey] ??= { productLabel: row.productLabel, items: [] }).items.push(row);
          return acc;
        }, {}),
      )
    : [];

  return (
    <AppShell
      pageTitle="Content"
      pageSubtitle="Edit knowledge base content — saved edits show up on the public pages immediately"
      titleIcon={<DocumentIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="rounded-2xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3 text-sm text-dash-ink">
        Edits here are saved in this browser only (no backend is wired up for this content yet) — this is a
        working mock of the editing flow, not a shared, cross-device CMS.
      </div>

      {!rows && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <div className="mt-6 space-y-6">
        {grouped.map((group) => (
          <div key={group.productLabel} className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border px-5 py-3">
              <h2 className="text-sm font-bold text-dash-ink">{group.productLabel}</h2>
            </div>
            <div className="divide-y divide-border">
              {group.items.map((row) => (
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
        ))}
      </div>
    </AppShell>
  );
}
