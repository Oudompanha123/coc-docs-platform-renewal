"use client";

import { useState } from "react";
import { TrashIcon, UserPlusIcon } from "@/components/layout/icons";
import { addMember, removeMember, type AxRenewalMember } from "@/lib/ax-renewal/api";

/**
 * Who is on this project (ADR-063, ADR-064). Only members and super admins
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
    <div className="overflow-hidden rounded-[5px] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
        <h3 className="text-sm font-bold text-dash-ink">Members</h3>
        <span className="text-xs text-muted">{members.length === 1 ? "1 member" : `${members.length} members`}</span>
      </div>
      <div className="p-5">
        <p className="text-xs leading-relaxed text-muted">
          Only this project&rsquo;s members can see it, and each can do what their role allows. Anyone not listed
          here can&rsquo;t open it at all.
        </p>

        {members.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nobody is on this project yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-[5px] border border-border" aria-label="Project members">
            {members.map((m) => {
              const isYou = currentUserId != null && m.accountId === currentUserId;
              return (
                <li key={m.accountId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-dash-ink">
                      {m.displayName}
                      {isYou && <span className="ml-2 text-xs font-semibold text-brand-purple">you</span>}
                    </p>
                    <p className="text-xs text-muted">Added {new Date(m.addedAt).toLocaleDateString()}</p>
                  </div>
                  {canManage && !isLastMember && (
                    <button
                      type="button"
                      onClick={() => void handleRemove(m.accountId)}
                      disabled={removing != null}
                      aria-label={confirming === m.accountId ? `Confirm removing ${m.displayName}` : `Remove ${m.displayName}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-[10px] border border-transparent px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:border-danger/30 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                      {removing === m.accountId ? "Removing…" : confirming === m.accountId ? "Press again to remove" : "Remove"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {canManage && members.length === 1 && (
          <p className="mt-2 text-xs text-muted">A project needs at least one member — add someone before removing the last one.</p>
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
              className="min-w-[220px] flex-1 rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
            />
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UserPlusIcon className="h-3.5 w-3.5" />
              {adding ? "Adding…" : "Add member"}
            </button>
          </form>
        )}

        {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}
