/** "About this document" — real status/path, and a real `updated_at` when a
 *  row has actually been saved (undefined otherwise, e.g. seed-only content,
 *  since there is nothing genuine to report yet). */
export function DocumentMetaPanel({
  hasSavedContent,
  updatedAt,
  path,
}: {
  hasSavedContent: boolean;
  updatedAt: string | undefined;
  path: string;
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-surface-border bg-card">
      <div className="border-b border-surface-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">About this document</h2>
      </div>
      <dl className="divide-y divide-surface-border">
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <dt className="font-medium text-muted-foreground">Status</dt>
          <dd className={`font-medium ${hasSavedContent ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
            {hasSavedContent ? "Has content" : "Not written yet"}
          </dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <dt className="font-medium text-muted-foreground">Last updated</dt>
          <dd className="font-medium text-foreground">{updatedAt ? formatWhen(updatedAt) : "—"}</dd>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 text-sm">
          <dt className="font-medium text-muted-foreground">Path</dt>
          <dd className="font-mono text-xs font-medium text-foreground">{path}</dd>
        </div>
      </dl>
    </div>
  );
}

/** A readable relative time, falling back to a plain date for anything more
 *  than a week old — same threshold `lib/notify/activity.ts`'s `timeAgo`
 *  already uses for the mail-icon activity feed, reused in spirit rather
 *  than imported since that one formats a `NotificationItem`'s own field
 *  name, not a bare ISO string passed positionally. */
function formatWhen(iso: string): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "—";

  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return then.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
