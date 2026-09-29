import type { TrackingStatus } from "@/lib/admin/claudeUsage";

/** Same dot+pill shape as users-roles/StatusBadge.tsx. Two states only: a row
 *  exists because somebody reported, so "active" is how it starts, and
 *  "removed" is the one an admin can put it in. The old "Invited" pill went
 *  with the invite feature and the status itself (V36). */
export function TrackingStatusBadge({ status }: { status: TrackingStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e1f5ec] px-2.5 py-1 text-xs font-semibold text-[#1f9d6b]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-page px-2.5 py-1 text-xs font-semibold text-muted">
      <span className="h-1.5 w-1.5 rounded-full bg-muted" aria-hidden="true" />
      Removed
    </span>
  );
}
