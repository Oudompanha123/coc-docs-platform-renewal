import { describe, expect, it } from "vitest";
import {
  isAllowedLinkHref,
  isMarkdownEmpty,
  markdownOutline,
  markdownWordCount,
  parseInline,
  parseMarkdown,
  validateMarkdown,
} from "./markdown";

describe("parseInline", () => {
  it("parses bold, italic, and links in one pass", () => {
    expect(parseInline("plain **bold** *italic* [link](https://example.com) tail")).toEqual([
      { text: "plain " },
      { text: "bold", bold: true },
      { text: " " },
      { text: "italic", italic: true },
      { text: " " },
      { text: "link", href: "https://example.com" },
      { text: " tail" },
    ]);
  });

  it("a plain string with no markers is one text span", () => {
    expect(parseInline("hello")).toEqual([{ text: "hello" }]);
  });

  it("a link with a disallowed scheme renders as literal text, not a link", () => {
    expect(parseInline("[click](javascript:alert(1))")).toEqual([{ text: "[click](javascript:alert(1))" }]);
  });

  it("a mailto link is allowed", () => {
    expect(parseInline("[email](mailto:a@b.com)")).toEqual([{ text: "email", href: "mailto:a@b.com" }]);
  });
});

describe("parseMarkdown", () => {
  it("parses a single paragraph", () => {
    expect(parseMarkdown("Hello world.")).toEqual([{ kind: "paragraph", spans: [{ text: "Hello world." }] }]);
  });

  it("joins soft-wrapped lines into one paragraph", () => {
    const doc = parseMarkdown("First line\nSecond line");
    expect(doc).toEqual([{ kind: "paragraph", spans: [{ text: "First line Second line" }] }]);
  });

  it("blank lines separate paragraphs", () => {
    const doc = parseMarkdown("First\n\nSecond");
    expect(doc).toHaveLength(2);
    expect(doc[0]).toEqual({ kind: "paragraph", spans: [{ text: "First" }] });
    expect(doc[1]).toEqual({ kind: "paragraph", spans: [{ text: "Second" }] });
  });

  it("parses heading levels 2, 3 and 4 — ## is a section", () => {
    const doc = parseMarkdown("## H2\n### H3\n#### H4");
    expect(doc).toEqual([
      { kind: "heading", level: 2, spans: [{ text: "H2" }] },
      { kind: "heading", level: 3, spans: [{ text: "H3" }] },
      { kind: "heading", level: 4, spans: [{ text: "H4" }] },
    ]);
  });

  it("does not treat a level 1 heading specially (not in the whitelist) — renders as a paragraph", () => {
    const doc = parseMarkdown("# Not a real heading here");
    expect(doc).toEqual([{ kind: "paragraph", spans: [{ text: "# Not a real heading here" }] }]);
  });

  it("parses a flat bullet list", () => {
    const doc = parseMarkdown("- one\n- two\n- three");
    expect(doc).toEqual([
      {
        kind: "bulletList",
        items: [
          [{ kind: "paragraph", spans: [{ text: "one" }] }],
          [{ kind: "paragraph", spans: [{ text: "two" }] }],
          [{ kind: "paragraph", spans: [{ text: "three" }] }],
        ],
      },
    ]);
  });

  it("parses a flat ordered list", () => {
    const doc = parseMarkdown("1. one\n2. two");
    expect(doc).toEqual([
      {
        kind: "orderedList",
        items: [[{ kind: "paragraph", spans: [{ text: "one" }] }], [{ kind: "paragraph", spans: [{ text: "two" }] }]],
      },
    ]);
  });

  it("parses one level of nested bullets under a top-level item", () => {
    const doc = parseMarkdown("- top\n  - nested one\n  - nested two");
    expect(doc).toEqual([
      {
        kind: "bulletList",
        items: [
          [
            { kind: "paragraph", spans: [{ text: "top" }] },
            {
              kind: "bulletList",
              items: [
                [{ kind: "paragraph", spans: [{ text: "nested one" }] }],
                [{ kind: "paragraph", spans: [{ text: "nested two" }] }],
              ],
            },
          ],
        ],
      },
    ]);
  });

  it("a lead paragraph followed by a bullet list are two separate blocks", () => {
    const doc = parseMarkdown("Please don't:\n- one\n- two");
    expect(doc).toHaveLength(2);
    expect(doc[0]!.kind).toBe("paragraph");
    expect(doc[1]!.kind).toBe("bulletList");
  });

  it("parses a horizontal rule, distinct from a bullet line", () => {
    expect(parseMarkdown("---")).toEqual([{ kind: "horizontalRule" }]);
    expect(parseMarkdown("- item")).not.toEqual([{ kind: "horizontalRule" }]);
  });

  it("parses a blockquote", () => {
    const doc = parseMarkdown("> quoted text");
    expect(doc).toEqual([
      { kind: "blockquote", blocks: [{ kind: "paragraph", spans: [{ text: "quoted text" }] }] },
    ]);
  });

  it("joins consecutive quote lines into one blockquote", () => {
    const doc = parseMarkdown("> line one\n> line two");
    expect(doc).toEqual([
      { kind: "blockquote", blocks: [{ kind: "paragraph", spans: [{ text: "line one line two" }] }] },
    ]);
  });

  it("an empty string parses to an empty doc", () => {
    expect(parseMarkdown("")).toEqual([]);
  });
});

