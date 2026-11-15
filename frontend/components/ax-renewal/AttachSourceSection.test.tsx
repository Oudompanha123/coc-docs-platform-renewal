import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { attachManifest, runAnalysis, fetchEngineStatus, uploadProjectSource } = vi.hoisted(() => ({
  attachManifest: vi.fn(),
  // The source upload that follows every attach (ADR-118).
  uploadProjectSource: vi.fn().mockResolvedValue(undefined),
  runAnalysis: vi.fn(),
  // Added with the analysing panel (ADR-043): the section asks on mount what
  // is doing the analysis, to label the progress card. "Not connected" keeps
  // these tests on the branch they were written for.
  fetchEngineStatus: vi.fn().mockResolvedValue({ connected: false, readsSource: false }),
}));
vi.mock("@/lib/ax-renewal/api", () => ({ attachManifest, runAnalysis, fetchEngineStatus, uploadProjectSource }));

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { AttachSourceSection } from "./AttachSourceSection";
import * as enginePreference from "@/lib/ax-renewal/engine-preference";
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
      revision: 0,
      member: true,
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
    members: [],
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

/** A minimal fake implementing just the FileSystemFileHandle shape readPickedDirectory reads. */
function fakeFileHandle(name: string, content = "x"): FileSystemFileHandle {
  return { kind: "file", name, getFile: async () => new File([content], name) } as unknown as FileSystemFileHandle;
}

/** A minimal fake implementing just the FileSystemDirectoryHandle shape readPickedDirectory reads. */
function fakeDirHandle(
  name: string,
  children: [string, FileSystemFileHandle | FileSystemDirectoryHandle][],
): FileSystemDirectoryHandle {
  return {
    kind: "directory",
    name,
    entries: () =>
      (async function* () {
        for (const entry of children) yield entry;
      })(),
  } as unknown as FileSystemDirectoryHandle;
}

/**
 * Holds attachManifest's promise open so a test can inspect the transient
 * scanning/attaching state deterministically before letting the automatic
 * attach (Choose a different folder/Attach removed — attaching now happens
 * on its own right after a scan) complete.
 */
function deferAttach(): () => void {
  let resolve!: () => void;
  attachManifest.mockImplementation(() => new Promise<void>((r) => (resolve = r)));
  return () => resolve();
}

