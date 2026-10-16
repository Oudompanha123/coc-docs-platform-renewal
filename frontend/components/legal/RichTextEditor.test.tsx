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

  it("formats with the heading buttons and reports Markdown back", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Hello" onChange={onChange} maxLength={1000} />);
    await screen.findByRole("textbox", { name: "Content" });

    await user.click(screen.getByRole("button", { name: "H1 heading" }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("## Hello"));
    expect(screen.getByRole("button", { name: "H1 heading" })).toHaveAttribute("aria-pressed", "true");
  });

  it("offers the deepest heading, which the dialect allowed but no button reached", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Detail" onChange={onChange} maxLength={1000} />);
    await screen.findByRole("textbox", { name: "Content" });

    await user.click(screen.getByRole("button", { name: "H3 heading" }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("#### Detail"));
  });

  it("inserts the rarely used blocks straight from the bar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Hello" onChange={onChange} maxLength={1000} />);
    await screen.findByRole("textbox", { name: "Content" });

    await user.click(screen.getByRole("button", { name: "Numbered list" }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("1. Hello"));
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

  it("centres a paragraph from the alignment menu and stores the marker", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Signed" onChange={onChange} maxLength={1000} />);
    await screen.findByRole("textbox", { name: "Content" });

    await user.click(screen.getByRole("button", { name: "Align centre" }));
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith("Signed {align=center}"));
    expect(screen.getByRole("button", { name: "Align centre" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Align left" })).toHaveAttribute("aria-pressed", "false");
  });

  it("colours a selection from the swatches and stores a named tone", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<RichTextEditor value="Do not share your password" onChange={onChange} maxLength={1000} />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    await user.tripleClick(box);

    await user.click(screen.getByRole("button", { name: "Text colour" }));
    await user.click(await screen.findByRole("button", { name: "Critical" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith("[Do not share your password]{color=critical}"),
    );
  });

  it("paints the colour in the editor, not only on the published page", async () => {
    render(<RichTextEditor value="[Careful]{color=critical} and on we go" onChange={vi.fn()} maxLength={1000} />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    await waitFor(() => expect(within(box).getByText("Careful")).toHaveClass("text-danger"));
  });

  it("shows alignment that came in with the value", async () => {
    render(<RichTextEditor value="Signed {align=right}" onChange={vi.fn()} maxLength={1000} />);
    const box = await screen.findByRole("textbox", { name: "Content" });
    expect(within(box).getByText("Signed")).toHaveStyle({ textAlign: "right" });
  });

});
