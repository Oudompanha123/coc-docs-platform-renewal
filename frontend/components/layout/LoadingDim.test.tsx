import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadingDim, loadingDimStandaloneHtml } from "./LoadingDim";

/** The full-screen sign-in/sign-out loading overlay. */
describe("LoadingDim", () => {
  it("announces its label and shows it under the brand ring", () => {
    render(<LoadingDim label="Signing in…" />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Signing in…");
    expect(status).toHaveClass("loading-dim");
    expect(status.querySelector(".cdp-spinner .cdp-spinner-arc")).not.toBeNull();
    // No longer the twelve-blade port of the old reference.
    expect(status.querySelector(".lds-spinner")).toBeNull();
  });

  it("says Loading… when no label is given", () => {
    render(<LoadingDim />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading…");
  });

  it("writes the same ring into a new tab's standalone page, escaping the label", () => {
    const html = loadingDimStandaloneHtml("<b>Opening</b>");

    expect(html).toContain('class="ring"');
    expect(html).toContain("conic-gradient");
    expect(html).toContain("&lt;b&gt;Opening&lt;/b&gt;");
    expect(html).not.toContain("<b>Opening</b>");
  });
});
