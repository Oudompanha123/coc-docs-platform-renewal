"use client";

import { useState } from "react";
import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    return <p className="text-sm text-muted-foreground">Loading your profile…</p>;
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
          className={`size-12 text-base ${AVATAR_GRADIENTS.purple}`}
        />
        <div className="min-w-0">
          {editing ? (
            <Input
              type="text"
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
                if (e.key === "Escape") setEditing(false);
              }}
              aria-label="Display name"
              className="w-56"
            />
          ) : (
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {user.role ? (ROLE_LABELS[user.role] ?? user.role) : ""}
          </p>
        </div>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 border-l border-surface-border pl-6 sm:grid-cols-3">
        <div className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">Email</dt>
          <dd className="mt-0.5 truncate text-sm text-foreground">{user.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Account status</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-foreground">
            {/* Active by construction: a deactivated account cannot hold a
                session, so a caller reading this page is active. */}
            <span className="h-2 w-2 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
            Active
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Joined</dt>
          <dd className="mt-0.5 text-sm text-foreground">{formatJoined(user.createdAt)}</dd>
        </div>
      </dl>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {editing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="default"
              onClick={() => setEditing(false)}
              className="text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="default"
              onClick={() => void handleSave()}
              disabled={!changed || saving}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => {
              setDraft(name);
              setError(null);
              setEditing(true);
            }}
            className="text-foreground"
          >
            Edit profile
          </Button>
        )}

        {error && <p className="text-xs text-danger">{error}</p>}

        {editing && (
          <p className="max-w-56 text-right text-xs text-muted-foreground">
            Signing in with Google replaces this with the name on your Google account.
          </p>
        )}
      </div>
    </div>
  );
}
