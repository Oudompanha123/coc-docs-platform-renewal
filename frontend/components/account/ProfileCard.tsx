"use client";

import { useState, type ChangeEvent } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { removeAvatar, updateProfile, uploadAvatar } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";

const ROLE_LABELS: Record<string, string> = {
  guest: "Guest",
  user: "User",
  developer: "Developer",
  reviewer: "Reviewer",
  lead: "Lead",
  admin: "Admin",
  super_admin: "Super Admin",
};

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]!.charAt(0);
  const second = words.length > 1 ? words[1]!.charAt(0) : "";
  return (first + second).toUpperCase();
}

// Advisory only, same as ProfileModal's (CONST-TECH-07): the backend's
// S3AvatarStorage re-decodes the bytes and is what actually decides.
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

/**
 * 1–50 chars, trimmed, no markup — advisory only, matching every other
 * client-side check in this codebase (CONST-TECH-07): `PATCH /api/v1/auth/me`
 * is the authority. This just avoids a round trip for the common mistakes.
 */
function validateDisplayName(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return "Display name is required.";
  if (trimmed.length > 50) return "Display name must be 50 characters or fewer.";
  if (/[<>]/.test(trimmed)) return "Display name can't contain HTML.";
  return null;
}

export function ProfileCard({
  department,
  onSaved,
  onError,
}: {
  /** From `GET /api/v1/me/attendance` — null when not linked or still loading. */
  department: string | null;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const { user, refresh } = useSession();
  const savedName = user?.displayName ?? "";
  const [displayName, setDisplayName] = useState(savedName);
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const dirty = displayName.trim() !== savedName && displayName.trim().length > 0;
  const [avatarBusy, setAvatarBusy] = useState(false);

  async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset now so choosing the same file again still fires this handler.
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      onError("Photos must be PNG, JPEG, or WebP.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      onError("That photo is too large — please choose one under 2 MB.");
      return;
    }
    setAvatarBusy(true);
    try {
      await uploadAvatar(file);
      await refresh();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't upload that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleRemoveAvatar() {
    setAvatarBusy(true);
    try {
      await removeAvatar();
      await refresh();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't remove that photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function handleCancel() {
    setDisplayName(savedName);
    setFieldError(null);
  }

  async function handleSave() {
    const error = validateDisplayName(displayName);
    if (error) {
      setFieldError(error);
      return;
    }
    setFieldError(null);
    setSaving(true);
    try {
      await updateProfile(displayName.trim());
      await refresh();
      onSaved();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  const initials = savedName ? initialsOf(savedName) : "?";
  const roleLabel = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : "—";

  return (
    <section id="account" className="scroll-mt-24 rounded-[10px] border border-border bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-dash-ink">Account</h2>
      <p className="mt-0.5 text-sm text-muted">Your account details on Coc Docs Platform.</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-4">
          <UserAvatar
            avatarUrl={user?.avatarUrl ?? null}
            initials={initials}
            name={savedName}
            className={`h-16 w-16 text-lg ${AVATAR_GRADIENTS.purple}`}
          />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-dash-ink">{savedName || "—"}</p>
            <p className="truncate text-sm text-muted">{user?.email ?? "—"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Disabled until object storage is configured on this deployment
              (ADR-026; provider still [DEFERRED], ADR-012 §2) — without it
              every upload is refused server-side anyway. */}
          <label
            aria-disabled="true"
            title="Photo upload is not available yet"
            className="cursor-not-allowed rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-dash-ink opacity-50"
          >
            {avatarBusy ? "Uploading…" : "Change photo"}
            {/* A file picker hidden behind its own label — `sr-only`, so none
                of Input's border, padding or focus styling would ever be seen.
                ADR-104 decision 7's escape hatch. */}
            {/* eslint-disable-next-line react/forbid-elements */}
            <input
              type="file"
              aria-label="Upload profile photo"
              accept={Array.from(ALLOWED_AVATAR_TYPES).join(",")}
              className="sr-only"
              disabled
              onChange={(e) => void handleAvatarChange(e)}
            />
          </label>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => void handleRemoveAvatar()}
            disabled={avatarBusy || !user?.avatarUrl}
            title={user?.avatarUrl ? undefined : "No photo to remove"}
            className="rounded-full px-3.5 py-1.5 text-dash-ink"
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted">Display name</span>
          <Input
            variant="dashboard"
            value={displayName}
            maxLength={50}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setFieldError(null);
            }}
            className="mt-1.5"
          />
          {fieldError && <p className="mt-1 text-xs font-semibold text-danger">{fieldError}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-muted">Email</span>
          <Input
            variant="dashboard"
            value={user?.email ?? ""}
            disabled
            readOnly
            className="mt-1.5 cursor-not-allowed bg-page text-muted"
          />
          <p className="mt-1 text-xs text-muted">Linked to your Google sign-in. Can&apos;t be changed here.</p>
        </label>

        <div>
          <span className="text-xs font-semibold text-muted">Role</span>
          <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-border bg-page px-3 py-2 text-sm font-semibold text-dash-ink">
            {roleLabel}
          </div>
          <p className="mt-1 text-xs text-muted">Only an admin can change your role.</p>
        </div>

        <div>
          <span className="text-xs font-semibold text-muted">Department</span>
          <div className="mt-1.5 rounded-xl border border-border bg-page px-3 py-2 text-sm text-dash-ink">
            {department ?? "—"}
          </div>
          <p className="mt-1 text-xs text-muted">From HRMS KOSIGN.</p>
        </div>
      </div>

      <div className="mt-5 flex justify-end gap-2 border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleCancel}
          disabled={!dirty || saving}
          className="text-dash-ink"
        >
          Cancel
        </Button>
        <Button type="button" size="md" onClick={() => void handleSave()} disabled={!dirty || saving} className="shadow">
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </section>
  );
}
