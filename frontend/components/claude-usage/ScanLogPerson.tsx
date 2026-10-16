"use client";

import { UserAvatar } from "@/components/layout/UserAvatar";
import { avatarColorFor, type ScanLogSummary } from "@/lib/admin/claudeUsage";
import { personName } from "@/lib/claudeUsage/scanLogs";

/**
 * Who ran a scan: their profile picture (initials when they have none), name,
 * and — when the name is a roster name — the email under it. Shared by the
 * Scan Logs table and the scan's detail drawer so the two read the same.
 *
 * The initials colour is keyed off the email, not the row's position, so the
 * same person keeps one colour on every row and every page.
 */
export function ScanLogPerson({
  log,
  size = "size-8",
}: {
  log: ScanLogSummary;
  /** Avatar size class; the table's default matches UsageTable. */
  size?: string;
}) {
  const name = personName(log);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar
        avatarUrl={log.avatarUrl}
        name={name}
        initials={initialsOf(name)}
        className={`${size} !text-xs`}
        style={{ backgroundColor: avatarColorFor(hashOf(log.email.toLowerCase())) }}
      />
      <div className="min-w-0">
        <span className="block truncate font-medium text-foreground">{name}</span>
        {log.displayName && <span className="block truncate text-xs text-muted-foreground">{log.email}</span>}
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  const words = name.includes("@") ? [name] : name.split(" ");
  return (
    words
      .map((part) => part[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function hashOf(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  return hash;
}
