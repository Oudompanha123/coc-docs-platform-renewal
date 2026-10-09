"use client";

import { useState } from "react";
import { TrashIcon } from "@/components/layout/icons";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "@/components/ui/button";
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
      <Modal title="Can't delete this account" onClose={onClose}>
        <p className="text-sm text-foreground">
          {isSelf
            ? "You cannot delete your own account. Ask another Super Admin to do it."
            : "This is the last remaining Super Admin. Promote another account to Super Admin first."}
        </p>
        <ModalFooter>
          <Button
            type="button"
            onClick={onClose}
          >
            OK
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  // Case-insensitive: the address is being copied off the row above, and
  // failing somebody for capitalisation teaches nothing.
  const confirmed = typed.trim().toLowerCase() === account.email.toLowerCase();

  return (
    <Modal onClose={onClose}>
      <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TrashIcon className="size-5" />
      </div>
      <h2 className="mt-3 text-base font-semibold text-foreground">Delete Account?</h2>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-surface-border bg-muted-surface px-3 py-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initialsFor(account.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        This removes the account permanently. Their sessions end immediately and they cannot sign in again.
        <strong className="font-semibold text-foreground"> This cannot be undone.</strong>
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Pages they wrote stay published, and the audit trail keeps their email against everything they did.
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        To keep the account but block access, use <strong className="font-semibold text-foreground">Deactivate</strong>{" "}
        instead — that one can be reversed.
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-medium text-foreground">
          Type <span className="font-mono text-danger">{account.email}</span> to confirm
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

      <ModalFooter>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={!confirmed}
        >
          Delete permanently
        </Button>
      </ModalFooter>
    </Modal>
  );
}
