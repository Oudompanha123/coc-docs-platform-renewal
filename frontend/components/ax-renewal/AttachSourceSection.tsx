"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  ChevronRightIcon,
  DocumentIcon,
  PaperclipIcon,
  SparklesIcon,
  WarningIcon,
} from "@/components/layout/icons";
import {
  ATTACH_STAGE_LABELS,
  buildVerification,
  computeAttachStats,
  formatBytes,
  type AttachStageIndex,
  type AxRenewalAttachStats,
} from "@/lib/ax-renewal/attachStats";
import { attachManifest, fetchEngineStatus, runAnalysis, type AxRenewalEngineStatus, type AxRenewalProjectDetail } from "@/lib/ax-renewal/api";
import { AnalysisProgress } from "@/components/ax-renewal/AnalysisProgress";
import { readSourcePathOverride, readUseModel, writeSourcePathOverride } from "@/lib/ax-renewal/engine-preference";
import {
  readDroppedFiles,
  readPickedDirectory,
  supportsDirectoryDrop,
  supportsDirectoryPicker,
} from "@/lib/ax-renewal/readDroppedFiles";

/** Recognized manifest filenames, matching AxRenewalService's own RUNTIME_HINTS server-side. */
const MANIFEST_FILENAMES = [
  "package.json",
  "composer.json",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "gemfile",
  "go.mod",
  "cargo.toml",
];

/** Picks the best manifest candidate out of an attached folder's files, or null if none is recognized. */
function findManifest(files: FileList | File[]): File | null {
  for (const file of Array.from(files)) {
    const path = file.webkitRelativePath || file.name;
    const basename = path.split("/").pop()?.toLowerCase() ?? "";
    if (MANIFEST_FILENAMES.includes(basename)) {
      return file;
    }
  }
  return null;
}

type Phase = "empty" | "picking" | "scanning" | "reviewing" | "attaching";

/** Shown when a confirmed pick (folder button or drag-and-drop) comes back with no readable files — same wording either way, since the real cause is the same either way (see readDroppedFiles.ts's own doc comment on readPickedDirectory). */
const EMPTY_PICK_MESSAGE =
  "That folder came back with nothing readable in it. If it's inside a cloud-synced folder (OneDrive, " +
  'Google Drive, Dropbox), make sure its files are downloaded to this device — not "available online ' +
  'only" — then try again.';

/**
 * The Attach step from CodeRenewalPlatform.html, reproduced state for state:
 * an empty dropzone that accepts a click or a drag, a "waiting for your
 * folder" beat while the OS dialog is open, a staged reading pass with a
 * live percentage (see attachStats.ts — every stage reports real progress,
 * there is no simulated delay anywhere in this file), then the file-types,
 * attached-stats and verification panels the prototype shows once a folder
 * has been read. Two differences from the prototype, both deliberate: (1)
 * reading the folder and persisting it are two separate steps here — the
 * prototype's single-service demo had no server round trip to separate them
 * from — so a picked folder sits in a "reviewing" phase, scanned but not yet
 * attached, until the user presses Attach; (2) a project with no recognized
 * manifest is still attachable (a static site has none), which the
 * prototype's own copy already anticipates.
 */
