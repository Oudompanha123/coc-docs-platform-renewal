import { describe, expect, it } from "vitest";
import { applyMarkdownAction, applyTextColor, type EditState } from "./editing";

/** Text with the selection marked by "[" and "]" — "a [b] c" selects "b". */
function at(marked: string): EditState {
  const start = marked.indexOf("[");
  const end = marked.indexOf("]") - 1;
  return { value: marked.replace("[", "").replace("]", ""), start, end };
}

function show({ value, start, end }: EditState): string {
  return `${value.slice(0, start)}[${value.slice(start, end)}]${value.slice(end)}`;
}

describe("applyMarkdownAction", () => {
  it("bolds the selection, and unbolds it again", () => {
    const once = applyMarkdownAction(at("say [hello] now"), "bold");
    expect(show(once)).toBe("say **[hello]** now");
    expect(show(applyMarkdownAction(once, "bold"))).toBe("say [hello] now");
  });

  it("unbolds a selection that includes its own markers", () => {
    expect(show(applyMarkdownAction(at("[**hello**]"), "bold"))).toBe("[hello]");
  });

  it("inserts a selected placeholder when nothing is selected", () => {
    expect(show(applyMarkdownAction(at("x []"), "italic"))).toBe("x _[italic text]_");
  });

  it("turns lines into a heading and back", () => {
    const once = applyMarkdownAction(at("Ti[]tle"), "h2");
    expect(once.value).toBe("## Title");
    expect(applyMarkdownAction({ ...once, start: 4, end: 4 }, "h2").value).toBe("Title");
  });

  it("switches heading level rather than stacking markers", () => {
    expect(applyMarkdownAction(at("## Ti[]tle"), "h1").value).toBe("# Title");
  });

  it("bullets every selected line, skipping blank ones", () => {
    expect(applyMarkdownAction(at("[one\n\ntwo]"), "bulletList").value).toBe("- one\n\n- two");
  });

  it("numbers lines in order, replacing a bullet", () => {
    expect(applyMarkdownAction(at("[- one\n- two]"), "numberedList").value).toBe("1. one\n2. two");
  });

  it("quotes and unquotes", () => {
    const once = applyMarkdownAction(at("[said]"), "quote");
    expect(once.value).toBe("> said");
    expect(applyMarkdownAction(once, "quote").value).toBe("said");
  });

  it("makes a link with the url selected", () => {
    expect(show(applyMarkdownAction(at("see [docs]"), "link"))).toBe("see [docs]([https://])");
  });

  it("fences a code block on its own lines", () => {
    expect(show(applyMarkdownAction(at("run [npm test] now"), "codeBlock"))).toBe("run \n```\n[npm test]\n```\n now");
  });
});

describe("applyTextColor", () => {
  it("colours the selection and leaves the text selected", () => {
    expect(show(applyTextColor(at("is [down] now"), "red"))).toBe("is [[down]]{color=red} now");
  });

  it("recolours text it already coloured, rather than nesting", () => {
    const red = applyTextColor(at("[down]"), "red");
    expect(applyTextColor(red, "blue").value).toBe("[down]{color=blue}");
  });

  it("recolours a whole span when the span itself is selected", () => {
    const value = "x [down]{color=red} y";
    const span = "[down]{color=red}";
    const start = value.indexOf(span);
    expect(applyTextColor({ value, start, end: start + span.length }, "green").value).toBe("x [down]{color=green} y");
  });

  it("removes the colour with null", () => {
    const red = applyTextColor(at("a [b] c"), "red");
    expect(show(applyTextColor(red, null))).toBe("a [b] c");
  });

  it("does nothing when removing colour from uncoloured text", () => {
    expect(show(applyTextColor(at("a [b] c"), null))).toBe("a [b] c");
  });

  it("inserts selected placeholder text when nothing is selected", () => {
    expect(show(applyTextColor(at("x []"), "blue"))).toBe("x [[colored text]]{color=blue}");
  });
});
