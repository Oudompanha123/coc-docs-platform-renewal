import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MarkdownView } from "./MarkdownView";

describe("MarkdownView", () => {
  it("renders a paragraph as text", () => {
    render(<MarkdownView source="Hello" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("renders heading levels 3 and 4 as h3/h4", () => {
    render(<MarkdownView source={"### H3\n\n#### H4"} />);
    expect(screen.getByRole("heading", { level: 3, name: "H3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "H4" })).toBeInTheDocument();
  });

  it("renders bold and italic marks", () => {
    const { container } = render(<MarkdownView source="**bold** and *italic*" />);
    expect(container.querySelector("strong")).toHaveTextContent("bold");
    expect(container.querySelector("em")).toHaveTextContent("italic");
  });

  it("renders a link with rel=noopener noreferrer, opening https in a new tab", () => {
    render(<MarkdownView source="[click](https://example.com)" />);
    const link = screen.getByRole("link", { name: "click" });
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not open a mailto link in a new tab", () => {
    render(<MarkdownView source="[email](mailto:a@b.com)" />);
    expect(screen.getByRole("link", { name: "email" })).not.toHaveAttribute("target");
  });

  it("a disallowed-scheme link renders as plain text, not a link", () => {
    render(<MarkdownView source="[click](javascript:alert(1))" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("[click](javascript:alert(1))")).toBeInTheDocument();
  });

  it("renders a bullet list with a list item per line", () => {
    render(<MarkdownView source={"- one\n- two"} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("one")).toBeInTheDocument();
    expect(screen.getByText("two")).toBeInTheDocument();
  });

  it("switches the bullet marker glyph between circle and check styles", () => {
    const { container: circle } = render(<MarkdownView source="- one" bulletStyle="circle" />);
    expect(circle.querySelector("svg")).not.toBeInTheDocument();

    const { container: check } = render(<MarkdownView source="- one" bulletStyle="check" />);
    expect(check.querySelector("svg")).toBeInTheDocument();
  });

  it("renders an ordered list with numbered markers", () => {
    render(<MarkdownView source={"1. first\n2. second"} />);
    expect(screen.getByText("1.")).toBeInTheDocument();
    expect(screen.getByText("2.")).toBeInTheDocument();
  });

  it("renders a blockquote and a horizontal rule", () => {
    const { container } = render(<MarkdownView source={"> quoted\n\n---"} />);
    expect(container.querySelector("blockquote")).toHaveTextContent("quoted");
    expect(container.querySelector("hr")).toBeInTheDocument();
  });

  it("never renders raw HTML tags as markup — they show up as literal text", () => {
    const { container } = render(<MarkdownView source="<script>alert(1)</script>" />);
    expect(container.querySelector("script")).not.toBeInTheDocument();
    expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
  });
});

describe("alignment (ADR-113)", () => {
  it("publishes a centred heading centred, with the marker nowhere on screen", () => {
    render(<MarkdownView source="## Signed {align=center}" />);
    const heading = screen.getByRole("heading", { level: 2, name: "Signed" });
    expect(heading.className).toContain("text-center");
    expect(heading.textContent).not.toContain("align");
  });

  it("leaves an unaligned paragraph with no alignment class", () => {
    const { container } = render(<MarkdownView source="Plain paragraph." />);
    expect(container.querySelector("p")!.className).not.toContain("text-center");
    expect(container.querySelector("p")!.className).not.toContain("text-right");
  });
});

describe("text colour (ADR-114)", () => {
  it("publishes a critical tone through the theme token, with no marker on screen", () => {
    render(<MarkdownView source="[Do not share this]{color=critical}" />);
    const span = screen.getByText("Do not share this");
    expect(span.className).toContain("text-danger");
    expect(document.body.textContent).not.toContain("color=");
  });

  it("ignores a tone the dialect does not define", () => {
    render(<MarkdownView source="[Careful]{color=neon}" />);
    expect(screen.getByText(/\[Careful\]\{color=neon\}/)).toBeInTheDocument();
  });

  it("paints the tone on a coloured link, which the link's own colour would otherwise win", () => {
    render(<MarkdownView source="[write to us](mailto:legal@example.com){color=critical}" />);
    const link = screen.getByRole("link", { name: "write to us" });
    expect(link).toHaveAttribute("href", "mailto:legal@example.com");
    expect(link.className).toContain("text-danger");
    expect(link.className).not.toContain("text-foreground");
    expect(document.body.textContent).not.toContain("color=");
  });

  it("keeps bold under a tone", () => {
    render(<MarkdownView source="[**Never**]{color=critical} share it" />);
    const strong = screen.getByText("Never");
    expect(strong.tagName).toBe("STRONG");
    expect(strong.parentElement!.className).toContain("text-danger");
  });
});
