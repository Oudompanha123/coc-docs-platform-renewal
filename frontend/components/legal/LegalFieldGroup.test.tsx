import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalFieldGroup } from "./LegalFieldGroup";

describe("LegalFieldGroup", () => {
  it("renders the label and its children, with no required marker by default", () => {
    render(
      <LegalFieldGroup label="Title">
        <input defaultValue="hello" />
      </LegalFieldGroup>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("shows a required marker when required", () => {
    render(
      <LegalFieldGroup label="Title" required>
        <input />
      </LegalFieldGroup>,
    );

    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("shows the one-line helper text under the label when given one, and nothing when not", () => {
    const { rerender } = render(
      <LegalFieldGroup label="Title" helper="Shown as the page heading.">
        <input />
      </LegalFieldGroup>,
    );
    expect(screen.getByText("Shown as the page heading.")).toBeInTheDocument();

    rerender(
      <LegalFieldGroup label="Title">
        <input />
      </LegalFieldGroup>,
    );
    expect(screen.queryByText("Shown as the page heading.")).not.toBeInTheDocument();
  });

  it("has no left accent line and no own background/border (task: 'remove accent lines')", () => {
    const { container } = render(
      <LegalFieldGroup label="Title">
        <input />
      </LegalFieldGroup>,
    );

    // The old accent line was a dedicated `aria-hidden` span — nothing in
    // this component should render one any more.
    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument();
    const root = container.firstElementChild;
    expect(root).not.toHaveClass("border");
    expect(root).not.toHaveClass("bg-page/60");
  });

  it("the label stays the same grey whether or not a field inside is focused — no focus-reactive classes at all", () => {
    render(
      <LegalFieldGroup label="Title">
        <input />
      </LegalFieldGroup>,
    );

    const label = screen.getByText("Title");
    expect(label).toHaveClass("text-legal-label");
    expect(label.className).not.toMatch(/focus-within/);
  });

  it("desktop layout: a fixed 220px label column beside the field, by default", () => {
    const { container } = render(
      <LegalFieldGroup label="Title">
        <input />
      </LegalFieldGroup>,
    );

    const root = container.firstElementChild;
    expect(root).toHaveClass("lg:flex-row");
    const labelColumn = screen.getByText("Title").closest("div")?.parentElement;
    expect(labelColumn).toHaveClass("lg:w-[220px]");
  });

  it("fullWidth: label+helper stack above the field instead of sharing a row with it (Sections only)", () => {
    const { container } = render(
      <LegalFieldGroup label="Sections" helper="Headings + body of the document." fullWidth>
        <div>the accordion</div>
      </LegalFieldGroup>,
    );

    const root = container.firstElementChild;
    expect(root).not.toHaveClass("lg:flex-row");
    expect(root).not.toHaveClass("lg:w-[220px]");
    expect(screen.getByText("the accordion")).toBeInTheDocument();
  });
});
