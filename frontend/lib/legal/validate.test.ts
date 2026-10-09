import { describe, expect, it } from "vitest";
import { isLegalContentValid, slugifyAnchor, validateLegalContent } from "./validate";
import { BLANK_LEGAL_CONTENT, LEGAL_LIMITS, type LegalContent } from "./content-types";

function valid(): LegalContent {
  return {
    title: "Terms of Service",
    lead: "The simple rules.",
    eyebrow: "Coc Docs Platform · Legal",
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "circle",
    highlights: [
      { icon: "person", title: "Your account", text: "Keep it safe." },
      { icon: "document", title: "Your work", text: "For your team only." },
      { icon: "ban", title: "Fair use", text: "Stay in your role." },
    ],
    plainLanguage: "The short version.",
    sections: [
      { id: "s1", title: "Section One", icon: "document", body: "Some text." },
      { id: "s2", title: "Section Two", icon: "person", body: "one\ntwo" },
    ],
    cta: { title: "Have a question?", text: "We can help." },
  };
}

describe("validateLegalContent", () => {
  it("a well-formed page has no issues", () => {
    expect(validateLegalContent(valid())).toEqual({});
    expect(isLegalContentValid(valid())).toBe(true);
  });

  it("the blank starting content is invalid (title/lastUpdated/sections missing)", () => {
    expect(isLegalContentValid(BLANK_LEGAL_CONTENT)).toBe(false);
  });

  it("a blank title is rejected", () => {
    const issues = validateLegalContent({ ...valid(), title: "" });
    expect(issues.title).toBeDefined();
  });

  it("a title over the max length is rejected", () => {
    const issues = validateLegalContent({ ...valid(), title: "x".repeat(LEGAL_LIMITS.maxTitleLength + 1) });
    expect(issues.title).toBeDefined();
  });

  it("a title at exactly the max length passes", () => {
    const issues = validateLegalContent({ ...valid(), title: "x".repeat(LEGAL_LIMITS.maxTitleLength) });
    expect(issues.title).toBeUndefined();
  });

  it("an eyebrow over the max length is rejected", () => {
    const issues = validateLegalContent({ ...valid(), eyebrow: "x".repeat(LEGAL_LIMITS.maxEyebrowLength + 1) });
    expect(issues.eyebrow).toBeDefined();
  });

  it("a missing eyebrow is fine — it's optional", () => {
    const issues = validateLegalContent({ ...valid(), eyebrow: "" });
    expect(issues.eyebrow).toBeUndefined();
  });

  it("a lead over the max length is rejected", () => {
    const issues = validateLegalContent({ ...valid(), lead: "x".repeat(LEGAL_LIMITS.maxLeadLength + 1) });
    expect(issues.lead).toBeDefined();
  });

  it("a missing lastUpdated is rejected", () => {
    const issues = validateLegalContent({ ...valid(), lastUpdated: "" });
    expect(issues.lastUpdated).toBeDefined();
  });

  it("an unknown bulletStyle is rejected", () => {
    const issues = validateLegalContent({ ...valid(), bulletStyle: "square" as LegalContent["bulletStyle"] });
    expect(issues.bulletStyle).toBeDefined();
  });

  it("not exactly 3 highlights is rejected (fewer)", () => {
    const content = valid();
    const issues = validateLegalContent({ ...content, highlights: content.highlights.slice(0, 2) });
    expect(issues.highlights).toBeDefined();
  });

  it("not exactly 3 highlights is rejected (more)", () => {
    const content = valid();
    const issues = validateLegalContent({
      ...content,
      highlights: [...content.highlights, { icon: "heart", title: "Extra", text: "One too many." }],
    });
    expect(issues.highlights).toBeDefined();
  });

  it("a highlight missing its title is rejected", () => {
    const content = valid();
    content.highlights[0]!.title = "";
    const issues = validateLegalContent(content);
    expect(issues["highlights[0].title"]).toBeDefined();
  });

  it("an empty plain-language string is rejected", () => {
    const issues = validateLegalContent({ ...valid(), plainLanguage: "" });
    expect(issues.plainLanguage).toBeDefined();
  });

  it("a plain-language string over the max length is rejected", () => {
    const issues = validateLegalContent({
      ...valid(),
      plainLanguage: "x".repeat(LEGAL_LIMITS.maxPlainLanguageLength + 1),
    });
    expect(issues.plainLanguage).toBeDefined();
  });

  it("a missing CTA title is rejected", () => {
    const issues = validateLegalContent({ ...valid(), cta: { title: "", text: "We can help." } });
    expect(issues["cta.title"]).toBeDefined();
  });

  it("a CTA text over the max length is rejected", () => {
    const issues = validateLegalContent({
      ...valid(),
      cta: { title: "Hi", text: "x".repeat(LEGAL_LIMITS.maxCtaTextLength + 1) },
    });
    expect(issues["cta.text"]).toBeDefined();
  });

  it("zero sections is rejected", () => {
    const issues = validateLegalContent({ ...valid(), sections: [] });
    expect(issues.sections).toBeDefined();
  });

  it("more than the max sections is rejected", () => {
    const content = valid();
    const sections = Array.from({ length: LEGAL_LIMITS.maxSections + 1 }, (_, i) => ({
      id: `s${i}`,
      title: `Section ${i}`,
      icon: "document",
      body: "text",
    }));
    expect(validateLegalContent({ ...content, sections }).sections).toBeDefined();
  });

  it("duplicate anchor ids are rejected", () => {
    const content = valid();
    content.sections[1]!.id = content.sections[0]!.id;
    const issues = validateLegalContent(content);
    expect(issues["sections[1].id"]).toBeDefined();
  });

  it("a section missing its icon is rejected", () => {
    const content = valid();
    content.sections[0]!.icon = "";
    expect(validateLegalContent(content)["sections[0].icon"]).toBeDefined();
  });

  it("a section needs non-empty body text", () => {
    const content = valid();
    content.sections[0]!.body = "";
    expect(validateLegalContent(content)["sections[0].body"]).toBeDefined();
  });

  it("a section body over the max length is rejected", () => {
    const content = valid();
    content.sections[0]!.body = "x".repeat(LEGAL_LIMITS.maxSectionBodyLength + 1);
    expect(validateLegalContent(content)["sections[0].body"]).toBeDefined();
  });

  it("a section body containing raw HTML is rejected", () => {
    const content = valid();
    content.sections[0]!.body = "<script>alert(1)</script>";
    expect(validateLegalContent(content)["sections[0].body"]).toBeDefined();
  });

  it("a section body with a non-https/mailto link is rejected", () => {
    const content = valid();
    content.sections[0]!.body = "[click](javascript:alert(1))";
    expect(validateLegalContent(content)["sections[0].body"]).toBeDefined();
  });
});

describe("slugifyAnchor", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyAnchor("Using the Platform")).toBe("using-the-platform");
  });

  it("strips punctuation", () => {
    expect(slugifyAnchor("What's Included?")).toBe("what-s-included");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugifyAnchor("  -- Hello --  ")).toBe("hello");
  });

  it("an empty title slugifies to an empty string", () => {
    expect(slugifyAnchor("")).toBe("");
  });
});
