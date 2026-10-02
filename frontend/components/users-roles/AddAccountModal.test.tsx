import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AddAccountModal } from "./AddAccountModal";

describe("AddAccountModal", () => {
  it("requires an email before it will submit", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Add Account" }));

    // An empty field says so; a malformed one says what is wrong with it.
    expect(await screen.findByText("Enter an email address.")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("rejects an address that is not a valid email", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "not-an-address");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(await screen.findByText("Include an @, as in name@example.com.")).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("defaults the role to user, and always submits some role", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "new.person@example.com");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(onAdd).toHaveBeenCalledWith("new.person@example.com", "user");
  });

  it("submits the role checked in the list", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "new.admin@example.com");
    await user.click(screen.getByRole("checkbox", { name: "Admin" }));
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(onAdd).toHaveBeenCalledWith("new.admin@example.com", "admin");
  });

  it("submits the highest checked role when several are selected, since the backend accepts only one", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "new.super.admin@example.com");
    await user.click(screen.getByRole("checkbox", { name: "Admin" }));
    await user.click(screen.getByRole("checkbox", { name: "Super Admin" }));
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(onAdd).toHaveBeenCalledWith("new.super.admin@example.com", "super_admin");
  });

  it("submits reviewer or lead like any other real role", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "new.lead@example.com");
    await user.click(screen.getByRole("checkbox", { name: "Lead" }));
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(onAdd).toHaveBeenCalledWith("new.lead@example.com", "lead");
  });

  it("trims surrounding whitespace from the email before submitting", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "  spaced@example.com  ");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(onAdd).toHaveBeenCalledWith("spaced@example.com", "user");
  });

  it("shows the failure reason inside the modal and stays open, rather than hiding it behind the overlay", async () => {
    const onAdd = vi.fn().mockRejectedValue(new Error("that email address already has an account"));
    const user = userEvent.setup();
    render(<AddAccountModal onClose={vi.fn()} onAdd={onAdd} />);

    await user.type(screen.getByLabelText("Email"), "taken@example.com");
    await user.click(screen.getByRole("button", { name: "Add Account" }));

    expect(await screen.findByText("that email address already has an account")).toBeInTheDocument();
    // Still here: the email field kept its value, so nothing has to be retyped.
    expect(screen.getByLabelText("Email")).toHaveValue("taken@example.com");
  });

  it("calls onClose when Cancel is clicked, without submitting", async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<AddAccountModal onClose={onClose} onAdd={onAdd} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });
});
