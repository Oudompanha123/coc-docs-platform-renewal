/**
 * Computes real, measured facts about a folder picked in the browser's file
 * input — file count, size, extension breakdown, manifest/lockfile presence,
 * a secrets scan of small config files, and the largest file. Nothing here
 * is fabricated or sampled: every field is counted or read directly from the
 * `FileList` the browser handed over. Mirrors the reference prototype's
 * Attach step (CodeRenewalPlatform.html) stage for stage, including its
 * five-stage progress readout — unlike the prototype, the stages below
 * report real progress on real work (there are no artificial delays).
 *
 * Pure functions only (DOM-free save for the `onStage` callback's timing),
 * so they're cheap to unit test.
 */

/** Matches the reference prototype's own `ATTACH_STAGES` labels, in order. */
export const ATTACH_STAGE_LABELS = [
  "Reading the file list",
  "Measuring the archive",
  "Grouping by file type",
  "Looking for the entry point",
  "Running the safety checks",
] as const;

export type AttachStageIndex = 0 | 1 | 2 | 3 | 4;

export interface AxRenewalAttachStats {
  /**
   * The attached folder's own top-level name (e.g. "my-project"), read off
   * the first file's relative path — matches the reference prototype's
   * `stat.root`. Null only when nothing was picked at all; when loose files
   * were chosen instead of a folder (no relative path to read a folder name
   * from), this ends up being the first file's own name instead — a quirk
   * inherited as-is from the prototype's identical fallback.
   */
  rootFolderName: string | null;
  /**
   * Files dropped for being inside a dependency tree, build output or VCS
   * folder. Reported rather than hidden: a project that shows 295 files when
   * the folder plainly has forty thousand needs to say why, or it reads as
   * having failed to see most of the code.
   */
  skippedCount: number;
  fileCount: number;
  totalBytes: number;
  extensions: Record<string, number>;
  manifestFilename: string | null;
  runtime: string | null;
  lockfile: string | null;
  secretsFound: string[];
  buildOutputDirs: string[];
  largestFile: { name: string; size: number } | null;
  /**
   * The biggest directories by file count, root folder name stripped so
   * entries read "src", "views", not "my-project/src" — real, counted
   * grouping, not a full recursive tree (see `MAX_LAYOUT_DIRS`/
   * `MAX_FILES_PER_DIR` for why it's capped this way). Grouped from the
   * same filtered file list `extensions` counts, so a dependency tree or
   * build-output directory that `SKIPPED_PATH_SEGMENT` already dropped
   * doesn't reappear here either.
   *
   * Optional, not just possibly empty: `computeAttachStats` always sets it,
   * but stats already persisted from a project attached before this field
   * existed genuinely lack the key — a consumer reading `attachStats` from
   * the server must default it (`?? []`), never assume it's there.
   */
  fileLayout?: FileLayoutEntry[];
}

export interface FileLayoutEntry {
  /** Path relative to the attached root; "" for files dropped directly in it. */
  dir: string;
  fileCount: number;
  /** Up to `MAX_FILES_PER_DIR` basenames — see `truncated` for whether more exist. */
  files: string[];
  truncated: boolean;
  /** Basenames from `files` that `secretsFound` flagged — surfaced so a real layout view can highlight them, same as the reference prototype's "connection string committed here" line. */
  riskFiles: string[];
}

/** Matches `AxRenewalService.RUNTIME_HINTS` server-side — kept in step so "Looks like a Node.js project" agrees with what Run analysis later detects. */
const MANIFESTS: [string, string][] = [
  ["package.json", "Node.js"],
  ["composer.json", "PHP"],
  ["requirements.txt", "Python"],
  ["pyproject.toml", "Python"],
  ["pom.xml", "Java"],
  ["build.gradle", "Java"],
  ["gemfile", "Ruby"],
  ["go.mod", "Go"],
  ["cargo.toml", "Rust"],
];

const LOCKFILES = [
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "bun.lockb",
  "composer.lock",
  "gemfile.lock",
  "poetry.lock",
  "cargo.lock",
];

