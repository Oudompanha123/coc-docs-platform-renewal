import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DeleteModal } from "./DeleteModal";
import type { ManagedAccount } from "@/lib/mock/users-roles";

const account: ManagedAccount = {
  id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
  name: "Dana Lee",
  email: "dana@example.com",
  role: "user",
  roles: ["user"],
  status: "active",
  lastLogin: "2026-09-14 10:02",
  ipAddress: "—",
  avatarUrl: null,
};

describe("DeleteModal", () => {
  it("keeps the delete button disabled until the address is typed back", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteModal
        account={account}
        isLastActiveSuperAdmin={false}
        isSelf={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    const button = screen.getByRole("button", { name: "Delete permanently" });
    expect(button).toBeDisabled();

    // The whole point of the gate: a click on the wrong row cannot complete.
    await user.click(button);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("refuses a near-miss, so deleting the wrong account takes more than a typo", async () => {
    const user = userEvent.setup();
    render(
      <DeleteModal
        account={account}
        isLastActiveSuperAdmin={false}
        isSelf={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText(/type dana@example\.com/i), "dana@example.co");

    expect(screen.getByRole("button", { name: "Delete permanently" })).toBeDisabled();
  });

  it("enables on the exact address, ignoring case", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();
    render(
      <DeleteModal
        account={account}
        isLastActiveSuperAdmin={false}
        isSelf={false}
        onClose={vi.fn()}
        onConfirm={onConfirm}
      />,
    );

    // Copied off the row above; failing somebody for capitalisation teaches
    // nothing and just makes them paste it a second time.
    await user.type(screen.getByLabelText(/type dana@example\.com/i), "Dana@Example.com");
    await user.click(screen.getByRole("button", { name: "Delete permanently" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("offers no delete at all for your own account", () => {
    render(
      <DeleteModal
        account={account}
        isLastActiveSuperAdmin={false}
        isSelf
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/cannot delete your own account/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete permanently" })).not.toBeInTheDocument();
  });

  it("offers no delete for the last remaining Super Admin, and says what to do first", () => {
    render(
      <DeleteModal
        account={{ ...account, role: "super_admin" }}
        isLastActiveSuperAdmin
        isSelf={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/last remaining Super Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Promote another account/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete permanently" })).not.toBeInTheDocument();
  });

  it("points at Deactivate as the reversible alternative", () => {
    render(
      <DeleteModal
        account={account}
        isLastActiveSuperAdmin={false}
        isSelf={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText(/cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByText(/can be reversed/i)).toBeInTheDocument();
  });
});
