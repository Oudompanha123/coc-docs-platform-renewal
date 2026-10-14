"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal, ModalFooter } from "@/components/users-roles/Modal";

/**
 * The typed-confirmation delete dialog for a product (task spec §E) —
 * Delete only enables once the admin types the product's exact name. On the
 * shared `Modal`, `Input` and `Button` (ADR-104 r2.15); it was a hand-drawn
 * panel with raw buttons and a shadowed red pill.
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
    <Modal title={`Delete ${productLabel}?`} ariaLabel={`Delete ${productLabel}?`} onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (matches && !busy) onConfirm();
        }}
      >
        <p className="text-sm text-muted-foreground">All docs for this product will be removed from the site. This can&rsquo;t be undone.</p>
        <Label htmlFor="delete-product-confirm" className="mt-4 block text-xs text-muted-foreground">
          Type <span className="font-mono text-foreground">{productLabel}</span> to confirm
        </Label>
        <Input
          id="delete-product-confirm"
          autoFocus
          autoComplete="off"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className="mt-1.5"
        />
        {error && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error}
          </p>
        )}
        <ModalFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" disabled={!matches || busy}>
            {busy ? "Deleting…" : "Delete"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

/** Deleting an empty custom group — the app's dialog instead of the browser's `confirm()`. */
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
    <Modal title={`Delete "${groupName}"?`} ariaLabel={`Delete group ${groupName}`} onClose={onCancel}>
      <p className="text-sm text-muted-foreground">The group is removed from the sidebar. It has no items, so no page moves or disappears.</p>
      <ModalFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" variant="destructive" onClick={onConfirm} autoFocus>
          Delete group
        </Button>
      </ModalFooter>
    </Modal>
  );
}
