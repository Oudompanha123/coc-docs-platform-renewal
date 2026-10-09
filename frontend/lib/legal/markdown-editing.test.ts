import { describe, expect, it } from "vitest";
import { cycleHeading, insertDivider, insertLink, toggleList, toggleQuote, toggleWrap } from "./markdown-editing";

describe("toggleWrap", () => {
  it("wraps a selection with the marker", () => {
    const result = toggleWrap("hello world", { start: 6, end: 11 }, "**");
    expect(result.text).toBe("hello **world**");
    expect(result.selection).toEqual({ start: 8, end: 13 });
  });

  it("unwraps an already-wrapped selection (toggle off)", () => {
    const result = toggleWrap("hello **world**", { start: 8, end: 13 }, "**");
    expect(result.text).toBe("hello world");
    expect(result.selection).toEqual({ start: 6, end: 11 });
  });

  it("inserts an empty marker pair at a collapsed cursor", () => {
    const result = toggleWrap("hello ", { start: 6, end: 6 }, "**");
    expect(result.text).toBe("hello ****");
    expect(result.selection).toEqual({ start: 8, end: 8 });
  });

  it("works for italic with a single-char marker", () => {
    const result = toggleWrap("hello world", { start: 0, end: 5 }, "*");
    expect(result.text).toBe("*hello* world");
  });
});

describe("cycleHeading", () => {
  it("plain line becomes heading 3", () => {
    const result = cycleHeading("Some title", { start: 3, end: 3 });
    expect(result.text).toBe("### Some title");
  });

  it("heading 3 becomes heading 4", () => {
    const result = cycleHeading("### Some title", { start: 5, end: 5 });
    expect(result.text).toBe("#### Some title");
  });

  it("heading 4 becomes plain", () => {
    const result = cycleHeading("#### Some title", { start: 5, end: 5 });
    expect(result.text).toBe("Some title");
  });

  it("only affects the line the cursor is on, in a multi-line doc", () => {
    const result = cycleHeading("First line\nSecond line\nThird line", { start: 15, end: 15 });
    expect(result.text).toBe("First line\n### Second line\nThird line");
  });

  it("keeps the cursor on the same logical position in the line after the shift", () => {
    // Cursor right after "Some" in "Some title" (position 4) -> after adding
    // "### " (4 chars), the same word boundary is now at position 8.
    const result = cycleHeading("Some title", { start: 4, end: 4 });
    expect(result.selection).toEqual({ start: 8, end: 8 });
  });
});

describe("toggleList — bullets", () => {
  it("adds a bullet to a single plain line", () => {
    const result = toggleList("one line", { start: 0, end: 0 }, false);
    expect(result.text).toBe("- one line");
  });

  it("adds bullets to every line the selection spans", () => {
    const result = toggleList("one\ntwo\nthree", { start: 0, end: 13 }, false);
    expect(result.text).toBe("- one\n- two\n- three");
  });

  it("removes bullets when every spanned line is already a bullet (toggle off)", () => {
    const result = toggleList("- one\n- two", { start: 0, end: 11 }, false);
    expect(result.text).toBe("one\ntwo");
  });

  it("converts an ordered list to a bullet list", () => {
    const result = toggleList("1. one\n2. two", { start: 0, end: 13 }, false);
    expect(result.text).toBe("- one\n- two");
  });
});

describe("toggleList — ordered", () => {
  it("adds sequential numbers to every spanned line", () => {
    const result = toggleList("one\ntwo\nthree", { start: 0, end: 13 }, true);
    expect(result.text).toBe("1. one\n2. two\n3. three");
  });

  it("removes numbering when every spanned line is already ordered (toggle off)", () => {
    const result = toggleList("1. one\n2. two", { start: 0, end: 13 }, true);
    expect(result.text).toBe("one\ntwo");
  });

  it("renumbers from 1 even if converting from a bullet list", () => {
    const result = toggleList("- one\n- two", { start: 0, end: 11 }, true);
    expect(result.text).toBe("1. one\n2. two");
  });
});

describe("toggleQuote", () => {
  it("adds a quote prefix to a single line", () => {
    const result = toggleQuote("hello", { start: 0, end: 0 });
    expect(result.text).toBe("> hello");
  });

  it("removes the quote prefix when already quoted (toggle off)", () => {
    const result = toggleQuote("> hello", { start: 0, end: 0 });
    expect(result.text).toBe("hello");
  });

  it("quotes every line the selection spans", () => {
    const result = toggleQuote("one\ntwo", { start: 0, end: 7 });
    expect(result.text).toBe("> one\n> two");
  });
});

describe("insertDivider", () => {
  it("surrounds the divider with blank lines when inserted mid-paragraph", () => {
    const result = insertDivider("before after", { start: 7, end: 7 });
    expect(result.text).toBe("before \n\n---\n\nafter");
  });

  it("does not duplicate blank lines already present", () => {
    const result = insertDivider("before\n\n\n\nafter", { start: 8, end: 8 });
    expect(result.text).toBe("before\n\n---\n\nafter");
  });

  it("inserts cleanly at the very start of the text", () => {
    const result = insertDivider("after", { start: 0, end: 0 });
    expect(result.text).toBe("---\n\nafter");
  });

  it("inserts cleanly at the very end of the text", () => {
    const result = insertDivider("before", { start: 6, end: 6 });
    expect(result.text).toBe("before\n\n---");
  });
});

describe("insertLink", () => {
  it("wraps the selected text as link text", () => {
    const result = insertLink("click here please", { start: 0, end: 10 }, "https://example.com");
    expect(result.text).toBe("[click here](https://example.com) please");
  });

  it("uses a placeholder when there is no selection", () => {
    const result = insertLink("", { start: 0, end: 0 }, "https://example.com");
    expect(result.text).toBe("[link text](https://example.com)");
  });

  it("places the cursor right after the inserted markdown", () => {
    const result = insertLink("x", { start: 0, end: 1 }, "https://example.com");
    expect(result.selection.start).toBe(result.text.length);
    expect(result.selection.end).toBe(result.text.length);
  });
});
