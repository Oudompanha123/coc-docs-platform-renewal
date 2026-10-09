import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROLE_HINTS } from "@/lib/mock/users-roles";
import { RoleMultiSelect } from "./RoleMultiSelect";

describe("RoleMultiSelect", () => {
  it("is a row of compact pills — no description printed under each role", () => {
    render(<RoleMultiSelect idPrefix="t" selected={["admin"]} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Admin" })).toBeChecked();
    // The hint is not visible text, only the accessible description.
    expect(screen.getByText(ROLE_HINTS.admin)).toHaveClass("sr-only");
  });

  it("still tells a screen reader what each role allows", () => {
    render(<RoleMultiSelect idPrefix="t" selected={[]} onChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Developer" })).toHaveAccessibleDescription(ROLE_HINTS.developer);
  });

  it("shows the description in a tooltip on keyboard focus", async () => {
    const user = userEvent.setup();
    render(<RoleMultiSelect idPrefix="t" selected={[]} onChange={vi.fn()} />);

    await user.tab();

    expect(await screen.findByRole("tooltip")).toHaveTextContent(ROLE_HINTS.user);
  });

  it("toggles a role from anywhere on its pill", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<RoleMultiSelect idPrefix="t" selected={["user"]} onChange={onChange} />);

    await user.click(screen.getByText("Reviewer"));

    expect(onChange).toHaveBeenCalledWith(["user", "reviewer"]);
  });
});
