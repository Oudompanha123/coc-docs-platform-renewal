"use client";

import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
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
      <div className="flex items-center gap-3 rounded-xl border border-border bg-page px-3 py-2.5">
        <ApplicantAvatar
          name={account.displayName}
          avatarUrl={account.avatarUrl}
          className="h-10 w-10 text-sm"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-dash-ink">{account.displayName}</p>
          <p className="truncate text-xs text-muted">{account.email}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">
        They have verified their email address and are waiting to be let in. Until you approve them they
        cannot sign in and hold no permissions.
      </p>

      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-dash-ink">Approve as</legend>
        <div className="mt-2 space-y-2">
          {ROLE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                role === choice.value ? "border-brand-purple bg-brand-purple/5" : "border-border hover:bg-page"
              }`}
            >
              <input
                type="radio"
                name="approve-role"
                value={choice.value}
                checked={role === choice.value}
                onChange={() => setRole(choice.value)}
                className="mt-0.5 h-4 w-4 text-brand-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              <span>
                <span className="block text-sm font-semibold text-dash-ink">{choice.label}</span>
                <span className="block text-xs text-muted">{choice.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void approve()}
          disabled={busy}
          aria-busy={busy}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Approving…" : "Approve"}
        </button>
      </div>
    </Modal>
  );
}
