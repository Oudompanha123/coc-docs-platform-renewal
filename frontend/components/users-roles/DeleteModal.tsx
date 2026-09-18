"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import type { ManagedAccount } from "@/lib/mock/users-roles";

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9.5 7V5.2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" strokeLinecap="round" />
      <path d="M6.5 7.5 7.3 19a1.6 1.6 0 0 0 1.6 1.5h6.2a1.6 1.6 0 0 0 1.6-1.5l.8-11.5" strokeLinecap="round" />
      <path d="M10.5 11v6M13.5 11v6" strokeLinecap="round" />
    </svg>
  );
}

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
        <p className="text-sm text-ink">
          {isSelf
            ? "You cannot delete your own account. Ask another Super Admin to do it."
            : "This is the last remaining Super Admin. Promote another account to Super Admin first."}
        </p>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            OK
          </button>
        </div>
      </Modal>
    );
  }

  // Case-insensitive: the address is being copied off the row above, and
  // failing somebody for capitalisation teaches nothing.
  const confirmed = typed.trim().toLowerCase() === account.email.toLowerCase();

  return (
    <Modal onClose={onClose}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TrashIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-3 text-lg font-bold text-dash-ink">Delete Account?</h2>

      <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-border bg-page px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-xs font-semibold text-white">
          {initialsFor(account.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-dash-ink">{account.name}</p>
          <p className="truncate text-xs text-muted">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        This removes the account permanently. Their sessions end immediately and they cannot sign in again.
        <strong className="font-semibold text-dash-ink"> This cannot be undone.</strong>
      </p>
      <p className="mt-2 text-sm text-muted">
        Pages they wrote stay published, and the audit trail keeps their email against everything they did.
      </p>
      <p className="mt-2 text-sm text-muted">
        To keep the account but block access, use <strong className="font-semibold text-dash-ink">Deactivate</strong>{" "}
        instead — that one can be reversed.
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-dash-ink">
          Type <span className="font-mono text-danger">{account.email}</span> to confirm
        </span>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          aria-label={`Type ${account.email} to confirm deletion`}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink outline-none focus:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple"
        />
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!confirmed}
          className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Delete permanently
        </button>
      </div>
    </Modal>
  );
}
