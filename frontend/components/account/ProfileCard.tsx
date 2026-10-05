"use client";

import { useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { updateProfile } from "@/lib/auth/api";
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
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-dash-ink opacity-50"
          >
            Change photo
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="cursor-not-allowed rounded-full border border-border px-3.5 py-1.5 text-sm font-semibold text-dash-ink opacity-50"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-muted">Display name</span>
          <input
            value={displayName}
            maxLength={50}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setFieldError(null);
            }}
            className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
          />
          {fieldError && <p className="mt-1 text-xs font-semibold text-danger">{fieldError}</p>}
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-muted">Email</span>
          <input
            value={user?.email ?? ""}
            disabled
            readOnly
            className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-border bg-page px-3 py-2 text-sm text-muted"
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
        <button
          type="button"
          onClick={handleCancel}
          disabled={!dirty || saving}
          className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </section>
  );
}
