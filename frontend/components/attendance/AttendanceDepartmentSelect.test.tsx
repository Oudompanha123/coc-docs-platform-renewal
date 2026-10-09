import { fieldSurfaceClass } from "@/components/ui/input";
import { openSelect, pickOption } from "@/components/ui/select.test-utils";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttendanceDepartmentSelect } from "./AttendanceDepartmentSelect";

describe("AttendanceDepartmentSelect", () => {
  it("lists the given departments and reflects the current selection", async () => {
    render(
      <AttendanceDepartmentSelect departments={["COOCON Department", "Engineering"]} value="Engineering" onChange={() => {}} />,
    );

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).not.toBeDisabled();
    expect(select).toHaveTextContent("Engineering");
    expect(await openSelect(userEvent.setup(), "Department")).toEqual(["COOCON Department", "Engineering"]);
  });

  it("calls onChange when a different department is picked", async () => {
    const onChange = vi.fn();
    render(
      <AttendanceDepartmentSelect departments={["COOCON Department", "Engineering"]} value="COOCON Department" onChange={onChange} />,
    );

    await pickOption(userEvent.setup(), "Department", "Engineering");

    expect(onChange).toHaveBeenCalledWith("Engineering");
  });

  it("shows disabled with a 'No departments' fallback when the list is empty", () => {
    render(<AttendanceDepartmentSelect departments={[]} value={null} onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent("No departments");
  });

  it("is styled by the shared field surface, not a copy of one", () => {
    // Asserting against the shared constant checks the thing that matters —
    // that this select did not grow a field style of its own — and keeps on
    // checking it when the palette changes again (ADR-104).
    render(<AttendanceDepartmentSelect departments={["COOCON Department"]} value="COOCON Department" onChange={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Department" });
    for (const cls of fieldSurfaceClass.split(" ")) {
      expect(select.className).toContain(cls);
    }
    expect(select).toHaveClass("h-10", "rounded-full");
    // Widened to clear the leading house icon.
    expect(select).toHaveClass("pl-9");
  });
});
