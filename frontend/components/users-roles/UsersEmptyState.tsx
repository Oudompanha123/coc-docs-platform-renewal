"use client";

import { ROLE_LABELS } from "@/lib/mock/users-roles";
import type { RoleFilter, StatusFilter } from "./FilterBar";

const STATUS_LABELS: Record<Exclude<StatusFilter, "all">, string> = {
  active: "Active",
  pending: "Pending",
  deactivated: "Deactivated",
};

function SearchOffGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
      <path d="M8.5 13.5 13.5 8.5M8.5 8.5l5 5" strokeLinecap="round" />
    </svg>
  );
}

function PeopleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c1.1-3 3.4-4.5 6.5-4.5s5.4 1.5 6.5 4.5" strokeLinecap="round" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8M18 14.8c1.7.6 2.9 2 3.5 4.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * What the Users list shows instead of an empty table.
 *
 * <p>Two different situations, said differently. With a filter or a search
 * applied, nothing matched — so it names what was asked for ("No users match
 * Lead") and offers to clear it in one click. With nothing applied, there are
 * simply no accounts yet, which is not a filter problem and should not be
 * described as one.
 */
export function UsersEmptyState({
  search,
  role,
  status,
  onClearFilters,
}: {
  search: string;
  role: RoleFilter;
  status: StatusFilter;
  /** Resets search, role and status together. */
  onClearFilters: () => void;
}) {
  const query = search.trim();
  const criteria = [
    role !== "all" ? ROLE_LABELS[role] : null,
    status !== "all" ? STATUS_LABELS[status] : null,
    query ? `“${query}”` : null,
  ].filter((c): c is string => c !== null);
  const filtering = criteria.length > 0;

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center rounded-[10px] border border-dashed border-border bg-[#f8fafc] px-6 py-14 text-center"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-foreground">
        {filtering ? <SearchOffGlyph className="h-7 w-7" /> : <PeopleGlyph className="h-7 w-7" />}
      </span>
      {filtering ? (
        <>
          <h3 className="mt-4 text-base font-bold text-dash-ink">No users found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            No users match <span className="font-semibold text-dash-ink">{criteria.join(" · ")}</span>.
            Try a different role or status, or clear the filters to see everyone.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Clear filters
          </button>
        </>
      ) : (
        <>
          <h3 className="mt-4 text-base font-bold text-dash-ink">No users yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Accounts appear here once they are added. Use <span className="font-semibold text-dash-ink">Add user</span> to
            invite the first one.
          </p>
        </>
      )}
    </div>
  );
}
