"use client";

import { useState, type ReactNode } from "react";
import type { AccountRole, AdminAccount } from "@/lib/admin/accounts";
import type { AccountRole as EnforcedRole } from "@/lib/mock/users-roles";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { CalendarCheckIcon, ClockIcon, XIcon } from "@/components/layout/icons";
import { Alert } from "@/components/ui/alert";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Modal } from "./Modal";
import { RoleBadge } from "./RoleBadge";
import { RoleMultiSelect } from "./RoleMultiSelect";
import { StatusBadge } from "./StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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
 *
 * <p>Laid out as a header (who this is, at a glance), a scrolling body (the
 * read-only facts, then what can be edited) and a footer that stays in view,
 * so Save is reachable however long the role list is. Only class names the
 * admin shell's dark theme already restyles are used for surfaces and text.
 */

function formatWhen(iso: string | null): string {
  if (!iso) return "Never";
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "Never" : when.toLocaleString();
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "?";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return (first + last).toUpperCase();
}

/** One read-only fact, as a small tile. */
function FactTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted-surface text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}

/** A notice above the footer: a caution about the caller's own account, or a refusal explained before it happens. */
function Notice({ tone, children }: { tone: "caution" | "danger"; children: ReactNode }) {
  return <Alert variant={tone === "caution" ? "warning" : "destructive"}>{children}</Alert>;
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
  onSave: (changes: { roles?: AccountRole[]; active?: boolean; displayName?: string }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(account.displayName);
  // Seeded from every role this account already holds (guest folds into
  // user, same as the badge below), not just the highest one, so reopening
  // this modal doesn't silently drop a role nobody meant to remove.
  const [roles, setRoles] = useState<EnforcedRole[]>(() => {
    const seeded: EnforcedRole[] = account.roles.map((r) => (r === "guest" ? "user" : r));
    return Array.from(new Set(seeded.length > 0 ? seeded : [account.role as EnforcedRole]));
  });
  const [active, setActive] = useState(account.active);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRoles: EnforcedRole[] = Array.from(
    new Set(account.roles.map((r): EnforcedRole => (r === "guest" ? "user" : r))),
  );
  const rolesChanged =
    roles.length !== currentRoles.length || !roles.every((r) => currentRoles.includes(r));
  const noRoleSelected = roles.length === 0;

  const nameChanged = displayName.trim() !== account.displayName && displayName.trim().length > 0;
  const activeChanged = active !== account.active;
  const dirty = nameChanged || rolesChanged || activeChanged;

  // The backend refuses this too — it is the control; this is the explanation,
  // given before the person presses a button rather than after.
  const losingLastSuperAdmin =
    isLastActiveSuperAdmin &&
    ((rolesChanged && !roles.includes("super_admin")) || (activeChanged && !active));

  async function handleSave() {
    if (!dirty || losingLastSuperAdmin || noRoleSelected) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(nameChanged ? { displayName: displayName.trim() } : {}),
        ...(rolesChanged ? { roles } : {}),
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

  const status = !account.active ? "deactivated" : account.mustChangePassword ? "pending" : "active";
  const saveDisabled = !dirty || saving || losingLastSuperAdmin || noRoleSelected;

  return (
    <Modal
      onClose={onClose}
      className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-surface-border bg-card shadow-xl"
      bodyClassName="flex min-h-0 flex-1 flex-col"
    >
      {/* Header — who this is, at a glance. */}
      <div className="relative shrink-0 border-b border-surface-border">
        <div className="flex items-start gap-4 px-6 pb-5 pt-6">
          <UserAvatar
            avatarUrl={account.avatarUrl}
            initials={initialsOf(account.displayName)}
            name={account.displayName}
            className={`flex size-14 items-center justify-center text-lg font-semibold text-white ${AVATAR_GRADIENTS.purple}`}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">Account details</p>
            <h2 className="mt-0.5 truncate text-lg font-semibold leading-tight text-foreground">{account.displayName}</h2>
            <p className="truncate text-sm text-muted-foreground" title={account.email}>
              {account.email}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <RoleBadge role={account.role === "guest" ? "user" : account.role} />
              <StatusBadge status={status} />
              {isSelf && (
                <span className="inline-flex items-center rounded-full border border-surface-border px-2 py-0.5 text-xs font-medium text-foreground">
                  You
                </span>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close account details"
            className="-mr-2 -mt-2 size-8 rounded-full text-muted-foreground"
          >
            <XIcon className="size-4" />
          </Button>
        </div>
      </div>

      {/* Body — the facts, then what can be changed. Scrolls on its own. */}
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section aria-label="Account overview">
          <dl className="grid grid-cols-1 gap-4 rounded-xl border border-surface-border p-4 sm:grid-cols-2">
            <FactTile icon={<ClockIcon className="size-4" />} label="Last sign-in" value={formatWhen(account.lastSignInAt)} />
            <FactTile icon={<CalendarCheckIcon className="size-4" />} label="Created" value={formatWhen(account.createdAt)} />
          </dl>
          {currentRoles.length > 1 && (
            <dl className="mt-3 flex flex-wrap items-center gap-2">
              <dt className="text-xs font-medium text-muted-foreground">All roles held</dt>
              <dd className="flex flex-wrap gap-1.5">
                {currentRoles.map((role) => (
                  <RoleBadge key={role} role={role} />
                ))}
              </dd>
            </dl>
          )}
        </section>

        <section aria-labelledby="detail-edit-heading" className="space-y-4">
          <h3 id="detail-edit-heading" className="text-sm font-semibold text-foreground">
            Profile
          </h3>

          <div>
            <label htmlFor="detail-name" className="mb-1.5 block text-sm font-medium text-foreground">
              Display name
            </label>
            <Input
              id="detail-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Google sign-in overwrites this with the provider&apos;s name, so a correction here lasts
              until this person next signs in.
            </p>
          </div>

          <div className="border-t border-surface-border pt-5">
            <h3 className="text-sm font-semibold text-foreground">Access</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">What this person can open, and whether they can sign in at all.</p>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-foreground">Roles</span>
            <RoleMultiSelect idPrefix="detail-role" selected={roles} onChange={setRoles} />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-surface-border px-3 py-2.5">
            <div className="min-w-0">
              <span id="detail-active-label" className="block text-sm font-medium text-foreground">
                Account is active
              </span>
              <span className="block text-xs text-muted-foreground">
                {active ? "Can sign in and use the app." : "Signed out everywhere and can't sign in."}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={active}
              aria-labelledby="detail-active-label"
              onClick={() => setActive((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                active ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                aria-hidden="true"
                // #fff, not bg-card: the dark theme repaints .bg-card, and the knob must
                // stay white on either track.
                className={`inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform ${
                  active ? "translate-x-[22px]" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {isSelf && (rolesChanged || activeChanged) && (
            <Notice tone="caution">
              This is your own account. Lowering your role or deactivating yourself takes effect on
              your next request, and you may not be able to undo it here.
            </Notice>
          )}

          {losingLastSuperAdmin && (
            <Notice tone="danger">
              This is the only active super admin. Promote someone else first, or the system locks
              itself out of account management.
            </Notice>
          )}

          {noRoleSelected && (
            <Notice tone="danger">
              Check at least one role — an account needs at least one; deactivate it instead of
              removing them all.
            </Notice>
          )}

          {error && <Notice tone="danger">{error}</Notice>}
        </section>
      </div>

      {/* Footer — always in view. */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-surface-border bg-muted-surface/40 px-6 py-4">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground" aria-live="polite">
          {dirty && <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />}
          {dirty ? "Unsaved changes" : ""}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saveDisabled}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
