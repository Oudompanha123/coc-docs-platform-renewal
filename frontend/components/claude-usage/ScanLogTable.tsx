"use client";

import { memo } from "react";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import { ChevronRightIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { diagnoseScan, formatDuration, formatScanTime, personName, recordsText, scanOutcome } from "@/lib/claudeUsage/scanLogs";

/**
 * The Scan Logs table — one row per scan, newest first. Same compact
 * table parts as UsageTable (ADR-104 r2.9); paging is the caller's,
 * so a filter change can reset it. The whole row opens the detail drawer;
 * the "View details" button is the same action for keyboard and screen
 * readers.
 *
 * `showUser`: off for a member's own scans, where every row is theirs.
 *
 * The error summary is the plain-language problem, never the raw error —
 * that stays in the drawer's Technical details.
 *
 * Memoized: an auto-refresh that brings back the same rows, or typing in a
 * filter that leaves this page of rows unchanged, doesn't redraw it.
 */
export const ScanLogTable = memo(function ScanLogTable({
  logs,
  onView,
  showUser = true,
}: {
  logs: ScanLogSummary[];
  onView: (log: ScanLogSummary) => void;
  showUser?: boolean;
}) {
  return (
    <Table className="min-w-[860px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {showUser && <TableHead className="pl-4">User</TableHead>}
          <TableHead className={showUser ? undefined : "pl-4"}>Status</TableHead>
          <TableHead>Started At</TableHead>
          <TableHead>Completed At</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead>Records</TableHead>
          <TableHead>Error Summary</TableHead>
          <TableHead className="pr-4">
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const outcome = scanOutcome(log);
          const name = personName(log);
          const problem = diagnoseScan(log)?.problem;
          return (
            <TableRow key={log.id} onClick={() => onView(log)} className="cursor-pointer">
              {showUser && (
                <TableCell className="pl-4">
                  <span className="font-medium text-foreground">{name}</span>
                  {log.displayName && <span className="block text-xs text-muted-foreground">{log.email}</span>}
                </TableCell>
              )}
              <TableCell className={showUser ? undefined : "pl-4"}>
                <ScanStatusBadge outcome={outcome} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-foreground">
                {formatScanTime(log.startedAt)}
                <span className="block text-xs text-muted-foreground">{log.trigger === "scheduled" ? "Scheduled" : "Manual"}</span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-foreground">
                {log.finishedAt ? formatScanTime(log.finishedAt) : <span className="text-muted-foreground">Not yet</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums text-foreground">{formatDuration(log.durationMs)}</TableCell>
              <TableCell className="whitespace-nowrap text-foreground">{recordsText(log)}</TableCell>
              <TableCell>
                {problem ? (
                  <span className={outcome === "failed" ? "text-destructive" : "text-[#b45309]"}>{problem}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={(event) => {
                    event.stopPropagation(); // the row would open it a second time
                    onView(log);
                  }}
                  aria-label={`View details of the scan ${showUser ? `by ${name} ` : ""}at ${formatScanTime(log.startedAt)}`}
                  className="whitespace-nowrap text-muted-foreground"
                >
                  View details
                  <ChevronRightIcon className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});
