import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RichTextEditor } from "./RichTextEditor";

describe("RichTextEditor", () => {
  it("shows the Markdown as formatted text — a real heading and bold, no ## or ** on screen", async () => {
    render(<RichTextEditor value={"## Intro\n\nHello **world**."} onChange={vi.fn()} maxLength={1000} />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    expect(within(box).getByRole("heading", { level: 2, name: "Intro" })).toBeInTheDocument();
    expect(within(box).getByText("world").tagName).toBe("STRONG");
    expect(box.textContent).not.toContain("##");
    expect(box.textContent).not.toContain("**");
  });

  it("formats with the toolbar and reports Markdown back", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Hello" onChange={onChange} maxLength={1000} />);
    await screen.findByRole("textbox", { name: "Content" });

    await user.click(screen.getByRole("button", { name: "Section heading" }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("## Hello"));
    expect(screen.getByRole("button", { name: "Section heading" })).toHaveAttribute("aria-pressed", "true");
  });

  it("replaces its content when the value changes from outside (reload, restore)", async () => {
    const { rerender } = render(<RichTextEditor value="Old text" onChange={vi.fn()} maxLength={1000} />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    rerender(<RichTextEditor value={"## Restored"} onChange={vi.fn()} maxLength={1000} />);
    await waitFor(() => expect(within(box).getByRole("heading", { level: 2, name: "Restored" })).toBeInTheDocument());
  });

  it("read-only: no toolbar, not editable", async () => {
    render(<RichTextEditor value="Text" onChange={vi.fn()} maxLength={1000} disabled />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    expect(screen.queryByRole("toolbar", { name: "Formatting" })).not.toBeInTheDocument();
    expect(box).toHaveAttribute("contenteditable", "false");
  });

  it("counts characters against the limit", async () => {
    render(<RichTextEditor value="abcd" onChange={vi.fn()} maxLength={3} />);
    expect(await screen.findByText("4 / 3")).toHaveClass("text-danger");
  });
});
