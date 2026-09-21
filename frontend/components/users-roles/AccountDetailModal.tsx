"use client";

import { useState } from "react";
import type { AccountRole, AdminAccount } from "@/lib/admin/accounts";
import { highestEnforcedRole, type DisplayRole } from "@/lib/mock/users-roles";
import { Modal } from "./Modal";
import { RoleBadge } from "./RoleBadge";
import { RoleMultiSelect } from "./RoleMultiSelect";
import { StatusBadge } from "./StatusBadge";

/**
 * One account, in full, with the fields an administrator may change.
 *
 * <p>Detail and edit in one place rather than two. The reason to open this is
 * almost always to check something and then change it, and a read-only panel
 * with an "edit" button that reopens the same fields is a step that exists
 * only because the code was easier to write that way.
 *
 * <p>Saves the difference, not the form. An unchanged field is left out of the
 * request entirely, because the backend treats an absent field as "leave
 * alone" — so opening this and pressing Save writes nothing and produces no
 * audit entry.
 */

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "Never" : when.toLocaleString();
}

export function AccountDetailModal({
  account,
  isSelf,
  isLastActiveSuperAdmin,
  onClose,
  onSave,
}: {
  account: AdminAccount;
  /** The signed-in administrator's own row. */
  isSelf: boolean;
  isLastActiveSuperAdmin: boolean;
  onClose: () => void;
  onSave: (changes: { role?: AccountRole; active?: boolean; displayName?: string }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(account.displayName);
  // Seeded from every role this account already holds (guest folds into
  // user, same as the badge above), not just the highest one, so reopening
  // this modal doesn't silently drop a role nobody meant to remove.
  const [roles, setRoles] = useState<DisplayRole[]>(() => {
    const seeded: DisplayRole[] = account.roles.map((r) => (r === "guest" ? "user" : r));
    return Array.from(new Set(seeded.length > 0 ? seeded : [account.role as DisplayRole]));
  });
  const [active, setActive] = useState(account.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = highestEnforcedRole(roles);
  const nameChanged = displayName.trim() !== account.displayName && displayName.trim().length > 0;
  const roleChanged = role !== account.role;
  const activeChanged = active !== account.active;
  const dirty = nameChanged || roleChanged || activeChanged;

  // The backend refuses this too — it is the control; this is the explanation,
  // given before the person presses a button rather than after.
  const losingLastSuperAdmin =
    isLastActiveSuperAdmin && ((roleChanged && role !== "super_admin") || (activeChanged && !active));

  async function handleSave() {
    if (!dirty || losingLastSuperAdmin) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(nameChanged ? { displayName: displayName.trim() } : {}),
        ...(roleChanged ? { role } : {}),
        ...(activeChanged ? { active } : {}),
      });
      onClose();
    } catch (err) {
      // Stays open, showing the backend's wording: the refusal is usually
      // something the person can act on here.
      setError(err instanceof Error ? err.message : "That change could not be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal title="Account details" onClose={onClose}>
      <dl className="space-y-3 border-b border-border pb-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd className="min-w-0 break-all text-right font-medium text-dash-ink">{account.email}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Current role</dt>
          <dd>
            <RoleBadge role={account.role === "guest" ? "user" : account.role} />
          </dd>
        </div>
        {account.roles.length > 1 && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-muted">All roles held</dt>
            <dd className="text-right font-medium text-dash-ink">{account.roles.join(", ")}</dd>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd>
            <StatusBadge
              status={!account.active ? "deactivated" : account.mustChangePassword ? "pending" : "active"}
            />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Last sign-in</dt>
          <dd className="font-medium text-dash-ink">{formatWhen(account.lastSignInAt)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Created</dt>
          <dd className="font-medium text-dash-ink">{formatWhen(account.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="detail-name" className="mb-1.5 block text-sm font-semibold text-ink">
            Display name
          </label>
          <input
            id="detail-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
          />
          <p className="mt-1 text-xs text-muted">
            Google sign-in overwrites this with the provider&apos;s name, so a correction here lasts
            until this person next signs in.
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-semibold text-ink">Roles</span>
          <RoleMultiSelect idPrefix="detail-role" selected={roles} onChange={setRoles} />
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-dash-ink">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="h-4 w-4 rounded border-border text-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple"
          />
          Account is active
        </label>

        {isSelf && (roleChanged || activeChanged) && (
          <p className="rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            This is your own account. Lowering your role or deactivating yourself takes effect on
            your next request, and you may not be able to undo it here.
          </p>
        )}

        {losingLastSuperAdmin && (
          <p className="rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            This is the only active super admin. Promote someone else first, or the system locks
            itself out of account management.
          </p>
        )}

        {error && (
          <p className="rounded-[10px] border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-gray-50"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saving || losingLastSuperAdmin}
          className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
