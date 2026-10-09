"use client";

import { useState } from "react";

/**
 * The typed-confirmation delete dialog for a product (task spec §E) —
 * Delete only enables once the admin types the product's exact name.
 */
export function SidebarDeleteProductDialog({
  productLabel,
  busy,
  error,
  onConfirm,
  onCancel,
}: {
  productLabel: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed === productLabel;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Delete ${productLabel}?`} className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-card p-6 shadow-xl">
        <h2 className="text-base font-bold text-foreground">Delete {productLabel}?</h2>
        <p className="mt-2 text-sm text-muted-foreground">All docs for this product will be removed from the site. This can&rsquo;t be undone.</p>

        <label className="mt-4 block text-xs font-semibold text-muted-foreground">
          Type <span className="font-mono">{productLabel}</span> to confirm
          <input
            autoFocus
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-surface-border px-3 py-2 text-sm text-foreground outline-none focus:border-danger focus:ring-[3px] focus:ring-danger/10"
          />
        </label>

        {error && <p className="mt-2 text-xs text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-surface-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!matches || busy}
            onClick={onConfirm}
            className="rounded-full bg-danger px-5 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
