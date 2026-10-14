"use client";

import { useState } from "react";
import { TrashIcon, UserPlusIcon } from "@/components/layout/icons";
import { addMember, removeMember, type AxRenewalMember } from "@/lib/ax-renewal/api";
import { Button } from "@/components/ui/button";
import { inputBaseClass } from "@/components/ui/input";

/**
 * Who is on this project (ADR-069, ADR-070). Only members and super admins
 * can open a project at all, so everyone who sees this panel is one of them;
 * only a caller who can manage the team (Admin on this project, or Super
 * Admin) gets the add/remove controls. The backend refuses both from anyone
 * else regardless; this only avoids offering what could only be refused.
 *
 * Display names only, never emails (NFR-SEC-PII) — the same as a comment's
 * author. Adding is by email because nobody below Super Admin can list
 * accounts to pick from.
 */
export function MembersPanel({
  projectId,
  members,
  currentUserId,
  canManage,
  onChanged,
}: {
  projectId: string;
  members: AxRenewalMember[];
  currentUserId: string | null;
  canManage: boolean;
  onChanged: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  /** The member whose Remove has been pressed once and is awaiting a second — same two-press pattern as removing a comment. */
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLastMember = members.length <= 1;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setAdding(true);
    setError(null);
    try {
      await addMember(projectId, trimmed);
      setEmail("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that member.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(accountId: string) {
    if (confirming !== accountId) {
      setConfirming(accountId);
      return;
    }
    setRemoving(accountId);
    setError(null);
    try {
      await removeMember(projectId, accountId);
      setConfirming(null);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that member.");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border bg-card">
      <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Members</h3>
        <span className="text-xs text-muted-foreground">{members.length === 1 ? "1 member" : `${members.length} members`}</span>
      </div>
      <div className="p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Only this project&rsquo;s members can see it, and each can do what their role allows. Anyone not listed
          here can&rsquo;t open it at all.
        </p>

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nobody is on this project yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-surface-border rounded-lg border border-surface-border" aria-label="Project members">
            {members.map((m) => {
              const isYou = currentUserId != null && m.accountId === currentUserId;
              return (
                <li key={m.accountId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {m.displayName}
                      {isYou && <span className="ml-2 text-xs font-semibold text-foreground">you</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">Added {new Date(m.addedAt).toLocaleDateString()}</p>
                  </div>
                  {canManage && !isLastMember && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleRemove(m.accountId)}
                      disabled={removing != null}
                      aria-label={confirming === m.accountId ? `Confirm removing ${m.displayName}` : `Remove ${m.displayName}`}
                      className="shrink-0 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      {removing === m.accountId ? "Removing…" : confirming === m.accountId ? "Press again to remove" : "Remove"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {canManage && members.length === 1 && (
          <p className="mt-2 text-xs text-muted-foreground">A project needs at least one member — add someone before removing the last one.</p>
        )}

        {canManage && (
          <form onSubmit={(e) => void handleAdd(e)} className="mt-4 flex flex-wrap items-center gap-2">
            <label htmlFor="ax-member-email" className="sr-only">
              Email address of the person to add
            </label>
            <input
              id="ax-member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
              className={`${inputBaseClass} min-w-[220px] flex-1`}
            />
            <Button type="submit" disabled={adding}>
              <UserPlusIcon className="h-3.5 w-3.5" />
              {adding ? "Adding…" : "Add member"}
            </Button>
          </form>
        )}

        {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}
