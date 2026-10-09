"use client";

import { useEffect, useState } from "react";
import { PulseIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { listSessions, revokeSession, type SessionSummary } from "@/lib/auth/api";

/* The user agent used to be parsed here, into "Chrome on Windows". The server
   sends that string now (SessionResponse.device), because it composes the push
   notification about the same device and the two descriptions have to match —
   a banner saying Chrome beside a list row saying Safari makes a person
   distrust both. The rules live in DeviceDescription.java. */
function formatWhen(iso: string): string {
  const when = new Date(iso);
  return Number.isNaN(when.getTime()) ? "recently" : when.toLocaleString();
}

/**
 * Every signed-in session of this account, with a per-device sign-out. Moved
 * out of SecurityTab unchanged so `/settings` (inside the Security accordion)
 * and `/account/settings#sessions` show the same list from one component.
 */
export function ActiveSessions() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load your sessions."))
      .finally(() => setLoading(false));
  }, []);

  async function signOutSession(id: string) {
    // Removed from the list only once the server has revoked it. Dropping it
    // optimistically would show a device as signed out while its session row
    // was still live.
    try {
      await revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not end that session.");
    }
  }

  return (
    <div className="py-4 last:pb-0">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <PulseIcon className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-dash-ink">Active sessions</p>
      </div>
      <div className="mt-3 divide-y divide-border">
        {loading && <p className="py-3 text-xs text-muted">Loading your sessions…</p>}
        {error && <p className="py-3 text-xs text-danger">{error}</p>}
        {!loading && !error && sessions.length === 0 && (
          <p className="py-3 text-xs text-muted">No other sessions.</p>
        )}
        {sessions.map((session) => (
          <div key={session.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dash-ink">
                {session.device}
                {session.current && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
                    This device
                  </span>
                )}
                {session.newDevice && !session.current && (
                  // The same fact the alert was about, left on the row it
                  // belongs to. Somebody who dismissed the notification, or
                  // never had notifications on, can still see which of
                  // these appeared out of nowhere.
                  <span className="ml-2 inline-flex items-center rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                    New device
                  </span>
                )}
              </p>
              <p className="truncate text-xs text-muted">
                {session.ipAddress ?? "Unknown address"} · signed in {formatWhen(session.issuedAt)}
              </p>
            </div>
            {!session.current && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void signOutSession(session.id)}
                className="shrink-0 rounded-full text-dash-ink"
              >
                Sign out
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
