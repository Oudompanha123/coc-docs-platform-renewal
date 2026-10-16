import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LegalHistoryPanel } from "./LegalHistoryPanel";
import type { LegalDocumentContent } from "@/lib/legal/legal-document";
import type { LegalVersionMeta, LegalVersionSummary } from "@/lib/legal/legal-api";
import { BACKEND_URL } from "@/lib/auth/api";

const { fetchLegalVersion, fetchLegalVersions } = vi.hoisted(() => ({
  fetchLegalVersion: vi.fn(),
  fetchLegalVersions: vi.fn(),
}));
vi.mock("@/lib/legal/legal-api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/legal/legal-api")>("@/lib/legal/legal-api");
  return { ...actual, fetchLegalVersion, fetchLegalVersions };
});

function content(overrides: Partial<LegalDocumentContent> = {}): LegalDocumentContent {
  return {
    title: "Terms of Service",
    subtitle: "",
    lastUpdated: "2026-10-01",
    updatedBy: "the Platform Team",
    body: "## Section One\n\nSome text.",
    ...overrides,
  };
}

function version(overrides: Partial<LegalVersionSummary> = {}): LegalVersionSummary {
  return {
    id: "v1",
    status: "published",
    versionNo: 1,
    publishedAt: "2026-09-01T12:00:00Z",
    publishedByName: "Jane Doe",
    publishedByAvatarUrl: null,
    initialVersion: false,
    publishNote: null,
    ...overrides,
  };
}

