import Image from "next/image";
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
 * Fully static — no animation anywhere on this page. The provided
 * illustration (public/404.jpg, an uploaded asset) fills the entire
 * viewport as the page background, rendered via next/image (built into
 * Next.js, not a new dependency); the text content sits on top of it.
 */
export default function NotFound() {
  return (
    <div className="relative min-h-screen">
      <Image
        src="/404.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-[68%_75%]"
        priority
      />
      {/* Soft grounding shadow along the bottom of the path, and a gentle
       *  vignette at the edges — adds depth to the flat corners of the
       *  photo (top-left/right) without touching the image file itself. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 160px rgba(0,0,0,0.08)" }}
      />

      <div className="relative flex min-h-screen items-center px-6 py-16 md:px-12 lg:px-[calc(var(--spacing)*150)]">
        <div className="text-center lg:text-left">
          <div className="flex items-center justify-center gap-5 lg:justify-start">
            <span className="text-7xl font-black tracking-tight text-dash-ink sm:text-8xl">404</span>
            <span aria-hidden="true" className="h-14 w-px bg-dash-ink/15 sm:h-16" />
            <TornPageIcon className="h-14 w-14 sm:h-16 sm:w-16" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-dash-ink sm:text-4xl">Page Not Found</h1>
          <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-muted lg:mx-0">
            The page you are looking for might have been removed, had its name changed, or is temporarily
            unavailable.
          </p>
          <Link
            href="/overview"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <HomeIcon className="h-4 w-4" />
            Go Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
