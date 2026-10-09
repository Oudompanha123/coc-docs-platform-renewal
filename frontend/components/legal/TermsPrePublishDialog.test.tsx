import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TermsPrePublishDialog } from "./TermsPrePublishDialog";
import { BLANK_LEGAL_DOCUMENT, type LegalDocumentContent } from "@/lib/legal/legal-document";

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return { ...BLANK_LEGAL_DOCUMENT, title: "Terms of Service", status: "approved", ...overrides };
}

describe("TermsPrePublishDialog", () => {
  it("shows a ready message and an enabled Publish button when there are no issues", () => {
    render(<TermsPrePublishDialog content={content()} issues={{}} onGoToField={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByText("Ready to publish — no issues found.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

  it("lists every issue and disables Publish while any remain", () => {
    render(
      <TermsPrePublishDialog
        content={content()}
        issues={{ title: "Title is required", "sections[1].body": "Body text is required" }}
        onGoToField={vi.fn()}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(screen.getByText("Body text is required")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("\"Go to field\" passes the section index for a section issue, and null for a top-level one", async () => {
    const user = userEvent.setup();
    const onGoToField = vi.fn();
    render(
      <TermsPrePublishDialog
        content={content()}
        issues={{ title: "Title is required", "sections[2].title": "Heading is required" }}
        onGoToField={onGoToField}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    const buttons = screen.getAllByRole("button", { name: "Go to field" });
    await user.click(buttons[0]!);
    await user.click(buttons[1]!);

    expect(onGoToField).toHaveBeenCalledWith(null);
    expect(onGoToField).toHaveBeenCalledWith(2);
  });

  it("shows the Draft warning only when status is draft", () => {
    const { rerender } = render(
      <TermsPrePublishDialog content={content({ status: "draft" })} issues={{}} onGoToField={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    expect(screen.getByText(/still marked as Draft/)).toBeInTheDocument();

    rerender(<TermsPrePublishDialog content={content({ status: "approved" })} issues={{}} onGoToField={vi.fn()} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.queryByText(/still marked as Draft/)).not.toBeInTheDocument();
  });

  it("passes the typed publish note to onConfirm, with a live character counter", async () => {
    const onConfirm = vi.fn();
    render(<TermsPrePublishDialog content={content()} issues={{}} onGoToField={vi.fn()} onConfirm={onConfirm} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText(/Updated data retention/), { target: { value: "Fixed a typo" } });
    expect(screen.getByText("188 characters left")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Publish" }));
    expect(onConfirm).toHaveBeenCalledWith("Fixed a typo");
  });

  it("calls onCancel from the Cancel button", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<TermsPrePublishDialog content={content()} issues={{}} onGoToField={vi.fn()} onConfirm={vi.fn()} onCancel={onCancel} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