function fullVersion(overrides: Partial<LegalVersionMeta> = {}): LegalVersionMeta {
  return {
    id: "v1",
    slug: "privacy",
    status: "published",
    content: content(),
    versionNo: 1,
    publishedAt: "2026-09-01T12:00:00Z",
    publishedById: "admin-1",
    publishedByName: "Jane Doe",
    publishNote: null,
    updatedAt: "2026-09-01T12:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

function renderPanel(props: Partial<Parameters<typeof LegalHistoryPanel>[0]> = {}) {
  return render(
    <LegalHistoryPanel
      slug="privacy"
      onClose={vi.fn()}
      onPreview={vi.fn()}
      onRestore={vi.fn()}
      canRestore={true}
      {...props}
    />,
  );
}

describe("LegalHistoryPanel", () => {
  it("shows a loading state before the versions arrive", () => {
    fetchLegalVersions.mockReturnValue(new Promise(() => {}));
    renderPanel();
    expect(screen.getByRole("status", { name: "Loading history" })).toBeInTheDocument();
  });

  it("shows an empty state when nothing has been published", async () => {
    fetchLegalVersions.mockResolvedValue([]);
    renderPanel();
    expect(await screen.findByText("Nothing published yet.")).toBeInTheDocument();
  });

  it("shows an error when the version list fails to load", async () => {
    fetchLegalVersions.mockRejectedValue(new Error("Couldn't reach the server."));
    renderPanel();
    expect(await screen.findByText("Couldn't reach the server.")).toBeInTheDocument();
  });

  it("lists each version's status, number, date and publisher", async () => {
    fetchLegalVersions.mockResolvedValue([
      version(),
      version({ id: "v2", status: "draft", versionNo: 2, publishedByName: null, initialVersion: true }),
    ]);
    renderPanel();

    expect(await screen.findByText("published")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
    expect(screen.getByText("v1")).toBeInTheDocument();
    expect(screen.getByText("v2")).toBeInTheDocument();
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Initial version")).toBeInTheDocument();
    expect(screen.queryByText("System")).not.toBeInTheDocument();
  });

  describe("publisher photo and label", () => {
    const row = () => screen.getAllByRole("listitem")[0]!;

    it("an uploaded photo loads from the backend's avatar route, next to the name", async () => {
      fetchLegalVersions.mockResolvedValue([version({ publishedByAvatarUrl: "/api/v1/avatars/acc-1/photo.png" })]);
      renderPanel();
      await screen.findByText("Jane Doe");

      expect(row().querySelector("img")).toHaveAttribute("src", `${BACKEND_URL}/api/v1/avatars/acc-1/photo.png`);
    });

    it("a Google picture is used as-is", async () => {
      const google = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";
      fetchLegalVersions.mockResolvedValue([version({ publishedByAvatarUrl: google })]);
      renderPanel();
      await screen.findByText("Jane Doe");

      expect(row().querySelector("img")).toHaveAttribute("src", google);
    });

    it("no photo, or one that fails to load: the publisher's initial", async () => {
      fetchLegalVersions.mockResolvedValue([
        version(),
        version({ id: "v2", publishedByName: "Sok", publishedByAvatarUrl: "/api/v1/avatars/acc-2/gone.png" }),
      ]);
      renderPanel();
      await screen.findByText("Jane Doe");
      const [first, second] = screen.getAllByRole("listitem");

      expect(first!.querySelector("img")).toBeNull();
      expect(first!).toHaveTextContent("J");
      fireEvent.error(second!.querySelector("img")!);
      expect(second!.querySelector("img")).toBeNull();
      expect(second!).toHaveTextContent("S");
    });

    it("the seeded first version reads 'Initial version', with no photo", async () => {
      fetchLegalVersions.mockResolvedValue([version({ publishedByName: null, initialVersion: true })]);
      renderPanel();

      expect(await screen.findByText("Initial version")).toBeInTheDocument();
      expect(row().querySelector("img")).toBeNull();
    });

    it("a later version whose publisher's account was deleted reads 'Deleted account', not 'Initial version'", async () => {
      fetchLegalVersions.mockResolvedValue([version({ publishedByName: null, initialVersion: false })]);
      renderPanel();

      expect(await screen.findByText("Deleted account")).toBeInTheDocument();
      expect(screen.queryByText("Initial version")).not.toBeInTheDocument();
    });
  });

  it("shows a version's publish note when it has one, and nothing when it doesn't", async () => {
    fetchLegalVersions.mockResolvedValue([
      version({ id: "v1", publishNote: "Updated data retention section" }),
      version({ id: "v2", versionNo: 2, publishNote: null }),
    ]);
    renderPanel();

    expect(await screen.findByText("“Updated data retention section”")).toBeInTheDocument();
  });

  it("Preview fetches the full version and calls onPreview, without touching the draft", async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    fetchLegalVersions.mockResolvedValue([version()]);
    fetchLegalVersion.mockResolvedValue(fullVersion());
    renderPanel({ onPreview });

    await user.click(await screen.findByRole("button", { name: "Preview" }));

    await waitFor(() => expect(fetchLegalVersion).toHaveBeenCalledWith("privacy", "v1"));
    expect(onPreview).toHaveBeenCalledWith(fullVersion());
  });

  it("shows an error if the preview fetch fails, without calling onPreview", async () => {
    const user = userEvent.setup();
    const onPreview = vi.fn();
    fetchLegalVersions.mockResolvedValue([version()]);
    fetchLegalVersion.mockRejectedValue(new Error("Couldn't load that version."));
    renderPanel({ onPreview });

    await user.click(await screen.findByRole("button", { name: "Preview" }));

    expect(await screen.findByText("Couldn't load that version.")).toBeInTheDocument();
    expect(onPreview).not.toHaveBeenCalled();
  });

  it("Restore hands the version id to the editor, which asks before restoring — the panel doesn't ask too", async () => {
    const native = vi.spyOn(window, "confirm");
    const user = userEvent.setup();
    const onRestore = vi.fn();
    fetchLegalVersions.mockResolvedValue([version()]);
    renderPanel({ onRestore });

    await user.click(await screen.findByRole("button", { name: "Restore as draft" }));

    expect(onRestore).toHaveBeenCalledWith("v1");
    expect(native).not.toHaveBeenCalled();
  });

  it("hides the Restore button when canRestore is false (admin, not super_admin)", async () => {
    fetchLegalVersions.mockResolvedValue([version()]);
    renderPanel({ canRestore: false });

    expect(await screen.findByRole("button", { name: "Preview" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Restore as draft" })).not.toBeInTheDocument();
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    fetchLegalVersions.mockResolvedValue([]);
    renderPanel({ onClose });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape", async () => {
    const onClose = vi.fn();
    fetchLegalVersions.mockResolvedValue([]);
    renderPanel({ onClose });

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on backdrop click but not on a click inside the panel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    fetchLegalVersions.mockResolvedValue([]);
    renderPanel({ onClose });

    await user.click(screen.getByText("History"));
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });
});
