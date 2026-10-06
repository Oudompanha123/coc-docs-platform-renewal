import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ usePathname: () => "/docs/faq" }));
vi.mock("@/lib/docs/useNavStructure", () => ({ useNavStructure: () => [] }));
vi.mock("./DocsHeaderSwitcher", () => ({ DocsHeaderSwitcher: () => null }));

import { DocsSidebar } from "./DocsSidebar";

/**
 * The docs pages (/docs, /docs/faq, …) and their way back to the site. Both
 * links go to the bare domain, which routes each visitor by session and role
 * (app/page.test.tsx covers that) — never straight to the public /welcome
 * page, which sent a signed-in member off their own home.
 */
describe("DocsSidebar", () => {
  it("takes the Coc Docs Platform brand back to the bare domain, not /welcome", () => {
    render(<DocsSidebar />);

    const brand = screen.getByRole("link", { name: /Coc Docs Platform/ });
    expect(brand).toHaveAttribute("href", "/");
  });

  it("takes Back to site to the bare domain too", () => {
    render(<DocsSidebar />);

    expect(screen.getByRole("link", { name: /Back to site/ })).toHaveAttribute("href", "/");
  });

  it("marks the page being read as current", () => {
    render(<DocsSidebar />);

    expect(screen.getByRole("link", { name: "FAQ" })).toHaveAttribute("aria-current", "page");
  });
});
