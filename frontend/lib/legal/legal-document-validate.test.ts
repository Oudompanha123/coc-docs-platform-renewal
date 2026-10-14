import { describe, expect, it } from "vitest";
import { validateLegalDocument } from "./legal-document-validate";
import { LEGAL_DOC_LIMITS, type LegalDocumentContent } from "./legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: "## Agreement\n\nBy using the Platform you agree.",
    ...overrides,
  };
}

describe("validateLegalDocument (mirrors LegalDocumentValidator.java)", () => {
  it("a complete page has no issues", () => {
    expect(validateLegalDocument(content())).toEqual({});
  });

  it("requires title, last updated, updated by and a body", () => {
    const issues = validateLegalDocument(content({ title: " ", lastUpdated: "", updatedBy: "", body: "  " }));
    expect(Object.keys(issues).sort()).toEqual(["body", "lastUpdated", "title", "updatedBy"]);
  });

  it("the subtitle is optional but capped", () => {
    expect(validateLegalDocument(content({ subtitle: "" }))).toEqual({});
    expect(validateLegalDocument(content({ subtitle: "x".repeat(LEGAL_DOC_LIMITS.maxSubtitleLength + 1) })).subtitle).toBeDefined();
  });

  it("caps the body and applies the Markdown whitelist to it", () => {
    expect(validateLegalDocument(content({ body: "x".repeat(LEGAL_DOC_LIMITS.maxBodyLength + 1) })).body).toMatch(/exceeds/);
    expect(validateLegalDocument(content({ body: "<b>hi</b>" })).body).toMatch(/HTML/);
    expect(validateLegalDocument(content({ body: "[x](javascript:alert(1))" })).body).toMatch(/link/);
  });
});
