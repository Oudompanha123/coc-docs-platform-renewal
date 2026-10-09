import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TermsDocumentEditor } from "./TermsDocumentEditor";
import { BLANK_LEGAL_DOCUMENT, type LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalVersionMeta, LegalVersionSummary } from "@/lib/legal/legal-api";

const { fetchLegalDraft, fetchLegalVersions, saveLegalDraft, publishLegalPage, restoreLegalVersion } = vi.hoisted(
  () => ({
    fetchLegalDraft: vi.fn(),
    fetchLegalVersions: vi.fn(),
    saveLegalDraft: vi.fn(),
    publishLegalPage: vi.fn(),
    restoreLegalVersion: vi.fn(),
  }),
);
vi.mock("@/lib/legal/legal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
  return { ...actual, fetchLegalDraft, fetchLegalVersions, saveLegalDraft, publishLegalPage, restoreLegalVersion };
});

vi.mock("@/components/legal/LegalHistoryPanel", () => ({
  LegalHistoryPanel: ({
    onClose,
    onPreview,
    onRestore,
  }: {
    onClose: () => void;
    onPreview: (version: { content: LegalDocumentContent }) => void;
    onRestore: (versionId: string) => void;
  }) => (
    <div role="dialog" aria-label="Version history">
      <button type="button" onClick={onClose}>
        Close
      </button>
      <button type="button" onClick={() => onPreview({ content: content({ title: "Historical Terms" }) })}>
        Preview
      </button>
      <button type="button" onClick={() => onRestore("pub-1")}>
        Restore
      </button>
    </div>
  ),
}));

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    ...BLANK_LEGAL_DOCUMENT,
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    lastUpdated: "2026-10-01",
    sections: [{ id: "intro", title: "Intro", body: "Hello there." }],
    ...overrides,
  };
}

