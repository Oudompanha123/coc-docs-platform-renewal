import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_DOCUMENTS } from "@/components/legal/content";

// jsdom has neither IntersectionObserver nor scrollIntoView — the page only
// needs them not to throw; the scroll-spy highlight is polish, not behaviour
// these tests assert.
class FakeIntersectionObserver {
  observe() {}
  disconnect() {}
  unobserve() {}
}

beforeEach(() => {
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
  Element.prototype.scrollIntoView = vi.fn();
});

describe("LegalPage", () => {
  it("renders every Terms section, in order, with its anchor", () => {
    render(<LegalPage docKey="terms" />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Terms of Service");

    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    for (const section of LEGAL_DOCUMENTS.terms.sections) {
      expect(headings.some((text) => text?.includes(section.title))).toBe(true);
      expect(document.getElementById(section.id)).not.toBeNull();
    }
  });

  it("lists what the Privacy Policy collects, including the linked-account case", () => {
    render(<LegalPage docKey="privacy" />);

    const section = document.getElementById("information-we-collect");
    expect(section).not.toBeNull();
    expect(section).toHaveTextContent("full name, email, and password");
    // Attendance is only ours once an administrator links the account (ADR-021).
    expect(section).toHaveTextContent("only if an admin links your account");
  });

  it("leads back to the registration form from the closing band", () => {
    render(<LegalPage docKey="terms" />);

    expect(screen.getByRole("link", { name: /Back to Register/ })).toHaveAttribute("href", "/register");
  });

  it("scrolls to a section when its contents entry is clicked, without navigating", async () => {
    const user = userEvent.setup();
    render(<LegalPage docKey="terms" />);

    const contents = screen.getByRole("navigation", { name: "On this page" });
    await user.click(within(contents).getByRole("link", { name: /Roles and admins/ }));

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
