import { Skeleton, SkeletonGroup, SkeletonStatCards, SkeletonTable } from "@/components/ui/skeleton";

/**
 * The admin shell's frame as a skeleton — sidebar, 64px header, a title and
 * a page of cards — shown while the session is still being checked
 * (`RequireSession`'s `fallback`). It used to be a blank screen for that
 * moment. It carries no navigation, names or data, so it shows nothing a
 * visitor might not be entitled to: only that a page is on its way, in the
 * shape it is about to take.
 *
 * Also the shell's route-level `loading.tsx` body (`PageSkeleton`), for the
 * moment between a sidebar click and the next page's first render.
 *
 * // req: ADR-104
 */
export function ShellSkeleton() {
  return (
    <div data-shell="admin" className="flex h-screen flex-col overflow-hidden bg-background lg:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col gap-2 border-r border-nav-border bg-nav px-3 py-3 lg:flex">
        <div className="flex h-10 items-center gap-2.5 px-1">
          <Skeleton className="size-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex h-10 items-center gap-2.5 px-3">
              <Skeleton className="size-4 rounded" />
              <Skeleton className={i % 3 === 0 ? "h-3.5 w-32" : "h-3.5 w-24"} />
            </div>
          ))}
        </div>
      </aside>
      <div className="flex min-h-0 flex-1 flex-col lg:min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-surface-border bg-background px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="size-9 rounded-full" />
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
          <PageSkeleton />
        </main>
      </div>
    </div>
  );
}

/** A generic page body: title, a row of stat cards and a table. */
export function PageSkeleton() {
  return (
    <SkeletonGroup label="Loading page">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      <SkeletonStatCards className="mt-6" />
      <SkeletonTable className="mt-4" rows={6} />
    </SkeletonGroup>
  );
}
