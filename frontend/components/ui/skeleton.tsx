/**
 * Skeleton — shadcn/ui's placeholder block, plus the few shapes the
 * dashboard's loading states are made of (ADR-104 r2.11).
 *
 * Every admin loading state is a skeleton of what is about to appear — stat
 * cards where the stat cards will be, rows where the table will be — instead
 * of a "Loading…" line that the real content then shoves out of the way. The
 * page keeps its shape from the first frame, so nothing jumps when data lands.
 *
 * The fill is `bg-muted-surface`, not shadcn's `bg-muted`: `bg-muted` is a
 * legacy token in this app (ADR-104 decision 2). Each composite carries
 * `role="status"` and a label, so a screen reader hears "Loading …" once
 * rather than a dozen empty boxes.
 *
 * // req: ADR-104
 */
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted-surface motion-reduce:animate-none", className)}
      {...props}
    />
  );
}

/** A labelled wrapper, so the group is announced once. */
export function SkeletonGroup({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-label={label} className={className}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** A row of stat cards — the shape of `UsageStatCard` and its siblings. */
export function SkeletonStatCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-xl border border-surface-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="mt-4 h-7 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

/** A table card: a header row and `rows` body rows of `columns` cells. */
export function SkeletonTable({
  rows = 6,
  columns = 4,
  className,
  bare = false,
}: {
  rows?: number;
  columns?: number;
  className?: string;
  /** No card border — for a table that already sits inside a card. */
  bare?: boolean;
}) {
  const widths = ["w-2/3", "w-1/2", "w-3/4", "w-2/5", "w-1/3", "w-3/5"];
  return (
    <div className={cn(!bare && "overflow-hidden rounded-xl border border-surface-border bg-card", className)}>
      <div className="flex gap-4 border-b border-surface-border px-4 py-3">
        {Array.from({ length: columns }, (_, c) => (
          <div key={c} className="flex-1">
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-surface-border px-4 py-3.5 last:border-b-0">
          {Array.from({ length: columns }, (_, c) => (
            <div key={c} className="flex-1">
              <Skeleton className={cn("h-4", widths[(r + c) % widths.length])} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** A list of avatar-and-two-lines rows — activity feeds, sessions, history. */
export function SkeletonList({ rows = 4, avatar = true, className }: { rows?: number; avatar?: boolean; className?: string }) {
  return (
    <div className={cn("divide-y divide-surface-border", className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          {avatar && <Skeleton className="size-8 shrink-0 rounded-full" />}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className={cn("h-3.5", i % 2 ? "w-1/2" : "w-2/3")} />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** A content card: a title line and a few lines of text. */
export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("rounded-xl border border-surface-border bg-card p-5", className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-4 h-8 w-40" />
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
        ))}
      </div>
    </div>
  );
}

/** A form card: label-and-field pairs. */
export function SkeletonForm({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <div className={cn("space-y-5", className)}>
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className={cn("rounded-full", i === fields - 1 ? "h-24 rounded-xl" : "h-10")} />
        </div>
      ))}
    </div>
  );
}
