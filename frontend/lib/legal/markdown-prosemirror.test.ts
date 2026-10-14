import { describe, expect, it } from "vitest";
import { docToMarkdown, markdownToDoc } from "./markdown-prosemirror";

const roundTrip = (md: string) => docToMarkdown(markdownToDoc(md));

describe("markdown <-> editor document", () => {
  it("round-trips every construct in the dialect unchanged", () => {
    const md = [
      "## Agreement to These Terms",
      "By using the Platform you **agree** to *these* Terms. See [Privacy](/privacy) or [mail](mailto:a@b.co).",
      "### Sub-heading",
      "- first\n- second\n  - nested\n- third",
      "1. one\n2. two",
      "> A quoted line.",
      "---",
      "#### Small heading",
    ].join("\n\n");
    expect(roundTrip(md)).toBe(md);
  });

  it("an empty body is one empty paragraph, and back to an empty string", () => {
    expect(markdownToDoc("")).toEqual({ type: "doc", content: [{ type: "paragraph" }] });
    expect(roundTrip("")).toBe("");
  });

  it("turns headings into heading nodes with their level", () => {
    expect(markdownToDoc("## Intro").content?.[0]).toEqual({ type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Intro" }] });
  });

  it("folds what the dialect cannot hold into what it can", () => {
    const doc = {
      type: "doc",
      content: [
        // bold + italic together -> bold (no nesting in the dialect)
        { type: "paragraph", content: [{ type: "text", text: "both", marks: [{ type: "bold" }, { type: "italic" }] }] },
        // a link to a scheme the whitelist refuses -> plain text
        { type: "paragraph", content: [{ type: "text", text: "bad", marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }] }] },
        // three list levels -> the third sits at level two
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "a" }] },
                {
                  type: "bulletList",
                  content: [
                    {
                      type: "listItem",
                      content: [
                        { type: "paragraph", content: [{ type: "text", text: "b" }] },
                        { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "c" }] }] }] },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        // a hard break inside a paragraph -> a space
        { type: "paragraph", content: [{ type: "text", text: "line" }, { type: "hardBreak" }, { type: "text", text: "two" }] },
        // empty paragraphs and headings disappear
        { type: "paragraph" },
        { type: "heading", attrs: { level: 2 } },
      ],
    };
    expect(docToMarkdown(doc)).toBe("**both**\n\nbad\n\n- a\n  - b\n  - c\n\nline two");
  });

  it("keeps spaces outside bold markers so the parser still sees them", () => {
    const doc = { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "a " }, { type: "text", text: " bold ", marks: [{ type: "bold" }] }, { type: "text", text: "b" }] }] };
    expect(docToMarkdown(doc)).toBe("a  **bold** b");
  });
});
