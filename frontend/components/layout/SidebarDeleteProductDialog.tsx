"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * The typed-confirmation delete dialog for a product (task spec §E) —
 * Delete only enables once the admin types the product's exact name. An
 * alert dialog (ADR-104 r2.16): no outside-click dismissal, focus starts on
 * Cancel, held open while the delete runs.
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
    <ConfirmDialog
      icon={<Trash2 />}
      title={`Delete ${productLabel}?`}
      description="All docs for this product will be removed from the site. This can't be undone."
      confirmLabel={busy ? "Deleting…" : "Delete"}
      destructive
      busy={busy}
      confirmDisabled={!matches}
      error={error}
      onConfirm={onConfirm}
      onCancel={onCancel}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (matches && !busy) onConfirm();
        }}
      >
        <Label htmlFor="delete-product-confirm" className="block text-xs text-muted-foreground">
          Type <span className="font-mono text-foreground">{productLabel}</span> to confirm
        </Label>
        <Input
          id="delete-product-confirm"
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-1.5"
        />
      </form>
    </ConfirmDialog>
  );
}

/** Deleting an empty custom group. */
export function SidebarDeleteGroupDialog({
  groupName,
  onConfirm,
  onCancel,
}: {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <ConfirmDialog
      icon={<Trash2 />}
      title={`Delete "${groupName}"?`}
      description="The group is removed from the sidebar. It has no items, so no page moves or disappears."
      confirmLabel="Delete group"
      destructive
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
