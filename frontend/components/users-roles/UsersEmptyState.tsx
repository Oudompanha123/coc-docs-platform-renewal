"use client";

import { ROLE_LABELS } from "@/lib/mock/users-roles";
import type { RoleFilter, StatusFilter } from "./FilterBar";
import { SearchX } from "lucide-react";
import { UsersIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";

const STATUS_LABELS: Record<Exclude<StatusFilter, "all">, string> = {
  active: "Active",
  pending: "Pending",
  deactivated: "Deactivated",
};

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
      className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-border bg-muted-surface/50 px-6 py-10 text-center"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
        {filtering ? <SearchX className="size-5" aria-hidden="true" /> : <UsersIcon className="size-5" />}
      </span>
      {filtering ? (
        <>
          <h3 className="mt-3 text-sm font-semibold text-foreground">No users found</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            No users match <span className="font-medium text-foreground">{criteria.join(" · ")}</span>.
            Try a different role or status, or clear the filters to see everyone.
          </p>
          <Button type="button" variant="outline" size="sm" onClick={onClearFilters} className="mt-4">
            Clear filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="mt-3 text-sm font-semibold text-foreground">No users yet</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Accounts appear here once they are added. Use <span className="font-semibold text-foreground">Add user</span> to
            invite the first one.
          </p>
        </>
      )}
    </div>
  );
}
