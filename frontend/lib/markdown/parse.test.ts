import { describe, expect, it } from "vitest";
import { markdownToPlainText, parseInline, parseMarkdown, safeHref } from "./parse";

describe("parseMarkdown — blocks", () => {
  it("reads headings, paragraphs, lists, quotes, code and rules", () => {
    const blocks = parseMarkdown(
      ["# Title", "", "Some text", "on two lines", "", "- one", "- two", "", "3. three", "4. four", "", "> quoted", "", "```js", "let a = 1;", "```", "", "---"].join("\n"),
    );
    expect(blocks.map((b) => b.type)).toEqual(["heading", "paragraph", "list", "list", "quote", "code", "rule"]);
    expect(blocks[0]).toMatchObject({ type: "heading", level: 1 });
    expect(blocks[1]).toEqual({
      type: "paragraph",
      children: [{ type: "text", value: "Some text" }, { type: "br" }, { type: "text", value: "on two lines" }],
    });
    expect(blocks[2]).toMatchObject({ type: "list", ordered: false, items: [[{ value: "one" }], [{ value: "two" }]] });
    expect(blocks[3]).toMatchObject({ type: "list", ordered: true, start: 3 });
    expect(blocks[5]).toEqual({ type: "code", lang: "js", value: "let a = 1;" });
  });

  it("does not read inline markers inside a code block", () => {
    expect(parseMarkdown("```\n**not bold**\n```")).toEqual([{ type: "code", lang: "", value: "**not bold**" }]);
  });

  it("runs an unclosed fence to the end rather than dropping it", () => {
    expect(parseMarkdown("```\nstill typing")).toEqual([{ type: "code", lang: "", value: "still typing" }]);
  });

  it("ends a paragraph where a list starts, without a blank line between", () => {
    expect(parseMarkdown("Intro\n- item").map((b) => b.type)).toEqual(["paragraph", "list"]);
  });

  it("treats a bold line as text, not a bullet", () => {
    expect(parseMarkdown("**Note** this")[0]!.type).toBe("paragraph");
  });
});

describe("parseInline", () => {
  it("reads bold, italic, code and links, nested", () => {
    expect(parseInline("**bold _and italic_** `x` [site](https://example.com)")).toEqual([
      { type: "strong", children: [{ type: "text", value: "bold " }, { type: "em", children: [{ type: "text", value: "and italic" }] }] },
      { type: "text", value: " " },
      { type: "code", value: "x" },
      { type: "text", value: " " },
      { type: "link", href: "https://example.com", children: [{ type: "text", value: "site" }] },
    ]);
  });

  it("leaves snake_case_words alone", () => {
    expect(parseInline("use snake_case_names here")).toEqual([{ type: "text", value: "use snake_case_names here" }]);
  });

  it("lets a backslash keep a marker literal", () => {
    expect(parseInline("\\*not italic\\*")).toEqual([{ type: "text", value: "*not italic*" }]);
  });
});

describe("safety (ADR-102)", () => {
  it.each(["javascript:alert(1)", "JaVaScRiPt:alert(1)", "data:text/html,<b>x</b>", "vbscript:x", "//evil.example"])(
    "drops a link to %s but keeps its text",
    (url) => {
      expect(parseInline(`[click](${url})`)).toEqual([{ type: "text", value: "click" }]);
    },
  );

  it("reads a url with parentheses in it", () => {
    expect(parseInline("[wiki](https://en.wikipedia.org/wiki/Foo_(bar))")).toEqual([
      { type: "link", href: "https://en.wikipedia.org/wiki/Foo_(bar)", children: [{ type: "text", value: "wiki" }] },
    ]);
  });

  it("allows http(s), mailto and site paths", () => {
    expect(safeHref("https://a.example")).toBe("https://a.example");
    expect(safeHref("http://a.example")).toBe("http://a.example");
    expect(safeHref("mailto:team@example.com")).toBe("mailto:team@example.com");
    expect(safeHref("/docs/jex3-0")).toBe("/docs/jex3-0");
  });

  it("keeps HTML as literal text", () => {
    expect(parseInline("<script>alert(1)</script>")).toEqual([{ type: "text", value: "<script>alert(1)</script>" }]);
  });
});

describe("markdownToPlainText", () => {
  it("keeps the words and drops the markers", () => {
    expect(markdownToPlainText("## **Maintenance** on _Friday_\n\n- [Status page](https://s.example)\n\n---")).toBe(
      "Maintenance on Friday\nStatus page",
    );
  });
});

describe("text color (ADR-102)", () => {
  it("reads [text]{color=name} for a palette colour, with formatting inside", () => {
    expect(parseInline("[**Urgent** now]{color=red}")).toEqual([
      {
        type: "color",
        color: "red",
        children: [{ type: "strong", children: [{ type: "text", value: "Urgent" }] }, { type: "text", value: " now" }],
      },
    ]);
  });

  it("keeps the text and drops the colour for a name outside the palette", () => {
    expect(parseInline("[hi]{color=hotpink}")).toEqual([{ type: "text", value: "hi" }]);
  });

  it("never treats a CSS value as a colour", () => {
    // Not even matched as a span: only [a-z]+ names are read.
    expect(parseInline("[x]{color=#f00;background:url(evil)}")).toEqual([
      { type: "text", value: "[x]{color=#f00;background:url(evil)}" },
    ]);
  });

  it("is plain text in excerpts", () => {
    expect(markdownToPlainText("Office [closed]{color=red} today")).toBe("Office closed today");
  });
});
