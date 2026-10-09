"use client";

import { useEffect, useRef, useState } from "react";
import { LockIcon } from "@/components/auth/icons";
import { CalendarCheckIcon, ChevronDownIcon } from "@/components/layout/icons";

/**
 * "Reports & Records" on the public `/welcome` page — same locked-preview
 * shape as `NavDropdown`'s per-product menu, not shared code with it since
 * this one's item list is fixed (mirrors `MemberHeader.tsx`'s own
 * `ReportsDropdown`: Attendance, plus a "More reports" placeholder) rather
 * than driven by `product.items`.
 */
export function ReportsNavDropdown({
  isDark,
  onRequireAuth,
}: {
  isDark: boolean;
  onRequireAuth: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-[72px] items-center gap-1.5 border-b-2 transition-all hover:font-bold ${
          open ? "border-primary font-bold" : "border-transparent hover:border-primary"
        } ${isDark ? "hover:text-[#f2effa]" : "hover:text-ink"}`}
      >
        Reports &amp; Records
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute left-0 top-[72px] z-30 w-72 rounded-[10px] border py-2 shadow-lg ${
            isDark ? "border-[#332e4d] bg-[#1e1a30]" : "border-border bg-white"
          }`}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => { setOpen(false); onRequireAuth("Attendance"); }}
            className={`group flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors ${
              isDark ? "hover:bg-white/10" : "hover:bg-secondary"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isDark ? "bg-primary/15 text-[#c4b5fd]" : "bg-secondary text-foreground"
              }`}
            >
              <CalendarCheckIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`flex items-center justify-between gap-2 truncate text-sm font-medium ${
                  isDark ? "text-[#f2effa]" : "text-ink"
                }`}
              >
                Attendance
                <LockIcon
                  className={`h-3.5 w-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ${
                    isDark ? "text-[#a79fc9]" : "text-muted"
                  }`}
                />
              </span>
              <span className={`block truncate text-xs ${isDark ? "text-[#a79fc9]" : "text-muted"}`}>
                Your daily check-in &amp; out
              </span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
