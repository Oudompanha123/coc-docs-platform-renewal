"use client";

import { useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { updateProfile } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * The signed-in person's own profile.
 *
 * <p>Reads the session the shell already resolved rather than fetching again,
 * and writes through `PATCH /api/v1/auth/me`, which only accepts a display
 * name. Email, role and status are shown but not editable here, and that is
 * the design rather than an omission: email identifies the account and comes
 * from the identity provider, and role is what a super admin grants. A profile
 * screen that could change either would be a privilege path.
 *
 * <p>On save it refreshes the session, so the sidebar and topbar show the new
 * name immediately instead of until the next reload.
 */

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
  return ((words[0]?.charAt(0) ?? "") + (words.length > 1 ? words[1]!.charAt(0) : "")).toUpperCase();
}

function formatJoined(iso: string | null): string {
  if (!iso) return "—";
  const when = new Date(iso);
  return Number.isNaN(when.getTime())
    ? "—"
    : when.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export function ProfileCard() {
  const { status, user, refresh } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status !== "authenticated" || !user) {
    return <p className="text-sm text-muted">Loading your profile…</p>;
  }

  const name = user.displayName ?? user.email ?? "";
  const changed = draft.trim().length > 0 && draft.trim() !== name;

  async function handleSave() {
    if (!changed) return;
    setSaving(true);
    setError(null);
    try {
      await updateProfile(draft.trim());
      // The shell's sidebar and topbar read the same session, so refreshing
      // here updates them too — otherwise the name would change in one place
      // and not the other two.
      await refresh();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-3">
        <UserAvatar
          avatarUrl={user.avatarUrl ?? null}
          initials={initialsOf(name)}
          name={name}
          className={`h-14 w-14 text-lg shadow-sm ${AVATAR_GRADIENTS.purple}`}
        />
        <div className="min-w-0">
          {editing ? (
            <input
              type="text"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label="Display name"
              className="w-56 rounded-lg border border-border px-2.5 py-1.5 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
            />
          ) : (
            <p className="truncate text-sm font-semibold text-dash-ink">{name}</p>
          )}
          <p className="text-sm text-muted">
            {user.role ? (ROLE_LABELS[user.role] ?? user.role) : ""}
          </p>
        </div>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 border-l border-border pl-6 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
          <dd className="mt-0.5 truncate text-sm text-dash-ink">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Account status</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-dash-ink">
            {/* Active by construction: a deactivated account cannot hold a
                session, so a caller reading this page is active. */}
            <span className="h-2 w-2 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
            Active
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Joined</dt>
          <dd className="mt-0.5 text-sm text-dash-ink">{formatJoined(user.createdAt)}</dd>
        </div>
      </dl>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {editing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!changed || saving}
              className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraft(name);
              setError(null);
              setEditing(true);
            }}
            className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
          >
            Edit profile
          </button>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        {editing && (
          <p className="max-w-56 text-right text-xs text-muted">
            Signing in with Google replaces this with the name on your Google account.
          </p>
        )}
      </div>
    </div>
  );
}
