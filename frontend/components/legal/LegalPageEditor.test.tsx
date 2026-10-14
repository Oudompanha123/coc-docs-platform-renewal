import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalPageEditor } from "./LegalPageEditor";
import { ConfirmProvider } from "@/components/ui/confirm";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalVersionMeta, LegalVersionSummary } from "@/lib/legal/legal-api";

const { fetchLegalDraft, fetchLegalVersions, fetchLegalVersion, saveLegalDraft, publishLegalPage, restoreLegalVersion } = vi.hoisted(() => ({
  fetchLegalDraft: vi.fn(),
  fetchLegalVersions: vi.fn(),
  fetchLegalVersion: vi.fn(),
  saveLegalDraft: vi.fn(),
  publishLegalPage: vi.fn(),
  restoreLegalVersion: vi.fn(),
}));
vi.mock("@/lib/legal/legal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
  return { ...actual, fetchLegalDraft, fetchLegalVersions, fetchLegalVersion, saveLegalDraft, publishLegalPage, restoreLegalVersion };
});

vi.mock("@/components/legal/LegalHistoryPanel", () => ({
  LegalHistoryPanel: ({ onRestore }: { onRestore: (id: string) => void }) => (
    <div role="dialog" aria-label="Version history">
      <button type="button" onClick={() => onRestore("pub-1")}>
        Restore
      </button>
    </div>
  ),
}));

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    title: "Terms of Service",
    subtitle: "Coc Docs Platform · Legal Information",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: "## Agreement\n\nYou agree.\n\n## Contact\n\nWrite to us.",
    ...overrides,
  };
}

