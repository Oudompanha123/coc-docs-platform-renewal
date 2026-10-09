import type { ReactNode } from "react";
import { AppShell } from "./AppShell";

/** Shared shell for a sidebar item that has a real route but no built
 *  page yet — honest "not built yet" state instead of a 404 or fabricated
 *  feature content. */
export function ComingSoonPage({
  pageTitle,
  titleIcon,
  icon,
}: {
  pageTitle: string;
  titleIcon: ReactNode;
  icon: ReactNode;
}) {
  return (
    <AppShell pageTitle={pageTitle} pageSubtitle="This page isn't built yet" titleIcon={titleIcon}>
      <div className="flex flex-col items-center justify-center rounded-xl border border-surface-border bg-card p-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted-surface text-muted-foreground">{icon}</div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">{pageTitle} is coming soon</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This section is in the sidebar, but there&apos;s nothing built here yet.
        </p>
      </div>
    </AppShell>
  );
}
