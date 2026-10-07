import type { ScanLogSummary } from "@/lib/admin/claudeUsage";

/** A View Logs row for tests: an ordinary scheduled scan that uploaded 15,240 new tokens. */
export function scanLog(overrides: Partial<ScanLogSummary> = {}): ScanLogSummary {
  return {
    id: "log-1",
    scanRef: "SCAN-20261007-110001-3F2A",
    memberId: "m-1",
    email: "sreyly@example.com",
    displayName: "Sreyly",
    trigger: "scheduled",
    cliVersion: "0.4.0",
    startedAt: new Date(2026, 9, 7, 11, 0, 1).toISOString(),
    finishedAt: new Date(2026, 9, 7, 11, 0, 9).toISOString(),
    receivedAt: new Date(2026, 9, 7, 11, 0, 10).toISOString(),
    durationMs: 8_000,
    status: "success",
    uploadStatus: "uploaded",
    transcriptFiles: 118,
    responses: 127,
    duplicates: 163,
    newTokens: 15_240,
    daysUploaded: 1,
    errorStep: null,
    errorMessage: null,
    ...overrides,
  };
}
