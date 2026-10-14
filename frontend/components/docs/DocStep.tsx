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
    <div className="flex gap-3 border-b border-surface-border py-5 last:border-b-0">
      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold leading-7 text-foreground">{title}</h3>
        {children && <div className="mt-1.5 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}
