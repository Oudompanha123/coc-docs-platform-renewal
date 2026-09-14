"use client";

import { useState } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { updateProfile } from "@/lib/auth/api";
import { UserAvatar } from "./UserAvatar";
import { CameraIcon } from "./icons";
import { LockIcon } from "@/components/auth/icons";
import { Modal } from "@/components/users-roles/Modal";
import { StatusBadge } from "@/components/users-roles/StatusBadge";
import { RoleBadge } from "@/components/users-roles/RoleBadge";
import type { AccountRole } from "@/lib/mock/users-roles";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!.charAt(0);
  const second = words.length > 1 ? words[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useSession();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty =
    displayName.trim().length > 0 && displayName.trim() !== (user?.displayName ?? "");

  async function handleSave() {
    if (!dirty) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(displayName.trim());
      await refresh();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
      setSaving(false);
    }
  }

  const initials = user?.displayName ? initialsOf(user.displayName) : "?";

  return (
    <Modal onClose={onClose}>
      {/* Avatar centered at top */}
      <div className="flex flex-col items-center pb-4">
        <label className="group flex flex-col items-center cursor-pointer">
          <div className="relative">
            <UserAvatar
              avatarUrl={user?.avatarUrl ?? null}
              initials={initials}
              name={user?.displayName ?? ""}
              className={`h-16 w-16 text-lg ${AVATAR_GRADIENTS.purple}`}
            />
            {/* Camera overlay on hover */}
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <CameraIcon className="h-6 w-6 text-white" />
            </span>
          </div>
          <span className="mt-1.5 text-xs font-medium text-brand-purple underline-offset-2 group-hover:underline">
            Change photo
          </span>
          <input type="file" accept="image/*" className="sr-only" />
        </label>
        <h2 className="mt-2 text-base font-bold text-dash-ink">{user?.displayName ?? "Profile"}</h2>
      </div>

      {/* Read-only details */}
      <dl className="space-y-3 border-b border-border pb-4 text-sm">
        <div className="flex items-start justify-between gap-4">
          <dt className="text-muted">Email</dt>
          <dd className="min-w-0 break-all text-right font-medium text-dash-ink">
            {user?.email ?? "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Current role</dt>
          <dd>{user?.role ? <RoleBadge role={user.role.toLowerCase() as AccountRole} /> : "—"}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Status</dt>
          <dd>
            <StatusBadge status="active" />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Last sign-in</dt>
          <dd className="font-medium text-dash-ink">{formatWhen(user?.lastSignInAt ?? null)}</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted">Created</dt>
          <dd className="font-medium text-dash-ink">{formatWhen(user?.createdAt ?? null)}</dd>
        </div>
      </dl>

      {/* Editable display name */}
      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="profile-display-name"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Display name
          </label>
          <input
            id="profile-display-name"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
          />
          <p className="mt-1 text-xs text-muted">
            Google sign-in overwrites this with the provider&apos;s name, so a correction here
            lasts until your next sign-in.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}

        {/* Change password */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3">
          <div className="flex items-center gap-2.5">
            <LockIcon className="h-4 w-4 shrink-0 text-muted" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Password</p>
              <p className="text-xs text-muted">Sign-in is managed by Google.</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
          >
            Change password
          </button>
        </div>
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
          disabled={!dirty || saving}
          className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
