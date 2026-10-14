"use client";

import { useConfirm } from "@/components/ui/confirm";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { DocumentIcon, PlugIcon, PlusIcon, UploadIcon, XIcon } from "@/components/layout/icons";
import { useSession } from "@/lib/auth/SessionProvider";
import { contentId } from "@/lib/docs/content-store";
import { fetchSavedSlugs } from "@/lib/docs/docs-content-api";
import { createItem, deleteItem, fetchNavStructure } from "@/lib/docs/nav-api";
import { hrefFor } from "@/lib/docs/nav-routing";
import { EmptyContentIllustration } from "./EmptyContentIllustration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
export function ProductContentTable({ productKey, productLabel }: { productKey: string; productLabel: string }) {
  const confirm = useConfirm();
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
  const uploadInputRef = useRef<HTMLInputElement>(null);

  async function loadRows(): Promise<Row[]> {
    const products = await fetchNavStructure();
    const items = products.find((p) => p.key === productKey)?.items ?? [];
    const saved = await fetchSavedSlugs(
      productKey,
      items.map((item) => item.slug),
    );
    return items.map((item) => ({
      id: contentId(productKey, item.slug),
      slug: item.slug,
      label: item.label,
      hasContent: saved.has(item.slug),
    }));
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

  /** "Upload Document" — registers a new item from the chosen file's name,
   *  the same way the inline "Add item" form registers one from typed text.
   *  The file itself isn't parsed into content; it just gets the item onto
   *  the list so an editor can write it up (or, later, a real import). */
  async function handleDocumentSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const label = file.name.replace(/\.[^./]+$/, "");
    const slug = slugify(label);
    if (!slug) return;
    setError(null);
    setBusy(true);
    try {
      await createItem(productKey, slug, label);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that item.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem(row: Row) {
    const ok = await confirm({
      title: `Remove "${row.label}"?`,
      description: row.hasContent ? "Its saved content will be permanently deleted too." : undefined,
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
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
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
        <div className="flex-1" />
        {canManage && !adding && (
          <Button type="button" size="sm" className="shrink-0" onClick={() => setAdding(true)}>
            <PlusIcon className="size-3.5" />
            Add item
          </Button>
        )}
      </div>

      {canManage && adding && (
        <form onSubmit={handleAddItem} className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-surface-border bg-card p-3">
          <Input
            autoFocus
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Item label (e.g. Prerequisites)"
            required
            className="min-w-0 flex-1"
          />
          {newLabel.trim() && <span className="shrink-0 text-xs text-muted-foreground">/{slugify(newLabel)}</span>}
          <Button type="submit" size="sm" disabled={busy} className="shrink-0">
            {busy ? "Adding…" : "Add"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setAdding(false);
              setNewLabel("");
              setError(null);
            }}
            className="shrink-0"
          >
            Cancel
          </Button>
        </form>
      )}

      {rows && rows.length === 0 && (
        <div className="animate-entrance mx-auto mt-8 max-w-md text-center">
          <EmptyContentIllustration />
          <h2 className="mt-5 text-base font-semibold text-foreground">Knowledge base is ready.</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            To begin creating &quot;{productLabel}&quot;&apos;s knowledge base, select a method from the list below.
            You can create a new page, upload a document, or embed a resource.
          </p>

          {canManage && (
            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAdding(true)}
                className="flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-card px-3 py-5 text-center transition-all duration-150 hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <DocumentIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">Create Page</span>
              </button>

              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-card px-3 py-5 text-center transition-all duration-150 hover:-translate-y-0.5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <UploadIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-foreground">Upload Document</span>
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                aria-label="Upload document"
                className="sr-only"
                disabled={busy}
                onChange={(e) => void handleDocumentSelected(e)}
              />

              <button
                type="button"
                disabled
                title="Coming soon"
                className="relative flex flex-col items-center gap-2 rounded-xl border border-surface-border bg-[color-mix(in_oklab,var(--color-white)_0.5%,#00000017)] px-3 py-5 text-center text-muted-foreground cursor-not-allowed"
              >
                <span className="absolute right-2 top-2 rounded-full bg-surface-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  Soon
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-border text-muted-foreground">
                  <PlugIcon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-muted-foreground">Embed Resource</span>
              </button>
            </div>
          )}
        </div>
      )}

      {rows && rows.length > 0 && (
        <div className="animate-entrance mt-6 rounded-xl border border-surface-border bg-card">
          <div className="divide-y divide-surface-border">
            {rows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{row.label}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.hasContent ? "bg-[#e1f5ec] text-[#1f9d6b]" : "bg-muted-surface text-muted-foreground"
                    }`}
                  >
                    {row.hasContent ? "Has content" : "Not written"}
                  </span>

                  {canManage ? (
                    <>
                      <Link
                        href={`/content/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-control border border-surface-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
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
                        className="inline-flex items-center rounded-full border border-surface-border p-1.5 text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                      >
                        <XIcon className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    row.hasContent && (
                      <Link
                        href={hrefFor(productKey, row.slug)}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-control border border-surface-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
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