function draftMeta(overrides: Partial<LegalVersionMeta<LegalDocumentContent>> = {}): LegalVersionMeta<LegalDocumentContent> {
  return {
    id: "draft-1",
    slug: "terms",
    status: "draft",
    content: content(),
    versionNo: 1,
    publishedAt: null,
    publishedById: null,
    publishedByName: null,
    publishNote: null,
    updatedAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

function published(overrides: Partial<LegalVersionSummary> = {}): LegalVersionSummary {
  return {
    id: "pub-1",
    status: "published",
    versionNo: 1,
    publishedAt: "2026-09-01T00:00:00Z",
    publishedByName: "Jane Doe",
    publishNote: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchLegalDraft.mockResolvedValue(draftMeta());
  fetchLegalVersions.mockResolvedValue([published()]);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("TermsDocumentEditor", () => {
  it("loads the Terms draft under slug \"terms\" and shows its title", async () => {
    render(<TermsDocumentEditor canEdit />);
    expect(await screen.findByDisplayValue("Terms of Service")).toBeInTheDocument();
    expect(fetchLegalDraft).toHaveBeenCalledWith("terms");
  });

  it("shows the read-only banner and disables controls for an admin (not super_admin)", async () => {
    render(<TermsDocumentEditor canEdit={false} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Only Super Admins can edit legal pages.");
    expect(screen.getByDisplayValue("Terms of Service")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
  });

  it("renders the whole form as one card, with every field group in order as a flush row (no per-group box) — task: '/legal-pages: one card'", async () => {
    const { container } = render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    // The one shared card: 16px radius, #e8eaf1 border (named token, task:
    // "remove accent lines, cleaner spacing"), 900px max-width.
    const card = screen.getByDisplayValue("Terms of Service").closest(".max-w-\\[900px\\]");
    expect(card).toHaveClass("rounded-2xl", "border-legal-card-border");

    // Its direct field-group list carries the divider + spacing, not any one
    // group having its own background/border (the old per-group box).
    const groupList = container.querySelector(".divide-y.divide-legal-divider");
    expect(groupList).not.toBeNull();
    for (const child of Array.from(groupList?.children ?? [])) {
      expect(child).not.toHaveClass("border");
      expect(child).not.toHaveClass("bg-page/60");
    }

    // Field groups appear in the task's specified order, Sections correctly
    // interleaved between Document status and End note rather than appended
    // after everything else the way it used to render.
    // The accent line is also a <span> (empty, aria-hidden) and comes first
    // in document order — the label is the first NAMED span.
    const labels = Array.from(groupList?.children ?? [])
      .map((el) => el.querySelector("span:not([aria-hidden])")?.textContent)
      .filter((text): text is string => Boolean(text));
    expect(labels).toEqual(["Title *", "Subtitle", "Document status", "Sections *", "End note", "Last updated *"]);
  });

  it("shows the last-published meta line, or Never published", async () => {
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");
    expect(screen.getByText(/Last published/)).toHaveTextContent("Jane Doe");

    fetchLegalVersions.mockResolvedValue([]);
    const { findByText } = render(<TermsDocumentEditor canEdit />);
    expect(await findByText("Never published")).toBeInTheDocument();
  });

  it("shows an Unsaved changes chip only after an edit, and reports dirty state", async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    render(<TermsDocumentEditor canEdit onDirtyChange={onDirtyChange} />);
    await screen.findByDisplayValue("Terms of Service");
    onDirtyChange.mockClear();

    expect(screen.queryByText("● Unsaved changes")).not.toBeInTheDocument();
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    expect(screen.getByText("● Unsaved changes")).toBeInTheDocument();
    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });

  it("saves the draft under slug \"terms\"", async () => {
    const user = userEvent.setup();
    saveLegalDraft.mockResolvedValue(draftMeta({ versionNo: 2, content: content({ title: "Terms of Service!" }) }));
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.type(screen.getByDisplayValue("Terms of Service"), "!");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(saveLegalDraft).toHaveBeenCalledWith("terms", expect.objectContaining({ title: "Terms of Service!" }), 1));
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
  });

  it("opens the pre-publish check, then publishes with the typed note", async () => {
    const user = userEvent.setup();
    publishLegalPage.mockResolvedValue(draftMeta());
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.click(screen.getByRole("button", { name: "Publish" }));
    expect(screen.getByRole("dialog", { name: "Pre-publish check" })).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Updated data retention/), "Fixed a typo");
    await user.click(within(screen.getByRole("dialog", { name: "Pre-publish check" })).getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(publishLegalPage).toHaveBeenCalledWith("terms", "Fixed a typo"));
    expect(await screen.findByText("Published.")).toBeInTheDocument();
  });

  it("asks to confirm publishing the last-saved draft when there are unsaved changes", async () => {
    const user = userEvent.setup();
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(window.confirm).toHaveBeenCalledWith(
      "You have unsaved draft changes that haven't been saved. Publish the last saved draft anyway?",
    );
    expect(screen.getByRole("dialog", { name: "Pre-publish check" })).toBeInTheDocument();
  });

  it("blocks publishing from the dialog while an issue remains, and Go to field jumps to it", async () => {
    const user = userEvent.setup();
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "" } });
    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(within(screen.getByRole("dialog", { name: "Pre-publish check" })).getByRole("button", { name: "Publish" })).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "Go to field" })[0]!);
    expect(screen.queryByRole("dialog", { name: "Pre-publish check" })).not.toBeInTheDocument();
  });

  it("switches to Preview mode and renders the full document", async () => {
    const user = userEvent.setup();
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.click(screen.getByRole("tab", { name: "preview" }));

    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Intro" })).toBeInTheDocument();
  });

  it("toggles the preview between desktop and mobile width", async () => {
    const user = userEvent.setup();
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");
    await user.click(screen.getByRole("tab", { name: "preview" }));

    const mobileButton = screen.getByRole("button", { name: "mobile" });
    await user.click(mobileButton);

    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" }).closest("div.max-w-\\[390px\\]")).toBeInTheDocument();
  });

  it("clicking a section in the outline expands it in the accordion", async () => {
    const user = userEvent.setup();
    render(
      <TermsDocumentEditor canEdit />,
    );
    await screen.findByDisplayValue("Terms of Service");

    // The sole section starts expanded; collapse it first so the click has
    // something to prove.
    await user.click(screen.getByRole("button", { name: "Collapse section 1" }));
    expect(screen.queryByPlaceholderText("Section heading")).not.toBeInTheDocument();

    await user.click(screen.getByRole("navigation", { name: "Outline" }).querySelector("button")!);

    expect(screen.getByRole("tab", { name: "edit" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByPlaceholderText("Section heading")).toBeInTheDocument();
  });

  it("autosaves 30s after an edit, without needing another one", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    saveLegalDraft.mockResolvedValue(draftMeta({ versionNo: 2, content: content({ title: "Terms of Service!" }) }));
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.type(screen.getByDisplayValue("Terms of Service"), "!");
    expect(saveLegalDraft).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(30_000);

    expect(saveLegalDraft).toHaveBeenCalledWith("terms", expect.objectContaining({ title: "Terms of Service!" }), 1);
    vi.useRealTimers();
  });

  it("does not autosave while an issue remains", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ delay: null });
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.clear(screen.getByDisplayValue("Terms of Service"));
    await vi.advanceTimersByTimeAsync(30_000);

    expect(saveLegalDraft).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("opens and closes the History panel, and previews/restores a version", async () => {
    const user = userEvent.setup();
    restoreLegalVersion.mockResolvedValue(draftMeta({ versionNo: 2, content: content({ title: "Restored Terms" }) }));
    render(<TermsDocumentEditor canEdit />);
    await screen.findByDisplayValue("Terms of Service");

    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByRole("dialog", { name: "Version history" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Restore" }));
    await waitFor(() => expect(restoreLegalVersion).toHaveBeenCalledWith("terms", "pub-1"));
    expect(await screen.findByDisplayValue("Restored Terms")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Version history" })).not.toBeInTheDocument();
  });
});
