import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttendanceDepartmentSelect } from "./AttendanceDepartmentSelect";

describe("AttendanceDepartmentSelect", () => {
  it("lists the given departments and reflects the current selection", () => {
    render(
      <AttendanceDepartmentSelect departments={["COOCON Department", "Engineering"]} value="Engineering" onChange={() => {}} />,
    );

    const select = screen.getByRole("combobox", { name: "Department" }) as HTMLSelectElement;
    expect(select).not.toBeDisabled();
    expect(select.value).toBe("Engineering");
    expect(screen.getByRole("option", { name: "COOCON Department" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Engineering" })).toBeInTheDocument();
  });

  it("calls onChange when a different department is picked", async () => {
    const onChange = vi.fn();
    render(
      <AttendanceDepartmentSelect departments={["COOCON Department", "Engineering"]} value="COOCON Department" onChange={onChange} />,
    );

    await userEvent.setup().selectOptions(screen.getByRole("combobox", { name: "Department" }), "Engineering");

    expect(onChange).toHaveBeenCalledWith("Engineering");
  });

  it("shows disabled with a 'No departments' fallback option when the list is empty", () => {
    render(<AttendanceDepartmentSelect departments={[]} value={null} onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toBeDisabled();
    expect(screen.getByRole("option", { name: "No departments" })).toBeInTheDocument();
  });

  it("matches the Users & Roles 'All Status' select's exact visual classes", () => {
    render(<AttendanceDepartmentSelect departments={["COOCON Department"]} value="COOCON Department" onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Department" });
    for (const cls of [
      "appearance-none",
      "rounded-xl",
      "border",
      "border-border",
      "bg-white",
      "py-2.5",
      "pl-9",
      "pr-9",
      "text-sm",
      "text-ink",
      "focus-visible:border-brand-purple",
      "focus-visible:ring-4",
      "focus-visible:ring-brand-purple/15",
    ]) {
      expect(select.className).toContain(cls);
    }
  });
});
