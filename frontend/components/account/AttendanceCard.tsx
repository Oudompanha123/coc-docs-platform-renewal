"use client";

import { MyAttendanceView } from "@/components/reports/MyAttendanceView";

/**
 * `/account/settings#attendance` — the caller's own HRMS attendance, moved
 * here from the former `/reports/attendance` page (which now redirects here).
 */
export function AttendanceCard() {
  return (
    <section id="attendance" className="scroll-mt-24 rounded-[10px] border border-border bg-white p-6 shadow-sm">
      <h2 className="text-base font-bold text-dash-ink">Attendance</h2>
      <p className="mt-0.5 text-sm text-muted">HRMS KOSIGN · Your daily check-in &amp; out.</p>
      <div className="mt-5">
        <MyAttendanceView />
      </div>
    </section>
  );
}
