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
    <div className="mt-4 rounded-[10px] border border-border bg-white p-5 shadow-sm">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-sm font-bold text-dash-ink">Disabled members ({members.length})</span>
          <span className="block text-xs text-muted">
            Not tracked and not counted. Usage collected before they were disabled is kept.
          </span>
        </span>
        <span className="text-sm font-semibold text-brand-purple">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-[10px] border border-border">
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
                    className="h-10 w-10 shrink-0 !text-sm opacity-60 shadow-sm"
                    style={{ backgroundColor: color }}
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-dash-ink">{member.displayName}</span>
                    <span className="block truncate text-xs text-muted">{member.email}</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onEnable(member)}
                  className="inline-flex shrink-0 items-center rounded-[4px] bg-[#1f9d6b]/10 px-4 py-1.5 text-sm font-semibold text-[#1f9d6b] transition-colors hover:bg-[#1f9d6b]/20"
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