export function AttachSourceSection({
  detail,
  canEdit,
  onChanged,
}: {
  detail: AxRenewalProjectDetail;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const router = useRouter();
  const folderInputRef = useRef<HTMLInputElement>(null);
  const filesInputRef = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("empty");
  const [pickWaitSecs, setPickWaitSecs] = useState(0);
  const [stage, setStage] = useState<{ index: AttachStageIndex; detail: string }>({ index: 0, detail: "" });
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  // Shown top-right while analysing -- the slot where the prototype admits
  // "sample data — no model connected". Same honesty, current facts.
  const [engine, setEngine] = useState<AxRenewalEngineStatus | null>(null);
  useEffect(() => {
    void fetchEngineStatus().then(setEngine);
  }, []);
  // One team member's own legacy checkout, per project, remembered only in
  // this browser (ADR-054) — never assumed to be the same folder the
  // backend's own app.ax-renewal.source-path points at, and never sent
  // anywhere until Run analysis is actually pressed.
  const [sourcePath, setSourcePath] = useState("");
  useEffect(() => {
    setSourcePath(readSourcePathOverride(detail.project.id));
  }, [detail.project.id]);
  function handleSourcePathChange(value: string) {
    setSourcePath(value);
    writeSourcePathOverride(detail.project.id, value);
  }
  const engineLabel = !engine
    ? "checking the analyser"
    : !engine.connected
      ? "keyword match — no model connected"
      : !readUseModel()
        ? "keyword match — model available but not in use"
        : sourcePath.trim() || engine.readsSource
          ? "local model — reading your source"
          : "local model — manifest only";
  const [scannedCount, setScannedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  // The browser's own facts about the picked folder, computed as soon as it's
  // chosen — shown as a live preview before Attach is even clicked, then sent
  // alongside the manifest so it's persisted (see attachStats.ts). Cleared
  // once attach succeeds, since `detail.project.attachStats` (from the
  // server) becomes the source of truth from then on.
  const [pickedStats, setPickedStats] = useState<AxRenewalAttachStats | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelledRef = useRef(false);
  const pickTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPickClock() {
    if (pickTimerRef.current != null) {
      clearInterval(pickTimerRef.current);
      pickTimerRef.current = null;
    }
  }

  const handleInputCancel = useCallback(() => {
    stopPickClock();
    setPhase("empty");
  }, []);

  // webkitdirectory/directory aren't part of React's typed input props (they
  // predate a standard), so they're set imperatively — via a *callback* ref
  // rather than a `useEffect(…, [])`, so it fires at the exact moment this
  // particular <input> mounts. That matters here: the input only renders once
  // `canEdit` is true, and `canEdit` depends on the session (see useSession),
  // which is still loading on the component's actual first mount — a
  // mount-effect with an empty dependency array would already have fired
  // and found `folderInputRef.current` null, permanently leaving this input
  // as a plain multi-file picker (folders un-selectable in the OS dialog)
  // once the session resolved and the input finally appeared.
  const registerFolderInput = useCallback(
    (el: HTMLInputElement | null) => {
      folderInputRef.current = el;
      if (!el) return;
      el.setAttribute("webkitdirectory", "");
      el.setAttribute("directory", "");
      // Fires when the OS file dialog is dismissed without a choice — no
      // corresponding React prop exists on <input> (only <dialog> has one),
      // so it's wired imperatively too, same as the reference prototype's
      // own `input.addEventListener("cancel", …)`.
      el.addEventListener("cancel", handleInputCancel);
      return () => el.removeEventListener("cancel", handleInputCancel);
    },
    [handleInputCancel],
  );

  const registerFilesInput = useCallback(
    (el: HTMLInputElement | null) => {
      filesInputRef.current = el;
      if (!el) return;
      el.addEventListener("cancel", handleInputCancel);
      return () => el.removeEventListener("cancel", handleInputCancel);
    },
    [handleInputCancel],
  );

  function beginPick(input: HTMLInputElement | null) {
    if (!input) return;
    setError(null);
    setPickWaitSecs(0);
    setPhase("picking");
    pickTimerRef.current = setInterval(() => setPickWaitSecs((s) => s + 1), 1000);
    // Fire after the repaint so the waiting screen is up before the dialog opens.
    setTimeout(() => input.click(), 30);
  }

  async function handleFilesPicked(files: FileList | File[]) {
    stopPickClock();
    setScannedCount(files.length);
    const manifestFile = findManifest(files);
    setPendingFile(manifestFile);
    setPickedStats(null);
    setPhase("scanning");
    cancelledRef.current = false;
    setStage({ index: 0, detail: "" });
    const stats = await computeAttachStats(files, (index, detailText) => setStage({ index, detail: detailText }));
    if (cancelledRef.current) {
      setPhase("empty");
      setScannedCount(0);
      setPendingFile(null);
      return;
    }
    setPickedStats(stats);
    await attach(stats, manifestFile);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    e.target.value = "";
    if (!files || files.length === 0) {
      stopPickClock();
      setPhase("empty");
      // This fires on `change`, not `cancel` (a real dialog cancel never
      // reaches here) — so the browser treated the pick as confirmed and
      // still handed back nothing. The common real cause on Windows: the
      // folder (or its files) lives in a cloud-synced location — OneDrive
      // "Files On-Demand" is the classic case — and files not yet downloaded
      // to this device don't enumerate through the picker at all, even
      // though Explorer shows them. Silently resetting here is otherwise
      // indistinguishable from the click having done nothing.
      setError(EMPTY_PICK_MESSAGE);
      return;
    }
    void handleFilesPicked(files);
  }

  // The real fix for the empty-FileList problem `handleInputChange` above
  // reports rather than just explains: `<input webkitdirectory>` builds its
  // FileList through whatever internal enumeration Chromium uses for that
  // element, which is where a cloud-synced folder (OneDrive Files On-Demand)
  // can come back empty. showDirectoryPicker() reads the real filesystem one
  // directory handle at a time — the same way drag-and-drop's
  // webkitGetAsEntry() walk already does, which is why dragging a folder in
  // has never shown this problem. Chrome/Edge only; Firefox and Safari fall
  // back to the classic input below, unchanged.
  async function chooseFolderViaFileSystemAccess() {
    setError(null);
    setPickWaitSecs(0);
    setPhase("picking");
    pickTimerRef.current = setInterval(() => setPickWaitSecs((s) => s + 1), 1000);
    try {
      const handle = await window.showDirectoryPicker();
      stopPickClock();
      const files = await readPickedDirectory(handle);
      if (files.length === 0) {
        setPhase("empty");
        setError(EMPTY_PICK_MESSAGE);
        return;
      }
      await handleFilesPicked(files);
    } catch (err) {
      stopPickClock();
      // AbortError is a plain cancel (closing the dialog, pressing Escape) —
      // exactly what the hidden input's own "cancel" event handles for the
      // fallback path, so it gets the same silent, error-free return here.
      if (err instanceof DOMException && err.name === "AbortError") {
        setPhase("empty");
        return;
      }
      setPhase("empty");
      setError(err instanceof Error ? err.message : "Couldn't read that folder.");
    }
  }

  function chooseFolder() {
    if (supportsDirectoryPicker()) {
      void chooseFolderViaFileSystemAccess();
    } else {
      beginPick(folderInputRef.current);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const items = e.dataTransfer?.items;
    // `DataTransfer.files` alone treats a dropped *folder* as a single
    // zero-byte, extension-less pseudo-file — it never reads what's inside
    // it. `items`/`webkitGetAsEntry()` is what actually lets a drop walk a
    // folder's contents, the same way `<input webkitdirectory>` does for a
    // button-driven pick; only fall back to the plain file list when the
    // browser doesn't support that at all (see readDroppedFiles.ts).
    if (items && supportsDirectoryDrop(items)) {
      void readDroppedFiles(items).then((files) => {
        if (files.length > 0) void handleFilesPicked(files);
      });
      return;
    }
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) void handleFilesPicked(files);
  }

  function cancelScan() {
    cancelledRef.current = true;
  }

  // Attaching happens automatically right after a scan completes — there is
  // no manual review step to confirm it from (Choose a different folder/
  // Attach removed on direct instruction). `stats`/`manifestFile` are taken
  // as parameters, not read back off state, because the caller only just set
  // that state this same tick and React would not have committed it yet.
  //
  // No recognized manifest is a fact about the project (a static site has no
  // package.json), not a reason to refuse the attach — this still records the
  // attach, just with a null filename/content, so `canEdit`'s Run analysis
  // is never blocked behind finding a manifest that was never going to exist.
  //
  // On failure this falls back to the empty dropzone rather than leaving the
  // reviewing panel stranded with no button left to retry or back out from.
  async function attach(stats: AxRenewalAttachStats, manifestFile: File | null) {
    setPhase("attaching");
    setError(null);
    try {
      if (manifestFile) {
        const content = await manifestFile.text();
        const path = manifestFile.webkitRelativePath || manifestFile.name;
        await attachManifest(detail.project.id, path, content, stats);
      } else {
        await attachManifest(detail.project.id, null, null, stats);
      }
      setPendingFile(null);
      setScannedCount(0);
      setPickedStats(null);
      setPhase("empty");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't attach that project.");
      setPendingFile(null);
      setScannedCount(0);
      setPickedStats(null);
      setPhase("empty");
    }
  }

  // Held so Stop can abort the request rather than only hiding the panel.
  const analysisAbortRef = useRef<AbortController | null>(null);

  async function handleAnalyze() {
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    setAnalyzing(true);
    setError(null);
    try {
      // Read at click time, so toggling it in the assistant panel takes
      // effect on the next run without this component having to subscribe.
      await runAnalysis(detail.project.id, controller.signal, readUseModel(), sourcePath);
      await onChanged();
    } catch (err) {
      // A deliberate Stop leaves no error behind: nothing was changed, and
      // the person who pressed it already knows what happened.
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Couldn't run analysis.");
      }
    } finally {
      analysisAbortRef.current = null;
      setAnalyzing(false);
    }
  }

  function stopAnalysis() {
    analysisAbortRef.current?.abort();
  }

  const alreadyAttached = detail.project.manifestAttachedAt != null;
  const shownStats = pickedStats ?? detail.project.attachStats;
  // Stays true through "attaching" (the POST is in flight) too, not just
  // "scanning" — pickedStats isn't cleared until attach() itself finishes
  // (success or failure), so this panel stays up for the whole automatic
  // scan-then-attach sequence rather than disappearing partway through it.
  const reviewingOnly = pickedStats != null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-dash-ink">Attach source</h2>
        <p className="mt-1 text-xs text-muted">
          Choose the project&apos;s folder — nothing is uploaded except the one dependency manifest found inside it
          (e.g. <code>package.json</code>), which is what analysis reads. A project with no recognized manifest (a
          static site, say) can still be attached; analysis will note that none was found.
        </p>
      </div>

      {/* One persistent pair of hidden inputs, reused by every "Choose a folder"/"Choose files"/"Replace source"
          trigger below — kept mounted for the component's whole lifetime so the webkitdirectory attribute and the
          native "cancel" listener (wired imperatively in the callback refs above) stay attached; a picker rendered
          fresh per phase would lose both the moment its branch remounted. */}
      {canEdit && (
        <>
          <input ref={registerFolderInput} type="file" multiple onChange={handleInputChange} className="hidden" />
          <input ref={registerFilesInput} type="file" multiple onChange={handleInputChange} className="hidden" />
        </>
      )}

      {phase === "picking" && (
        <div className="rounded-[10px] border border-border bg-page p-5">
          <div className="flex items-center gap-3">
            <span
              className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-purple/30 border-t-brand-purple"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Waiting for your folder</p>
              <p className="text-xs text-muted">
                This part is your browser, not the platform — nothing has been read yet.
              </p>
            </div>
            <span className="ml-auto font-mono text-xs text-muted">{pickWaitSecs}s</span>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                stopPickClock();
                setPhase("empty");
              }}
              className="rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {phase === "scanning" && (
        <div className="rounded-[10px] border border-border bg-page p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-dash-ink">Attaching</h3>
            <span className="text-xs text-muted">manifest only — no source is parsed</span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold tabular-nums tracking-tight text-dash-ink">
              {Math.round(((stage.index + 1) / ATTACH_STAGE_LABELS.length) * 100)}%
            </span>
            <span className="font-mono text-xs text-muted">{ATTACH_STAGE_LABELS[stage.index]}</span>
            <span className="ml-auto font-mono text-xs text-muted">{stage.detail}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-page">
            <div
              className="h-full rounded-full bg-brand-purple transition-[width] duration-300"
              style={{ width: `${Math.round(((stage.index + 1) / ATTACH_STAGE_LABELS.length) * 100)}%` }}
            />
          </div>
          <div className="mt-4 divide-y divide-border">
            {ATTACH_STAGE_LABELS.map((label, i) => {
              const status = i < stage.index ? "done" : i === stage.index ? "run" : "queued";
              return (
                <div key={label} className="flex items-start gap-3 py-2.5">
                  {status === "run" ? (
                    <span
                      className="mt-0.5 h-[22px] w-[22px] shrink-0 animate-spin rounded-full border-2 border-brand-purple/30 border-t-brand-purple"
                      aria-hidden="true"
                    />
                  ) : (
                    <span
                      className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md font-mono text-[11px] font-bold ${
                        status === "done" ? "bg-brand-purple/10 text-brand-purple" : "bg-page text-muted"
                      }`}
                    >
                      {status === "done" ? "✓" : i + 1}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-dash-ink">{label}</span>
                    {status === "run" && stage.detail && (
                      <span className="block font-mono text-xs text-muted">{stage.detail}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted">
                    {status === "done" ? "done" : status === "run" ? "reading" : "queued"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={cancelScan}
              className="rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-danger/10 hover:text-danger"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === "empty" && !alreadyAttached && (
        <>
          {canEdit ? (
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={handleDrop}
              className={`rounded-[10px] border-2 border-dashed p-12 text-center transition-colors ${
                dragOver ? "border-brand-purple bg-brand-purple/5" : "border-border bg-page"
              }`}
            >
              <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <PaperclipIcon className="h-4 w-4" />
              </span>
              <p className="mt-3 text-base font-semibold text-dash-ink">Attach the project you want renewed</p>
              <p className="mt-1 text-sm text-muted">Drag a folder here, or choose one. It is opened read only.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={chooseFolder}
                  className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-5 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
                >
                  Choose a folder
                </button>
                <button
                  type="button"
                  onClick={() => beginPick(filesInputRef.current)}
                  className="rounded-[10px] border border-border px-5 py-2.5 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
                >
                  Choose files
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[10px] border border-border bg-page p-5">
              <p className="text-sm text-muted">Nothing attached yet.</p>
            </div>
          )}

          <div className="rounded-[10px] border border-border bg-page p-5">
            <h3 className="text-sm font-bold text-dash-ink">Attaching does not analyse</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-muted">
              Attaching reads the manifest only — the file list, the sizes, the dependency file and a handful of
              config files. It does not parse your source, so it stays fast on a large project.{" "}
              <span className="font-medium text-dash-ink">Run analysis</span> is the step that reads the code, and
              it waits for you.
            </p>
          </div>
        </>
      )}

      {(reviewingOnly || (alreadyAttached && phase !== "picking" && phase !== "scanning")) && (
        <>
          {shownStats && (
            <div className="rounded-[10px] border border-border bg-page p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-dash-ink">File types found</h3>
                <span className="text-xs text-muted">
                  {pickedStats ? "scanned just now — not yet attached" : "from the manifest, not from parsing"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(shownStats.extensions)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 14)
                  .map(([ext, count]) => (
                    <span
                      key={ext}
                      className="rounded-full border border-border bg-page px-2.5 py-1 font-mono text-xs text-dash-ink"
                    >
                      .{ext} <b className="font-bold">{count}</b>
                    </span>
                  ))}
              </div>
              {shownStats.runtime && (
                <p className="mt-3 text-xs text-muted">
                  Looks like a <span className="font-medium text-dash-ink">{shownStats.runtime}</span> project from{" "}
                  {shownStats.manifestFilename}. Run analysis confirms or corrects that.
                </p>
              )}
            </div>
          )}

          {shownStats && (
            <div className="overflow-hidden rounded-[10px] border border-border bg-page">
              <div className="relative flex items-center gap-2 border-b border-border bg-page px-5 py-3">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-4 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-brand-purple/15 to-brand-blue/15 blur-2xl"
                />
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                  <DocumentIcon className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-dash-ink">{pickedStats ? "Reviewing" : "Attached"}</h3>
                <span className="ml-auto text-xs text-muted">
                  {pickedStats ? "not yet attached" : "manifest only"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
                {[
                  { label: "project files", value: shownStats.fileCount.toLocaleString() },
                  { label: "on disk", value: formatBytes(shownStats.totalBytes) },
                  {
                    label: pickedStats ? "scanned" : "attached",
                    value: detail.project.manifestAttachedAt
                      ? new Date(detail.project.manifestAttachedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "just now",
                  },
                  { label: "state", value: detail.analysis ? "analysed" : "not analysed" },
                ].map((cell) => (
                  <div key={cell.label} className="bg-page p-3.5">
                    <b className="block text-xl font-bold tracking-tight text-dash-ink">{cell.value}</b>
                    <span className="text-xs text-muted">{cell.label}</span>
                  </div>
                ))}
              </div>
              {shownStats.skippedCount > 0 && (
                // Said out loud, because the alternative is somebody seeing
                // "295 project files" for a folder they know holds forty
                // thousand and concluding it failed to read their code.
                <p className="border-t border-border px-5 py-2.5 text-xs text-muted">
                  {shownStats.skippedCount.toLocaleString()} files skipped — dependency trees, build output and
                  version-control folders, which describe nothing a migration plan needs.
                </p>
              )}
              <div className="space-y-1.5 px-5 py-3.5 text-sm">
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted">Name</span>
                  <b className="font-semibold text-dash-ink">{shownStats.rootFolderName ?? "—"}</b>
                </div>
                <div className="flex items-center justify-between border-b border-border py-1.5">
                  <span className="text-muted">Manifest</span>
                  <b className="font-semibold text-dash-ink">{shownStats.manifestFilename ?? "none found"}</b>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">Mode</span>
                  <b className="font-semibold text-dash-ink">read only — never modified</b>
                </div>
              </div>
              {pendingFile && pickedStats && (
                <p className="border-t border-border bg-page px-5 py-2.5 text-xs text-muted">
                  Found <span className="font-medium text-dash-ink">{pendingFile.webkitRelativePath || pendingFile.name}</span>{" "}
                  among {scannedCount} files scanned.
                </p>
              )}
              {!pendingFile && pickedStats && (
                <p className="border-t border-border bg-page px-5 py-2.5 text-xs text-muted">
                  No recognized manifest ({MANIFEST_FILENAMES.join(", ")}) was found among the {scannedCount} files
                  scanned — attaching will record that.
                </p>
              )}
              {canEdit && !pickedStats && alreadyAttached && (
                <div className="flex justify-end border-t border-border px-5 py-3.5">
                  <button
                    type="button"
                    onClick={chooseFolder}
                    className="rounded-[10px] border border-dashed border-border px-3.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:text-brand-purple"
                  >
                    Replace source
                  </button>
                </div>
              )}
            </div>
          )}

          {shownStats && (
            <div className="rounded-[10px] border border-border bg-page p-5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-bold text-dash-ink">
                  <CheckCircleIcon className="h-6 w-6 shrink-0 text-emerald-500" />
                  Verification
                </h3>
                <span className="text-xs text-muted">
                  {buildVerification(shownStats).filter((r) => r.status === "ok").length} passed ·{" "}
                  {buildVerification(shownStats).filter((r) => r.status === "warn").length} to note
                </span>
              </div>
              <div className="mt-3 divide-y divide-border">
                {buildVerification(shownStats).map((row) => (
                  <div key={row.title} className="flex items-start gap-3 py-2.5">
                    {row.status === "ok" ? (
                      <CheckCircleIcon className="mt-0.5 h-6 w-6 shrink-0 text-emerald-500" />
                    ) : (
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                        <WarningIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-dash-ink">{row.title}</span>
                      <span className="block text-xs text-muted">{row.detail}</span>
                    </span>
                    {/* Decorative only — every row here already shows everything it
                        has (title + detail), there's no drill-down destination to
                        wire this to yet. */}
                    <ChevronRightIcon className="mt-1 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Only offered once a local model actually answers Run analysis at
          all (ADR-054) — with none connected, the keyword stub ignores this
          entirely, and showing it anyway would promise something this
          deployment cannot do. Remembered per project, per browser
          (engine-preference.ts); never sent anywhere until Run analysis is
          pressed, and the backend does not persist it either. */}
      {canEdit && engine?.connected && (
        <div className="rounded-[10px] border border-border bg-page p-4">
          <label htmlFor="ax-source-path" className="text-xs font-semibold text-muted">
            Your legacy project&apos;s path on this machine (optional)
          </label>
          <p className="mt-1 text-xs text-muted">
            Leave blank to use this deployment&apos;s configured default, if it has one. Typing a path here reads
            <em> your</em> checkout instead, for this run only — nothing is saved on the server.
          </p>
          <input
            id="ax-source-path"
            value={sourcePath}
            onChange={(e) => handleSourcePathChange(e.target.value)}
            disabled={analyzing}
            placeholder="e.g. C:\Users\you\projects\legacy-app"
            spellCheck={false}
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-border px-3 py-1.5 font-mono text-xs text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>
      )}

      {/* Above the cards, not instead of them. Replacing them would hide
          "Open architecture" mid-run and, on a re-run, take away results that
          are still perfectly valid until the new ones land. Both buttons are
          already disabled while analysing, so there is no double-click to
          guard against. */}
      {analyzing && <AnalysisProgress engineLabel={engineLabel} onStop={stopAnalysis} />}

      {detail.analysis ? (
        <div className="relative overflow-hidden rounded-[10px] border border-border bg-page p-5">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-brand-purple/15 to-brand-blue/15 blur-2xl"
          />
          <h3 className="flex items-center gap-2 text-sm font-bold text-dash-ink">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-blue text-base font-bold text-white">
              ✓
            </span>
            Analysis complete
          </h3>
          <p className="mt-1.5 text-sm text-dash-ink">
            Codebase, architecture, pages and findings are open in the explorer.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {canEdit && (
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={analyzing}
                className="rounded-[10px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? "Running…" : "Run analysis again"}
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/ax-renewal?project=${detail.project.id}&section=understand-architecture`)}
              className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            >
              Open architecture
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-[10px] border border-border bg-page p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-3 text-sm font-bold text-dash-ink">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
                <SparklesIcon className="h-4 w-4" />
              </span>
              Run analysis
            </h3>
            {canEdit && (
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={analyzing}
                className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {analyzing ? "Running…" : "Run analysis"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-muted">
            Unlocks Codebase, Architecture and Findings in the Understand group, and every section of Plan.
          </p>
          <p className="mt-3 text-sm text-muted">Not analyzed yet.</p>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
