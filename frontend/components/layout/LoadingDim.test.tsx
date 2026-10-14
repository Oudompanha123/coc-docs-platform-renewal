import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingDim, loadingDimStandaloneHtml } from "./LoadingDim";

/** The full-screen sign-in/sign-out loading overlay. */
describe("LoadingDim", () => {
  it("announces its label and shows it under shadcn's spinner", () => {
    render(<LoadingDim label="Signing in…" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Signing in…");
    expect(status).toHaveClass("loading-dim");
    const spinner = status.querySelector("svg.lucide-loader-circle");
    expect(spinner).not.toBeNull();
    expect(spinner).toHaveClass("animate-spin");
    expect(spinner).toHaveAttribute("aria-hidden", "true");
    // No longer the brand-gradient ring it replaced.
    expect(status.querySelector(".cdp-spinner")).toBeNull();
  });

  it("says Loading… when no label is given", () => {
    render(<LoadingDim />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("writes the same spinner into a new tab's standalone page, escaping the label", () => {
    const html = loadingDimStandaloneHtml("<b>Opening</b>");

    expect(html).toContain('class="spinner"');
    expect(html).not.toContain("conic-gradient");
    expect(html).toContain("&lt;b&gt;Opening&lt;/b&gt;");
    expect(html).not.toContain("<b>Opening</b>");
  });
});
