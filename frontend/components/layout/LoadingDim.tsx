/**
 * The full-screen loading overlay — shown for: Login submission/redirect,
 * Logout's redirect to Login, and (as a standalone page) a new tab opened by
 * "View site". The heavier, whole-viewport treatment for auth transitions
 * specifically, not for routine nav clicks (those keep the slim
 * `TopProgressBar`).
 *
 * A brand ring on a soft, blurred overlay that follows the light/dark theme,
 * with the label shown under it ("Signing in…"). It replaced a port of the
 * old `로딩DIM.html` reference — twelve black blades fading in steps on a flat
 * grey dim — which matched nothing else in the app. Styles live in
 * `globals.css` (`.loading-dim`, `.cdp-spinner`).
 */
export function LoadingDim({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-dim fixed inset-0 z-[100000] flex flex-col items-center justify-center gap-4"
    >
      <span className="cdp-spinner" aria-hidden="true">
        <span className="cdp-spinner-arc" />
      </span>
      <span className="loading-dim-label text-sm font-semibold tracking-wide">{label}</span>
    </div>
  );
}

/** The same overlay as a standalone HTML page — for {@link
 *  openInNewTabWithLoadingDim}, which writes it into a brand new tab before
 *  that tab has any of our compiled CSS/JS to render `LoadingDim` with. Values
 *  mirror `.loading-dim`/`.cdp-spinner` in `globals.css`; the tab has no theme
 *  setting yet, so it follows the operating system's. */
export function loadingDimStandaloneHtml(label = "Loading…"): string {
  const safeLabel = label.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  return `<!doctype html><html><head><meta charset="utf-8"><title>Coc Docs Platform</title><style>
html,body{margin:0;height:100%}
body{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#f5f4fb;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.label{color:#2d2a4a;font-size:14px;font-weight:600;letter-spacing:.02em}
.ring{position:relative;width:56px;height:56px}
.ring::before{content:"";position:absolute;inset:0;border-radius:50%;border:5px solid rgba(109,60,224,.14)}
.arc{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,rgba(109,60,224,0) 0deg,#6d3ce0 210deg,#4c6ff0 360deg);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 5px));mask:radial-gradient(farthest-side,transparent calc(100% - 5px),#000 calc(100% - 5px));animation:spin .9s linear infinite}
.arc::after{content:"";position:absolute;top:0;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#4c6ff0}
@keyframes spin{to{transform:rotate(360deg)}}
@media (prefers-color-scheme:dark){body{background:#0a0a10}.label{color:#e7e5f4}}
@media (prefers-reduced-motion:reduce){.arc{animation:none}}
</style></head><body><div class="ring" aria-hidden="true"><div class="arc"></div></div><div class="label" role="status">${safeLabel}</div></body></html>`;
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
