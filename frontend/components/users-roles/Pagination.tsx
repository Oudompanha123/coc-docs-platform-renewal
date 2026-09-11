"use client";

import { useState } from "react";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

/** Static — one page's worth of mock rows exists, so prev/next stay disabled and the
 *  rows-per-page control is a UI stub (like Export), not wired to real pagination. */
export function Pagination({ shown }: { shown: number }) {
  const [pageSize, setPageSize] = useState(Math.min(shown, 5) || PAGE_SIZE_OPTIONS[0]);

  return (
    <div className="flex items-center justify-between border-t border-border px-6 py-4 text-sm text-muted">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            aria-label="Rows per page"
            className="appearance-none rounded-lg border border-border bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-dash-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted disabled:cursor-not-allowed"
        >
          ‹
        </button>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue text-sm font-semibold text-white">
          1
        </span>
        <button
          type="button"
          disabled
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  );
}
