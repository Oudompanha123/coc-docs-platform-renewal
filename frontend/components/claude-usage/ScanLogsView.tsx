"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BarChartIcon, CheckCircleIcon, ClockIcon, DocumentIcon, WarningIcon, XIcon } from "@/components/layout/icons";
import { ClaudeUsageTabs } from "@/components/claude-usage/ClaudeUsageTabs";
import { ScanLogDetailModal } from "@/components/claude-usage/ScanLogDetailModal";
import { ScanLogTable } from "@/components/claude-usage/ScanLogTable";
import { UsageStatCard } from "@/components/claude-usage/UsageStatCard";
import { Pagination } from "@/components/users-roles/Pagination";
import { fetchScanLogs, type ScanLogList, type ScanLogSummary } from "@/lib/admin/claudeUsage";
import {
  filterLogs,
  formatScanTime,
  isoDate,
  peopleIn,
  personKey,
  personName,
  presetRange,
  summarize,
  type RangePreset,
  type StatusFilter,
} from "@/lib/claudeUsage/scanLogs";

const TITLE_ICON = <DocumentIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />;

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

/** Same field look as users-roles/FilterBar. */
const FIELD =
  "rounded-xl border border-border bg-white py-2.5 text-sm text-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15";

/**
 * `/claude-usage/logs` — View Logs (ADR-096): every `claude-team-usage scan`
 * the team's PCs ran, how each ended, and where a failed one stopped. Admin
 * only, like the rest of `/claude-usage`.
 *
 * The date range is fetched from the server; person, status and search
 * filter the loaded rows here, like Users & Roles. The summary cards count
 * the range and person only — filtering the table by "Failed" should not
 * turn the "Successful" card into 0.
 *
 * Kept distinct from the dashboard's two timestamps: "Last scan" is the
 * latest check-in, "Last reported" the latest upload; this page is the
 * history of every scan behind them.
 */
