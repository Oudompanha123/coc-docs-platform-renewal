import { DISPLAY_ROLE_ORDER, ROLE_LABELS, type AccountStatus, type DisplayRole } from "@/lib/mock/users-roles";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";

export type StatusFilter = AccountStatus | "all";
export type RoleFilter = DisplayRole | "all";

const ROLE_OPTIONS: FilterOption<RoleFilter>[] = [
  { value: "all", label: "All Roles" },
  ...DISPLAY_ROLE_ORDER.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
];

/** Dots in the same colours as `StatusBadge`, so the filter and the table read alike. */
const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active", dotClassName: "bg-[#1f9d6b]" },
  { value: "pending", label: "Pending", dotClassName: "bg-amber-500" },
  { value: "deactivated", label: "Deactivated", dotClassName: "bg-muted" },
];

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
          className="w-full rounded-xl border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-ink shadow-sm placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        />
      </div>

      <FilterDropdown<RoleFilter>
        label="Role"
        icon={<RoleGlyphIcon className="h-4 w-4" />}
        value={role}
        onChange={onRoleChange}
        options={ROLE_OPTIONS}
        className="sm:w-48"
      />

      <FilterDropdown<StatusFilter>
        label="Status"
        icon={<StatusGlyphIcon className="h-4 w-4" />}
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        className="sm:w-48"
      />
    </div>
  );
}
