import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_DOCUMENTS, LEGAL_LAST_UPDATED } from "@/components/legal/content";

describe("LegalPage", () => {
  it("renders every Terms section, in order, with its anchor", () => {
    render(<LegalPage docKey="terms" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Terms of Service");

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(LEGAL_DOCUMENTS.terms.sections.map((section) => section.title));
    for (const section of LEGAL_DOCUMENTS.terms.sections) {
      expect(document.getElementById(section.id)).not.toBeNull();
    }
  });

  it("lists what the Privacy Policy collects, including the linked-account case", () => {
    render(<LegalPage docKey="privacy" />);

    const section = document.getElementById("information-we-collect");
    expect(section).not.toBeNull();
    expect(section).toHaveTextContent("your full name, email, and password");
    // Attendance is only ours once an administrator links the account (ADR-021).
    expect(section).toHaveTextContent("only if an admin links your account");
  });

  it("leads back to the registration form", () => {
    render(<LegalPage docKey="terms" />);

    expect(screen.getByRole("link", { name: /Back to Register/ })).toHaveAttribute("href", "/register");
  });

  it("says in the page itself that the copy is not approved legal text", () => {
    render(<LegalPage docKey="terms" />);

    expect(screen.getByText(/replace with approved legal content/)).toBeInTheDocument();
  });

  it("closes with the last-updated line", () => {
    render(<LegalPage docKey="privacy" />);

    expect(screen.getByText(`Last updated by the Platform Team on ${LEGAL_LAST_UPDATED}`)).toBeInTheDocument();
  });

  // Every "Related Policies" entry has to land somewhere that exists — the
  // platform has no Acceptable Use or Security Contacts page, so those point
  // at the section carrying the rule rather than at a 404.
  it.each(["terms", "privacy"] as const)("points every related-policy link at a real target in %s", (docKey) => {
    render(<LegalPage docKey={docKey} />);

    const related = document.getElementById("related-policies");
    const hrefs = Array.from(related?.querySelectorAll("a") ?? []).map((a) => a.getAttribute("href"));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/(terms|privacy)(#[a-z-]+)?$/);
      const [path, hash] = href!.split("#");
      const target = path === "/terms" ? LEGAL_DOCUMENTS.terms : LEGAL_DOCUMENTS.privacy;
      if (hash) expect(target.sections.map((section) => section.id)).toContain(hash);
    }
  });
});
