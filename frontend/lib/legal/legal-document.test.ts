import { describe, expect, it } from "vitest";
import { BLANK_LEGAL_DOCUMENT, formatLegalDate, legalDocReadMinutes, legalDocWordCount, normalizeLegalDocument } from "./legal-document";

describe("legal-document", () => {
  it("a blank page has an empty body and the default byline", () => {
    expect(BLANK_LEGAL_DOCUMENT.body).toBe("");
    expect(BLANK_LEGAL_DOCUMENT.updatedBy).toBe("the Platform Team");
  });

  it("counts words and read minutes from the one body", () => {
    expect(legalDocWordCount({ body: "## Intro\n\nHello there friend." })).toBe(5);
    expect(legalDocReadMinutes({ body: "" })).toBe(1);
    expect(legalDocReadMinutes({ body: "word ".repeat(401) })).toBe(3);
  });

  it("formats yyyy-mm-dd without a timezone shift, and leaves anything else alone", () => {
    expect(formatLegalDate("2026-10-01")).toBe("1 Oct 2026");
    expect(formatLegalDate("soon")).toBe("soon");
  });
});


describe("normalizeLegalDocument — content saved before V81", () => {
  it("converts Privacy's highlights/CTA shape the way V81 does", () => {
    const doc = normalizeLegalDocument({
      title: "Privacy Policy",
      lead: "What we collect.",
      lastUpdated: "2026-10-01",
      plainLanguage: "We collect little.",
      highlights: [{ icon: "eye", title: "Only what's needed", text: "Name and email." }],
      sections: [{ id: "a", title: "Information we collect", icon: "db", body: "- Email" }],
      cta: { title: "Have a question?", text: "Ask us." },
    });
    expect(doc.subtitle).toBe("What we collect.");
    expect(doc.updatedBy).toBe("the Platform Team");
    expect(doc.body).toBe(
      "> We collect little.\n\n- **Only what's needed** — Name and email.\n\n## Information we collect\n\n- Email\n\n## Have a question?\n\nAsk us.",
    );
  });

  it("converts Terms' sections/endNote shape", () => {
    const doc = normalizeLegalDocument({
      title: "Terms",
      subtitle: "Legal",
      status: "draft",
      sections: [{ id: "x", title: "Intro", body: "Hi." }],
      endNote: "*Bye.*",
      lastUpdated: "2026-10-01",
      updatedBy: "Legal Team",
    });
    expect(doc).toEqual({ title: "Terms", subtitle: "Legal", lastUpdated: "2026-10-01", updatedBy: "Legal Team", body: "## Intro\n\nHi.\n\n---\n\n*Bye.*" });
  });

  it("fills every field for an empty or missing object, and leaves a current one alone", () => {
    expect(normalizeLegalDocument(undefined)).toEqual({ title: "", subtitle: "", lastUpdated: "", updatedBy: "the Platform Team", body: "" });
    const current = { title: "T", subtitle: "", lastUpdated: "2026-10-01", updatedBy: "X", body: "## A" };
    expect(normalizeLegalDocument(current)).toEqual(current);
  });
});
