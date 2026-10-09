"use client";

import { LockIcon } from "@/components/auth/icons";
import { NavMenu, NavMenuItem } from "@/components/ui/nav-menu";

/**
 * "Reports & Records" on the public `/welcome` page — a fixed list rather than
 * one driven by `product.items`. Its one entry is a locked preview of
 * Attendance: choosing it closes the menu and prompts sign-in.
 *
 * Built on the shared `NavMenu` (ADR-104 r2.9), same as `ProductsNavDropdown`.
 */
export function ReportsNavDropdown({ onRequireAuth }: { onRequireAuth: (label: string) => void }) {
  return (
    <NavMenu label="Reports & Records" panelClassName="w-[280px]">
      <NavMenuItem
        title="Attendance"
        description="Your daily check-in and check-out, by day and by month."
        onSelect={() => onRequireAuth("Attendance")}
        trailing={
          <LockIcon className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        }
      />
    </NavMenu>
  );
}
