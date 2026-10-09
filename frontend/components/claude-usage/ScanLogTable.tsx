"use client";

import { memo } from "react";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import { ChevronRightIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ScanLogSummary } from "@/lib/admin/claudeUsage";
import { formatCount, formatDuration, formatScanTime, personName, resultText, scanOutcome } from "@/lib/claudeUsage/scanLogs";

/**
 * The Scan Logs table — one row per scan, newest first. Same compact
 * table parts as UsageTable (ADR-104 r2.9); paging is the caller's,
 * so a filter change can reset it. The whole row opens the detail drawer;
 * the chevron button is the same action for keyboard and screen readers.
 *
 * Memoized: an auto-refresh that brings back the same rows, or typing in a
 * filter that leaves this page of rows unchanged, doesn't redraw it.
 */
export const ScanLogTable = memo(function ScanLogTable({
  logs,
  onView,
}: {
  logs: ScanLogSummary[];
  onView: (log: ScanLogSummary) => void;
}) {
  return (
    <Table className="min-w-[680px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="pl-4">User</TableHead>
          <TableHead>Scan Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Result</TableHead>
          <TableHead className="text-right">Duration</TableHead>
          <TableHead className="w-12 pr-4">
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const outcome = scanOutcome(log);
          const name = personName(log);
          return (
            <TableRow key={log.id} onClick={() => onView(log)} className="cursor-pointer">
              <TableCell className="pl-4">
                <span className="font-medium text-foreground">{name}</span>
                {log.displayName && <span className="block text-xs text-muted-foreground">{log.email}</span>}
              </TableCell>
              <TableCell className="whitespace-nowrap text-foreground">
                {formatScanTime(log.startedAt)}
                <span className="block text-xs text-muted-foreground">{log.trigger === "scheduled" ? "Scheduled" : "Manual"}</span>
              </TableCell>
              <TableCell>
                <ScanStatusBadge outcome={outcome} />
              </TableCell>
              <TableCell>
                <span className={outcome === "failed" ? "text-destructive" : outcome === "partial" ? "text-[#b45309]" : "text-foreground"}>
                  {resultText(log)}
                </span>
                {outcome === "success" && (
                  <span className="block text-xs text-muted-foreground">{formatCount(log.newTokens)} tokens</span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums text-foreground">{formatDuration(log.durationMs)}</TableCell>
              <TableCell className="pr-4 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation(); // the row would open it a second time
                    onView(log);
                  }}
                  aria-label={`View details of the scan by ${name} at ${formatScanTime(log.startedAt)}`}
                  className="size-8 text-muted-foreground"
                >
                  <ChevronRightIcon className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
});
