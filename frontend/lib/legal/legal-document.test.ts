import { describe, expect, it } from "vitest";
import { legalDocWordCount, slugifyAnchor, uniqueAnchor } from "./legal-document";

describe("slugifyAnchor", () => {
  it("lowercases and dashes a plain title", () => {
    expect(slugifyAnchor("Acceptable Use")).toBe("acceptable-use");
  });

  it("strips punctuation instead of dashing it", () => {
    expect(slugifyAnchor("Your \"Content\" & Data")).toBe("your-content-data");
  });

  it("trims leading/trailing dashes left by leading/trailing punctuation", () => {
    expect(slugifyAnchor("  -- Hello! --  ")).toBe("hello");
  });

  it("falls back to \"section\" for a title with no letters or digits", () => {
    expect(slugifyAnchor("")).toBe("section");
    expect(slugifyAnchor("!!!")).toBe("section");
  });
});

describe("uniqueAnchor", () => {
  it("returns the anchor unchanged when nothing collides", () => {
    expect(uniqueAnchor("contact", new Set(["intro"]))).toBe("contact");
  });

  it("appends -2 on a first collision", () => {
    expect(uniqueAnchor("contact", new Set(["contact"]))).toBe("contact-2");
  });

  it("keeps incrementing past multiple collisions", () => {
    expect(uniqueAnchor("contact", new Set(["contact", "contact-2", "contact-3"]))).toBe("contact-4");
  });
});

describe("legalDocWordCount", () => {
  it("sums every section body plus the end note", () => {
    const words = legalDocWordCount({
      sections: [
        { id: "a", title: "A", body: "one two three" },
        { id: "b", title: "B", body: "four five" },
      ],
      endNote: "six",
    });
    expect(words).toBe(6);
  });

  it("counts zero for an empty document", () => {
    expect(legalDocWordCount({ sections: [], endNote: "" })).toBe(0);
  });
});
