"use client";

import { HomeIcon } from "@/components/layout/icons";

/**
 * Matches Users & Roles' "All Status" filter select exactly (same
 * `appearance-none`/border/padding/focus-ring classes and the same
 * leading-icon + trailing-chevron layout, copied from
 * components/users-roles/FilterBar.tsx) — that component has no reusable
 * export and is hardcoded to a fixed status enum, so there was nothing to
 * import; this reproduces its visual style for Attendance's own,
 * differently-shaped data (an arbitrary list of department names, with a
 * disabled/"No departments" state Users & Roles' own select never needed).
 */
export function AttendanceDepartmentSelect({
  departments,
  value,
  onChange,
}: {
  departments: string[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  const disabled = departments.length === 0;

  return (
    <div className="relative">
      <HomeIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <select
        value={value ?? ""}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Department"
        className="appearance-none rounded-xl border border-border bg-white py-2.5 pl-9 pr-9 text-sm text-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? (
          <option value="">No departments</option>
        ) : (
          departments.map((d) => (
            <option key={d} value={d}>
              {d || "(no department found)"}
            </option>
          ))
        )}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
