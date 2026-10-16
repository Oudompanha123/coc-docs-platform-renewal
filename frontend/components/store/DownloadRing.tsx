"use client";

import { type ReactNode } from "react";
import { percentOf, type DownloadState } from "@/lib/store/download";

const SIZE = 36;
const STROKE = 3;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The App Store's download indicator, drawn over an app icon. While a build
 * downloads, the icon is dimmed and a pie sweeps clockwise from the top,
 * revealing the icon at full brightness as the percentage grows; a small
 * ring in the centre tracks the same progress. When the download is done the
 * dimming fades away. A failed download leaves the icon dimmed with a red
 * ring. With an unknown size the ring spins instead of filling.
 *
 * The overlay is clipped to the icon's rounded square and takes no layout
 * space. It is decoration; the Download button and an `aria-live` region carry
 * the state in words.
 */
export function DownloadRing({ state, children }: { state: DownloadState | null; children: ReactNode }) {
  const downloading = state?.status === "downloading";
  const percent = downloading ? percentOf(state.loaded, state.total) : null;
  const indeterminate = downloading && percent === null;

  const revealed = state?.status === "done" ? 100 : (percent ?? 0);
  const failed = state?.status === "error";
  const arc = failed ? 100 : state?.status === "done" ? 100 : (percent ?? 25);

  return (
    <div className="relative shrink-0">
      {children}
      {state && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-[22%] transition-opacity duration-500 ${
            state.status === "done" ? "opacity-0" : "opacity-100"
          }`}
          style={{
            // Remaining (not yet downloaded) part is dark; the downloaded wedge shows the icon.
            background: `conic-gradient(from 0deg, transparent 0 ${revealed}%, rgba(0, 0, 0, 0.58) ${revealed}% 100%)`,
          }}
        >
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            className={`absolute left-1/2 top-1/2 h-[46%] w-[46%] -translate-x-1/2 -translate-y-1/2 -rotate-90 ${
              failed ? "text-red-400" : "text-white"
            } ${indeterminate ? "animate-spin" : ""}`}
          >
            <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={STROKE} />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - arc / 100)}
              className="transition-[stroke-dashoffset] duration-300 ease-out"
            />
          </svg>
        </div>
      )}
    </div>
  );
}
