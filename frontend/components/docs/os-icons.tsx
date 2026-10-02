"use client";

import { useId } from "react";
import type { ComponentType, SVGProps } from "react";
import type { HeroDownloadOs } from "@/lib/docs/content-types";

/**
 * Windows / macOS / Linux glyphs for the Hero editor's download-button rows
 * and the rendered Hero's own buttons — this app's closed icon set
 * (`components/layout/icons.tsx`, `lib/docs/icon-map.ts`) has no OS icons,
 * and the task scope asks for inline SVGs here rather than a new icon
 * package. Page-scoped on purpose: nothing outside the Hero feature uses
 * these today.
 *
 * <p>Each icon mints its own gradient id via `useId()` so that several of
 * the same icon on one page (e.g. the admin editor's three OS cards, or a
 * Hero with its own buttons rendered alongside a Live Preview copy) never
 * share — and so never silently break — a `<linearGradient>` definition.
 *
 * <p>Decorative only: every caller already supplies the button's own
 * accessible name (its label text), so these carry `aria-hidden="true"`
 * rather than their own.
 *
 * <p>Licensing —
 * Windows and Apple marks: path geometry after Simple Icons (CC0 1.0
 * Universal — https://github.com/simple-icons/simple-icons, CC0-licensed).
 * Tux (the Linux penguin): original character © Larry Ewing
 * (lewing@isc.tamu.edu) and The GIMP, redrawn here as a simplified flat
 * icon under the same attribution terms Tux has always carried.
 */

function base(props: SVGProps<SVGSVGElement>) {
  return { viewBox: "0 0 24 24", "aria-hidden": true as const, ...props };
}

export function WindowsIcon(props: SVGProps<SVGSVGElement>) {
  const gradientId = `hero-os-windows-${useId()}`;
  return (
    <svg {...base(props)}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
      </defs>
      {/* Four panes, a 1.5px gap between them — the classic four-square mark, not the wordmark. */}
      <path d="M3 3.75h8.25V12H3V3.75Z" fill={`url(#${gradientId})`} />
      <path d="M12.75 3.75H21V12h-8.25V3.75Z" fill={`url(#${gradientId})`} />
      <path d="M3 12.75h8.25V21H3v-8.25Z" fill={`url(#${gradientId})`} />
      <path d="M12.75 12.75H21V21h-8.25v-8.25Z" fill={`url(#${gradientId})`} />
    </svg>
  );
}

export function AppleIcon(props: SVGProps<SVGSVGElement>) {
  const gradientId = `hero-os-apple-${useId()}`;
  return (
    <svg {...base(props)}>
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>
      </defs>
      <path
        d="M15.5 8.1c-.9 0-1.9.5-2.6.5s-1.6-.5-2.6-.5C7.9 8.1 6 9.9 6 13c0 2.9 2 7.6 4.3 7.6.9 0 1.2-.6 2.1-.6s1.2.6 2.2.6C17 20.6 19 15.6 19 13c0-.2 0-.4 0-.5-2 .2-3-1.2-3-2.5 0-.8.3-1.5.5-1.9z"
        fill={`url(#${gradientId})`}
        stroke="#6b7280"
        strokeOpacity="0.3"
        strokeWidth="0.4"
      />
      <path
        d="M13.3 7.4c.3-1 1.1-1.9 2.3-2-.1 1-.6 2-1.3 2.6-.4.4-1 .6-1.5.6 0-.4.2-.9.5-1.2z"
        fill={`url(#${gradientId})`}
        stroke="#6b7280"
        strokeOpacity="0.3"
        strokeWidth="0.4"
      />
    </svg>
  );
}

/**
 * Tux. Full color: body `#1f2937`, belly/face `#ffffff`, beak + feet
 * `#f59e0b`. The belly carries a hairline `#e5e7eb` stroke always (not only
 * in dark mode) — on this icon's own near-white tones the stroke is nearly
 * invisible, and it is what keeps the belly from washing into a dark tile
 * background without needing a second, dark-mode-only variant of the path.
 */
export function LinuxIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M8.3 10.8c-1.6 1.6-2.4 4.2-2.4 6.3 0 2.5 2.9 3.9 6.1 3.9s6.1-1.4 6.1-3.9c0-2.1-.8-4.7-2.4-6.3"
        fill="#1f2937"
      />
      <ellipse cx="12" cy="8.6" rx="3.4" ry="3.8" fill="#1f2937" />
      <ellipse cx="12" cy="17.6" rx="3.2" ry="2.6" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.3" />
      <circle cx="10.1" cy="8.2" r="1" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.3" />
      <circle cx="13.9" cy="8.2" r="1" fill="#ffffff" stroke="#e5e7eb" strokeWidth="0.3" />
      <circle cx="10.1" cy="8.3" r=".4" fill="#1f2937" />
      <circle cx="13.9" cy="8.3" r=".4" fill="#1f2937" />
      <path d="M11.3 10.1h1.4l-.7 1.1-.7-1.1Z" fill="#f59e0b" />
      <ellipse cx="9.4" cy="19.9" rx="1.3" ry=".8" fill="#f59e0b" />
      <ellipse cx="14.6" cy="19.9" rx="1.3" ry=".8" fill="#f59e0b" />
    </svg>
  );
}

export const HERO_DOWNLOAD_OS_ICON: Record<HeroDownloadOs, ComponentType<SVGProps<SVGSVGElement>>> = {
  windows: WindowsIcon,
  macos: AppleIcon,
  linux: LinuxIcon,
};
