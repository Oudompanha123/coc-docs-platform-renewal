import type { ReactNode } from "react";

/** One numbered step — dark circle badge + heading + body, matching the
 *  reference docs site's step pattern. */
export function DocStep({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex gap-4 border-b border-border py-6 last:border-b-0">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        {children && <div className="mt-2 space-y-3 text-sm text-muted">{children}</div>}
      </div>
    </div>
  );
}
