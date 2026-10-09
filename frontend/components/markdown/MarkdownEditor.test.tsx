import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

function Harness({ initial = "", maxLength }: { initial?: string; maxLength?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="body">Message</label>
      <MarkdownEditor id="body" value={value} onChange={setValue} maxLength={maxLength} />
    </>
  );
}

function select(textarea: HTMLTextAreaElement, text: string) {
  textarea.focus();
  const start = textarea.value.indexOf(text);
  textarea.setSelectionRange(start, start + text.length);
}

describe("MarkdownEditor (ADR-102)", () => {
  it("has a toolbar for bold, italic, headings, lists, links, code blocks and quotes", () => {
    render(<Harness />);
    const toolbar = screen.getByRole("toolbar", { name: "Formatting" });
    for (const name of [
      "Bold",
      "Italic",
      "Heading 1",
      "Heading 2",
      "Heading 3",
      "Bulleted list",
      "Numbered list",
      "Link",
      "Code block",
      "Quote",
    ]) {
      expect(toolbar.querySelector(`button[aria-label="${name}"]`)).not.toBeNull();
    }
  });

  it("wraps the selected text when a toolbar button is clicked, leaving it selected", async () => {
    const user = userEvent.setup();
    render(<Harness initial="Office closed Friday" />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    select(textarea, "closed");
    await user.click(screen.getByRole("button", { name: "Bold" }));

    expect(textarea).toHaveValue("Office **closed** Friday");
    expect(textarea).toHaveFocus();
    expect(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)).toBe("closed");
  });

  it("applies Ctrl+B / Ctrl+I / Ctrl+K", async () => {
    const user = userEvent.setup();
    render(<Harness initial="word" />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    select(textarea, "word");
    await user.keyboard("{Control>}i{/Control}");
    expect(textarea).toHaveValue("_word_");

    await user.keyboard("{Control>}k{/Control}");
    expect(textarea).toHaveValue("_[word](https://)_");
  });

  it("turns lines into a list from the toolbar", async () => {
    const user = userEvent.setup();
    render(<Harness initial={"one\ntwo"} />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    textarea.setSelectionRange(0, textarea.value.length);
    await user.click(screen.getByRole("button", { name: "Numbered list" }));

    expect(textarea).toHaveValue("1. one\n2. two");
  });

  it("does nothing rather than cut the text when a button would pass the limit", async () => {
    const user = userEvent.setup();
    render(<Harness initial="12345678" maxLength={10} />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    select(textarea, "12345678");
    await user.click(screen.getByRole("button", { name: "Bold" }));

    expect(textarea).toHaveValue("12345678");
  });

  it("previews the Markdown as it will be published, and goes back to writing", async () => {
    const user = userEvent.setup();
    render(<Harness initial={"## Heads up\n\nThe **portal** is down."} />);

    await user.click(screen.getByRole("tab", { name: "Preview" }));

    expect(screen.getByRole("heading", { level: 2, name: "Heads up" })).toBeInTheDocument();
    expect(screen.getByText("portal").tagName).toBe("STRONG");
    // Formatting is for the text being written, not the preview of it.
    expect(screen.getByRole("button", { name: "Bold" })).toBeDisabled();

    await user.click(screen.getByRole("tab", { name: "Write" }));
    expect(screen.getByLabelText("Message")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Heads up" })).not.toBeInTheDocument();
  });

  it("says so when there is nothing to preview", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByText("Nothing to preview yet.")).toBeInTheDocument();
  });
});

describe("MarkdownEditor — text color (ADR-102)", () => {
  it("colours the selection from the palette, keeps it selected, and previews it", async () => {
    const user = userEvent.setup();
    render(<Harness initial="Office closed today" />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    select(textarea, "closed");
    await user.click(screen.getByRole("button", { name: "Text color" }));
    await user.click(screen.getByRole("menuitem", { name: "Red" }));

    expect(textarea).toHaveValue("Office [closed]{color=red} today");
    expect(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd)).toBe("closed");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByText("closed")).toHaveClass("text-red-600");
  });

  it("recolours, then takes the colour off with Default color", async () => {
    const user = userEvent.setup();
    render(<Harness initial="Office closed today" />);
    const textarea = screen.getByLabelText("Message") as HTMLTextAreaElement;

    select(textarea, "closed");
    await user.click(screen.getByRole("button", { name: "Text color" }));
    await user.click(screen.getByRole("menuitem", { name: "Green" }));
    await user.click(screen.getByRole("button", { name: "Text color" }));
    await user.click(screen.getByRole("menuitem", { name: "Blue" }));
    expect(textarea).toHaveValue("Office [closed]{color=blue} today");

    await user.click(screen.getByRole("button", { name: "Text color" }));
    await user.click(screen.getByRole("menuitem", { name: "Default color" }));
    expect(textarea).toHaveValue("Office closed today");
  });

  it("closes the palette on Escape without changing the text", async () => {
    const user = userEvent.setup();
    render(<Harness initial="text" />);

    await user.click(screen.getByRole("button", { name: "Text color" }));
    expect(screen.getByRole("menu", { name: "Text color" })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Message")).toHaveValue("text");
  });
});
