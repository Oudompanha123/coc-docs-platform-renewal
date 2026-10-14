"use client";

import { Children, isValidElement, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BarChartIcon, CheckCircleIcon, ClockIcon, DocumentIcon, WarningIcon, XIcon } from "@/components/layout/icons";
import { ClaudeUsageTabs } from "@/components/claude-usage/ClaudeUsageTabs";
import { ScanLogDrawer } from "@/components/claude-usage/ScanLogDrawer";
import { ScanLogTable } from "@/components/claude-usage/ScanLogTable";
import { ScanStatusBadge } from "@/components/claude-usage/ScanStatusBadge";
import { ScanStatusPanel } from "@/components/claude-usage/ScanStatusPanel";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { Button } from "@/components/ui/button";
import { inputBaseClass } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { SimpleSelect } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { Pagination } from "@/components/users-roles/Pagination";
import { fetchScanLogs, type ScanLogList, type ScanLogScope, type ScanLogSummary } from "@/lib/admin/claudeUsage";
import {
  filterLogs,
  formatScanTime,
  isoDate,
  peopleIn,
  personKey,
  personName,
  pollInterval,
  presetRange,
  scanNotices,
  scanOutcome,
  summarize,
  type RangePreset,
  type ScanNotice,
  type StatusFilter,
} from "@/lib/claudeUsage/scanLogs";
import { useVisiblePolling } from "@/lib/claudeUsage/useVisiblePolling";

export { SCAN_LOG_ACTIVE_POLL_INTERVAL_MS, SCAN_LOG_MAX_POLL_INTERVAL_MS, SCAN_LOG_POLL_INTERVAL_MS } from "@/lib/claudeUsage/scanLogs";

/** How long a status notification stays on screen. */
export const SCAN_NOTICE_DISMISS_MS = 8_000;
/** At most this many notifications at once — the newest win. */
const MAX_NOTICES = 3;


const TITLE_ICON = <DocumentIcon className="hidden size-5 shrink-0 text-muted-foreground sm:block" />;

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

/** The shared pill field (ADR-104), sized to its content rather than full width. */
const FIELD = `${inputBaseClass} h-9 w-auto`;

/**
 * `/claude-usage/monitoring` — Scan Logs (ADR-099): every `claude-team-usage scan`
 * the team's PCs ran, how each ended, and — for one that didn't fully work —
 * the problem and how to fix it, in a side drawer. Team-wide for a
 * super_admin; every other role sees only their own scans (ADR-107).
 *
 * The date range is fetched from the server; person, status and search
 * filter the loaded rows here, like Users & Roles. The summary cards count
 * the range and person only — filtering the table by "Failed" should not
 * turn the "Successful" card into 0.
 *
 * Kept distinct from the dashboard's two timestamps: "Last scan" is the
 * latest check-in, "Last reported" the latest upload; this page is the
 * history of every scan behind them.
 *
 * Re-reads the range every SCAN_LOG_POLL_INTERVAL_MS while the tab is
 * visible, so a scan run with the page open shows up on its own — every
 * SCAN_LOG_ACTIVE_POLL_INTERVAL_MS while a scan in view is in progress, and
 * backing off to SCAN_LOG_MAX_POLL_INTERVAL_MS while refreshes fail. There is
 * no push channel for scan events; polling the same endpoint is the honest
 * substitute, and nothing is shown that the server didn't return (ADR-107).
 *
 * A scan that starts or finishes while the page is open is announced once —
 * a short notification, also read out by screen readers. "Once" is per scan
 * and outcome: the same result coming back on the next poll is not news.
 *
 * `scope`: `team` is every scan (super_admin); `mine` is the viewer's own,
 * from the self-service endpoint, for every other role (ADR-107).
 */
