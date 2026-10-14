import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AttendanceCard } from "./AttendanceCard";

// MyAttendanceView carries the former /reports/attendance page's own logic
// unchanged — here only that this tab hosts it.
vi.mock("@/components/reports/MyAttendanceView", () => ({
  MyAttendanceView: () => <div>My attendance view</div>,
}));

describe("AttendanceCard (account settings)", () => {
  it("shows the caller's own attendance under an Attendance heading", () => {
    render(<AttendanceCard />);

    expect(screen.getByRole("heading", { name: "Attendance" })).toBeInTheDocument();
    expect(screen.getByText("My attendance view")).toBeInTheDocument();
  });
});