const SECRET_HINT =
  /(mysql|postgres|postgresql|mongodb):\/\/[^\s"']*:[^\s"']*@|password\s*[:=]\s*["'][^"']{3,}|secret\s*[:=]\s*["'][^"']{8,}|AKIA[0-9A-Z]{16}/i;
const CONFIGISH = /(^|\/)(\.env|\.env\..+|config[^/]*\.(js|json|php|py|yml|yaml)|db\.(js|php|py)|settings\.(py|json))$/i;

/** Files this small enough are worth scanning for a hardcoded secret; larger ones are skipped rather than read in full. */
const MAX_SCANNED_FILE_BYTES = 50_000;
/** Caps how many candidate config files get read, so one huge project can't stall the browser on this step. */
const MAX_FILES_SCANNED_FOR_SECRETS = 25;
/** Caps how many directories `fileLayout` reports, so a huge repository still renders a short, readable list. */
const MAX_LAYOUT_DIRS = 24;
/** Caps how many filenames are listed per directory in `fileLayout`; the rest are only reflected in `fileCount`. */
const MAX_FILES_PER_DIR = 8;

function pathOf(file: File): string {
  return file.webkitRelativePath || file.name;
}

/** `path`, with the attached folder's own top-level segment stripped, so groups read "src/…" rather than "my-project/src/…". */
function stripRoot(path: string, rootFolderName: string | null): string {
  if (rootFolderName && path.startsWith(rootFolderName + "/")) {
    return path.slice(rootFolderName.length + 1);
  }
  return path;
}

/** Yields to the event loop so a large folder doesn't freeze the tab while this runs. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Whether a path runs through a directory whose contents say nothing about
 * the project — a dependency tree, build output, or VCS metadata.
 *
 * The drag-and-drop walk skips these before creating a `File` at all
 * (`readDroppedFiles.ts`). The folder picker cannot: `webkitdirectory`
 * enumerates everything in the browser before handing it over, with no way to
 * exclude. So they are dropped here instead — the memory has already been
 * spent by then, but the counts, the extension breakdown and the secrets scan
 * all end up describing the project rather than its dependencies.
 */
const SKIPPED_PATH_SEGMENT =
  /(^|\/)(node_modules|\.git|\.next|dist|build|out|target|vendor|\.venv|__pycache__|\.gradle|\.idea|\.vscode)\//;

