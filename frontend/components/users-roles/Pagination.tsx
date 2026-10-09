"use client";

import { Button } from "@/components/ui/button";
import { SimpleSelect } from "@/components/ui/select";
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
    <div className="flex flex-col gap-3 border-t border-surface-border px-5 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span>Rows per page:</span>
        <SimpleSelect
          size="sm"
          aria-label="Rows per page"
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v));
            // Showing more rows can remove pages from under the reader.
            onPageChange(1);
          }}
          options={PAGE_SIZE_OPTIONS.map((size) => ({ value: String(size), label: size }))}
          className="w-20 font-medium"
        />
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
          aria-label="Previous page"
          className="size-8 text-muted-foreground"
        >
          ‹
        </Button>

        {pages.map((p) => (
          <Button
            key={p}
            type="button"
            variant={p === current ? "default" : "ghost"}
            size="icon"
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === current ? "page" : undefined}
            className="size-8 font-medium"
          >
            {p}
          </Button>
        ))}

        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={current >= pageCount}
          onClick={() => onPageChange(current + 1)}
          aria-label="Next page"
          className="size-8 text-muted-foreground"
        >
          ›
        </Button>
      </div>
    </div>
  );
}
