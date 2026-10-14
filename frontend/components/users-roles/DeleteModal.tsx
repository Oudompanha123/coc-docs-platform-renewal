"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/layout/icons";
import { ConfirmDialog } from "@/components/ui/confirm";
import type { ManagedAccount } from "@/lib/mock/users-roles";
import { Input } from "@/components/ui/input";

function initialsFor(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

type DeleteModalProps = {
  account: ManagedAccount;
  /** The only active Super Admin — the backend refuses this with a 409. */
  isLastActiveSuperAdmin: boolean;
  /** The signed-in actor — the backend refuses this with a 400. */
  isSelf: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

/**
 * Confirms removing an account for good (ADR-023).
 *
 * <p>Deliberately harder to get through than {@link DeactivateModal}. That one
 * is a single button because it is undoable — the row stays and the person can
 * be let back in. This is not undoable by anyone, at any level, so it asks the
 * address to be typed. The cost is three seconds on a real deletion; the thing
 * it buys is that a misaimed click on the wrong row cannot complete.
 *
 * <p>The two refusals are shown here rather than left to the server, so the
 * button is never offered in a state that cannot succeed. The server checks
 * both again regardless — this is courtesy, not enforcement.
 */
export function DeleteModal({ account, isLastActiveSuperAdmin, isSelf, onClose, onConfirm }: DeleteModalProps) {
  const [typed, setTyped] = useState("");

  if (isLastActiveSuperAdmin || isSelf) {
    return (
      <ConfirmDialog
        notice
        title="Can't delete this account"
        description={
          isSelf
            ? "You cannot delete your own account. Ask another Super Admin to do it."
            : "This is the last remaining Super Admin. Promote another account to Super Admin first."
        }
        onCancel={onClose}
      />
    );
  }

  // Case-insensitive: the address is being copied off the row above, and
  // failing somebody for capitalisation teaches nothing.
  const confirmed = typed.trim().toLowerCase() === account.email.toLowerCase();

  return (
    <ConfirmDialog
      icon={<TrashIcon />}
      title="Delete Account?"
      description={
        <>
          This removes the account permanently. Their sessions end immediately and they cannot sign in again.
          <strong className="font-semibold text-foreground"> This cannot be undone.</strong>
        </>
      }
      confirmLabel="Delete permanently"
      destructive
      confirmDisabled={!confirmed}
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-muted-surface px-3 py-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initialsFor(account.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        Pages they wrote stay published, and the audit trail keeps their email against everything they did.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        To keep the account but block access, use <strong className="font-semibold text-foreground">Deactivate</strong>{" "}
        instead — that one can be reversed.
      </p>
      <label className="mt-4 block">
        <span className="text-sm font-medium text-foreground">
          Type <span className="font-mono text-destructive">{account.email}</span> to confirm
        </span>
        <Input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label={`Type ${account.email} to confirm deletion`}
          className="mt-1.5"
        />
      </label>
    </ConfirmDialog>
  );
}
