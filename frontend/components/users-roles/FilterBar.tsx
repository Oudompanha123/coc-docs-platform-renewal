import { ROLE_LABELS, ROLE_ORDER, type AccountRole, type AccountStatus } from "@/lib/mock/users-roles";

export type StatusFilter = AccountStatus | "all";
export type RoleFilter = AccountRole | "all";

function RoleGlyphIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19c1.1-3 3.4-4.5 6.5-4.5s5.4 1.5 6.5 4.5" strokeLinecap="round" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8" strokeLinecap="round" />
    </svg>
  );
}

function StatusGlyphIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  );
}

/** Real client-side filtering — no backend call, but not decorative either. */
export function FilterBar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  role: RoleFilter;
  onRoleChange: (value: RoleFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative w-full sm:w-[300px] sm:shrink-0">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full rounded-xl border border-border py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        />
      </div>

      <div className="relative">
        <RoleGlyphIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <select
          value={role}
          onChange={(e) => onRoleChange(e.target.value as RoleFilter)}
          className="appearance-none rounded-xl border border-border bg-white py-2.5 pl-9 pr-9 text-sm text-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        >
          <option value="all">All Roles</option>
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="relative">
        <StatusGlyphIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
          className="appearance-none rounded-xl border border-border bg-white py-2.5 pl-9 pr-9 text-sm text-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="deactivated">Deactivated</option>
        </select>
        <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
