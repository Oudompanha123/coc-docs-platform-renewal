"use client";

import { WarningIcon } from "@/components/layout/icons";
import { Modal } from "./Modal";
import { Button } from "@/components/ui/button";
import type { ManagedAccount } from "@/lib/mock/users-roles";

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
        <p className="text-sm text-foreground">
          This account cannot be deactivated because it&apos;s the last remaining Super Admin. Promote another account
          to Super Admin first.
        </p>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={onClose}
          >
            OK
          </Button>
        </div>
      </Modal>
    );
  }

  if (isSelf) {
    return (
      <Modal title="Can't deactivate this account" onClose={onClose}>
        <p className="text-sm text-foreground">You cannot deactivate your own account.</p>
        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={onClose}
          >
            OK
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 text-danger">
        <WarningIcon className="size-5" />
      </div>
      <h2 className="mt-3 text-base font-semibold text-foreground">Deactivate Account?</h2>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-surface-border bg-muted-surface px-3 py-2">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initialsFor(account.name)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">This account will no longer be able to access Coc Docs Platform.</p>
      <p className="mt-2 text-sm font-semibold text-[#1f9d6b]">Existing content and audit history will be preserved.</p>

      <div className="mt-5 flex justify-end gap-2">
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
        >
          Deactivate
        </Button>
      </div>
    </Modal>
  );
}
