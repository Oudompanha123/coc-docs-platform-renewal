"use client";

import { MyAttendanceView } from "@/components/reports/MyAttendanceView";

/**
 * `/account/settings#attendance` — the caller's own HRMS attendance, moved
 * here from the former `/reports/attendance` page (which now redirects here).
 */
export function AttendanceCard() {
  return (
    <section id="attendance" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Attendance</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">HRMS KOSIGN · Your daily check-in &amp; out.</p>
      <div className="mt-4">
        <MyAttendanceView />
      </div>
    </section>
  );
}
