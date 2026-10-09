import { inputBaseClass } from "@/components/ui/input";
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

  it("is styled by the shared field primitive, not a copy of one", () => {
    // This used to list the fourteen literal classes it shared with the
    // Users & Roles "All Status" select, because keeping two hand-written
    // class strings in step was the only way to make them match. They are
    // both `inputBaseClass` now (ADR-104), so asserting against the constant
    // checks the thing that actually matters — that this select did not grow
    // a field style of its own — and keeps on checking it when the palette
    // changes again.
    render(<AttendanceDepartmentSelect departments={["COOCON Department"]} value="COOCON Department" onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Department" });
    for (const cls of inputBaseClass.split(" ")) {
      expect(select.className).toContain(cls);
    }
    // Its own addition: the native arrow is replaced by the chevron this
    // component draws.
    expect(select.className).toContain("appearance-none");
  });
});
