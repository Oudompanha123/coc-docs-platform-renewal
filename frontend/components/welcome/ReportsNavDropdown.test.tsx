import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReportsNavDropdown } from "./ReportsNavDropdown";

describe("ReportsNavDropdown (public /welcome page)", () => {
  it("opens a locked Attendance preview on click", async () => {
    const user = userEvent.setup();
    const onRequireAuth = vi.fn();
    render(<ReportsNavDropdown isDark={false} onRequireAuth={onRequireAuth} />);

    await user.click(screen.getByRole("button", { name: /reports.*records/i }));

    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /attendance/i })).toBeInTheDocument();
    expect(onRequireAuth).not.toHaveBeenCalled();
  });

  it("clicking Attendance closes the menu and prompts sign-in", async () => {
    const user = userEvent.setup();
    const onRequireAuth = vi.fn();
    render(<ReportsNavDropdown isDark={false} onRequireAuth={onRequireAuth} />);

    await user.click(screen.getByRole("button", { name: /reports.*records/i }));
    await user.click(screen.getByRole("menuitem", { name: /attendance/i }));

    expect(onRequireAuth).toHaveBeenCalledWith("Attendance");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
