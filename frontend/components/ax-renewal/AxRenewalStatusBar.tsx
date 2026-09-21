"use client";

import { useSession } from "@/lib/auth/SessionProvider";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";

/**
 * A slim summary bar across the bottom of the AX Renewal shell, mirroring the
 * reference prototype's status bar — self-contained (reads the project via
 * the same `project=` query param the sidebar and page already read
 * independently, per `useAxRenewalProject`'s own doc comment) so it needs no
 * prop wiring through the layout.
 */
export function AxRenewalStatusBar() {
  const { user } = useSession();
  const { detail } = useAxRenewalProjectContext();

  if (!detail) {
    return (
      <footer className="flex h-8 items-center gap-4 border-t border-border bg-white px-4 text-xs text-muted">
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

  return (
    <footer className="flex h-8 items-center gap-4 overflow-x-auto border-t border-border bg-white px-4 font-mono text-xs text-muted">
      <span className={analyzed ? "text-brand-purple" : ""}>{analyzed ? "analysed" : "not analysed"}</span>
      {analyzed && (
        <>
          <span>{movingLayers}/{detail.stackLayers.length} layers moving</span>
          <span className={detail.dbConnection ? "text-brand-purple" : ""}>
            {detail.dbConnection ? detail.dbConnection.databaseName ?? "connected" : "database not connected"}
          </span>
          <span className={confirmedCount === 4 ? "text-brand-purple" : ""}>{confirmedCount}/4 confirmed</span>
          <span className={detail.destination ? "text-brand-purple" : ""}>
            {detail.destination ? detail.destination.target : "no destination"}
          </span>
        </>
      )}
      <span className="ml-auto">
        {detail.latestImplementationRun ? detail.latestImplementationRun.status : "idle"}
      </span>
      <span>no model</span>
      {user?.displayName && (
        <span>
          {user.displayName} · {user.role ?? ""}
        </span>
      )}
    </footer>
  );
}
