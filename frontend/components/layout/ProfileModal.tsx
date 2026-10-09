"use client";

import Link from "next/link";
import { useState, type ChangeEvent } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { uploadAvatar, removeAvatar } from "@/lib/auth/api";
import { UserAvatar } from "./UserAvatar";
import { CameraIcon } from "./icons";
import { Modal } from "@/components/users-roles/Modal";
import { Button } from "@/components/ui/button";
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

export function ProfileModal({
  onClose,
  editHref = "/account/settings#account",
}: {
  onClose: () => void;
  /** Where "Edit Profile" goes — the member settings page by default; the
   *  admin shell passes its own `/settings`. */
  editHref?: string;
}) {
  const { user, refresh } = useSession();

  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

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
    <Modal
      onClose={onClose}
      className="relative w-full max-w-md rounded-xl border border-border bg-card pb-5 shadow-xl"
    >
      {/* Avatar straddles the card's top edge (half above, half inside), so
          it reads as a floating profile photo rather than boxed inside the
          header — this needs the card itself to have no overflow-hidden/
          auto, since clipping the card would clip the avatar's overlap too.
          Uploading here stores the photo ourselves (S3-compatible object
          storage, ADR-026) and, from that point on, takes precedence over
          the identity provider's picture — signing in with Google no longer
          overwrites it. Remove it to go back to that provider picture (or
          initials, absent one). */}
      <div className="relative flex flex-col items-center border-b border-border px-5 pb-4 pt-14">
        <label
          className={`group flex flex-col items-center ${avatarBusy ? "cursor-wait" : "cursor-pointer"}`}
        >
          {/* Absolute, not in flow — positioned against the header above,
              straddling its top edge regardless of the label's own layout. */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <UserAvatar
              avatarUrl={user?.avatarUrl ?? null}
              initials={initials}
              name={user?.displayName ?? ""}
              className={`h-24 w-24 text-2xl shadow-lg ring-4 ring-ring/40 ring-offset-2 ${AVATAR_GRADIENTS.purple} ${avatarBusy ? "opacity-60" : ""}`}
            />
            <span
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/40 transition-opacity ${
                avatarBusy ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <CameraIcon className="h-7 w-7 text-white" />
            </span>
          </div>
          <span className="mt-1.5 text-xs font-medium text-foreground underline-offset-2 group-hover:underline">
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

      {/* The avatar header above and the Close row below are both fixed
          parts of the modal — only the details scroll. Display name,
          password and notifications are edited on the Settings pages, not
          here, so this popup is read-only apart from the photo. */}
      <div className="no-scrollbar-arrows max-h-[60vh] overflow-y-auto px-5 pt-5">
        {/* Read-only details */}
        <dl className="space-y-3 text-sm">
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
      </div>

      {/* Outside the scroll region on purpose, so Close stays in view. */}
      <div className="mt-5 flex justify-end gap-2 px-5">
        <Link
          href={editHref}
          onClick={onClose}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          Edit Profile
        </Link>
        <Button type="button" variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
