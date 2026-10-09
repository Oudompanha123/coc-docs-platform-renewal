import type { SVGProps } from "react";

/**
 * The handful of icons the legal pages' highlight cards and section tiles
 * need that neither `components/layout/icons.tsx` nor
 * `components/auth/icons.tsx` already export. Same 24x24 stroked outline
 * style as those two files, so a legal icon reads as the same icon set.
 */

export function KeyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="7.5" cy="15.5" r="4" />
      <path d="m10.5 12.5 8-8" />
      <path d="m16 7 2.5 2.5" />
      <path d="m19 4 2 2" />
    </svg>
  );
}

export function HistoryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.4" />
      <path d="M3.5 4.5v4h4" />
      <path d="M12 8v4.3l3 1.8" />
    </svg>
  );
}

export function ServerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01" />
      <path d="M7 16.5h.01" />
    </svg>
  );
}

export function SlidersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 20v-7" />
      <path d="M5 9V4" />
      <path d="M12 20v-10" />
      <path d="M12 6V4" />
      <path d="M19 20v-4" />
      <path d="M19 12V4" />
      <path d="M3 11h4" />
      <path d="M10 8h4" />
      <path d="M17 14h4" />
    </svg>
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 3 5 6v5.5c0 4.3 2.9 8.3 7 9.5 4.1-1.2 7-5.2 7-9.5V6z" />
      <path d="m9.2 12 2 2 3.6-3.9" />
    </svg>
  );
}
