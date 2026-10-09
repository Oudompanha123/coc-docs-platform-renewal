import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SidebarRenameRow } from "./SidebarRenameRow";
import { ScaleIcon } from "./icons";
import type { NavItem } from "./nav-config";

function item(overrides: Partial<NavItem> = {}): NavItem {
  return { label: "Legal pages", href: "/legal-pages", icon: ScaleIcon, ...overrides };
}

describe("SidebarRenameRow", () => {
  it("shows no URL preview by default (a static item's rename never changes its route)", () => {
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText(/^URL:/)).not.toBeInTheDocument();
  });

  it("shows a live URL preview for a product, updating as the label is typed", async () => {
    const user = userEvent.setup();
    render(
      <SidebarRenameRow
        item={item({ label: "Jex3.0", href: "/jex3-0" })}
        existingLabels={[]}
        showUrlPreview
        onSave={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("URL: /docs/jex3-0")).toBeInTheDocument();

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "Jex!! Three");

    expect(screen.getByText("URL: /docs/jex-three")).toBeInTheDocument();
  });

  it("the URL preview falls back to a placeholder rather than showing a bare, confusing '/docs/'", async () => {
    const user = userEvent.setup();
    render(
      <SidebarRenameRow item={item({ label: "Jex3.0" })} existingLabels={[]} showUrlPreview onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    await user.clear(screen.getByRole("textbox"));
    await user.type(screen.getByRole("textbox"), "!!!");

    expect(screen.getByText("URL: /docs/…")).toBeInTheDocument();
  });

  it("hides the URL preview once a validation error is showing, so they never overlap", () => {
    render(
      <SidebarRenameRow item={item({ label: "Jex3.0" })} existingLabels={[]} showUrlPreview onSave={vi.fn()} onCancel={vi.fn()} />,
    );

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    fireEvent.blur(screen.getByRole("textbox"));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText(/^URL:/)).not.toBeInTheDocument();
  });

  it("starts with the current label, selected", () => {
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={vi.fn()} onCancel={vi.fn()} />);
    const input = screen.getByRole("textbox", { name: "Rename Legal pages" }) as HTMLInputElement;
    expect(input.value).toBe("Legal pages");
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(input.value.length);
  });

  it("saves the trimmed value on Enter", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.type(input, "  Legal Docs  {Enter}");

    expect(onSave).toHaveBeenCalledWith("Legal Docs");
  });

  it("saves on blur", () => {
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={vi.fn()} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Legal Docs" } });
    fireEvent.blur(input);

    expect(onSave).toHaveBeenCalledWith("Legal Docs");
  });

  it("cancels on Escape without saving", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={onCancel} />);

    const input = screen.getByRole("textbox");
    await user.type(input, " changed");
    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not also save on the blur that follows Escape", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={vi.fn()} />);

    const input = screen.getByRole("textbox");
    await user.keyboard("{Escape}");
    fireEvent.blur(input);

    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a blank name", () => {
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "   " } });
    fireEvent.blur(screen.getByRole("textbox"));

    expect(screen.getByRole("alert")).toHaveTextContent("Can't be blank.");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a name over 30 characters", () => {
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={onSave} onCancel={vi.fn()} />);

    const input = screen.getByRole("textbox") as HTMLInputElement;
    // maxLength on the input itself would also stop this at the DOM level in
    // a real browser, but jsdom's fireEvent.change doesn't enforce it — this
    // exercises the component's own length check directly.
    fireEvent.change(input, { target: { value: "x".repeat(31) } });
    fireEvent.blur(input);

    expect(screen.getByRole("alert")).toHaveTextContent("30 characters or fewer");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("rejects a name already used by a sibling in the same group, case-insensitively", () => {
    const onSave = vi.fn();
    render(<SidebarRenameRow item={item()} existingLabels={["Announcements"]} onSave={onSave} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "announcements" } });
    fireEvent.blur(screen.getByRole("textbox"));

    expect(screen.getByRole("alert")).toHaveTextContent("already used");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("clears the error once the text changes again", () => {
    render(<SidebarRenameRow item={item()} existingLabels={[]} onSave={vi.fn()} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "" } });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Legal" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
