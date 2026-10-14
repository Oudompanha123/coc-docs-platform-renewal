"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/users-roles/Modal";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Radio } from "@/components/ui/radio";
import { approveAccount, type AccountRole, type PendingAccount } from "@/lib/admin/accounts";
import { ApplicantAvatar } from "./ApplicantAvatar";

/**
 * Approving somebody straight from the notification that told you about them.
 *
 * <p>The bell's job is to say "this needs you". Making the reader navigate to
 * another page to act on a one-line decision is what turns a notification into
 * something people dismiss rather than answer.
 *
 * <p><b>A role is chosen here, not defaulted silently.</b> Approval and role
 * are one decision (ADR-017): there is no "approve, then set the role later"
 * state, because that state would be somebody admitted at whatever the system
 * guessed. The dialog defaults to User — the least it can be — and says what
 * each choice grants, so picking is a decision rather than a shrug.
 *
 * <p>Refusals arrive with the backend's own wording and are shown as they are.
 * "This is the only active super admin…" tells the reader what to do next;
 * "something went wrong" does not.
 */

const ROLE_CHOICES: { value: AccountRole; label: string; hint: string }[] = [
  { value: "user", label: "User", hint: "Reads published content." },
  { value: "admin", label: "Admin", hint: "Authors, validates and publishes." },
  { value: "super_admin", label: "Super Admin", hint: "Also decides who gets in." },
];

export function ApproveRegistrationModal({
  account,
  onClose,
  onApproved,
}: {
  account: PendingAccount;
  onClose: () => void;
  /** Called after the server has accepted, so the caller can re-read the queue. */
  onApproved: () => void;
}) {
  const [role, setRole] = useState<AccountRole>("user");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve() {
    setBusy(true);
    setError(null);
    try {
      await approveAccount(account.id, role);
      onApproved();
      onClose();
    } catch (err) {
      // The row stays in the queue, because the server kept it there.
      setError(err instanceof Error ? err.message : "Couldn't approve that registration.");
      setBusy(false);
    }
  }

  return (
    <Modal title="New registration" onClose={onClose}>
      <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-muted-surface px-3 py-2">
        <ApplicantAvatar
          name={account.displayName}
          avatarUrl={account.avatarUrl}
          className="size-8 text-xs"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{account.displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        They have verified their email address and are waiting to be let in. Until you approve them they
        cannot sign in and hold no permissions.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-foreground">Approve as</legend>
        <div className="mt-2 space-y-2">
          {ROLE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className={`flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors ${
                role === choice.value ? "border-primary bg-secondary" : "border-surface-border hover:bg-accent"
              }`}
            >
              <Radio
                name="approve-role"
                value={choice.value}
                checked={role === choice.value}
                onChange={() => setRole(choice.value)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{choice.label}</span>
                <span className="block text-xs text-muted-foreground">{choice.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <Alert variant="destructive" className="mt-4">
          {error}
        </Alert>
      )}

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" onClick={() => void approve()} disabled={busy} aria-busy={busy}>
          {busy ? "Approving…" : "Approve"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