describe("markdownOutline", () => {
  it("lists every ## heading in order with a unique anchor, ignoring ### and ####", () => {
    expect(markdownOutline("## Acceptable Use\n\ntext\n\n### Sub\n\n## Contact\n\n## Contact")).toEqual([
      { id: "acceptable-use", title: "Acceptable Use" },
      { id: "contact", title: "Contact" },
      { id: "contact-2", title: "Contact" },
    ]);
  });

  it("uses the heading's text without its markup, and falls back for a heading with no letters", () => {
    expect(markdownOutline("## **Bold** title\n\n## ???")).toEqual([
      { id: "bold-title", title: "Bold title" },
      { id: "section", title: "???" },
    ]);
  });
});

describe("isMarkdownEmpty / markdownWordCount", () => {
  it("empty/whitespace-only is empty", () => {
    expect(isMarkdownEmpty("")).toBe(true);
    expect(isMarkdownEmpty("   \n  ")).toBe(true);
    expect(isMarkdownEmpty(null)).toBe(true);
    expect(isMarkdownEmpty(undefined)).toBe(true);
  });

  it("non-blank text is not empty", () => {
    expect(isMarkdownEmpty("hi")).toBe(false);
  });

  it("counts words by whitespace", () => {
    expect(markdownWordCount("one two three")).toBe(3);
    expect(markdownWordCount("")).toBe(0);
  });
});

describe("isAllowedLinkHref", () => {
  it("accepts https://, mailto:, and a same-origin relative path", () => {
    expect(isAllowedLinkHref("https://example.com")).toBe(true);
    expect(isAllowedLinkHref("mailto:a@b.com")).toBe(true);
    expect(isAllowedLinkHref("/privacy")).toBe(true);
    expect(isAllowedLinkHref("/docs/get-started")).toBe(true);
  });

  it("rejects everything else, including a scheme-relative //host URL", () => {
    expect(isAllowedLinkHref("http://example.com")).toBe(false);
    expect(isAllowedLinkHref("javascript:alert(1)")).toBe(false);
    expect(isAllowedLinkHref("//evil.com")).toBe(false);
  });
});

describe("validateMarkdown", () => {
  it("a well-formed string within the limit passes", () => {
    expect(validateMarkdown("Hello **world**.", 100, "Body")).toBeNull();
  });

  it("rejects an empty string", () => {
    expect(validateMarkdown("", 100, "Body")).not.toBeNull();
  });

  it("rejects a string over the length limit", () => {
    expect(validateMarkdown("x".repeat(101), 100, "Body")).not.toBeNull();
  });

  it("accepts a string at exactly the length limit", () => {
    expect(validateMarkdown("x".repeat(100), 100, "Body")).toBeNull();
  });

  it("rejects raw HTML tags", () => {
    expect(validateMarkdown("<script>alert(1)</script>", 100, "Body")).not.toBeNull();
    expect(validateMarkdown("plain <b>bold</b> text", 100, "Body")).not.toBeNull();
  });

  it("rejects a link with a disallowed scheme", () => {
    expect(validateMarkdown("[click](javascript:alert(1))", 100, "Body")).not.toBeNull();
  });

  it("accepts an https or mailto link", () => {
    expect(validateMarkdown("[click](https://example.com)", 100, "Body")).toBeNull();
    expect(validateMarkdown("[email](mailto:a@b.com)", 100, "Body")).toBeNull();
  });
});
