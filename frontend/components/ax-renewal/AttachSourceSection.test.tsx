import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { attachManifest, runAnalysis } = vi.hoisted(() => ({
  attachManifest: vi.fn(),
  runAnalysis: vi.fn(),
}));
vi.mock("@/lib/ax-renewal/api", () => ({ attachManifest, runAnalysis }));

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { AttachSourceSection } from "./AttachSourceSection";
import type { AxRenewalProjectDetail } from "@/lib/ax-renewal/api";

function detailFixture(
  overrides: Partial<AxRenewalProjectDetail["project"]> = {},
  analysis: AxRenewalProjectDetail["analysis"] = null,
): AxRenewalProjectDetail {
  return {
    project: {
      id: "p1",
      name: "Sample Project Portfolio",
      description: null,
      status: "draft",
      manifestFilename: null,
      manifestAttachedAt: null,
      attachStats: null,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
      ...overrides,
    },
    analysis,
    stackLayers: [],
    architecture: null,
    pageMappings: [],
    dbChanges: [],
    dbConnection: null,
    destination: null,
    confirmations: {},
    latestImplementationRun: null,
    comments: [],
  };
}

/** A File carrying a `webkitRelativePath`, the way a real folder-picker input hands files back. */
function folderFile(path: string): File {
  const file = new File(["x"], path.split("/").pop() ?? path, { type: "text/plain" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  return file;
}

/** 16 files under one folder — 13 .js, 1 .html, 1 .png, 1 .css — matching the exact breakdown reported against the reference prototype. */
function sampleProjectFiles(): File[] {
  const files: File[] = [];
  for (let i = 0; i < 13; i++) files.push(folderFile(`Sample Project Portfolio/src/file${i}.js`));
  files.push(folderFile("Sample Project Portfolio/index.html"));
  files.push(folderFile("Sample Project Portfolio/logo.png"));
  files.push(folderFile("Sample Project Portfolio/styles.css"));
  return files;
}

describe("AttachSourceSection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the folder-only picker (webkitdirectory) working even when it first mounts after the session finishes loading", () => {
    // Mirrors a real page load: canEdit starts false while useSession() is
    // still fetching, then flips true once it resolves — the exact ordering
    // that broke the mount-effect version of this wiring.
    const { rerender, container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={false} onChanged={vi.fn()} />,
    );
    expect(container.querySelectorAll('input[type="file"]').length).toBe(0);

    rerender(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

    const inputs = container.querySelectorAll('input[type="file"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveAttribute("webkitdirectory");
    expect(inputs[1]).not.toHaveAttribute("webkitdirectory");
  });

  it("scans a picked folder and shows the same file-type breakdown, file count, and folder name the reference prototype reports", async () => {
    const { container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
    );
    const folderInput = container.querySelector('input[type="file"][webkitdirectory]') as HTMLInputElement;
    expect(folderInput).toBeTruthy();

    Object.defineProperty(folderInput, "files", { value: sampleProjectFiles(), configurable: true });
    fireEvent.change(folderInput);

    await screen.findByText("File types found");
    // The card two levels up from the heading (heading -> header row -> card) — not selected by class name, so a later style change to the card's own classes (e.g. its border radius) can't silently break this.
    const extensionsPanel = screen.getByText("File types found").closest("div")!.parentElement as HTMLElement;
    expect(extensionsPanel.textContent).toContain(".js");
    expect(extensionsPanel.textContent).toContain("13");
    expect(extensionsPanel.textContent).toContain(".html");
    expect(extensionsPanel.textContent).toContain(".png");
    expect(extensionsPanel.textContent).toContain(".css");

    const filesListedLabel = await screen.findByText("files listed");
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).toBe("16");

    const nameLabel = screen.getByText("Name");
    expect(nameLabel.parentElement?.querySelector("b")?.textContent).toBe("Sample Project Portfolio");
  });

  it("reads a dropped folder's actual contents, not the single zero-byte pseudo-file plain DataTransfer.files would give", async () => {
    const { container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
    );
    const dropzone = container.querySelector(".border-dashed") as HTMLElement;
    expect(dropzone).toBeTruthy();

    const fileEntry = (name: string): FileSystemEntry =>
      ({
        isFile: true,
        isDirectory: false,
        name,
        file: (success: (f: File) => void) => success(new File(["x"], name)),
      }) as unknown as FileSystemEntry;
    const dirEntry: FileSystemEntry = {
      isFile: false,
      isDirectory: true,
      name: "Sample Project Portfolio",
      createReader: () => {
        let served = false;
        return {
          readEntries: (success: (entries: FileSystemEntry[]) => void) => {
            queueMicrotask(() => {
              success(served ? [] : [fileEntry("index.html"), fileEntry("logo.png"), fileEntry("styles.css")]);
              served = true;
            });
          },
        };
      },
    } as unknown as FileSystemEntry;

    fireEvent.drop(dropzone, {
      dataTransfer: { items: [{ webkitGetAsEntry: () => dirEntry }] },
    });

    const filesListedLabel = await screen.findByText("files listed");
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).toBe("3");
    // The bug this guards against: without directory-entry walking, a
    // dropped folder resolves to one zero-byte, extension-less pseudo-file.
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).not.toBe("1");
  });

  it("shows the Analysis complete card with its two actions once analysis exists, matching the reference prototype's copy", () => {
    runAnalysis.mockResolvedValue({});
    const analysis: AxRenewalProjectDetail["analysis"] = {
      stackDetected: {},
      findings: [],
      pagesDetected: [],
      modelConnected: false,
      analyzedAt: "2026-01-02T00:00:00Z",
    };
    render(<AttachSourceSection detail={detailFixture({}, analysis)} canEdit={true} onChanged={vi.fn()} />);

    expect(screen.getByText("Analysis complete")).toBeInTheDocument();
    expect(
      screen.getByText("Codebase, architecture, pages and findings are open in the explorer."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run analysis again" }));
    expect(runAnalysis).toHaveBeenCalledWith("p1");

    fireEvent.click(screen.getByRole("button", { name: "Open architecture" }));
    expect(push).toHaveBeenCalledWith("/ax-renewal?project=p1&section=understand-architecture");
  });

  it("shows the not-yet-analysed Run analysis card instead when there is no analysis yet", () => {
    render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Run analysis" })).toBeInTheDocument();
    expect(screen.queryByText("Analysis complete")).not.toBeInTheDocument();
    expect(screen.queryByText("Open architecture")).not.toBeInTheDocument();
  });
});
