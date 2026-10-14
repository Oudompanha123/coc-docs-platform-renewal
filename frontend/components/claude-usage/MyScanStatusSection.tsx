"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { DocsCodeBlock } from "@/components/docs/DocsCodeBlock";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import { ScanStatusPanel } from "@/components/claude-usage/ScanStatusPanel";
import { fetchScanLogs, type ScanLogList } from "@/lib/admin/claudeUsage";
import { diagnoseScan, formatScanTime, pollInterval, presetRange, resultText, scanOutcome } from "@/lib/claudeUsage/scanLogs";
import { useVisiblePolling } from "@/lib/claudeUsage/useVisiblePolling";

/** How many recent scans the section lists. The full history is on Scan Logs. */
const RECENT = 5;

/**
 * "Your latest scan" on My Claude Usage (ADR-107): every member's own scan
 * status — In Progress, Success, Partial Success, Failed, or No Recent Scan —
 * with the plain-language problem and the first fix when one went wrong, and
 * the last few scans under it. Read from the caller's own scan logs
 * (`/api/v1/claude-usage/me/scan-logs`, scoped by the session), polled like
 * the Scan Logs page.
 *
 * `scanLogsHref`: where the full history is, for a role the admin shell
 * admits; a plain `user` can't open it, so gets no link.
 */
export function MyScanStatusSection({ scanLogsHref }: { scanLogsHref?: string }) {
  const [data, setData] = useState<ScanLogList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [failures, setFailures] = useState(0);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const range = presetRange("7d")!;
    try {
      const next = await fetchScanLogs(range.from, range.to, "mine");
      setData((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      setLoadError(null);
      setLastUpdated(new Date());
      setFailures(0);
    } catch (err) {
      setFailures((n) => n + 1);
      setLoadError(err instanceof Error ? err.message : "Couldn't load your scans.");
    } finally {
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const logs = data?.logs ?? [];
  const anyRunning = logs.some((l) => l.status === "running");
  useVisiblePolling(load, pollInterval(failures, anyRunning));

  const latest = logs[0] ?? null;
  const diagnosis = latest ? diagnoseScan(latest) : null;
  const firstFix = diagnosis?.fix.find((step) => step.command);

  return (
    <section aria-label="Your scans" className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-dash-ink">Your scans</h3>
        {scanLogsHref && (
          <Link href={scanLogsHref} className="text-xs font-semibold text-brand-purple hover:underline">
            View all scan logs
          </Link>
        )}
      </div>

      {!data ? (
        loadError ? (
          <p role="alert" className="mt-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Couldn&apos;t load your scans: {loadError}
          </p>
        ) : (
          <p role="status" className="mt-3 rounded-[10px] border border-border bg-white px-4 py-6 text-center text-sm text-muted">
            Loading your scans…
          </p>
        )
      ) : (
        <>
          <ScanStatusPanel
            log={latest}
            lastUpdated={lastUpdated}
            refreshFailed={loadError !== null}
            showPerson={false}
            runningCount={logs.filter((l) => l.status === "running").length}
          />
          {firstFix?.command && (
            <div className="mt-3 rounded-[10px] border border-border bg-white px-4 py-3 text-sm">
              <p className="text-dash-ink">{firstFix.text}</p>
              <div className="mt-2">
                <DocsCodeBlock code={firstFix.command} />
              </div>
            </div>
          )}
          {logs.length > 1 && (
            <ul aria-label="Recent scans" className="mt-3 divide-y divide-border rounded-[10px] border border-border bg-white">
              {logs.slice(0, RECENT).map((log) => (
                <li key={log.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
                  <span className="flex items-center gap-3">
                    <ScanStatusBadge outcome={scanOutcome(log)} />
                    <span className="text-dash-ink">{formatScanTime(log.startedAt)}</span>
                  </span>
                  <span className="text-muted">{resultText(log)}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
