"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { ROLE_LABELS, ROLE_ORDER, type AccountRole } from "@/lib/mock/users-roles";

/**
 * Mock-only: the real backend has no endpoint to pre-provision an account —
 * every Google sign-in auto-creates its own account row at role `user`
 * (SessionService.createAccount). This modal's "add" is local mock state
 * only, not a stand-in for a real API call that exists today. See the
 * report for this task for the full finding.
 */
export function AddAccountModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (email: string, role: AccountRole) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AccountRole>("user");
  const [error, setError] = useState<string | undefined>();

  function submit() {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Enter a valid Google email address.");
      return;
    }
    onAdd(trimmed, role);
  }

  return (
    <Modal title="Add account" onClose={onClose}>
      <label className="mb-1.5 block text-sm font-semibold text-ink">Google email</label>
      <input
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(undefined);
        }}
        placeholder="name@company.com"
        className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}

      <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Role</label>
      <div className="relative">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AccountRole)}
          className="w-full appearance-none rounded-xl border border-border bg-white px-3 py-2.5 pr-9 text-sm text-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        >
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

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
          onClick={submit}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Add account
        </button>
      </div>
    </Modal>
  );
}
