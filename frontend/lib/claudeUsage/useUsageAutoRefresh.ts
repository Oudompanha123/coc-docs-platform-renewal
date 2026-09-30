"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * `claude-team-usage`'s sign-in callback lands on `/cli/signed-in`, which
 * forwards to the right dashboard with this query. The CLI scans and uploads
 * on its own right after, so the page polls briefly until the upload lands.
 */
export const CLI_RETURN_PARAM = "cli";
export const CLI_RETURN_VALUE = "signed-in";
export const CLI_POLL_INTERVAL_MS = 5_000;
export const CLI_POLL_MAX_MS = 120_000;
/** Focus and visibilitychange both fire on one return to the tab — fetch once. */
const REFRESH_MIN_GAP_MS = 2_000;

/**
 * Keeps a Claude Usage dashboard current without a manual reload:
 *
 * - re-reads whenever the tab or window regains focus, so switching back
 *   from the terminal after a `claude-team-usage scan` shows the new figures;
 * - after the CLI's browser sign-in returns here (`?cli=signed-in`), drops
 *   that marker from the URL and polls every CLI_POLL_INTERVAL_MS until
 *   `fingerprint` changes from its first loaded value, or CLI_POLL_MAX_MS.
 *
 * `fingerprint` is whatever changes when new usage arrives (e.g. "last
 * reported"); `undefined` until the first load. Only the CLI uploads — this
 * only re-reads.
 *
 * // req: FR-USAGE-005, ADR-060
 */
export function useUsageAutoRefresh(reload: () => unknown, fingerprint: string | null | undefined): { awaitingCliUpload: boolean } {
  const [awaitingCliUpload, setAwaitingCliUpload] = useState(false);
  const lastFetchAt = useRef(0);
  const baseline = useRef<string | null | undefined>(undefined);
  const reloadRef = useRef(reload);
  useEffect(() => {
    reloadRef.current = reload;
  }, [reload]);

  const refetch = useCallback(() => {
    lastFetchAt.current = Date.now();
    void reloadRef.current();
  }, []);

  // The first load counts as a fetch, so the focus guard doesn't double it.
  useEffect(() => {
    lastFetchAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (fingerprint === undefined) return;
    if (baseline.current === undefined) baseline.current = fingerprint;
    else if (fingerprint !== baseline.current) setAwaitingCliUpload(false);
  }, [fingerprint]);

  // Back from the terminal (another window or tab): re-read.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState !== "visible" || Date.now() - lastFetchAt.current < REFRESH_MIN_GAP_MS) return;
      refetch();
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [refetch]);

  // Arrived from the CLI's sign-in: drop the marker so a reload doesn't
  // re-trigger, then watch for the upload.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(CLI_RETURN_PARAM) !== CLI_RETURN_VALUE) return;
    url.searchParams.delete(CLI_RETURN_PARAM);
    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    setAwaitingCliUpload(true);
  }, []);

  useEffect(() => {
    if (!awaitingCliUpload) return;
    const poll = window.setInterval(refetch, CLI_POLL_INTERVAL_MS);
    const stop = window.setTimeout(() => setAwaitingCliUpload(false), CLI_POLL_MAX_MS);
    return () => {
      window.clearInterval(poll);
      window.clearTimeout(stop);
    };
  }, [awaitingCliUpload, refetch]);

  return { awaitingCliUpload };
}
