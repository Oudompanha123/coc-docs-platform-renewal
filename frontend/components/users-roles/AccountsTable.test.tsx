import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AccountsTable } from "./AccountsTable";
import type { ManagedAccount } from "@/lib/mock/users-roles";

function row(overrides: Partial<ManagedAccount> = {}): ManagedAccount {
  return {
    id: "0f8b1a2c-1111-4444-8888-aaaaaaaaaaaa",
    name: "Dana Lee",
    email: "dana@example.com",
    role: "user",
    roles: ["user"],
    status: "active",
    lastLogin: "2026-09-14 10:02",
    ipAddress: "—",
    avatarUrl: null,
    ...overrides,
  };
}

describe("AccountsTable actions", () => {
  /**
   * The dead end this fixes: a deactivated row ended at a disabled
   * "Deactivated" label, so nothing on the page could undo a deactivation —
   * even though the backend has supported reactivation since it was written.
   */
  it("offers Reactivate on a deactivated account, not a dead label", async () => {
    const onReactivate = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountsTable
        accounts={[row({ status: "deactivated" })]}
        onDeactivate={vi.fn()}
        onReactivate={onReactivate}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Actions for / }));
    await user.click(screen.getByRole("menuitem", { name: "Reactivate" }));

    expect(onReactivate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Deactivate" })).not.toBeInTheDocument();
  });

  it("offers Deactivate on an active account", async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountsTable
        accounts={[row()]}
        onDeactivate={onDeactivate}
        onReactivate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Actions for / }));
    await user.click(screen.getByRole("menuitem", { name: "Deactivate" }));

    expect(onDeactivate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Deactivate, not Reactivate, on a pending account — it is still active in the backend", async () => {
    const onDeactivate = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountsTable
        accounts={[row({ status: "pending" })]}
        onDeactivate={onDeactivate}
        onReactivate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /^Actions for / }));
    await user.click(screen.getByRole("menuitem", { name: "Deactivate" }));

    expect(onDeactivate).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Reactivate" })).not.toBeInTheDocument();
  });

  it("offers Delete whatever the status, since a deactivated row still needs removing", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(
      <AccountsTable
        accounts={[row({ status: "deactivated" })]}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
        onDelete={onDelete}
        onOpen={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for Dana Lee" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete permanently" }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("shows the account's picture when it has one", () => {
    render(
      <AccountsTable
        accounts={[row({ avatarUrl: "https://lh3.googleusercontent.com/a/example" })]}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.getByRole("img", { name: "Dana Lee" })).toHaveAttribute(
      "src",
      "https://lh3.googleusercontent.com/a/example",
    );
  });

  it("falls back to initials when the account has no picture", () => {
    render(
      <AccountsTable
        accounts={[row({ avatarUrl: null })]}
        onDeactivate={vi.fn()}
        onReactivate={vi.fn()}
        onDelete={vi.fn()}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("DL")).toBeInTheDocument();
  });
});
