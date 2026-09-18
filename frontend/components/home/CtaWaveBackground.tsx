/**
 * Ribbon-wave background for the Home page's CTA band — several soft,
 * glowing ribbons crossing diagonally over a dark violet-to-black radial
 * base, each fading transparent → color → transparent along its own length,
 * with a few thinner, brighter highlight strands woven through. Built with
 * inline SVG (stroked paths + a Gaussian blur filter) rather than a photo —
 * no canvas/WebGL, no new dependency.
 *
 * Each ribbon/highlight is one path, defined once for a single tile of
 * width TILE_WIDTH, then rendered twice — the second copy translated by
 * exactly one tile width. The whole group then drifts via a single slow
 * `translateX` from 0 to -50%, which is exactly one tile's width: the
 * second copy lines up where the first started, so the loop has no visible
 * seam. Varied vertical start/amplitude/drift per ribbon is what makes them
 * visibly cross rather than stack as parallel waves.
 *
 * No dedicated `prefers-reduced-motion` rule — the blanket rule in
 * globals.css already forces every animation's duration near zero under
 * that preference, which freezes this drift the same as everything else.
 */
const TILE_WIDTH = 900;
const HEIGHT = 300;

type Ribbon = {
  id: string;
  /** Cubic-bezier path across one tile (0 to TILE_WIDTH), y-only motion. */
  path: string;
  color: string;
  strokeWidth: number;
};

const RIBBONS: Ribbon[] = [
  { id: "r1", path: "M0 90 C180 50, 315 130, 450 120 C585 80, 720 160, 900 150", color: "#6d3ce0", strokeWidth: 54 },
  { id: "r2", path: "M0 150 C180 95, 315 205, 450 115 C585 60, 720 170, 900 80", color: "#4c6ff0", strokeWidth: 46 },
  { id: "r3", path: "M0 210 C180 175, 315 245, 450 235 C585 200, 720 270, 900 260", color: "#4338ca", strokeWidth: 60 },
  { id: "r4", path: "M0 60 C180 10, 315 110, 450 105 C585 55, 720 155, 900 150", color: "#7c5cff", strokeWidth: 38 },
  { id: "r5", path: "M0 240 C180 195, 315 285, 450 200 C585 155, 720 245, 900 160", color: "#5b3ec8", strokeWidth: 50 },
];

const HIGHLIGHTS: Ribbon[] = [
  { id: "h1", path: "M0 120 C180 72, 315 168, 450 140 C585 92, 720 188, 900 160", color: "#c4b5fd", strokeWidth: 4 },
  { id: "h2", path: "M0 180 C180 142, 315 218, 450 152.5 C585 114.5, 720 190.5, 900 125", color: "#a78bfa", strokeWidth: 3 },
  { id: "h3", path: "M0 75 C180 33, 315 117, 450 110 C585 68, 720 152, 900 145", color: "#ddd6fe", strokeWidth: 2.5 },
];

function RibbonTile({ ribbon }: { ribbon: Ribbon }) {
  return (
    <>
      <path d={ribbon.path} stroke={`url(#cta-ribbon-${ribbon.id})`} strokeWidth={ribbon.strokeWidth} strokeLinecap="round" fill="none" />
      <path
        d={ribbon.path}
        stroke={`url(#cta-ribbon-${ribbon.id})`}
        strokeWidth={ribbon.strokeWidth}
        strokeLinecap="round"
        fill="none"
        transform={`translate(${TILE_WIDTH} 0)`}
      />
    </>
  );
}

/** Sits as the first child of a `relative overflow-hidden` band, painted
 *  behind the CTA copy that follows it in source order. */
export function CtaWaveBackground() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 bottom-0 left-0 bg-[radial-gradient(ellipse_at_center,_#3b2472_0%,_#1a1235_45%,_#0a0817_85%)]"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 h-56 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/30 blur-3xl"
      />

      <svg
        aria-hidden="true"
        viewBox={`0 0 ${TILE_WIDTH * 2} ${HEIGHT}`}
        preserveAspectRatio="none"
        className="animate-ribbon-drift absolute top-0 left-0 h-full w-[200%]"
      >
        <defs>
          {[...RIBBONS, ...HIGHLIGHTS].map((r) => (
            <linearGradient key={r.id} id={`cta-ribbon-${r.id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={TILE_WIDTH} y2="0">
              <stop offset="0%" stopColor={r.color} stopOpacity="0" />
              <stop offset="50%" stopColor={r.color} stopOpacity="0.65" />
              <stop offset="100%" stopColor={r.color} stopOpacity="0" />
            </linearGradient>
          ))}
          <filter id="cta-ribbon-blur" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <filter id="cta-highlight-blur" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        <g filter="url(#cta-ribbon-blur)">
          {RIBBONS.map((ribbon) => (
            <RibbonTile key={ribbon.id} ribbon={ribbon} />
          ))}
        </g>
        <g filter="url(#cta-highlight-blur)" opacity="0.9">
          {HIGHLIGHTS.map((ribbon) => (
            <RibbonTile key={ribbon.id} ribbon={ribbon} />
          ))}
        </g>
      </svg>
    </>
  );
}