export function ScanLogsView({ scope = "team" }: { scope?: ScanLogScope }) {
  const team = scope === "team";
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [custom, setCustom] = useState(() => presetRange("7d") ?? { from: isoDate(new Date()), to: isoDate(new Date()) });
  const [person, setPerson] = useState("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<ScanLogList | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ScanLogSummary | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pollFailures, setPollFailures] = useState(0);
  const [notices, setNotices] = useState<ScanNotice[]>([]);

  const range = preset === "custom" ? custom : presetRange(preset)!;
  const rangeInvalid = range.from > range.to;

  // Only the newest request may write state: a poll still in flight when the
  // range changes must not overwrite the new range's rows.
  const latestRequest = useRef(0);
  const inFlight = useRef(false);
  // Every `${id}:${outcome}` already on screen or announced — what keeps a
  // poll from announcing the same change twice.
  const seenOutcomes = useRef(new Set<string>());
  /** The rows on screen, for comparing a fresh read against without a state updater doing side effects. */
  const shown = useRef<ScanLogList | null>(null);

  /**
   * `background` is the auto-refresh: it never shows "Refreshing…", skips a
   * tick while another load is running, and on failure keeps the rows on
   * screen and tries again next tick rather than raising the error banner.
   */
  const load = useCallback(
    async ({ background = false }: { background?: boolean } = {}) => {
      if (rangeInvalid || (background && inFlight.current)) return;
      const request = ++latestRequest.current;
      inFlight.current = true;
      if (!background) setLoading(true);
      try {
        const next = await fetchScanLogs(range.from, range.to, scope);
        if (request !== latestRequest.current) return;
        const prev = shown.current;
        // Same rows as before (the usual poll): keep the old object, so nothing re-renders.
        if (!prev || JSON.stringify(prev) !== JSON.stringify(next)) {
          // News only within the same range: a new range's rows were simply never seen.
          const sameRange = prev !== null && prev.from === next.from && prev.to === next.to;
          const fresh = sameRange ? scanNotices(prev.logs, next.logs, seenOutcomes.current) : [];
          for (const log of next.logs) seenOutcomes.current.add(`${log.id}:${scanOutcome(log)}`);
          if (fresh.length) setNotices((current) => [...current, ...fresh].slice(-MAX_NOTICES));
          shown.current = next;
          setData(next);
        }
        setLoadError(null);
        setLastUpdated(new Date());
        setPollFailures(0);
      } catch (err) {
        if (request !== latestRequest.current) return;
        if (background) {
          // Keep the rows; say the refresh failed, and slow down until one works.
          setPollFailures((n) => n + 1);
          return;
        }
        setLoadError(err instanceof Error ? err.message : "Couldn't load scan logs.");
      } finally {
        if (request === latestRequest.current) {
          inFlight.current = false;
          setLoading(false);
        }
      }
    },
    [range.from, range.to, rangeInvalid, scope],
  );

  useEffect(() => {
    void load();
  }, [load]);

  // A `claude-team-usage scan` posts its log on its own; show it without a manual Refresh.
  const pollLogs = useCallback(() => load({ background: true }), [load]);
  const anyRunning = useMemo(() => (data?.logs ?? []).some((l) => l.status === "running"), [data]);
  useVisiblePolling(pollLogs, pollInterval(pollFailures, anyRunning), !rangeInvalid);

  // Any filter change starts again at page 1, or a narrower result can leave the table on an empty page.
  useEffect(() => setPage(1), [preset, custom, person, status, search]);

  const logs = useMemo(() => data?.logs ?? [], [data]);
  const people = useMemo(() => peopleIn(logs), [logs]);
  const personLogs = useMemo(() => (person === "all" ? logs : logs.filter((l) => personKey(l) === person)), [logs, person]);
  const summary = useMemo(() => summarize(personLogs), [personLogs]);
  const filtered = useMemo(() => filterLogs(logs, { person, status, search }), [logs, person, status, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  // Memoized so the memo'd table skips a redraw when an auto-refresh brings back the same rows.
  const visible = useMemo(() => filtered.slice((current - 1) * pageSize, current * pageSize), [filtered, current, pageSize]);
  const filtersActive = person !== "all" || status !== "all" || search.trim() !== "";

  const hasFilters = person !== "all" || status !== "all" || search !== "";

  function clearFilters() {
    setPerson("all");
    setStatus("all");
    setSearch("");
  }

  const closeDetail = useCallback(() => setSelected(null), []);
  const dismissNotice = useCallback((key: string) => setNotices((current) => current.filter((n) => n.key !== key)), []);
  // The open drawer follows its row: a scan that finishes while open shows its result.
  const selectedLog = selected ? (logs.find((l) => l.id === selected.id) ?? selected) : null;
  const runningCount = useMemo(() => personLogs.filter((l) => l.status === "running").length, [personLogs]);
  const visibleNotices = person === "all" ? notices : notices.filter((n) => personKey(n.log) === person);

  return (
    <AppShell
      pageTitle={team ? "Scan Logs" : "My Scan Logs"}
      pageSubtitle={
        team
          ? "View and monitor Claude usage scan activities from all users."
          : "See how each of your Claude usage scans went, and how to fix one that didn't."
      }
      titleIcon={TITLE_ICON}
    >
      <ClaudeUsageTabs showDashboard={team} />

      {/* One toolbar card (ADR-104 r2.10): search first — the control used
          most — then the filters, then Clear and Refresh on the right. Every
          control is the same 36px height, and Clear appears as soon as any
          filter is set rather than only once a search comes back empty. */}
      <div className="rounded-xl border border-surface-border bg-card p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <SearchInput
            aria-label="Search scan logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={team ? "Search user, scan ID, or error..." : "Search scan ID or error..."}
            containerClassName="lg:max-w-xs"
            className="h-9"
          />
          <div className="flex flex-wrap items-center gap-2">
          <SelectField label="Date range" value={preset} onChange={(v) => setPreset(v as RangePreset)}>
            {RANGE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
          {preset === "custom" && (
            <>
              <input
                type="date"
                aria-label="From"
                value={custom.from}
                max={custom.to}
                onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })}
                className={FIELD}
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                aria-label="To"
                value={custom.to}
                min={custom.from}
                max={isoDate(new Date())}
                onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })}
                className={FIELD}
              />
            </>
          )}
          {team && (
            <SelectField label="User" value={person} onChange={setPerson}>
              <option value="all">All users</option>
              {people.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.name}
                </option>
              ))}
            </SelectField>
          )}
          <SelectField label="Status" value={status} onChange={(v) => setStatus(v as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="in-progress">In Progress</option>
            <option value="success">Success</option>
            <option value="no-usage">No New Usage</option>
            <option value="partial">Partial Success</option>
            <option value="failed">Failed</option>
          </SelectField>
          </div>
          <div className="flex items-center gap-2 lg:ml-auto">
            {hasFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <XIcon className="size-4" />
                Clear
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={loading || rangeInvalid}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              {loading && data ? "Refreshing…" : "Refresh"}
            </Button>
          </div>
        </div>
      </div>

      {rangeInvalid && (
        <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          The start date must be on or before the end date.
        </p>
      )}

      {loadError && (
        <div role="alert" className="mt-4 flex flex-col gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
          <span>Couldn&apos;t load scan logs: {loadError}</span>
          <Button type="button" variant="link" size="inline" onClick={() => void load()} className="self-start text-destructive underline sm:self-auto">
            Try again
          </Button>
        </div>
      )}

      {loading && !data ? (
        <p role="status" className="mt-4 rounded-xl border border-surface-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Loading scan logs…
        </p>
      ) : data ? (
        <>
          <ScanStatusPanel
            log={summary.last}
            lastUpdated={lastUpdated}
            refreshFailed={pollFailures > 0}
            showPerson={team}
            runningCount={runningCount}
          />

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UsageStatCard
              icon={BarChartIcon}
              label="Total Scans"
              value={summary.total.toLocaleString("en-US")}
              note={summary.last ? `Last: ${formatScanTime(summary.last.startedAt)} · ${personName(summary.last)}` : rangeNote(preset, range)}
            />
            <UsageStatCard icon={CheckCircleIcon} label="Success" value={summary.success.toLocaleString("en-US")} note="Usage uploaded" />
            <UsageStatCard icon={ClockIcon} label="No New Usage" value={summary["no-usage"].toLocaleString("en-US")} note="Nothing new to upload" />
            <UsageStatCard icon={WarningIcon} label="Partial Success" value={summary.partial.toLocaleString("en-US")} note="Retried by the next scan" />
            <UsageStatCard icon={XIcon} label="Failed" value={summary.failed.toLocaleString("en-US")} note="Needs a fix on the PC" />
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-surface-border bg-card">
            <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-sm font-semibold text-foreground">Scan history</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length.toLocaleString("en-US")} of {logs.length.toLocaleString("en-US")} scan(s) · newest first
              </p>
            </div>
            {data.truncated && (
              <p className="border-t border-surface-border bg-[#fffbeb] px-4 py-2 text-xs text-[#b45309]">
                Showing the newest {logs.length.toLocaleString("en-US")} scans only. Choose a shorter date range to see the rest.
              </p>
            )}

            {logs.length === 0 ? (
              <EmptyState title="No scan logs yet">
                {team
                  ? "Scan activity will appear here when users run Claude Usage."
                  : "Your scans will appear here once claude-team-usage runs on your PC."}
                {preset !== "30d" && " Try a wider date range if you expected scans here."}
              </EmptyState>
            ) : filtered.length === 0 ? (
              <EmptyState title="No scans match these filters">
                {filtersActive && (
                  <Button type="button" variant="link" size="inline" onClick={clearFilters} className="mt-1">
                    Clear filters
                  </Button>
                )}
              </EmptyState>
            ) : (
              <>
                <div className="border-t border-surface-border">
                  <ScanLogTable logs={visible} onView={setSelected} showUser={team} />
                </div>
                <Pagination
                  total={filtered.length}
                  page={current}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </div>
        </>
      ) : null}

      {selectedLog && <ScanLogDrawer key={selectedLog.id} log={selectedLog} onClose={closeDetail} scope={scope} />}

      <ScanNoticeStack notices={visibleNotices} onDismiss={dismissNotice} onView={setSelected} />
    </AppShell>
  );
}

/**
 * Status notifications, bottom right (ADR-107). The live region is always in
 * the page, so a screen reader hears each one as it is added; each dismisses
 * itself after SCAN_NOTICE_DISMISS_MS, and its timer is cleared on unmount.
 */
function ScanNoticeStack({
  notices,
  onDismiss,
  onView,
}: {
  notices: ScanNotice[];
  onDismiss: (key: string) => void;
  onView: (log: ScanLogSummary) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-label="Scan notifications"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:w-96"
    >
      {notices.map((notice) => (
        <ScanNoticeToast key={notice.key} notice={notice} onDismiss={onDismiss} onView={onView} />
      ))}
    </div>
  );
}

function ScanNoticeToast({
  notice,
  onDismiss,
  onView,
}: {
  notice: ScanNotice;
  onDismiss: (key: string) => void;
  onView: (log: ScanLogSummary) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(notice.key), SCAN_NOTICE_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [notice.key, onDismiss]);

  return (
    <div role="status" className="pointer-events-auto rounded-xl border border-border bg-white p-3 shadow-lg">
      <div className="flex items-start gap-3">
        <ScanStatusBadge outcome={notice.outcome} />
        <p className="min-w-0 flex-1 pt-0.5 text-sm text-dash-ink">{notice.message}</p>
        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => onDismiss(notice.key)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-page hover:text-dash-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-purple/15"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
      {notice.outcome !== "in-progress" && (
        <button
          type="button"
          onClick={() => {
            onView(notice.log);
            onDismiss(notice.key);
          }}
          className="mt-1.5 text-xs font-semibold text-brand-purple hover:underline"
        >
          View details
        </button>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  // Callers still write `<option>`s; they are read into the shared Select's
  // option list here, so the three filters above did not each need rewriting.
  const options = Children.toArray(children).flatMap((child) =>
    isValidElement<{ value: string; children: ReactNode }>(child)
      ? [{ value: String(child.props.value), label: child.props.children }]
      : [],
  );
  return <SimpleSelect size="sm" aria-label={label} value={value} onValueChange={onChange} options={options} className="w-auto min-w-36" />;
}

function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center border-t border-surface-border px-4 py-10 text-center">
      <span className="flex size-9 items-center justify-center rounded-lg bg-muted-surface text-muted-foreground">
        <DocumentIcon className="size-4" />
      </span>
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

function rangeNote(preset: RangePreset, range: { from: string; to: string }): string {
  const option = RANGE_OPTIONS.find((o) => o.value === preset);
  if (preset !== "custom") return option?.label ?? "";
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return range.from === range.to ? fmt(range.from) : `${fmt(range.from)} – ${fmt(range.to)}`;
}
