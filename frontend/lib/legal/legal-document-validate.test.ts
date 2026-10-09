import { describe, expect, it } from "vitest";
import { sectionHasIssue, validateLegalDocument } from "./legal-document-validate";
import { BLANK_LEGAL_DOCUMENT, type LegalDocumentContent } from "./legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    ...BLANK_LEGAL_DOCUMENT,
    title: "Terms of Service",
    lastUpdated: "2026-10-01",
    sections: [{ id: "intro", title: "Intro", body: "Hello there." }],
    ...overrides,
  };
}

describe("validateLegalDocument", () => {
  it("passes a fully filled-in document", () => {
    expect(validateLegalDocument(content())).toEqual({});
  });

  it("requires a title", () => {
    expect(validateLegalDocument(content({ title: "" })).title).toBe("Title is required");
  });

  it("requires a last-updated date in yyyy-mm-dd form", () => {
    expect(validateLegalDocument(content({ lastUpdated: "" })).lastUpdated).toBeDefined();
    expect(validateLegalDocument(content({ lastUpdated: "Oct 1 2026" })).lastUpdated).toBeDefined();
    expect(validateLegalDocument(content({ lastUpdated: "2026-10-01" })).lastUpdated).toBeUndefined();
  });

  it("requires updated-by, with a length cap", () => {
    expect(validateLegalDocument(content({ updatedBy: "" })).updatedBy).toBe("Updated by is required");
    expect(validateLegalDocument(content({ updatedBy: "x".repeat(61) })).updatedBy).toMatch(/exceeds 60/);
  });

  it("allows an empty end note but rejects HTML in a non-empty one", () => {
    expect(validateLegalDocument(content({ endNote: "" })).endNote).toBeUndefined();
    expect(validateLegalDocument(content({ endNote: "<script>alert(1)</script>" })).endNote).toBeDefined();
  });

  it("requires at least one section", () => {
    expect(validateLegalDocument(content({ sections: [] })).sections).toBe("There must be at least one section");
  });

  it("flags a section with an empty heading or body", () => {
    const issues = validateLegalDocument(content({ sections: [{ id: "a", title: "", body: "" }] }));
    expect(issues["sections[0].title"]).toBe("Heading is required");
    expect(issues["sections[0].body"]).toBeDefined();
  });

  it("flags duplicate anchors", () => {
    const issues = validateLegalDocument(
      content({
        sections: [
          { id: "dup", title: "One", body: "a" },
          { id: "dup", title: "Two", body: "b" },
        ],
      }),
    );
    expect(issues["sections[1].id"]).toMatch(/more than one section/);
  });

  it("flags a section body over the 4,000-character limit", () => {
    const issues = validateLegalDocument(content({ sections: [{ id: "a", title: "A", body: "x".repeat(4001) }] }));
    expect(issues["sections[0].body"]).toMatch(/exceeds 4000/);
  });
});

describe("sectionHasIssue", () => {
  it("is true only for keys belonging to that section index", () => {
    const issues = { "sections[0].title": "bad", "sections[2].body": "bad" };
    expect(sectionHasIssue(issues, 0)).toBe(true);
    expect(sectionHasIssue(issues, 1)).toBe(false);
    expect(sectionHasIssue(issues, 2)).toBe(true);
  });
});
