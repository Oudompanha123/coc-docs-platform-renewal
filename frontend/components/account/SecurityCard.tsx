"use client";

import { useEffect, useState } from "react";
import { GoogleIcon } from "@/components/auth/icons";
import { fetchMySecurity, type SignInEvent } from "@/lib/me/security";

function formatWhen(iso: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return "—";
  return when.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventLabel(action: string): string {
  if (action === "auth.sign_in") return "Signed in";
  if (action === "auth.sign_out") return "Signed out";
  return action;
}

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; signInMethod: string; email: string; recentSignIns: SignInEvent[] };

/**
 * `GET /api/v1/me/security` (ADR-093): Google is the only sign-in method
 * this app has ever had, plus the caller's own last 10 sign-in/sign-out
 * events — no IP address, by design (see that endpoint's own doc comment).
 */
export function SecurityCard() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchMySecurity()
      .then((data) => {
        if (!cancelled) setState({ status: "ready", ...data });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: err instanceof Error ? err.message : "Couldn't load your security info.",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="security" className="scroll-mt-24 rounded-xl border border-surface-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Security</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">How you sign in, and your recent sign-in activity.</p>

      {state.status === "loading" && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}
      {state.status === "error" && <p className="mt-4 text-sm text-danger">{state.message}</p>}

      {state.status === "ready" && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-surface-border px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <GoogleIcon className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Google account</p>
              <p className="text-xs text-muted-foreground">{state.email}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Recent sign-ins</p>
            {state.recentSignIns.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">No sign-in history yet.</p>
            ) : (
              <div className="mt-2 divide-y divide-surface-border">
                {state.recentSignIns.map((event, i) => (
                  <div key={i} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">{eventLabel(event.action)}</p>
                      <p className="text-xs text-muted-foreground">{event.device || "Unknown device"}</p>
                    </div>
                    <p className="shrink-0 text-xs text-muted-foreground">{formatWhen(event.occurredAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
