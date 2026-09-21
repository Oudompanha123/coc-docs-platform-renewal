/**
 * The full-screen loading overlay, ported from the real production
 * reference `로딩DIM.html` (and its `.laoding_wrap`/`.lds-spinner` rules in
 * `content_mo.css`) verbatim — dim color, spinner geometry, blade shape,
 * rotation/delay steps, and the fade keyframe all match that file's exact
 * values. Colors kept faithful (a neutral gray dim, black blades) rather
 * than recolored to the brand palette, since neither clashes and both read
 * clearly over any page content.
 *
 * Shown for: Login submission/redirect, Logout's redirect to Login — the
 * heavier, whole-viewport treatment for auth transitions specifically, not
 * for routine nav clicks (those keep the slim `TopProgressBar`).
 */
const BLADE_COUNT = 12;
const BLADE_ANGLE_STEP_DEG = 30;
const BLADE_DELAY_STEP_S = 0.1;

export function LoadingDim({ label = "Loading" }: { label?: string }) {
  return (
    <div
      role="status"
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-[#cccccc]/50"
    >
      <span className="lds-spinner">
        {Array.from({ length: BLADE_COUNT }, (_, i) => (
          <span
            key={i}
            style={{
              transform: `rotate(${i * BLADE_ANGLE_STEP_DEG}deg)`,
              animationDelay: `${(i - (BLADE_COUNT - 1)) * BLADE_DELAY_STEP_S}s`,
            }}
          />
        ))}
      </span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Same geometry/timing as `LoadingDim` above, as a standalone HTML string
 *  — for {@link openInNewTabWithLoadingDim}, which writes it into a brand
 *  new tab before that tab has any of our compiled CSS/JS to render our
 *  React component with. */
function loadingDimStandaloneHtml(): string {
  const blades = Array.from(
    { length: BLADE_COUNT },
    (_, i) =>
      `<span style="transform:rotate(${i * BLADE_ANGLE_STEP_DEG}deg);animation-delay:${
        (i - (BLADE_COUNT - 1)) * BLADE_DELAY_STEP_S
      }s"></span>`,
  ).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>Coc Docs Platform</title><style>
html,body{margin:0;height:100%;background:#cccccc;display:flex;align-items:center;justify-content:center;}
.lds-spinner{display:inline-block;position:relative;width:86px;height:86px}
.lds-spinner span{position:absolute;inset:0;animation:spin 1.2s linear infinite;transform-origin:43px 43px}
.lds-spinner span::after{content:"";display:block;position:absolute;top:0;left:40px;width:7px;height:17px;border-radius:4px 4px 0 0;background:#000}
@keyframes spin{0%{opacity:1}100%{opacity:0}}
</style></head><body><div class="lds-spinner">${blades}</div></body></html>`;
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
