import type { SVGProps } from "react";
import type { StorePlatform } from "@/lib/store/store-api";

/**
 * Plain glyphs for the four Store platforms — a robot head, an apple, four
 * panes and a laptop. Drawn here, in the same 24px stroke style as
 * `components/layout/icons.tsx`, rather than pulled from a brand icon set.
 */
export function PlatformIcon({ platform, ...props }: { platform: StorePlatform } & SVGProps<SVGSVGElement>) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
    ...props,
  } as const;

  switch (platform) {
    case "android":
      return (
        <svg {...common}>
          <path d="M5 16v-3a7 7 0 0 1 14 0v3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path d="m7.5 7.5-1.5-2.5M16.5 7.5 18 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="9.5" cy="12" r="1" fill="currentColor" />
          <circle cx="14.5" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case "ios":
      return (
        <svg {...common}>
          <path
            d="M12 7.5c-1.2-1-3.6-1.4-5 .4-1.6 2-1.2 6 .7 8.8 1 1.5 2 2.3 3 2.3.6 0 .9-.4 1.3-.4s.7.4 1.3.4c1 0 2-.8 3-2.3 1.9-2.8 2.3-6.8.7-8.8-1.4-1.8-3.8-1.4-5-.4z"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M12 7.5c0-2 1.2-3.5 3-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "windows":
      return (
        <svg {...common}>
          <path d="M4 5.5 11 4.5v7H4zM13 4.2 20 3v8.5h-7zM4 12.5h7v7L4 18.5zM13 12.5h7V21l-7-1.2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "macos":
      return (
        <svg {...common}>
          <rect x="4.5" y="5" width="15" height="10.5" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
          <path d="M2.5 18.5h19" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
  }
}
