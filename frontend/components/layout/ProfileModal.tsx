"use client";

import { useState, type ChangeEvent } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { updateProfile, uploadAvatar, removeAvatar } from "@/lib/auth/api";
import { UserAvatar } from "./UserAvatar";
import { CameraIcon } from "./icons";
import { LockIcon } from "@/components/auth/icons";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
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

// Advisory only, matching every other client-side check in this codebase
// (CONST-TECH-07): the backend's own S3AvatarStorage re-decodes the bytes and
// is what actually decides. This just avoids a round trip for the common
// mistakes.
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, refresh } = useSession();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset now, not after the upload settles, so choosing the same file
    // again later still fires this handler.
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError("Photos must be PNG, JPEG, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("That photo is too large — please choose one under 2 MB.");
      return;
    }

    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await uploadAvatar(file);
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await removeAvatar();
      await refresh();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't remove that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  const initials = user?.displayName ? initialsOf(user.displayName) : "?";

  return (
    <Modal onClose={onClose}>
      {/* Avatar centered at top. Uploading here stores the photo ourselves
          (S3-compatible object storage, ADR-026) and, from that point on,
          takes precedence over the identity provider's picture — signing in
          with Google no longer overwrites it. Remove it to go back to that
          provider picture (or initials, absent one). */}
      <div className="sticky top-0 z-10 -mx-5 -mt-5 flex flex-col items-center border-b border-border bg-white px-5 pb-4 pt-5">
        <label
          className={`group flex flex-col items-center ${avatarBusy ? "cursor-wait" : "cursor-pointer"}`}
        >
          <div className="relative">
            <UserAvatar
              avatarUrl={user?.avatarUrl ?? null}
              initials={initials}
              name={user?.displayName ?? ""}
              className={`h-16 w-16 text-lg ${AVATAR_GRADIENTS.purple} ${avatarBusy ? "opacity-60" : ""}`}
            />
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${
                avatarBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <CameraIcon className="h-6 w-6 text-white" />
            </span>
          </div>
          <span className="mt-1.5 text-xs font-medium text-brand-purple underline-offset-2 group-hover:underline">
            {avatarBusy ? "Uploading…" : "Change photo"}
          </span>
          <input
            type="file"
            aria-label="Upload profile photo"
            accept={Array.from(ALLOWED_AVATAR_TYPES).join(",")}
            className="sr-only"
            disabled={avatarBusy}
            onChange={(e) => void handleAvatarChange(e)}
          />
        </label>
        {user?.avatarUrl && (
          <button
            type="button"
            onClick={() => void handleRemoveAvatar()}
            disabled={avatarBusy}
            className="mt-0.5 text-xs text-muted underline-offset-2 hover:text-danger hover:underline disabled:cursor-not-allowed"
          >
            Remove photo
          </button>
        )}
        {avatarError && <p className="mt-1 text-xs text-danger">{avatarError}</p>}
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

        {/* Change password (ADR-022) */}
        <div className="rounded-xl border border-border px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <LockIcon className="h-4 w-4 shrink-0 text-muted" />
              <div>
                <p className="text-sm font-semibold text-dash-ink">Password</p>
                <p className="text-xs text-muted">
                  {passwordNotice ?? "Keep your account secure with a strong password."}
                </p>
              </div>
            </div>
            {!changingPassword && (
              <button
                type="button"
                onClick={() => {
                  setChangingPassword(true);
                  setPasswordNotice(null);
                }}
                className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
              >
                Change password
              </button>
            )}
          </div>
          {changingPassword && (
            <div className="mt-3 border-t border-border pt-3">
              <ChangePasswordForm
                onSuccess={(message) => {
                  setChangingPassword(false);
                  setPasswordNotice(message);
                }}
                onCancel={() => setChangingPassword(false)}
              />
            </div>
          )}
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
