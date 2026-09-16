"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, XIcon } from "@/components/layout/icons";
import { useSession } from "@/lib/auth/SessionProvider";
import { contentId } from "@/lib/docs/content-store";
import { fetchDocContent } from "@/lib/docs/docs-content-api";
import { createItem, deleteItem, fetchNavStructure } from "@/lib/docs/nav-api";
import { hrefFor } from "@/lib/docs/nav-routing";

type Row = { id: string; slug: string; label: string; hasContent: boolean };

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A product's own content-management table — filtered to just its sub-items,
 *  reused across every product's admin landing page instead of duplicating
 *  this listing once per product. Extracted from the old standalone
 *  /content page, which showed every product's rows on one page.
 *
 *  Owns its own nav-structure fetch (rather than the shared useNavStructure
 *  hook) so it can reload the row list right after "+ Add item" creates a
 *  new sub-item, without adding a refetch capability every other consumer
 *  of that hook would have to carry too. */
export function ProductContentTable({ productKey }: { productKey: string }) {
  // Same role floor the backend enforces on /api/v1/admin/nav/** and
  // /api/v1/admin/docs-content/**: hiding Add/Delete/Edit here is
  // presentation, not the actual control — a "user" caller who reached
  // either endpoint directly still gets refused server-side.
  const { user: session } = useSession();
  const canManage = session?.role === "admin" || session?.role === "super_admin";

  const [rows, setRows] = useState<Row[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function loadRows(): Promise<Row[]> {
    const products = await fetchNavStructure();
    const items = products.find((p) => p.key === productKey)?.items ?? [];
    return Promise.all(
      items.map(async (item) => {
        const id = contentId(productKey, item.slug);
        const content = await fetchDocContent(id).catch(() => undefined);
        return { id, slug: item.slug, label: item.label, hasContent: content !== undefined };
      }),
    );
  }

  async function reload() {
    setRows(await loadRows());
  }

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    loadRows().then((result) => {
      if (!cancelled) setRows(result);
    });
    return () => {
      cancelled = true;
    };
  }, [productKey]);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    const slug = slugify(newLabel);
    if (!slug) return;
    setError(null);
    setBusy(true);
    try {
      await createItem(productKey, slug, newLabel.trim());
      setNewLabel("");
      setAdding(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(row: Row) {
    if (!window.confirm(`Remove "${row.label}"? This only works while it has no saved content.`)) return;
    setError(null);
    try {
      await deleteItem(productKey, row.slug);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that item.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        {error && <p className="text-xs font-semibold text-[#c94040]">{error}</p>}
        <div className="flex-1" />
        {canManage && !adding && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add item
          </button>
        )}
      </div>

      {canManage && adding && (
        <form onSubmit={handleAddItem} className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3 shadow-sm">
          <input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Item label (e.g. Prerequisites)"
            required
            className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm"
          />
          {newLabel.trim() && <span className="shrink-0 text-xs text-muted">/{slugify(newLabel)}</span>}
          <button
            type="submit"
            disabled={busy}
            className="shrink-0 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Adding…" : "Add"}
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewLabel("");
              setError(null);
            }}
            className="shrink-0 rounded-full border border-border px-4 py-2 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            Cancel
          </button>
        </form>
      )}

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

                  {canManage ? (
                    <>
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
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(row)}
                        aria-label={`Remove ${row.label}`}
                        className="inline-flex items-center rounded-full border border-border p-1.5 text-muted transition-colors hover:border-[#c94040] hover:text-[#c94040]"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    row.hasContent && (
                      <Link
                        href={hrefFor(productKey, row.slug)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
                      >
                        View
                      </Link>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
