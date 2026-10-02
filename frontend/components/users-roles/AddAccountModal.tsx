"use client";

import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";
import { useState } from "react";
import { Modal } from "./Modal";
import { RoleMultiSelect } from "./RoleMultiSelect";
import { highestEnforcedRole, type AccountRole } from "@/lib/mock/users-roles";

/**
 * Backed by the real `POST /api/v1/admin/accounts` (super_admin only). The
 * account is created immediately, active, at the chosen role — the backend
 * generates a temporary password and emails it, and the new owner is
 * required to replace it on first login (revision of ADR-017). Nothing
 * about that password ever reaches this component or its response.
 */
export function AddAccountModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  /**
   * Rejects on failure — a duplicate email, an insufficient role, a network
   * error — so this modal can show the reason itself. It used to be
   * fire-and-forget: a rejection was reported on the page *behind* this
   * modal's full-screen overlay, which nobody could see, so a failed create
   * looked identical to the button doing nothing at all.
   */
  onAdd: (email: string, role: AccountRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<AccountRole[]>(["user"]);
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const trimmed = email.trim();
    // Advisory only, matching every other client-side check in this codebase
    // (CONST-TECH-07): the backend's @ValidEmail on CreateAccountRequest is
    // what actually decides. The local pattern this replaces was one of three
    // different shapes across the forms (ADR-088).
    if (!isEmailAcceptable(trimmed)) {
      setError(emailViolations(trimmed).join(" "));
      return;
    }
    setError(undefined);
    setIsSubmitting(true);
    try {
      await onAdd(trimmed, highestEnforcedRole(roles));
      // No further state change here on success: the parent closes this
      // modal once the account is actually in its list, which is also what
      // unmounts this component.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal title="Add User" onClose={onClose}>
      <label htmlFor="add-account-email" className="mb-1.5 block text-sm font-semibold text-ink">
        Email
      </label>
      <input
        id="add-account-email"
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

      <span className="mb-1.5 mt-4 block text-sm font-semibold text-ink">Roles</span>
      <RoleMultiSelect idPrefix="add-account-role" selected={roles} onChange={setRoles} collapseToHighest />

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Adding…" : "Add Account"}
        </button>
      </div>
    </Modal>
  );
}
