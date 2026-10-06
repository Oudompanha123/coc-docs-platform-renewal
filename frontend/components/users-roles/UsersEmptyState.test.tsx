import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UsersEmptyState } from "./UsersEmptyState";

/** What the Users list says when it has nothing to show. */
describe("UsersEmptyState", () => {
  it("says No users found and names the role filter that matched nobody", () => {
    render(<UsersEmptyState search="" role="lead" status="all" onClearFilters={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "No users found" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("No users match Lead.");
  });

  it("names role, status and search together", () => {
    render(<UsersEmptyState search="  dara " role="reviewer" status="pending" onClearFilters={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("No users match Reviewer · Pending · “dara”.");
  });

  it("clears every filter in one click", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(<UsersEmptyState search="dara" role="lead" status="active" onClearFilters={onClearFilters} />);

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("with nothing filtered, says there are no users yet — not that a filter failed", () => {
    render(<UsersEmptyState search="   " role="all" status="all" onClearFilters={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "No users yet" })).toBeInTheDocument();
    expect(screen.queryByText("No users found")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });
});
