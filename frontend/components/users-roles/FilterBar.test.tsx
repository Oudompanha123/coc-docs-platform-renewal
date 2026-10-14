import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { FilterBar, type RoleFilter, type StatusFilter } from "./FilterBar";

/** Holds the filters' state the way the Users & Roles page does, and reports each change. */
function Harness({ onRole, onStatus }: { onRole?: (r: RoleFilter) => void; onStatus?: (s: StatusFilter) => void }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  return (
    <>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        role={role}
        onRoleChange={(r) => {
          setRole(r);
          onRole?.(r);
        }}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          onStatus?.(s);
        }}
      />
      <button type="button">elsewhere</button>
    </>
  );
}

/** Users & Roles → the All Roles / All Status filters. */
describe("FilterBar dropdowns", () => {
  it("start on All Roles and All Status, closed", () => {
    render(<Harness />);

    expect(screen.getByRole("button", { name: "Role: All Roles" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Status: All Status" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("lists every role, with the current one marked, and filters by the one picked", async () => {
    const user = userEvent.setup();
    const onRole = vi.fn();
    render(<Harness onRole={onRole} />);

    await user.click(screen.getByRole("button", { name: "Role: All Roles" }));
    const list = screen.getByRole("listbox", { name: "Role" });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "All Roles",
      "User",
      "Developer",
      "Reviewer",
      "Lead",
      "Admin",
      "Super Admin",
    ]);
    expect(screen.getByRole("option", { name: "All Roles" })).toHaveAttribute("aria-selected", "true");
    expect(list).toBeInTheDocument();

    await user.click(screen.getByRole("option", { name: "Admin" }));

    expect(onRole).toHaveBeenCalledWith("admin");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Role: Admin" })).toHaveFocus();
  });

  it("filters by status", async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    render(<Harness onStatus={onStatus} />);

    await user.click(screen.getByRole("button", { name: "Status: All Status" }));
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "All Status",
      "Active",
      "Pending",
      "Deactivated",
    ]);
    await user.click(screen.getByRole("option", { name: "Deactivated" }));

    expect(onStatus).toHaveBeenCalledWith("deactivated");
    expect(screen.getByRole("button", { name: "Status: Deactivated" })).toBeInTheDocument();
  });

  it("tints the trigger while a filter is applied, and not when it is back on All", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = () => screen.getByRole("button", { name: /^Role:/ });
    expect(trigger()).not.toHaveClass("text-foreground");

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "Lead" }));
    expect(trigger()).toHaveClass("text-foreground");

    await user.click(trigger());
    await user.click(screen.getByRole("option", { name: "All Roles" }));
    expect(trigger()).not.toHaveClass("text-foreground");
  });

  it("works from the keyboard: open, move, pick", async () => {
    const user = userEvent.setup();
    const onStatus = vi.fn();
    render(<Harness onStatus={onStatus} />);

    screen.getByRole("button", { name: "Status: All Status" }).focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "All Status" })).toHaveFocus();

    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("option", { name: "Pending" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("option", { name: "Deactivated" })).toHaveFocus();
    await user.keyboard("{Home}{ArrowUp}");
    expect(screen.getByRole("option", { name: "Deactivated" })).toHaveFocus();

    await user.keyboard("{ArrowUp}{Enter}");
    expect(onStatus).toHaveBeenCalledWith("pending");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes without changing anything on Escape, and on a click outside", async () => {
    const user = userEvent.setup();
    const onRole = vi.fn();
    render(<Harness onRole={onRole} />);
    const trigger = screen.getByRole("button", { name: "Role: All Roles" });

    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "elsewhere" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onRole).not.toHaveBeenCalled();
  });

  it("does not report a change when the current option is picked again", async () => {
    const user = userEvent.setup();
    const onRole = vi.fn();
    render(<Harness onRole={onRole} />);

    await user.click(screen.getByRole("button", { name: "Role: All Roles" }));
    await user.click(screen.getByRole("option", { name: "All Roles" }));

    expect(onRole).not.toHaveBeenCalled();
  });

  it("keeps the search box working", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.type(screen.getByPlaceholderText("Search by name, email, or role..."), "dara");

    expect(screen.getByPlaceholderText("Search by name, email, or role...")).toHaveValue("dara");
  });
});
