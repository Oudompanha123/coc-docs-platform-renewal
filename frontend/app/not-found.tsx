import Link from "next/link";
import { HomeIcon } from "@/components/layout/icons";

/** Static torn-page-with-sad-face icon next to the "404" — no shared icon
 *  like this exists elsewhere in the app yet (one-off, same pattern as
 *  ClockIcon in AccountsTable.tsx). */
function TornPageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 4h18l10 10v26a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4Z"
        fill="#e7e9f5"
        stroke="#c3c7e0"
        strokeWidth="1.5"
      />
      <path d="M30 4v8a2 2 0 0 0 2 2h8" fill="none" stroke="#c3c7e0" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 26l4-3 3 3 4-4 3 3" fill="none" stroke="#a7abcf" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="34" r="1.6" fill="#6b6b80" />
      <circle cx="28" cy="34" r="1.6" fill="#6b6b80" />
      <path d="M17 41c1.5-2 3-2 4-2s2.5 0 4 2" stroke="#6b6b80" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/**
 * Global 404 (Next.js App Router convention: app/not-found.tsx renders for
 * any unmatched route or an explicit notFound() call).
 *
 * Two-column layout replacing the earlier single-scene concept. The right
 * column's illustration is inline SVG (no image asset, no animation
 * library); only the character moves — see globals.css: walk-drift (the
 * whole figure paces a few px back and forth along the path, alternating
 * direction so it reverses smoothly with no reset/fade needed), leg-swing,
 * body-bob, and teardrop-fall. Signpost, clouds, footprints, and everything
 * in the left column stay static.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center bg-page px-6 py-16 md:px-12 lg:px-20">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* Left column — static */}
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center gap-4 lg:justify-start">
            <span className="text-7xl font-extrabold text-dash-ink sm:text-8xl">404</span>
            <TornPageIcon className="h-16 w-16 sm:h-20 sm:w-20" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-dash-ink sm:text-4xl">Page Not Found</h1>
          <p className="mx-auto mt-4 max-w-md text-base text-muted lg:mx-0">
            The page you are looking for might have been removed, had its name changed, or is temporarily
            unavailable.
          </p>
          <Link
            href="/overview"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2"
          >
            <HomeIcon className="h-4 w-4" />
            Go Back Home
          </Link>
        </div>

        {/* Right column — illustration */}
        <div className="mx-auto w-full max-w-lg lg:max-w-xl">
          <svg viewBox="0 0 360 340" className="h-auto w-full" fill="none" aria-hidden="true">
            {/* clouds, static */}
            <g fill="#e7eaf8">
              <ellipse cx="70" cy="46" rx="30" ry="16" />
              <ellipse cx="48" cy="53" rx="18" ry="11" />
              <ellipse cx="92" cy="53" rx="18" ry="11" />
            </g>
            <g fill="#eef1fa">
              <ellipse cx="270" cy="30" rx="24" ry="13" />
              <ellipse cx="254" cy="36" rx="14" ry="9" />
              <ellipse cx="286" cy="36" rx="14" ry="9" />
            </g>

            {/* soft ground-shadow patches along the path, static */}
            <g fill="#e2e6f5" opacity="0.55">
              <ellipse cx="90" cy="300" rx="60" ry="14" />
              <ellipse cx="230" cy="322" rx="70" ry="14" />
            </g>

            {/* footprints trailing behind the character, static */}
            <g fill="#d3d7ec">
              <ellipse cx="55" cy="298" rx="6" ry="9" transform="rotate(-16 55 298)" opacity="0.55" />
              <ellipse cx="76" cy="288" rx="6" ry="9" transform="rotate(-16 76 288)" opacity="0.65" />
              <ellipse cx="98" cy="292" rx="6" ry="9" transform="rotate(-16 98 292)" opacity="0.78" />
              <ellipse cx="120" cy="282" rx="6" ry="9" transform="rotate(-16 120 282)" opacity="0.9" />
            </g>

            {/* signpost, grass, rock — static, arrow points back toward the character */}
            <g>
              <ellipse cx="295" cy="322" rx="22" ry="7" fill="#c9cee6" opacity="0.5" />
              <path d="M266 318q3-11 0-18" stroke="#7fb069" strokeWidth="3" strokeLinecap="round" fill="none" />
              <path d="M274 318q3-10 0-17" stroke="#7fb069" strokeWidth="3" strokeLinecap="round" fill="none" />
              <ellipse cx="312" cy="320" rx="14" ry="8" fill="#a9a6bb" />
              <rect x="305" y="215" width="8" height="115" rx="3" fill="#9c7b53" />
              <path
                d="M285 197h48v20h-48l-15 -10Z"
                fill="#8a6a45"
                stroke="#725636"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <text x="309" y="212" textAnchor="middle" fontSize="15" fontWeight="700" fill="#f3f1e9">
                404
              </text>
            </g>

            {/* character — paces a short distance (walk-drift) */}
            <g className="animate-walk-drift">
              {/* legs, hinged at the hip (200,236 — the torso's bottom edge), alternating swing */}
              <g style={{ transformOrigin: "200px 236px" }} className="animate-leg-swing">
                <line x1="200" y1="236" x2="182" y2="308" stroke="#22242e" strokeWidth="15" strokeLinecap="round" />
                <ellipse cx="173" cy="315" rx="15" ry="6" fill="#f4f4f6" stroke="#22242e" strokeWidth="1.5" />
                <path d="M162 315a15 6 0 0 0 22 0" fill="none" stroke="#22242e" strokeWidth="1.5" />
                <rect x="168" y="304" width="20" height="12" rx="6" fill="#22242e" />
              </g>
              <g style={{ transformOrigin: "200px 236px", animationDelay: "-0.25s" }} className="animate-leg-swing">
                <line x1="200" y1="236" x2="218" y2="308" stroke="#22242e" strokeWidth="15" strokeLinecap="round" />
                <ellipse cx="227" cy="315" rx="15" ry="6" fill="#f4f4f6" stroke="#22242e" strokeWidth="1.5" />
                <path d="M212 315a15 6 0 0 0 22 0" fill="none" stroke="#22242e" strokeWidth="1.5" />
                <rect x="212" y="304" width="20" height="12" rx="6" fill="#22242e" />
              </g>

              {/* torso, backpack, head, arms, tears — bob together */}
              <g className="animate-body-bob">
                {/* arm hanging at the side */}
                <path d="M170 172 160 232" stroke="#22242e" strokeWidth="17" strokeLinecap="round" fill="none" />

                {/* hoodie torso */}
                <rect x="160" y="150" width="80" height="92" rx="30" fill="#22242e" />

                {/* backpack, centered on the back */}
                <rect x="169" y="158" width="62" height="70" rx="14" fill="#3a3d4c" stroke="#22242e" strokeWidth="2" />
                <rect x="188" y="170" width="26" height="22" rx="5" fill="#22242e" />
                <circle cx="201" cy="203" r="2.6" fill="#5f6376" />
                <line x1="174" y1="152" x2="167" y2="178" stroke="#22242e" strokeWidth="5" strokeLinecap="round" />
                <line x1="226" y1="152" x2="233" y2="178" stroke="#22242e" strokeWidth="5" strokeLinecap="round" />

                {/* head + hair, seen from behind/three-quarters (shifted down 12px to close the neck gap above the torso) */}
                <g transform="translate(0 12)">
                  <circle cx="200" cy="98" r="34" fill="#f2c9a0" />
                  <path
                    d="M164 92a36 32 0 0 1 68-4c2 6-3 12-8 8-3-11-13-19-25-19-11 0-21 7-24 18-3 5-9 3-11-3Z"
                    fill="#171922"
                  />
                  <path d="M164 92c-3 11 0 21 7 26-6-1-13-8-13-18 0-4 2-7 6-8Z" fill="#171922" />
                  <path d="M198 62c4-4 9-6 13-5-3 2-6 5-7 9Z" fill="#171922" />
                  <path d="M214 65c4-2 9-2 12 0-4 1-7 3-9 6Z" fill="#171922" />
                </g>

                {/* raised arm wiping the eye */}
                <path d="M230 172q12-14 8-22" stroke="#22242e" strokeWidth="17" strokeLinecap="round" fill="none" />
                <circle cx="238" cy="150" r="11" fill="#f2c9a0" />

                {/* teardrops falling from the raised hand, looping */}
                <path
                  d="M233 170c3 4 4 7 4 9a4 4 0 1 1-8 0c0-2 1-5 4-9Z"
                  fill="#7cb8e8"
                  className="animate-teardrop-fall"
                  style={{ animationDelay: "0ms" }}
                />
                <path
                  d="M245 176c3 4 4 7 4 9a4 4 0 1 1-8 0c0-2 1-5 4-9Z"
                  fill="#7cb8e8"
                  className="animate-teardrop-fall"
                  style={{ animationDelay: "450ms" }}
                />
                <path
                  d="M239 188c3 4 4 7 4 9a4 4 0 1 1-8 0c0-2 1-5 4-9Z"
                  fill="#7cb8e8"
                  className="animate-teardrop-fall"
                  style={{ animationDelay: "900ms" }}
                />
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
