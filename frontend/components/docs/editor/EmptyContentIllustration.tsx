/** The glossy cube illustration for the "knowledge base is ready" empty
 *  state — inline SVG, not an image asset, so it inherits the app's
 *  brand-purple/brand-blue tokens instead of shipping a fixed-color PNG. */
export function EmptyContentIllustration() {
  return (
    <div className="relative mx-auto h-40 w-48" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-primary/15 blur-3xl" />

      <svg viewBox="0 0 160 150" className="absolute inset-x-0 bottom-0 mx-auto h-32 w-40">
        <defs>
          <linearGradient id="empty-content-cube-face" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-purple)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* Pins jutting out of the left face, like a keycap switch */}
        <rect x="34" y="66" width="16" height="6" rx="3" fill="var(--color-brand-purple)" fillOpacity="0.5" />
        <rect x="34" y="78" width="16" height="6" rx="3" fill="var(--color-brand-purple)" fillOpacity="0.5" />
        <rect x="34" y="90" width="16" height="6" rx="3" fill="var(--color-brand-purple)" fillOpacity="0.5" />

        {/* Cube body, glossy/translucent */}
        <rect
          x="48"
          y="34"
          width="86"
          height="86"
          rx="20"
          fill="url(#empty-content-cube-face)"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="1.5"
        />
        {/* Top-left highlight, the "glossy" bevel */}
        <path d="M60 46 Q60 40 66 40 L108 40 Q84 40 66 62 L60 62 Z" fill="#ffffff" fillOpacity="0.35" />
        {/* Bottom-right shading for depth */}
        <rect x="48" y="34" width="86" height="86" rx="20" fill="#1a1030" fillOpacity="0.08" />
      </svg>

      <span className="absolute left-6 top-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-card text-base font-bold text-foreground shadow-md">
        ?
        <span className="absolute -bottom-1 left-2 h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-primary bg-card" />
      </span>
    </div>
  );
}