function meta(overrides: Partial<LegalVersionMeta<LegalDocumentContent>> = {}): LegalVersionMeta<LegalDocumentContent> {
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

const LIVE: LegalVersionSummary = {
  id: "pub-1",
  status: "published",
  versionNo: 1,
  publishedAt: "2026-09-01T00:00:00Z",
  publishedByName: "Jane Doe",
  publishedByAvatarUrl: null,
  initialVersion: false,
  publishNote: null,
};

function renderEditor(props: Partial<Parameters<typeof LegalPageEditor>[0]> = {}) {
  return render(
    <ConfirmProvider>
      <LegalPageEditor slug="terms" pageName="Terms of Service" canEdit {...props} />
    </ConfirmProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchLegalDraft.mockResolvedValue(meta());
  fetchLegalVersions.mockResolvedValue([LIVE]);
  fetchLegalVersion.mockResolvedValue(meta({ id: "pub-1", status: "published" }));
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

async function loaded() {
  return screen.findByDisplayValue("Terms of Service");
}

describe("LegalPageEditor", () => {
  it("loads the draft for its slug into one form with one visual editor — no section list", async () => {
    renderEditor({ slug: "privacy", pageName: "Privacy Policy" });
    await loaded();
    expect(fetchLegalDraft).toHaveBeenCalledWith("privacy");
    const content = await screen.findByRole("textbox", { name: "Content" });
    expect(within(content).getByRole("heading", { level: 2, name: "Agreement" })).toBeInTheDocument();
    expect(screen.queryByRole("complementary", { name: "Sections" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add section/i })).not.toBeInTheDocument();
  });

  it("opens content still in the pre-V81 Privacy shape without crashing — it is converted on load", async () => {
    fetchLegalDraft.mockResolvedValue(
      meta({
        content: {
          title: "Privacy Policy",
          lead: "What we collect.",
          lastUpdated: "2026-10-01",
          highlights: [{ icon: "eye", title: "Only what's needed", text: "Name." }],
          sections: [{ id: "a", title: "Information we collect", icon: "db", body: "- Email" }],
        } as unknown as LegalDocumentContent,
      }),
    );
    renderEditor({ slug: "privacy", pageName: "Privacy Policy" });
    expect(await screen.findByDisplayValue("Privacy Policy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("What we collect.")).toBeInTheDocument();
    const box = await screen.findByRole("textbox", { name: "Content" });
    expect(within(box).getByRole("heading", { level: 2, name: "Information we collect" })).toBeInTheDocument();
  });

  it("says Live when the saved draft matches the published version, and Changes not live after an edit", async () => {
    const user = userEvent.setup();
    renderEditor();
    await loaded();
    expect(await screen.findByText("Live")).toBeInTheDocument();

    await user.type(screen.getByDisplayValue("Terms of Service"), "!");
    expect(screen.getByText("Changes not live")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
  });

  it("says Not published when nothing is live", async () => {
    fetchLegalVersions.mockResolvedValue([]);
    renderEditor();
    await loaded();
    expect(screen.getByText("Not published")).toBeInTheDocument();
  });

  it("disables Publish when there is nothing new to publish", async () => {
    renderEditor();
    await loaded();
    await screen.findByText("Live");
    expect(screen.getByRole("button", { name: "Publish" })).toBeDisabled();
  });

  it("publishing with unsaved edits saves them first, then publishes — never an older draft", async () => {
    const user = userEvent.setup();
    saveLegalDraft.mockResolvedValue(meta({ versionNo: 2, content: content({ title: "Terms of Service!" }) }));
    publishLegalPage.mockResolvedValue(meta());
    renderEditor();
    await loaded();
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    await user.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog", { name: "Publish Terms of Service" });
    expect(dialog).toHaveTextContent("Your unsaved changes will be saved first");
    await user.type(within(dialog).getByPlaceholderText(/retention/), "Typo fix");
    await user.click(within(dialog).getByRole("button", { name: "Publish" }));

    await waitFor(() => expect(publishLegalPage).toHaveBeenCalledWith("terms", "Typo fix"));
    expect(saveLegalDraft).toHaveBeenCalledWith("terms", expect.objectContaining({ title: "Terms of Service!" }), 1);
    expect(saveLegalDraft.mock.invocationCallOrder[0]).toBeLessThan(publishLegalPage.mock.invocationCallOrder[0]!);
    expect(window.confirm).not.toHaveBeenCalled();
    expect(await screen.findByText(/Published\./)).toBeInTheDocument();
  });

  it("does not publish when saving first fails", async () => {
    const user = userEvent.setup();
    saveLegalDraft.mockRejectedValue(new Error("Couldn't save. Please try again."));
    renderEditor();
    await loaded();
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    await user.click(screen.getByRole("button", { name: "Publish" }));
    await user.click(within(screen.getByRole("dialog", { name: "Publish Terms of Service" })).getByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Couldn't save. Please try again.")).toBeInTheDocument();
    expect(publishLegalPage).not.toHaveBeenCalled();
  });

  it("blocks publishing while an issue remains, and Go to field closes the dialog", async () => {
    const user = userEvent.setup();
    fetchLegalVersions.mockResolvedValue([]);
    renderEditor();
    await loaded();
    fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "" } });

    await user.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = screen.getByRole("dialog", { name: "Publish Terms of Service" });
    expect(within(dialog).getByRole("button", { name: "Publish" })).toBeDisabled();
    expect(dialog).toHaveTextContent("Title is required");

    await user.click(within(dialog).getByRole("button", { name: "Go to field" }));
    expect(screen.queryByRole("dialog", { name: "Publish Terms of Service" })).not.toBeInTheDocument();
  });

  it("a save conflict keeps your edits on screen and offers Reload instead of reloading over them", async () => {
    const user = userEvent.setup();
    const { LegalApiError } = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
    saveLegalDraft.mockRejectedValue(new LegalApiError("Someone else changed this page.", true));
    renderEditor();
    await loaded();
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    await user.click(screen.getByRole("button", { name: "Save draft" }));

    expect(await screen.findByText("Someone else changed this page.")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Terms of Service!")).toBeInTheDocument();
    expect(fetchLegalDraft).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => expect(fetchLegalDraft).toHaveBeenCalledTimes(2));
  });

  it("restoring over unsaved edits asks first, in the app's own dialog", async () => {
    const user = userEvent.setup();
    restoreLegalVersion.mockResolvedValue(meta({ content: content({ title: "Restored title" }) }));
    renderEditor();
    await loaded();
    await user.type(screen.getByDisplayValue("Terms of Service"), "!");

    await user.click(screen.getByRole("button", { name: "Version history" }));
    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(restoreLegalVersion).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Restore anyway" }));
    expect(await screen.findByDisplayValue("Restored title")).toBeInTheDocument();
    expect(restoreLegalVersion).toHaveBeenCalledWith("terms", "pub-1");
  });

  it("Preview renders what readers get", async () => {
    const user = userEvent.setup();
    renderEditor();
    await loaded();
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    expect(screen.getByRole("heading", { level: 1, name: "Terms of Service" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Agreement" })).toBeInTheDocument();
  });

  it("read-only for an admin: no Save or Publish, and the fields are disabled", async () => {
    renderEditor({ canEdit: false });
    expect(await screen.findByRole("alert")).toHaveTextContent("Only Super Admins can edit legal pages.");
    expect(screen.getByDisplayValue("Terms of Service")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Save draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Publish" })).not.toBeInTheDocument();
  });

  it("Ctrl+S saves only while this editor is the visible tab", async () => {
    saveLegalDraft.mockResolvedValue(meta({ versionNo: 2 }));
    const { rerender } = renderEditor({ active: false });
    await loaded();
    fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "Changed" } });

    fireEvent.keyDown(document, { key: "s", ctrlKey: true });
    expect(saveLegalDraft).not.toHaveBeenCalled();

    rerender(
      <ConfirmProvider>
        <LegalPageEditor slug="terms" pageName="Terms of Service" canEdit active />
      </ConfirmProvider>,
    );
    await act(async () => {
      fireEvent.keyDown(document, { key: "s", ctrlKey: true });
    });
    expect(saveLegalDraft).toHaveBeenCalledTimes(1);
  });

  it("autosaves quietly after 30s — the toolbar changes, no banner", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      saveLegalDraft.mockResolvedValue(meta({ versionNo: 2, content: content({ title: "Changed" }) }));
      renderEditor();
      await loaded();
      fireEvent.change(screen.getByDisplayValue("Terms of Service"), { target: { value: "Changed" } });

      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000);
      });

      expect(saveLegalDraft).toHaveBeenCalledTimes(1);
      expect(await screen.findByText(/Saved at/)).toBeInTheDocument();
      expect(screen.queryByText("Draft saved.")).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});
