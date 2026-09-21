"use client";

import { Modal } from "./Modal";
import type { ManagedAccount } from "@/lib/mock/users-roles";

function WarningTriangleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3.8 2.5 20h19L12 3.8Z" strokeLinejoin="round" />
      <path d="M12 10v4.5" strokeLinecap="round" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
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

type DeactivateModalProps = {
  account: ManagedAccount;
  /** True when this is the only active Super Admin — mirrors the real
   *  backend's AccountService.setActive() guard (409 "this is the only
   *  active super admin..."), reproduced here since this page is mock-only. */
  isLastActiveSuperAdmin: boolean;
  /** True when the target is the signed-in actor — mirrors the real
   *  backend's "you cannot deactivate your own account" rule. */
  isSelf: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeactivateModal({ account, isLastActiveSuperAdmin, isSelf, onClose, onConfirm }: DeactivateModalProps) {
  if (isLastActiveSuperAdmin) {
    return (
      <Modal title="Can't deactivate this account" onClose={onClose}>
        <p className="text-sm text-ink">
          This account cannot be deactivated because it&apos;s the last remaining Super Admin. Promote another account
          to Super Admin first.
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

  if (isSelf) {
    return (
      <Modal title="Can't deactivate this account" onClose={onClose}>
        <p className="text-sm text-ink">You cannot deactivate your own account.</p>
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

  return (
    <Modal onClose={onClose}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <WarningTriangleIcon className="h-6 w-6" />
      </div>
      <h2 className="mt-3 text-lg font-bold text-dash-ink">Deactivate Account?</h2>

      <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-border bg-page px-3 py-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-xs font-semibold text-white">
          {initialsFor(account.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-dash-ink">{account.name}</p>
          <p className="truncate text-xs text-muted">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">This account will no longer be able to access Coc Docs Platform.</p>
      <p className="mt-2 text-sm font-semibold text-[#1f9d6b]">Existing content and audit history will be preserved.</p>

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
          className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Deactivate
        </button>
      </div>
    </Modal>
  );
}
