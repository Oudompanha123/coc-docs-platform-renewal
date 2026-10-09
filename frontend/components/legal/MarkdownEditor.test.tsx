import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./MarkdownEditor";

function getTextarea(): HTMLTextAreaElement {
  return screen.getByPlaceholderText("Write…") as HTMLTextAreaElement;
}

function select(start: number, end: number) {
  const ta = getTextarea();
  ta.setSelectionRange(start, end);
}

describe("MarkdownEditor — toolbar", () => {
  it("Bold wraps the selected text", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="hello world" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(6, 11);

    fireEvent.click(screen.getByRole("button", { name: /Bold/ }));

    expect(onChange).toHaveBeenCalledWith("hello **world**");
  });

  it("Italic wraps the selected text", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="hello world" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 5);

    fireEvent.click(screen.getByRole("button", { name: /Italic/ }));

    expect(onChange).toHaveBeenCalledWith("*hello* world");
  });

  it("Heading cycles plain -> H3 -> H4 -> plain", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="A title" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 0);

    fireEvent.click(screen.getByRole("button", { name: /Heading/ }));
    expect(onChange).toHaveBeenLastCalledWith("### A title");
  });

  it("Bullet list adds a bullet to the current line", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="one line" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 0);

    fireEvent.click(screen.getByRole("button", { name: "Bullet list" }));

    expect(onChange).toHaveBeenCalledWith("- one line");
  });

  it("Numbered list adds a number to the current line", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="one line" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 0);

    fireEvent.click(screen.getByRole("button", { name: "Numbered list" }));

    expect(onChange).toHaveBeenCalledWith("1. one line");
  });

  it("Quote adds a quote prefix", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="hello" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 0);

    fireEvent.click(screen.getByRole("button", { name: "Quote" }));

    expect(onChange).toHaveBeenCalledWith("> hello");
  });

  it("Divider inserts a rule, with no padding needed on an empty document", () => {
    const onChange = vi.fn();
    render(<MarkdownEditor value="" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 0);

    fireEvent.click(screen.getByRole("button", { name: "Divider" }));

    expect(onChange).toHaveBeenCalledWith("---");
  });

  it("every toolbar button is disabled when the editor is disabled", () => {
    render(<MarkdownEditor value="hello" onChange={vi.fn()} maxLength={100} bulletStyle="circle" disabled placeholder="Write…" />);
    expect(screen.getByRole("button", { name: /Bold/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Italic/ })).toBeDisabled();
  });
});

describe("MarkdownEditor — link popover", () => {
  it("inserts a link for an allowed https URL", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="click here" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 10);

    await user.click(screen.getByRole("button", { name: /Link/ }));
    const urlInput = screen.getByLabelText(/URL/);
    await user.clear(urlInput);
    fireEvent.change(urlInput, { target: { value: "https://example.com" } });
    await user.click(screen.getByRole("button", { name: "Insert" }));

    expect(onChange).toHaveBeenCalledWith("[click here](https://example.com)");
  });

  it("refuses a disallowed scheme and shows an error instead of inserting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="click here" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 10);

    await user.click(screen.getByRole("button", { name: /Link/ }));
    const urlInput = screen.getByLabelText(/URL/);
    await user.clear(urlInput);
    fireEvent.change(urlInput, { target: { value: "javascript:alert(1)" } });
    await user.click(screen.getByRole("button", { name: "Insert" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Only https:// or mailto: links are allowed.")).toBeInTheDocument();
  });

  it("Cancel closes the popover without changing the value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<MarkdownEditor value="click here" onChange={onChange} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    select(0, 10);

    await user.click(screen.getByRole("button", { name: /Link/ }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByLabelText(/URL/)).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });
});

/** Every span in the overlay matching `role`'s marker-ness, in document
 *  order — the shared helper every test in the block below queries with. */
function overlaySpans(container: HTMLElement, marker: boolean): string[] {
  const overlay = container.querySelector(".whitespace-pre-wrap");
  // Markers in the muted text colour, prose in the foreground (ADR-104: the
  // purple marker / slate prose hexes moved onto the design-system tokens).
  const selector = marker ? "span.text-muted-foreground" : "span.text-foreground";
  return Array.from(overlay?.querySelectorAll(selector) ?? []).map((el) => el.textContent ?? "");
}

