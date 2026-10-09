"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth/SessionProvider";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { fetchEngineStatus, type AxRenewalEngineStatus } from "@/lib/ax-renewal/api";

/**
 * A slim summary bar across the bottom of the AX Renewal shell, mirroring the
 * reference prototype's status bar — self-contained (reads the project via
 * the same `project=` query param the sidebar and page already read
 * independently, per `useAxRenewalProject`'s own doc comment) so it needs no
 * prop wiring through the layout.
 *
 * `sticky bottom-0 z-10`, the same pattern `AxRenewalTopbar` already uses for
 * `sticky top-0` — this is the half of CodeRenewalPlatform.html's fixed
 * `26px` status row the side columns' own `sticky top-0
 * h-[calc(100vh-32px)]` assumed but never actually provided: those columns
 * stay pinned to the top 32px-short of the viewport, but without this, the
 * footer itself was a plain flow element that only reached the visible area
 * once a tall `<main>` (the Codebase panel's stacked cards, say) had been
 * scrolled all the way past — i.e. it looked like it had scrolled away
 * rather than stayed fixed. `z-10`, not higher: stays above ordinary
 * scrolling content without climbing over the mobile sidebar drawer's own
 * `z-40`/`z-50`.
 */
export function AxRenewalStatusBar() {
  const { user } = useSession();
  const { detail } = useAxRenewalProjectContext();

  // Project-independent (the same `GET /engine` AttachSourceSection/
  // AxAssistantPanel already call), so this fetches once per mount rather
  // than per project. Was hardcoded to the single word "no model" below,
  // regardless of whether this deployment actually has one configured —
  // this is what makes it honest instead.
  const [engine, setEngine] = useState<AxRenewalEngineStatus | null>(null);
  useEffect(() => {
    void fetchEngineStatus().then(setEngine);
  }, []);

  if (!detail) {
    return (
      <footer className="sticky bottom-0 z-10 flex h-8 items-center gap-4 border-t border-border bg-white px-4 text-xs text-muted">
        <span>No project selected</span>
        {user?.displayName && (
          <span className="ml-auto">
            {user.displayName} · {user.role ?? ""}
          </span>
        )}
      </footer>
    );
  }

  const analyzed = detail.analysis != null;
  const confirmedCount = Object.keys(detail.confirmations).length;
  const movingLayers = detail.stackLayers.filter((l) => l.newTarget && l.newTarget !== l.oldTarget).length;
  // Confirming Database with nothing entered records "this renewal doesn't
  // use one" — a real decision, not the same as not having gotten to it yet.
  const noDatabaseNeeded =
    detail.confirmations.database != null && !detail.dbConnection && detail.dbChanges.length === 0;

  return (
    <footer className="sticky bottom-0 z-10 flex h-8 items-center gap-4 overflow-x-auto border-t border-border bg-white px-4 font-mono text-xs text-muted">
      <span className={analyzed ? "text-foreground" : ""}>{analyzed ? "analysed" : "not analysed"}</span>
      {analyzed && (
        <>
          <span>{movingLayers}/{detail.stackLayers.length} layers moving</span>
          <span className={detail.dbConnection || noDatabaseNeeded ? "text-foreground" : ""}>
            {detail.dbConnection
              ? detail.dbConnection.databaseName ?? "connected"
              : noDatabaseNeeded
                ? "no database required"
                : "database not connected"}
          </span>
          <span className={confirmedCount === 4 ? "text-foreground" : ""}>{confirmedCount}/4 confirmed</span>
          <span className={detail.destination ? "text-foreground" : ""}>
            {detail.destination ? detail.destination.target : "no destination"}
          </span>
        </>
      )}
      <span className="ml-auto">
        {detail.latestImplementationRun ? detail.latestImplementationRun.status : "idle"}
      </span>
      <span className={engine?.connected ? "text-foreground" : ""}>
        {!engine ? "checking model" : engine.connected ? "local model" : "no model"}
      </span>
      {user?.displayName && (
        <span>
          {user.displayName} · {user.role ?? ""}
        </span>
      )}
    </footer>
  );
}
