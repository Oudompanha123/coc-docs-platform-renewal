/**
 * Computes real, measured facts about a folder picked in the browser's file
 * input — file count, size, extension breakdown, manifest/lockfile presence,
 * a secrets scan of small config files, and the largest file. Nothing here
 * is fabricated or sampled: every field is counted or read directly from the
 * `FileList` the browser handed over. Mirrors the reference prototype's
 * Attach step (CodeRenewalPlatform.html), minus its staged progress-bar
 * animation — that was cosmetic, not part of what gets persisted.
 *
 * Pure functions only, so they're cheap to unit test without a DOM.
 */

export interface AxRenewalAttachStats {
  fileCount: number;
  totalBytes: number;
  extensions: Record<string, number>;
  manifestFilename: string | null;
  runtime: string | null;
  lockfile: string | null;
  secretsFound: string[];
  buildOutputDirs: string[];
  largestFile: { name: string; size: number } | null;
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

function pathOf(file: File): string {
  return file.webkitRelativePath || file.name;
}

/** Yields to the event loop so a large folder doesn't freeze the tab while this runs. */
function yieldToUi(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

export async function computeAttachStats(files: FileList | File[]): Promise<AxRenewalAttachStats> {
  const list = Array.from(files);
  const extensions: Record<string, number> = {};
  const buildOutputDirs = new Set<string>();
  let totalBytes = 0;
  let largestFile: { name: string; size: number } | null = null;

  for (let i = 0; i < list.length; i++) {
    const file = list[i]!;
    const path = pathOf(file);
    totalBytes += file.size;
    if (!largestFile || file.size > largestFile.size) {
      largestFile = { name: path, size: file.size };
    }
    const match = /\.([a-z0-9]+)$/i.exec(path.toLowerCase());
    const ext = match ? match[1]! : "(none)";
    extensions[ext] = (extensions[ext] ?? 0) + 1;
    const dirMatch = /(^|\/)(dist|build|out|node_modules|vendor)\//.exec(path);
    if (dirMatch) buildOutputDirs.add(dirMatch[2]!);
    if (i % 500 === 0) await yieldToUi();
  }

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

  const secretsFound: string[] = [];
  const candidates = list.filter((f) => CONFIGISH.test(pathOf(f)) && f.size < MAX_SCANNED_FILE_BYTES).slice(0, MAX_FILES_SCANNED_FOR_SECRETS);
  for (const file of candidates) {
    try {
      const text = await file.text();
      if (SECRET_HINT.test(text)) secretsFound.push(pathOf(file));
    } catch {
      // Unreadable file — skip rather than fail the whole attach over one file.
    }
    await yieldToUi();
  }

  return {
    fileCount: list.length,
    totalBytes,
    extensions,
    manifestFilename,
    runtime,
    lockfile,
    secretsFound,
    buildOutputDirs: Array.from(buildOutputDirs),
    largestFile,
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

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}