describe("MarkdownEditor — highlighter only colors real Markdown syntax", () => {
  it("leaves ordinary parentheses and quotes as normal text — the bug this fixes", () => {
    const { container } = render(
      <MarkdownEditor value='These Terms (the "Terms") apply.' onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual([]);
    expect(overlaySpans(container, false).join("")).toBe('These Terms (the "Terms") apply.');
  });

  it("leaves a lone, unpaired asterisk (not emphasis) as normal text", () => {
    const { container } = render(
      <MarkdownEditor value="5 * 3 = 15" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual([]);
  });

  it("leaves an underscore inside a word as normal text, not emphasis", () => {
    const { container } = render(
      <MarkdownEditor value="my_variable_name stays plain" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual([]);
  });

  it("colors ** as the marker for bold, not the word's own letters", () => {
    const { container } = render(
      <MarkdownEditor value="**bold**" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["**", "**"]);
    expect(overlaySpans(container, false)).toEqual(["bold"]);
  });

  it("colors a genuine *italic* pair, each asterisk separately", () => {
    const { container } = render(
      <MarkdownEditor value="*italic*" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["*", "*"]);
    expect(overlaySpans(container, false)).toEqual(["italic"]);
  });

  it("colors a genuine _italic_ pair, word-boundary guarded", () => {
    const { container } = render(
      <MarkdownEditor value="_italic_" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["_", "_"]);
    expect(overlaySpans(container, false)).toEqual(["italic"]);
  });

  it("colors the ### heading marker at line start", () => {
    const { container } = render(
      <MarkdownEditor value="### A heading" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["### "]);
  });

  it("colors the - bullet marker at line start", () => {
    const { container } = render(
      <MarkdownEditor value="- a list item" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["- "]);
  });

  it("colors the > quote marker at line start", () => {
    const { container } = render(
      <MarkdownEditor value="> a quote" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["> "]);
  });

  it("colors a --- divider line", () => {
    const { container } = render(
      <MarkdownEditor value="---" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual(["---"]);
  });

  it("colors the full [text](url) link pattern's brackets and parentheses, with the text/url in between staying normal", () => {
    const { container } = render(
      <MarkdownEditor
        value="Contact [legal](mailto:legal@example.com) for help."
        onChange={vi.fn()}
        maxLength={200}
        bulletStyle="circle"
        placeholder="Write…"
      />,
    );

    expect(overlaySpans(container, true)).toEqual(["[", "]", "(", ")"]);
    expect(overlaySpans(container, false).join("")).toBe("Contact legalmailto:legal@example.com for help.");
  });

  it("leaves a lone, unmatched bracket or parenthesis as normal text", () => {
    const { container } = render(
      <MarkdownEditor value="array[0] and foo(bar)" onChange={vi.fn()} maxLength={200} bulletStyle="circle" placeholder="Write…" />,
    );

    expect(overlaySpans(container, true)).toEqual([]);
  });
});

describe("MarkdownEditor — overlay text color", () => {
  it("renders plain (non-marker) text in the spec's visible color, not transparent", () => {
    // The real <textarea> underneath is `text-transparent` (only its caret
    // shows); the overlay div in front of it is the ONLY thing that visually
    // renders the written text, with markdown markers (*, -, >, …) colored
    // separately from the surrounding prose. If the prose spans were ALSO
    // transparent, nothing written would ever be visible at all — exactly
    // the bug this guards against (plain text invisible, only marker
    // characters showing). `text-foreground` is the prose colour (it was the
    // task spec's #1f2937 before ADR-104) and flips with the theme.
    const { container } = render(
      <MarkdownEditor value="hello world" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />,
    );

    // Several toolbar icon SVGs also carry `aria-hidden="true"`; the overlay
    // itself is the one element with this distinguishing class combination.
    const overlay = container.querySelector(".whitespace-pre-wrap");
    const proseSpan = Array.from(overlay?.querySelectorAll("span") ?? []).find((el) => el.textContent === "hello world");

    expect(proseSpan).toBeDefined();
    expect(proseSpan).toHaveClass("text-foreground");
    expect(proseSpan).not.toHaveClass("text-transparent");
  });

  it("colors markdown marker characters in the muted text colour, separately from the surrounding text", () => {
    const { container } = render(
      <MarkdownEditor value="*hi*" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />,
    );

    const overlay = container.querySelector(".whitespace-pre-wrap");
    const markerSpans = Array.from(overlay?.querySelectorAll("span.text-muted-foreground") ?? []).map((el) => el.textContent);

    expect(markerSpans).toEqual(["*", "*"]);
  });

  it("the real textarea's caret uses a class (caret-dash-ink), not an inline style, so dark mode can repaint it", () => {
    // An inline `style={{caretColor: ...}}` can't be reached by any CSS
    // rule — dark mode's override in globals.css targets `.caret-dash-ink`
    // specifically because it's a class.
    render(<MarkdownEditor value="hi" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />);

    const textarea = screen.getByPlaceholderText("Write…");
    expect(textarea).toHaveClass("caret-dash-ink");
    expect(textarea.style.caretColor).toBe("");
  });
});

describe("MarkdownEditor — modes", () => {
  it("defaults to write mode: shows the textarea, not the rendered preview", () => {
    const { container } = render(
      <MarkdownEditor value="**bold**" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />,
    );
    expect(getTextarea()).toBeInTheDocument();
    // The syntax-highlight overlay behind the textarea mirrors the raw text
    // (needed so its markers line up with the real cursor) — it's not the
    // rendered preview, so the absence check is for an actual <strong>, not
    // for the word "bold" as plain text.
    expect(container.querySelector("strong")).not.toBeInTheDocument();
  });

  it("Preview mode renders through MarkdownView and hides the textarea", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor value="**bold**" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />);

    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.queryByPlaceholderText("Write…")).not.toBeInTheDocument();
    expect(screen.getByText("bold").tagName).toBe("STRONG");
  });

  it("clicking Preview again returns to write mode", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor value="**bold**" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />);

    const previewButton = screen.getByRole("button", { name: "Preview" });
    await user.click(previewButton);
    await user.click(previewButton);

    expect(getTextarea()).toBeInTheDocument();
  });

  it("Side by side shows both the textarea and the preview", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MarkdownEditor value="**bold**" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />,
    );

    await user.click(screen.getByRole("button", { name: "Side by side" }));

    expect(getTextarea()).toBeInTheDocument();
    expect(container.querySelector("strong")).toHaveTextContent("bold");
  });

  it("Fullscreen toggles on and Escape exits it", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MarkdownEditor value="hello" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />,
    );

    await user.click(screen.getByRole("button", { name: "Fullscreen" }));
    expect(container.querySelector(".fixed.inset-0")).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(container.querySelector(".fixed.inset-0")).not.toBeInTheDocument();
  });
});

describe("MarkdownEditor — status line", () => {
  it("shows line/word counts and characters remaining", () => {
    render(<MarkdownEditor value={"one two\nthree"} onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />);
    expect(screen.getByText("lines: 2 · words: 3")).toBeInTheDocument();
    expect(screen.getByText("87 characters left · English (US)")).toBeInTheDocument();
  });

  it("the character counter turns into the danger style at zero", () => {
    render(<MarkdownEditor value={"x".repeat(10)} onChange={vi.fn()} maxLength={10} bulletStyle="circle" placeholder="Write…" />);
    expect(screen.getByText("0 characters left · English (US)")).toHaveClass("text-danger");
  });
});

describe("MarkdownEditor — help popover", () => {
  it("shows the syntax cheat sheet on click and hides it again", async () => {
    const user = userEvent.setup();
    render(<MarkdownEditor value="" onChange={vi.fn()} maxLength={100} bulletStyle="circle" placeholder="Write…" />);

    const helpButton = screen.getByRole("button", { name: "Markdown syntax help" });
    await user.click(helpButton);
    expect(screen.getByText("Markdown syntax")).toBeInTheDocument();

    await user.click(helpButton);
    expect(screen.queryByText("Markdown syntax")).not.toBeInTheDocument();
  });
});
