"use client";

import { useRef, useState } from "react";
import { Spinner } from "@/components/layout/Spinner";
import { Button } from "@/components/ui/button";
import type { AxRenewalRunLocallyState } from "@/lib/ax-renewal/api";

/**
 * Start / Stop for Run Locally.
 *
 * <p>Start goes into its loading state on the click itself — before the
 * request returns — and stays there while the dev server is {@code
 * starting}. It ends when the server is running (Stop), or has failed or
 * stopped (Start again). While it is starting, Cancel stops it.
 *
 * <p>One request at a time: a ref, not only state, guards the handlers. A
 * second click in the same tick, before React has re-rendered the button as
 * disabled, is ignored rather than sent. The backend would refuse a second
 * start anyway; this keeps that refusal from reaching the screen as an
 * error.
 *
 * <p>The handlers report their own errors; this only tracks that one is in
 * flight.
 */
export function RunLocallyControls({
  state,
  onStart,
  onStop,
}: {
  state: AxRenewalRunLocallyState | null;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
}) {
  const [pending, setPending] = useState<"start" | "stop" | null>(null);
  const inFlight = useRef(false);

  async function run(kind: "start" | "stop", action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(kind);
    try {
      await action();
    } finally {
      inFlight.current = false;
      setPending(null);
    }
  }

  if (pending === "stop") {
    return (
      <Button type="button" variant="outline" disabled aria-busy="true">
        <Spinner className="h-3.5 w-3.5 border-2" />
        Stopping…
      </Button>
    );
  }

  if (pending === "start" || state === "starting") {
    return (
      <div className="flex items-center gap-2">
        {/* Nothing to cancel until the start request has made a process. */}
        {pending !== "start" && (
          <Button type="button" variant="outline" onClick={() => void run("stop", onStop)}>
            Cancel
          </Button>
        )}
        <Button type="button" disabled aria-busy="true">
          <Spinner className="h-3.5 w-3.5 border-2" />
          Starting…
        </Button>
      </div>
    );
  }

  if (state === "running") {
    return (
      <Button type="button" onClick={() => void run("stop", onStop)}>
        Stop
      </Button>
    );
  }

  return (
    <Button type="button" onClick={() => void run("start", onStart)}>
      Start
    </Button>
  );
}
