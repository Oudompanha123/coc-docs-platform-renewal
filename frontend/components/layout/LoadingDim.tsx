import { LoaderCircle } from "lucide-react";

/**
 * The full-screen loading overlay — shown for: Login submission/redirect,
 * Logout's redirect to Login, and (as a standalone page) a new tab opened by
 * "View site". The heavier, whole-viewport treatment for auth transitions
 * specifically, not for routine nav clicks (those keep the slim
 * `TopProgressBar`).
 *
 * shadcn's spinner — Lucide's `LoaderCircle` turning — in neutral ink on a
 * soft, blurred overlay that follows the light/dark theme, with the label
 * under it ("Signing in…") (ADR-104 r2.5). It replaced a purple-to-blue
 * conic ring from the retired brand palette, which was the last thing on the
 * sign-in path still in the old colours. Overlay and label colours live in
 * `globals.css` (`.loading-dim`).
 */
export function LoadingDim({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-dim fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-3"
    >
      <LoaderCircle aria-hidden="true" className="loading-dim-spinner size-8 animate-spin" />
      <span className="loading-dim-label text-sm font-medium">{label}</span>
    </div>
  );
}

/** The same overlay as a standalone HTML page — for {@link
 *  openInNewTabWithLoadingDim}, which writes it into a brand new tab before
 *  that tab has any of our compiled CSS/JS to render `LoadingDim` with. Values
 *  mirror `.loading-dim` in `globals.css`, and the SVG is `LoaderCircle`'s own
 *  path; the tab has no theme setting yet, so it follows the operating
 *  system's. */
export function loadingDimStandaloneHtml(label = "Loading…"): string {
  const safeLabel = label.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Coc Docs Platform</title><style>
html,body{margin:0;height:100%}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#ffffff;color:#171717;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.label{font-size:14px;font-weight:500}
.spinner{width:32px;height:32px;color:#737373;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-color-scheme:dark){body{background:#0a0a0a;color:#fafafa}.spinner{color:#a1a1a1}}
@media (prefers-reduced-motion:reduce){.spinner{animation:none}}
</style></head><body><svg class="spinner" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><div class="label" role="status">${safeLabel}</div></body></html>`;
}

/**
 * Opens `href` in a new tab that shows the `LoadingDim` look immediately,
 * before the real page has loaded — for a `target="_blank"` link (e.g.
 * "View site"), where the new tab steals focus the instant it opens, so a
 * `LoadingDim` rendered back in the original tab is never actually seen.
 * Writing this directly into the new tab, then navigating it to `href`,
 * puts the loading state exactly where the person is now looking.
 *
 * Falls back to a plain `window.open` if the browser didn't return a
 * handle to write into (a popup blocker, though a click handler calling
 * this synchronously is normally exempt from one).
 */
export function openInNewTabWithLoadingDim(href: string): void {
  const win = window.open("", "_blank");
  if (!win) {
    window.open(href, "_blank");
    return;
  }
  win.document.write(loadingDimStandaloneHtml());
  win.document.close();
  win.location.href = href;
}
