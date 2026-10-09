import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PrivacyLegalPageEditor } from "./PrivacyLegalPageEditor";
import type { LegalContent } from "@/lib/legal/content-types";
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

// Out of scope for this component's own tests — covered by their own test files.
vi.mock("@/components/legal/LegalHighlightsForm", () => ({
  LegalHighlightsForm: () => <div>Highlights form</div>,
}));
vi.mock("@/components/legal/LegalSectionsForm", () => ({
  LegalSectionsForm: () => <div>Sections form</div>,
}));
vi.mock("@/components/legal/LegalSummaryForm", () => ({
  LegalSummaryForm: () => <div>Summary form</div>,
}));
vi.mock("@/components/legal/LegalHistoryPanel", () => ({
  LegalHistoryPanel: ({
    onClose,
    onPreview,
    onRestore,
  }: {
    onClose: () => void;
    onPreview: (version: { content: LegalContent }) => void;
    onRestore: (versionId: string) => void;
  }) => (
    <div role="dialog" aria-label="Version history">
      <button type="button" onClick={onClose}>
        Close
      </button>
      <button type="button" onClick={() => onPreview({ content: content({ title: "Historical Privacy Policy" }) })}>
        Preview
      </button>
      <button type="button" onClick={() => onRestore("pub-1")}>
        Restore
      </button>
    </div>
  ),
}));

function content(overrides: Partial<LegalContent> = {}): LegalContent {
  return {
    title: "Privacy Policy",
    lead: "The simple rules.",
    eyebrow: "Coc Docs Platform · Legal",
    lastUpdated: "2026-10-01",
    status: "draft",
    bulletStyle: "circle",
    highlights: [
      { icon: "person", title: "Your account", text: "Keep it safe." },
      { icon: "document", title: "Your work", text: "For your team only." },
      { icon: "ban", title: "Fair use", text: "Stay in your role." },
    ],
    plainLanguage: "Summary.",
    sections: [{ id: "s1", title: "Section One", icon: "document", body: "Some text." }],
    cta: { title: "Have a question?", text: "We can help." },
    ...overrides,
  };
}

function draftMeta(overrides: Partial<LegalVersionMeta> = {}): LegalVersionMeta {
  return {
    id: "draft-1",
    slug: "privacy",
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

function renderEditor(canEdit = true) {
  return render(<PrivacyLegalPageEditor canEdit={canEdit} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchLegalDraft.mockResolvedValue(draftMeta());
  fetchLegalVersions.mockResolvedValue([published()]);
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

describe("PrivacyLegalPageEditor", () => {
  it("loads the draft on mount and shows its title in the form", async () => {
    renderEditor();

    expect(await screen.findByDisplayValue("Privacy Policy")).toBeInTheDocument();
    expect(fetchLegalDraft).toHaveBeenCalledWith("privacy");
  });

  it("shows the read-only banner and disables form controls for an admin (not super_admin)", async () => {
    renderEditor(false);

    expect(await screen.findByRole("alert")).toHaveTextContent("Only Super Admins can edit legal pages.");
    expect(screen.getByDisplayValue("Privacy Policy")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });

  it("shows no banner and enabled controls for a super_admin", async () => {
    renderEditor(true);
    await screen.findByDisplayValue("Privacy Policy");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Privacy Policy")).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
  });

  it("shows the last-published meta line", async () => {
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    expect(screen.getByText(/Last published/)).toHaveTextContent("Jane Doe");
    expect(screen.getByText("/privacy")).toBeInTheDocument();
  });

  it("shows an Unsaved changes chip only after an edit, and Save draft is disabled until then", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    expect(screen.queryByText("● Unsaved changes")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeDisabled();

    await user.type(screen.getByDisplayValue("Privacy Policy"), "!");

    expect(screen.getByText("● Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save draft" })).toBeEnabled();
  });

  it("saves the draft and clears the unsaved chip on success", async () => {
    const user = userEvent.setup();
    saveLegalDraft.mockResolvedValue(draftMeta({ versionNo: 2, content: content({ title: "Privacy Policy!" }) }));
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.type(screen.getByDisplayValue("Privacy Policy"), "!");
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    await waitFor(() => expect(saveLegalDraft).toHaveBeenCalledWith("privacy", expect.objectContaining({ title: "Privacy Policy!" }), 1));
    expect(await screen.findByText("Draft saved.")).toBeInTheDocument();
    expect(screen.queryByText("● Unsaved changes")).not.toBeInTheDocument();
  });

  it("publishes after confirming, then reloads", async () => {
    const user = userEvent.setup();
    publishLegalPage.mockResolvedValue(draftMeta());
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");
    fetchLegalDraft.mockClear();

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => expect(publishLegalPage).toHaveBeenCalledWith("privacy"));
    expect(await screen.findByText("Published.")).toBeInTheDocument();
    expect(fetchLegalDraft).toHaveBeenCalledWith("privacy");
  });

  it("does not publish when the confirmation is declined", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.click(screen.getByRole("button", { name: "Publish" }));

    expect(publishLegalPage).not.toHaveBeenCalled();
  });

  it("opens and closes the History panel", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.click(screen.getByRole("button", { name: "History" }));
    expect(screen.getByRole("dialog", { name: "Version history" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog", { name: "Version history" })).not.toBeInTheDocument();
  });

  it("previewing a version from history shows it full-page, with a way back to the form", async () => {
    const user = userEvent.setup();
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Preview" }));

    expect(screen.getByRole("dialog", { name: "Version preview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Historical Privacy Policy" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Privacy Policy")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to form" }));
    expect(screen.queryByRole("dialog", { name: "Version preview" })).not.toBeInTheDocument();
  });

  it("restoring a version from history replaces the draft, not the live page, and closes history", async () => {
    const user = userEvent.setup();
    restoreLegalVersion.mockResolvedValue(
      draftMeta({ versionNo: 2, content: content({ title: "Restored Privacy Policy" }) }),
    );
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Restore" }));

    await waitFor(() => expect(restoreLegalVersion).toHaveBeenCalledWith("privacy", "pub-1"));
    expect(await screen.findByDisplayValue("Restored Privacy Policy")).toBeInTheDocument();
    expect(screen.getByText("Restored into your draft. Publish to make it live.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Version history" })).not.toBeInTheDocument();
    expect(publishLegalPage).not.toHaveBeenCalled();
  });

  it("shows an error if restoring fails, without closing history", async () => {
    const user = userEvent.setup();
    restoreLegalVersion.mockRejectedValue(new Error("Couldn't restore that version."));
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    await user.click(screen.getByRole("button", { name: "History" }));
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(await screen.findByText("Couldn't restore that version.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Version history" })).toBeInTheDocument();
  });

  it("links View live page to /privacy", async () => {
    renderEditor();
    await screen.findByDisplayValue("Privacy Policy");

    expect(screen.getByRole("link", { name: /View live page/ })).toHaveAttribute("href", "/privacy");
  });

  it("reports its dirty state via onDirtyChange", async () => {
    const user = userEvent.setup();
    const onDirtyChange = vi.fn();
    render(<PrivacyLegalPageEditor canEdit onDirtyChange={onDirtyChange} />);
    await screen.findByDisplayValue("Privacy Policy");
    onDirtyChange.mockClear();

    await user.type(screen.getByDisplayValue("Privacy Policy"), "!");

    expect(onDirtyChange).toHaveBeenCalledWith(true);
  });
});
