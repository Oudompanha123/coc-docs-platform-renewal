"use client";

import { WarningIcon } from "@/components/layout/icons";
import { ConfirmDialog } from "@/components/ui/confirm";
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

/** Confirms deactivating an account — undoable, so one button (ADR-104 r2.16 alert dialog). */
export function DeactivateModal({ account, isLastActiveSuperAdmin, isSelf, onClose, onConfirm }: DeactivateModalProps) {
  if (isLastActiveSuperAdmin || isSelf) {
    return (
      <ConfirmDialog
        notice
        title="Can't deactivate this account"
        description={
          isSelf
            ? "You cannot deactivate your own account."
            : "This account cannot be deactivated because it's the last remaining Super Admin. Promote another account to Super Admin first."
        }
        onCancel={onClose}
      />
    );
  }

  return (
    <ConfirmDialog
      icon={<WarningIcon />}
      title="Deactivate Account?"
      description="This account will no longer be able to access Coc Docs Platform."
      confirmLabel="Deactivate"
      destructive
      onConfirm={onConfirm}
      onCancel={onClose}
    >
      <AccountChip account={account} />
      <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">Existing content and audit history will be preserved.</p>
    </ConfirmDialog>
  );
}

function AccountChip({ account }: { account: ManagedAccount }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-muted-surface px-3 py-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {initialsFor(account.name)}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{account.name}</p>
        <p className="truncate text-xs text-muted-foreground">{account.email}</p>
      </div>
    </div>
  );
}
