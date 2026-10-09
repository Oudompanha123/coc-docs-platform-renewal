import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarDeleteProductDialog } from "./SidebarDeleteProductDialog";

describe("SidebarDeleteProductDialog", () => {
  it("shows the product name in the title, body text, and confirmation prompt", () => {
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy={false} error={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Delete Jex3.0?" })).toBeInTheDocument();
    expect(screen.getByText(/All docs for this product will be removed/)).toBeInTheDocument();
    expect(screen.getByText("Jex3.0")).toBeInTheDocument();
  });

  it("disables Delete until the typed text matches exactly", async () => {
    const user = userEvent.setup();
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy={false} error={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    const deleteButton = screen.getByRole("button", { name: "Delete" });
    expect(deleteButton).toBeDisabled();

    const input = screen.getByRole("textbox");
    await user.type(input, "Jex3");
    expect(deleteButton).toBeDisabled();

    await user.type(input, ".0");
    expect(deleteButton).toBeEnabled();
  });

  it("is case-sensitive and whitespace-sensitive about the match", async () => {
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy={false} error={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "jex3.0 " } });
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("calls onConfirm only once the text matches", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy={false} error={null} onConfirm={onConfirm} onCancel={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "Jex3.0");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalled();
  });

  it("shows a busy label and disables Delete while deleting", async () => {
    const user = userEvent.setup();
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy error={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    await user.type(screen.getByRole("textbox"), "Jex3.0");
    expect(screen.getByRole("button", { name: "Deleting…" })).toBeDisabled();
  });

  it("shows an error message when given one", () => {
    render(
      <SidebarDeleteProductDialog
        productLabel="Jex3.0"
        busy={false}
        error="Couldn't remove that product."
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText("Couldn't remove that product.")).toBeInTheDocument();
  });

  it("calls onCancel from the Cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<SidebarDeleteProductDialog productLabel="Jex3.0" busy={false} error={null} onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
