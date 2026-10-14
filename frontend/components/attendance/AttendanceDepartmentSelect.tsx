"use client";

import { HomeIcon } from "@/components/layout/icons";
import { SimpleSelect } from "@/components/ui/select";

/**
 * The department filter: the shared `SimpleSelect` (ADR-104 r2.10) with a
 * leading house icon, and a disabled "No departments" state when the roster
 * has none. It was a native `<select>`, whose open list the operating system
 * drew — the square box with a bright blue highlight — and no CSS could
 * reach. The icon sits over the trigger's left padding (`pl-9`), so it never
 * covers the text.
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
      <HomeIcon className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <SimpleSelect
        aria-label="Department"
        value={value ?? ""}
        disabled={disabled}
        onValueChange={onChange}
        options={
          disabled
            ? [{ value: "", label: "No departments" }]
            : departments.map((d) => ({ value: d, label: d || "(no department found)" }))
        }
        className="pl-9"
      />
    </div>
  );
}
