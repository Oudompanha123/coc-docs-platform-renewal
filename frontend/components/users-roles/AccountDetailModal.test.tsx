import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AdminAccount } from "@/lib/admin/accounts";
import { AccountDetailModal } from "./AccountDetailModal";

function account(overrides: Partial<AdminAccount> = {}): AdminAccount {
  return {
    id: "a1",
    email: "dara@example.com",
    displayName: "Dara Sok",
    role: "admin",
    active: true,
    roles: ["admin"],
    createdAt: "2026-09-01T09:00:00Z",
    lastSignInAt: "2026-10-05T08:30:00Z",
    mustChangePassword: false,
    avatarUrl: null,
    ...overrides,
  };
}

function renderModal(props: Partial<Parameters<typeof AccountDetailModal>[0]> = {}) {
  const onClose = vi.fn();
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <AccountDetailModal
      account={account()}
      isSelf={false}
      isLastActiveSuperAdmin={false}
      onClose={onClose}
      onSave={onSave}
      {...props}
    />,
  );
  return { onClose, onSave: (props.onSave as typeof onSave | undefined) ?? onSave };
}

/** Users & Roles → Account details: everything it did before the redesign, it still does. */
describe("AccountDetailModal", () => {
  it("shows who the account is at a glance: name, email, role, status, initials", () => {
    renderModal();

    expect(screen.getByText("Account details")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Dara Sok" })).toBeInTheDocument();
    expect(screen.getByText("dara@example.com")).toBeInTheDocument();
    expect(screen.getByText("DS")).toBeInTheDocument();
  });

  it("shows the read-only facts, and 'Never' for someone who has not signed in", () => {
    renderModal({ account: account({ lastSignInAt: null }) });

    const overview = screen.getByRole("region", { name: "Account overview" });
    expect(within(overview).getByText("Last sign-in")).toBeInTheDocument();
    expect(within(overview).getByText("Never")).toBeInTheDocument();
    expect(within(overview).getByText("Created")).toBeInTheDocument();
  });

  it("lists every role held when there is more than one", () => {
    renderModal({ account: account({ roles: ["admin", "developer"] }) });

    expect(screen.getByText("All roles held")).toBeInTheDocument();
  });

  it("marks your own account", () => {
    renderModal({ isSelf: true });

    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("offers nothing to save until something changes", () => {
    renderModal();

    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    expect(screen.queryByText("Unsaved changes")).not.toBeInTheDocument();
  });

  it("saves only the field that changed", async () => {
    const user = userEvent.setup();
    const { onSave, onClose } = renderModal();

    await user.clear(screen.getByLabelText("Display name"));
    await user.type(screen.getByLabelText("Display name"), "Dara S.");
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ displayName: "Dara S." }));
    expect(onClose).toHaveBeenCalled();
  });

  it("switches the account off and saves just that", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();
    const toggle = screen.getByRole("switch", { name: "Account is active" });
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "false");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ active: false }));
  });

  it("saves a change of roles", async () => {
    const user = userEvent.setup();
    const { onSave } = renderModal();

    await user.click(screen.getByRole("checkbox", { name: "Developer" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ roles: ["admin", "developer"] }));
  });

  it("refuses to save with no role at all, and says why", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("checkbox", { name: "Admin" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Check at least one role");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("won't let the last active super admin be switched off, and says why", async () => {
    const user = userEvent.setup();
    renderModal({
      account: account({ role: "super_admin", roles: ["super_admin"] }),
      isLastActiveSuperAdmin: true,
    });

    await user.click(screen.getByRole("switch", { name: "Account is active" }));

    expect(screen.getByRole("alert")).toHaveTextContent("This is the only active super admin");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  });

  it("cautions an administrator changing their own role or status", async () => {
    const user = userEvent.setup();
    renderModal({ isSelf: true });

    await user.click(screen.getByRole("switch", { name: "Account is active" }));

    expect(screen.getByText(/This is your own account/)).toBeInTheDocument();
  });

  it("stays open and shows the backend's wording when a save is refused", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockRejectedValue(new Error("that email is already in use"));
    const { onClose } = renderModal({ onSave });

    await user.click(screen.getByRole("switch", { name: "Account is active" }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("that email is already in use");
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
  });

  it("closes from the header's ✕ and from the footer's Close", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.click(screen.getByRole("button", { name: "Close account details" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
