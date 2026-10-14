"use client";

import { useState } from "react";
import { avatarColorFor, type ClaudeUsageMember } from "@/lib/admin/claudeUsage";
import { UserAvatar } from "@/components/layout/UserAvatar";

// req: FR-USAGE-001, ADR-035 — disabled members stay findable so they can be enabled again.

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Members a super_admin has disabled. The backend leaves them out of every
 * dashboard figure — table, chart, totals, counters — and lists them here
 * instead, so Enable is never more than a click away. Collapsed by default:
 * it is a way back, not part of the dashboard.
 */
export function DisabledMembersPanel({
  members,
  onSelect,
  onEnable,
}: {
  members: ClaudeUsageMember[];
  /** Opens the member's detail popup, as a table row does. */
  onSelect: (member: ClaudeUsageMember, avatarColor: string) => void;
  onEnable: (member: ClaudeUsageMember) => void;
}) {
  const [open, setOpen] = useState(false);
  if (members.length === 0) return null;

  return (
    <div className="mt-4 rounded-xl border border-surface-border bg-card p-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-sm font-semibold text-foreground">Disabled members ({members.length})</span>
          <span className="block text-xs text-muted-foreground">
            Not tracked and not counted. Usage collected before they were disabled is kept.
          </span>
        </span>
        <span className="text-sm font-medium text-muted-foreground hover:text-foreground">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <ul className="mt-4 divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border">
          {members.map((member, index) => {
            const color = avatarColorFor(index);
            return (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => onSelect(member, color)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <UserAvatar
                    avatarUrl={member.avatarUrl}
                    name={member.displayName}
                    initials={initialsOf(member.displayName)}
                    className="size-8 shrink-0 !text-xs opacity-60"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{member.displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{member.email}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onEnable(member)}
                  className="inline-flex h-8 shrink-0 items-center rounded-control bg-emerald-500/10 px-3.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20"
                >
                  Enable
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