export async function computeAttachStats(
  files: FileList | File[],
  onStage?: (stage: AttachStageIndex, detail: string) => void,
): Promise<AxRenewalAttachStats> {
  // Everything the browser handed over, then only what describes the project.
  // `skippedCount` is reported so the UI can say why 38,000 files became 295
  // rather than leaving somebody to wonder whether it read their code at all.
  const everything = Array.from(files);
  const list = everything.filter((f) => !SKIPPED_PATH_SEGMENT.test(pathOf(f)));
  const paths = list.map(pathOf);
  // Read off the unfiltered list: the folder somebody picked keeps its name
  // even when everything inside it turned out to be dependencies.
  const allPaths = everything.map(pathOf);
  const rootFolderName = allPaths.length > 0 ? allPaths[0]!.split("/")[0]! || "(files)" : null;

  // Stage 0 — the file list itself.
  onStage?.(0, "");
  for (let i = 0; i < list.length; i++) {
    if (i % 500 === 0) {
      onStage?.(0, `${(i + 1).toLocaleString()} files`);
      await yieldToUi();
    }
  }
  onStage?.(0, `${list.length.toLocaleString()} files`);

  // Stage 1 — total size and the largest single file.
  onStage?.(1, "");
  let totalBytes = 0;
  let largestFile: { name: string; size: number } | null = null;
  for (let i = 0; i < list.length; i++) {
    const file = list[i]!;
    totalBytes += file.size;
    if (!largestFile || file.size > largestFile.size) {
      largestFile = { name: paths[i]!, size: file.size };
    }
    if (i % 800 === 0) {
      onStage?.(1, formatBytes(totalBytes));
      await yieldToUi();
    }
  }
  onStage?.(1, formatBytes(totalBytes));

  // Stage 2 — group by extension, group by directory, and flag any committed build output.
  onStage?.(2, "");
  const extensions: Record<string, number> = {};
  const buildOutputDirs = new Set<string>();
  const dirFileCounts = new Map<string, number>();
  const dirFileNames = new Map<string, string[]>();
  // Extensions and the directory layout describe the project, so both count
  // the filtered list — a dependency tree or build-output directory that was
  // already dropped shouldn't reappear as a "directory" here either.
  for (const path of paths) {
    const match = /\.([a-z0-9]+)$/i.exec(path.toLowerCase());
    const ext = match ? match[1]! : "(none)";
    extensions[ext] = (extensions[ext] ?? 0) + 1;

    const relative = stripRoot(path, rootFolderName);
    const lastSlash = relative.lastIndexOf("/");
    const dir = lastSlash >= 0 ? relative.slice(0, lastSlash) : "";
    const basename = lastSlash >= 0 ? relative.slice(lastSlash + 1) : relative;
    dirFileCounts.set(dir, (dirFileCounts.get(dir) ?? 0) + 1);
    const names = dirFileNames.get(dir);
    if (names) {
      if (names.length < MAX_FILES_PER_DIR) names.push(basename);
    } else {
      dirFileNames.set(dir, [basename]);
    }
  }
  // Committed build output is the opposite case: it has to be looked for in
  // everything the browser handed over, because the whole point of the
  // finding is that these directories are present at all. Detecting them here
  // while skipping their contents elsewhere is one judgement, not a conflict.
  for (const path of allPaths) {
    const dirMatch = /(^|\/)(dist|build|out|node_modules|vendor)\//.exec(path);
    if (dirMatch) buildOutputDirs.add(dirMatch[2]!);
  }
  onStage?.(2, `${Object.keys(extensions).length} file types`);
  await yieldToUi();

  // Stage 3 — the entry point: a recognized dependency manifest and lockfile.
  onStage?.(3, "");
  let manifestFilename: string | null = null;
  let runtime: string | null = null;
  for (const [name, rt] of MANIFESTS) {
    const found = list.find((f) => pathOf(f).split("/").pop()?.toLowerCase() === name);
    if (found) {
      manifestFilename = found.name.split("/").pop() ?? name;
      runtime = rt;
      break;
    }
  }
  const lockfile =
    LOCKFILES.find((name) => list.some((f) => pathOf(f).split("/").pop()?.toLowerCase() === name)) ?? null;
  onStage?.(3, manifestFilename ?? "no manifest found");
  await yieldToUi();

  // Stage 4 — a secrets scan of small config-shaped files only.
  onStage?.(4, "");
  const secretsFound: string[] = [];
  const candidates = list.filter((f) => CONFIGISH.test(pathOf(f)) && f.size < MAX_SCANNED_FILE_BYTES).slice(0, MAX_FILES_SCANNED_FOR_SECRETS);
  for (const file of candidates) {
    try {
      const text = await file.text();
      if (SECRET_HINT.test(text)) secretsFound.push(pathOf(file));
    } catch {
      // Unreadable file — skip rather than fail the whole attach over one file.
    }
    onStage?.(4, `${candidates.length} config files checked`);
    await yieldToUi();
  }
  onStage?.(4, `${candidates.length} config files checked`);

  // secretsFound is only known now (stage 4 runs after the grouping above),
  // so the risk cross-reference happens here rather than inline in stage 2.
  const riskBasenames = new Set(
    secretsFound.map((path) => {
      const relative = stripRoot(path, rootFolderName);
      const lastSlash = relative.lastIndexOf("/");
      return lastSlash >= 0 ? relative.slice(lastSlash + 1) : relative;
    }),
  );
  const fileLayout: FileLayoutEntry[] = Array.from(dirFileCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_LAYOUT_DIRS)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dir, fileCount]) => {
      const files = dirFileNames.get(dir) ?? [];
      return {
        dir,
        fileCount,
        files,
        truncated: fileCount > files.length,
        riskFiles: files.filter((name) => riskBasenames.has(name)),
      };
    });

  return {
    rootFolderName,
    fileCount: list.length,
    totalBytes,
    extensions,
    manifestFilename,
    runtime,
    lockfile,
    secretsFound,
    buildOutputDirs: Array.from(buildOutputDirs),
    largestFile,
    skippedCount: everything.length - list.length,
    fileLayout,
  };
}