describe("AttachSourceSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // The override is *written* for real by the component — only the read
    // is spied, below — so a path typed in one test is still in storage for
    // the next one. That is how "Run analysis again" came to be called with
    // another test's folder instead of the empty string it asserts.
    try {
      localStorage.clear();
    } catch {
      // Storage is not reliably available in this sandbox; tests that need a
      // specific value spy on engine-preference rather than seeding it.
    }
  });
  afterEach(() => {
    delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
  });

  describe("the source path override (ADR-054)", () => {
    // Spies on engine-preference.ts's own export rather than seeding real
    // localStorage -- this sandbox's Storage polyfill does not reliably
    // implement getItem/setItem (see that module's own test file), and
    // reading storage correctly is that module's job, unit tested there.
    // What belongs here is only that this component reads it on mount and
    // renders what it returns. Restored after each test so the override
    // cannot leak into a later test in this file.
    afterEach(() => vi.restoreAllMocks());

    it("is not offered when no model is connected", async () => {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: false, readsSource: false });
      render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

      await waitFor(() => expect(fetchEngineStatus).toHaveBeenCalled());
      expect(screen.queryByLabelText(/legacy project's path/)).not.toBeInTheDocument();
    });

    it("is not offered to somebody who cannot edit", async () => {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      render(<AttachSourceSection detail={detailFixture()} canEdit={false} onChanged={vi.fn()} />);

      await waitFor(() => expect(fetchEngineStatus).toHaveBeenCalled());
      expect(screen.queryByLabelText(/legacy project's path/)).not.toBeInTheDocument();
    });

    it("prefills from what engine-preference.ts reports for this project", async () => {
      vi.spyOn(enginePreference, "readSourcePathOverride").mockReturnValue("C:\\legacy\\app");
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

      expect(await screen.findByLabelText(/legacy project's path/)).toHaveValue("C:\\legacy\\app");
    });

    it("sends the typed override with the next Run analysis", async () => {
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

      const input = await screen.findByLabelText(/legacy project's path/);
      fireEvent.change(input, { target: { value: "/home/dev/legacy-app" } });
      expect(input).toHaveValue("/home/dev/legacy-app");

      fireEvent.click(screen.getByRole("button", { name: "Run analysis" }));

      expect(runAnalysis).toHaveBeenCalledWith(
        "p1",
        expect.any(AbortSignal),
        true,
        "/home/dev/legacy-app",
      );
    });

    it("prefills from a picked folder's own name, since a browser never hands back its real location on disk", async () => {
      const resolveAttach = deferAttach();
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      const { container } = render(
        <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
      );
      const folderInput = container.querySelector('input[type="file"][webkitdirectory]') as HTMLInputElement;
      Object.defineProperty(folderInput, "files", {
        value: [folderFile("legacy-app-checkout/index.html")],
        configurable: true,
      });
      fireEvent.change(folderInput);

      const input = await screen.findByLabelText(/legacy project's path/);
      await waitFor(() => expect(input).toHaveValue("legacy-app-checkout"));

      resolveAttach();
      await waitFor(() => expect(screen.queryByText("File types found")).not.toBeInTheDocument());
    });

    it("never overwrites a legacy path already typed for this project when another folder is then picked", async () => {
      const resolveAttach = deferAttach();
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      const { container } = render(
        <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
      );

      const input = await screen.findByLabelText(/legacy project's path/);
      fireEvent.change(input, { target: { value: "/home/dev/legacy-app" } });

      const folderInput = container.querySelector('input[type="file"][webkitdirectory]') as HTMLInputElement;
      Object.defineProperty(folderInput, "files", {
        value: [folderFile("some-other-checkout/index.html")],
        configurable: true,
      });
      fireEvent.change(folderInput);

      await screen.findByText("File types found");
      expect(input).toHaveValue("/home/dev/legacy-app");

      resolveAttach();
      await waitFor(() => expect(screen.queryByText("File types found")).not.toBeInTheDocument());
    });
  });

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

  it("scans a picked folder, shows the same file-type breakdown/file count/folder name the reference prototype reports, then attaches it automatically", async () => {
    const resolveAttach = deferAttach();
    const onChanged = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={onChanged} />,
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

    // Renamed from "files listed" when dependency trees stopped being counted:
    // the number is the project's own files now, not everything on disk.
    const filesListedLabel = await screen.findByText("project files");
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).toBe("16");

    const nameLabel = screen.getByText("Name");
    expect(nameLabel.parentElement?.querySelector("b")?.textContent).toBe("Sample Project Portfolio");

    // Reached automatically -- there is no button left to click for this.
    expect(attachManifest).toHaveBeenCalledWith("p1", null, null, expect.objectContaining({ fileCount: 16 }));
    expect(screen.queryByRole("button", { name: "Choose a different folder" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Attach" })).not.toBeInTheDocument();

    resolveAttach();
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(screen.queryByText("File types found")).not.toBeInTheDocument();
  });

  it("tells the user when a confirmed folder pick comes back with nothing readable, instead of silently resetting", () => {
    const { container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
    );
    const folderInput = container.querySelector('input[type="file"][webkitdirectory]') as HTMLInputElement;

    // A `change` event with an empty FileList — the same shape a cloud-synced
    // folder (OneDrive Files On-Demand, etc.) produces when its files aren't
    // actually downloaded to this device, distinct from the `cancel` event a
    // real dialog dismissal fires.
    Object.defineProperty(folderInput, "files", { value: [], configurable: true });
    fireEvent.change(folderInput);

    expect(screen.getByRole("alert").textContent).toContain("nothing readable");
    expect(screen.queryByText("File types found")).not.toBeInTheDocument();
  });

  it('uses the File System Access API for "Choose a folder" when the browser offers it, never touching the hidden input', async () => {
    const resolveAttach = deferAttach();
    const root = fakeDirHandle("Sample Project Portfolio", [
      ["index.html", fakeFileHandle("index.html")],
      ["styles.css", fakeFileHandle("styles.css")],
    ]);
    const showDirectoryPicker = vi.fn().mockResolvedValue(root);
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = showDirectoryPicker;

    const { container } = render(
      <AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Choose a folder" }));

    await screen.findByText("File types found");
    expect(showDirectoryPicker).toHaveBeenCalledTimes(1);
    const folderInput = container.querySelector('input[type="file"][webkitdirectory]') as HTMLInputElement;
    expect(folderInput.files?.length ?? 0).toBe(0);
    resolveAttach();
    await waitFor(() => expect(screen.queryByText("File types found")).not.toBeInTheDocument());
  });

  it("returns quietly to empty when the File System Access picker is cancelled, the same as dismissing the classic dialog", async () => {
    const showDirectoryPicker = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"));
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = showDirectoryPicker;

    render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose a folder" }));

    await waitFor(() => expect(showDirectoryPicker).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("File types found")).not.toBeInTheDocument();
  });

  it("shows the same empty-pick message via the File System Access path when the picked folder has nothing readable", async () => {
    (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi
      .fn()
      .mockResolvedValue(fakeDirHandle("Empty", []));

    render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Choose a folder" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("nothing readable");
  });

  it("reads a dropped folder's actual contents, not the single zero-byte pseudo-file plain DataTransfer.files would give", async () => {
    const resolveAttach = deferAttach();
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

    // Renamed from "files listed" when dependency trees stopped being counted:
    // the number is the project's own files now, not everything on disk.
    const filesListedLabel = await screen.findByText("project files");
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).toBe("3");
    // The bug this guards against: without directory-entry walking, a
    // dropped folder resolves to one zero-byte, extension-less pseudo-file.
    expect(filesListedLabel.parentElement?.querySelector("b")?.textContent).not.toBe("1");
    resolveAttach();
    await waitFor(() => expect(screen.queryByText("File types found")).not.toBeInTheDocument());
  });

  it("shows the Analysis complete card with its two actions once analysis exists, matching the reference prototype's copy", () => {
    runAnalysis.mockResolvedValue({});
    const analysis: AxRenewalProjectDetail["analysis"] = {
      stackDetected: {},
      findings: [],
      pagesDetected: [],
      indexed: {},
      runningOnToday: [],
      fileLayout: [],
      moduleCoupling: {},
      recommendedStackMove: [],
      modelConnected: false,
      analyzedAt: "2026-01-02T00:00:00Z",
    };
    render(
      <AttachSourceSection
        detail={detailFixture({ manifestAttachedAt: "2026-01-01T00:00:00Z" }, analysis)}
        canEdit={true}
        onChanged={vi.fn()}
      />,
    );

    expect(screen.getByText("Analysis complete")).toBeInTheDocument();
    expect(
      screen.getByText("Codebase, architecture, pages and findings are open in the explorer."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Run analysis again" }));
    // Second argument is the AbortSignal behind Stop; the third is whether
    // this browser wants the configured model used (ADR-043); the fourth is
    // this browser's remembered source path override for this project,
    // empty here since nothing was typed (ADR-054).
    expect(runAnalysis).toHaveBeenCalledWith("p1", expect.any(AbortSignal), true, "");

    fireEvent.click(screen.getByRole("button", { name: "Open architecture" }));
    expect(push).toHaveBeenCalledWith("/ax-renewal?project=p1&section=understand-architecture");
  });

  it("shows the not-yet-analysed Run analysis card instead when there is no analysis yet", () => {
    render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Run analysis" })).toBeInTheDocument();
    expect(screen.queryByText("Analysis complete")).not.toBeInTheDocument();
    expect(screen.queryByText("Open architecture")).not.toBeInTheDocument();
  });

  describe("refusing to run analysis on a project with nothing to read", () => {
    it("alerts and does not call the API when nothing was ever attached and no path was typed", () => {
      // detailFixture()'s own default: manifestAttachedAt null, nothing picked.
      render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

      fireEvent.click(screen.getByRole("button", { name: "Run analysis" }));

      expect(runAnalysis).not.toHaveBeenCalled();
      expect(screen.getByRole("alert")).toHaveTextContent(
        /attach this project's folder|provide your legacy project's path/i,
      );
    });

    it("proceeds once a folder has been attached, even with no path typed", async () => {
      runAnalysis.mockResolvedValue({});
      render(
        <AttachSourceSection
          detail={detailFixture({ manifestAttachedAt: "2026-01-01T00:00:00Z" })}
          canEdit={true}
          onChanged={vi.fn()}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Run analysis" }));

      await waitFor(() => expect(runAnalysis).toHaveBeenCalledWith("p1", expect.any(AbortSignal), true, ""));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("proceeds once a legacy path has been typed, even with nothing attached", async () => {
      runAnalysis.mockResolvedValue({});
      vi.mocked(fetchEngineStatus).mockResolvedValue({ connected: true, readsSource: false });
      render(<AttachSourceSection detail={detailFixture()} canEdit={true} onChanged={vi.fn()} />);

      const input = await screen.findByLabelText(/legacy project's path/);
      fireEvent.change(input, { target: { value: "/home/dev/legacy-app" } });
      fireEvent.click(screen.getByRole("button", { name: "Run analysis" }));

      await waitFor(() =>
        expect(runAnalysis).toHaveBeenCalledWith("p1", expect.any(AbortSignal), true, "/home/dev/legacy-app"),
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
