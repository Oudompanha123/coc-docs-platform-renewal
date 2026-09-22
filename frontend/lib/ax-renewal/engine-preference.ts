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