export type VerificationStatus = "ok" | "warn";

export interface VerificationRow {
  status: VerificationStatus;
  title: string;
  detail: string;
}

/** Turns the raw counts above into the same pass/note checklist the reference prototype shows — kept separate from `computeAttachStats` so it can run again on stats read back from the server, not just freshly computed ones. */
export function buildVerification(stats: AxRenewalAttachStats): VerificationRow[] {
  const rows: VerificationRow[] = [];
  rows.push({
    status: "ok",
    title: "Files readable",
    detail: `${stats.fileCount.toLocaleString()} files, ${formatBytes(stats.totalBytes)}`,
  });
  rows.push(
    stats.manifestFilename
      ? {
          status: "ok",
          title: "Manifest found",
          detail: stats.runtime ? `${stats.manifestFilename} · ${stats.runtime} project` : stats.manifestFilename,
        }
      : {
          status: "warn",
          title: "No manifest found",
          detail: "dependencies cannot be listed until the analysis reads the imports",
        },
  );
  rows.push(
    stats.lockfile
      ? { status: "ok", title: "Lockfile present", detail: stats.lockfile }
      : { status: "warn", title: "No lockfile", detail: "dependency versions cannot be pinned exactly" },
  );
  rows.push(
    stats.secretsFound.length > 0
      ? {
          status: "warn",
          title: "Credentials in source",
          detail:
            stats.secretsFound.slice(0, 3).join(", ") +
            (stats.secretsFound.length > 3 ? ` and ${stats.secretsFound.length - 3} more` : ""),
        }
      : { status: "ok", title: "No obvious credentials", detail: "in the config files checked" },
  );
  rows.push(
    stats.buildOutputDirs.length > 0
      ? {
          status: "warn",
          title: "Build output committed",
          detail: `${stats.buildOutputDirs.join(", ")} — excluded from the analysis`,
        }
      : { status: "ok", title: "No build output committed", detail: "dist/ and node_modules/ are absent" },
  );
  if (stats.largestFile) {
    rows.push({
      status: "ok",
      title: "Largest file",
      detail: `${stats.largestFile.name.split("/").pop()} · ${formatBytes(stats.largestFile.size)}`,
    });
  }
  return rows;
}

export interface LanguageShare {
  name: string;
  percent: number;
}

/** Maps a counted extension to the language it represents on screen. Extensions absent here (config, image, lockfile, etc.) are real file types too — they just don't count as a "language" share. */
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript",
  hbs: "Handlebars",
  handlebars: "Handlebars",
  ejs: "EJS",
  css: "CSS",
  scss: "CSS",
  less: "CSS",
  html: "HTML",
  htm: "HTML",
  sql: "SQL and shell",
  sh: "SQL and shell",
  bash: "SQL and shell",
  ps1: "SQL and shell",
  py: "Python",
  php: "PHP",
  java: "Java",
  kt: "Kotlin",
  rb: "Ruby",
  go: "Go",
  rs: "Rust",
};

/**
 * Turns the real, already-counted `extensions` map into language shares —
 * no model, no sampling: every percentage point traces back to a file the
 * browser actually counted. Extensions the map above doesn't recognize
 * (json, yml, lockfiles, images, …) are real files too but don't read as a
 * "language", so they're left out of the denominator rather than lumped
 * into an "other" bucket nobody asked for.
 */
export function languageBreakdown(extensions: Record<string, number>): LanguageShare[] {
  const totals = new Map<string, number>();
  let known = 0;
  for (const [ext, count] of Object.entries(extensions)) {
    const name = LANGUAGE_BY_EXTENSION[ext.toLowerCase()];
    if (!name) continue;
    totals.set(name, (totals.get(name) ?? 0) + count);
    known += count;
  }
  if (known === 0) return [];
  return Array.from(totals.entries())
    .map(([name, count]) => ({ name, percent: Math.round((count / known) * 100) }))
    .sort((a, b) => b.percent - a.percent);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}
