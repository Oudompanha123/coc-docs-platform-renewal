import { DISPLAY_ROLE_ORDER, ROLE_LABELS, type AccountStatus, type DisplayRole } from "@/lib/mock/users-roles";
import { FilterDropdown, type FilterOption } from "./FilterDropdown";
import { SearchInput } from "@/components/ui/search-input";
import { ClockIcon, UsersIcon } from "@/components/layout/icons";

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
  { value: "deactivated", label: "Deactivated", dotClassName: "bg-muted-foreground" },
];

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
      <SearchInput
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or role..."
        aria-label="Search users"
        containerClassName="sm:w-72 sm:shrink-0"
      />

      <FilterDropdown<RoleFilter>
        label="Role"
        icon={<UsersIcon className="size-4" />}
        value={role}
        onChange={onRoleChange}
        options={ROLE_OPTIONS}
        className="sm:w-48"
      />

      <FilterDropdown<StatusFilter>
        label="Status"
        icon={<ClockIcon className="size-4" />}
        value={status}
        onChange={onStatusChange}
        options={STATUS_OPTIONS}
        className="sm:w-48"
      />
    </div>
  );
}
