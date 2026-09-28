/**
 * Whether this browser wants the local model used for Run analysis.
 *
 * <h2>Why a preference and not a setting</h2>
 *
 * <p>The model is connected by a path in one developer's own
 * `backend/.env.local` (ADR-043). A button in a web page cannot edit that
 * file, and should not: configuration that decides whether a process gets
 * spawned belongs in configuration, not behind a control anyone signed in
 * can press.
 *
 * <p>So Disconnect does the honest, smaller thing — it stops *this browser*
 * asking for the model, by sending `useModel=false` with the run. The
 * backend still has its path, still could, and simply was not asked. That is
 * also why the wording in the UI is "not using it here" rather than
 * "disconnected": nothing was disconnected from anything.
 *
 * <p>Per-browser is the right scope for the same reason the whole feature is
 * local-only: the backend, the CLI and this page are one machine, so one
 * person's choice cannot surprise anybody else.
 *
 * <p>// req: ADR-043
 */

const STORAGE_KEY = "coc-ax-renewal-use-model";

/**
 * Defaults to true — a configured model is used unless somebody said not to.
 * Reads defensively: `localStorage` throws in a private window and can be
 * cleared at any time, and the right answer when it cannot be read is the
 * default rather than an error.
 */
export function readUseModel(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

/** Stores the choice. Silently does nothing where storage is unavailable — the run still honours the value passed to it. */
export function writeUseModel(useModel: boolean): void {
  try {
    if (useModel) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, "false");
  } catch {
    // A browser that refuses storage still gets the behaviour for this
    // session; only the memory of it across reloads is lost.
  }
}

/**
 * One team member's own legacy checkout, per project (ADR-054).
 *
 * <p>Keyed by project id, unlike {@link #readUseModel}/{@link #writeUseModel}
 * — two different projects attached on the same machine are two different
 * folders, so remembering one path globally would silently offer the wrong
 * one the next time somebody switches projects. Per-browser for the same
 * reason the model preference above is: this path only ever means anything
 * on the machine that typed it, the same reasoning `app.ax-renewal.source-path`
 * itself was built on (ADR-043) — nothing here is sent anywhere until a Run
 * analysis call includes it, and the backend does not persist it either.
 */
const SOURCE_PATH_PREFIX = "coc-ax-renewal-source-path:";

/** Empty string when nothing was remembered, or storage cannot be read — never null, so callers can bind it straight to an input's value. */
export function readSourcePathOverride(projectId: string): string {
  try {
    return localStorage.getItem(SOURCE_PATH_PREFIX + projectId) ?? "";
  } catch {
    return "";
  }
}

/** Stores this project's path, or forgets it when cleared. Silently does nothing where storage is unavailable — the run still honours whatever was typed. */
export function writeSourcePathOverride(projectId: string, sourcePath: string): void {
  try {
    const trimmed = sourcePath.trim();
    if (trimmed === "") localStorage.removeItem(SOURCE_PATH_PREFIX + projectId);
    else localStorage.setItem(SOURCE_PATH_PREFIX + projectId, trimmed);
  } catch {
    // Same degradation as writeUseModel: this session still works, only the
    // memory of it across reloads is lost.
  }
}
