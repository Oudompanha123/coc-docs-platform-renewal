"use client";

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

/**
 * Pagination over the loaded list.
 *
 * <p>Controlled, not self-contained: the page owns `page` and `pageSize`,
 * because it is the page that slices the rows and that has to reset to the
 * first page when a filter changes. A component holding that state privately
 * would leave the table showing page 4 of a two-page result.
 *
 * <p>Client-side paging, deliberately. The account list is one request and the
 * whole team fits in it; server-side paging would add a round trip per page
 * and a cursor to get wrong, to solve a problem this table does not have yet.
 * When it does, the change is here and in one query.
 */
export function Pagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  /** Rows after filtering — what is actually being paged. */
  total: number;
  /** 1-based, matching what the buttons show. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pageCount);

  // At most seven buttons, centred on the current page. A team of forty would
  // otherwise render forty of them and wrap the control onto three lines.
  const windowStart = Math.max(1, Math.min(current - 3, pageCount - 6));
  const pages = Array.from({ length: Math.min(7, pageCount) }, (_, i) => windowStart + i);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-6 py-4 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <div className="relative">
          <select
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              // Showing more rows can remove pages from under the reader.
              onPageChange(1);
            }}
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
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted transition-colors enabled:hover:border-brand-purple enabled:hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
        >
          ‹
        </button>

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === current ? "page" : undefined}
            className={
              p === current
                ? "flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue text-sm font-semibold text-white"
                : "flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-sm font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
            }
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-muted transition-colors enabled:hover:border-brand-purple enabled:hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
        >
          ›
        </button>
      </div>
    </div>
  );
}