export function ScanLogsView() {
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

  const range = preset === "custom" ? custom : presetRange(preset)!;
  const rangeInvalid = range.from > range.to;

  const load = useCallback(async () => {
    if (rangeInvalid) return;
    setLoading(true);
    try {
      setData(await fetchScanLogs(range.from, range.to));
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Couldn't load scan logs.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, rangeInvalid]);

  useEffect(() => {
    void load();
  }, [load]);

  // Any filter change starts again at page 1, or a narrower result can leave the table on an empty page.
  useEffect(() => setPage(1), [preset, custom, person, status, search]);

  const logs = useMemo(() => data?.logs ?? [], [data]);
  const people = useMemo(() => peopleIn(logs), [logs]);
  const personLogs = useMemo(() => (person === "all" ? logs : logs.filter((l) => personKey(l) === person)), [logs, person]);
  const summary = useMemo(() => summarize(personLogs), [personLogs]);
  const filtered = useMemo(() => filterLogs(logs, { person, status, search }), [logs, person, status, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const filtersActive = person !== "all" || status !== "all" || search.trim() !== "";

  function clearFilters() {
    setPerson("all");
    setStatus("all");
    setSearch("");
  }

  const closeDetail = useCallback(() => setSelected(null), []);

  return (
    <AppShell
      pageTitle="View Logs"
      pageSubtitle="Monitor Claude Usage scan activity and troubleshoot scan failures."
      titleIcon={TITLE_ICON}
    >
      <ClaudeUsageTabs />

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
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
                className={`${FIELD} px-3`}
              />
              <span className="text-sm text-muted">to</span>
              <input
                type="date"
                aria-label="To"
                value={custom.to}
                min={custom.from}
                max={isoDate(new Date())}
                onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })}
                className={`${FIELD} px-3`}
              />
            </>
          )}
        </div>
        <SelectField label="User" value={person} onChange={setPerson}>
          <option value="all">All users</option>
          {people.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Status" value={status} onChange={(v) => setStatus(v as StatusFilter)}>
          <option value="all">All statuses</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="failed">Failed</option>
        </SelectField>
        <div className="relative w-full lg:w-[280px]">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            aria-label="Search scan logs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search user, scan ID, or error..."
            className={`${FIELD} w-full pl-10 pr-4 placeholder:text-muted`}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading || rangeInvalid}
          className="self-start rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-semibold text-dash-ink shadow-sm transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50 lg:ml-auto lg:self-auto"
        >
          {loading && data ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {rangeInvalid && (
        <p role="alert" className="mt-4 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          The start date must be on or before the end date.
        </p>
      )}

      {loadError && (
        <div role="alert" className="mt-4 flex flex-col gap-2 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger sm:flex-row sm:items-center sm:justify-between">
          <span>Couldn&apos;t load scan logs: {loadError}</span>
          <button type="button" onClick={() => void load()} className="self-start font-semibold underline sm:self-auto">
            Try again
          </button>
        </div>
      )}

      {loading && !data ? (
        <p role="status" className="mt-4 rounded-[10px] border border-border bg-white px-4 py-8 text-center text-sm text-muted">
          Loading scan logs…
        </p>
      ) : data ? (
        <>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <UsageStatCard icon={BarChartIcon} label="Total Scans" value={summary.total.toLocaleString("en-US")} tone="purple" note={rangeNote(preset, range)} />
            <UsageStatCard icon={CheckCircleIcon} label="Successful" value={summary.success.toLocaleString("en-US")} tone="green" note="Including scans with no new usage" />
            <UsageStatCard icon={WarningIcon} label="Warnings" value={summary.warning.toLocaleString("en-US")} tone="orange" note="Completed, with something to check" />
            <UsageStatCard icon={XIcon} label="Failed" value={summary.failed.toLocaleString("en-US")} tone="red" note="Stopped before finishing" />
            <UsageStatCard
              icon={ClockIcon}
              label="Last Scan"
              value={summary.last ? timeOnly(summary.last.startedAt) : "—"}
              tone="blue"
              note={summary.last ? `${dayPart(summary.last.startedAt)} · ${personName(summary.last)}` : "No scans in this range"}
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-[10px] border border-border bg-white shadow-sm">
            <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-baseline sm:justify-between">
              <h2 className="text-sm font-bold text-dash-ink">Scan history</h2>
              <p className="text-xs text-muted">
                {filtered.length.toLocaleString("en-US")} of {logs.length.toLocaleString("en-US")} scan(s) · newest first
              </p>
            </div>
            {data.truncated && (
              <p className="border-t border-border bg-[#fffbeb] px-5 py-2.5 text-xs text-[#b45309]">
                Showing the newest {logs.length.toLocaleString("en-US")} scans only. Choose a shorter date range to see the rest.
              </p>
            )}

            {logs.length === 0 ? (
              <EmptyState title="No scan logs yet">
                Scan activity will appear here when users run Claude Usage.
                {preset !== "30d" && " Try a wider date range if you expected scans here."}
              </EmptyState>
            ) : filtered.length === 0 ? (
              <EmptyState title="No scans match these filters">
                {filtersActive && (
                  <button type="button" onClick={clearFilters} className="mt-1 font-semibold text-brand-purple hover:underline">
                    Clear filters
                  </button>
                )}
              </EmptyState>
            ) : (
              <>
                <div className="border-t border-border">
                  <ScanLogTable logs={visible} onView={setSelected} />
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

      {selected && <ScanLogDetailModal log={selected} onClose={closeDetail} />}
    </AppShell>
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
  return (
    <div className="relative">
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={`${FIELD} appearance-none pl-3 pr-9`}>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center border-t border-border px-4 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-page text-muted">
        <DocumentIcon className="h-5 w-5" />
      </span>
      <p className="mt-3 text-sm font-bold text-dash-ink">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted">{children}</p>
    </div>
  );
}

function rangeNote(preset: RangePreset, range: { from: string; to: string }): string {
  const option = RANGE_OPTIONS.find((o) => o.value === preset);
  if (preset !== "custom") return option?.label ?? "";
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return range.from === range.to ? fmt(range.from) : `${fmt(range.from)} – ${fmt(range.to)}`;
}

function timeOnly(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "Today" / "Yesterday" / "Oct 5" — the day half of formatScanTime. */
function dayPart(iso: string): string {
  return formatScanTime(iso).split(",").slice(0, -1).join(",") || formatScanTime(iso);
}
