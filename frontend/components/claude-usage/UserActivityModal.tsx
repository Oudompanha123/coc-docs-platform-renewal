"use client";

import { Skeleton, SkeletonGroup, SkeletonTable } from "@/components/ui/skeleton";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { Alert } from "@/components/ui/alert";
import { Pagination } from "@/components/users-roles/Pagination";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/layout/icons";
import { BudgetOverrideInput } from "@/components/claude-usage/BudgetOverrideInput";
import {
  fetchMemberActivity,
  formatLastActive,
  type ClaudeUsageActivityDay,
  type ClaudeUsageActivityProject,
  type ClaudeUsageActivitySession,
  type ClaudeUsageMember,
  type ClaudeUsageMemberActivity,
} from "@/lib/admin/claudeUsage";
import {
  ACTIVITY_PRESETS,
  formatCount,
  formatDuration,
  presetRange,
  REPORT_TZ,
  reportDate,
  topProjects,
  type ActivityPreset,
} from "@/lib/claudeUsage/activity";
import { formatCost, formatTokens, modelDisplayName } from "@/lib/claudeUsage/format";
import { DatePicker } from "@/components/ui/date-picker";
import { SimpleSelect } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * The admin "User Activity" detail, opened from a row of {@link UsageTable}
 * (ADR-074). Top to bottom in the order an admin asks: who, how much in the
 * selected range, on which projects, for how long, where the tokens went,
 * then day by day. Model, cache and cost detail live one level down, in a
 * day's own view.
 *
 * Every figure comes from `GET /admin/claude-usage/members/{id}/activity`.
 * Requests, sessions and active time exist only for days the reporter sent
 * activity for; a day from an older reporter shows "—", never 0, and the
 * view says how many such days are in range.
 *
 * Definitions (computed by the reporter, see ADR-074):
 * - request: one human turn — each time the person asked Claude something
 * - session: continuous activity, split after 30 minutes with none
 * - active time: each session's first to last event, summed
 *
 * // req: FR-USAGE-001, ADR-035, ADR-058, ADR-074
 */
export function UserActivityModal({
  member,
  avatarColor,
  onClose,
  onRemove,
  onRestore,
  onBudgetChange,
}: {
  member: ClaudeUsageMember;
  avatarColor: string;
  onClose: () => void;
  /** When given, the header offers "Disable" (tracking only — the caller confirms it). */
  onRemove?: (member: ClaudeUsageMember) => void;
  /** When given, a disabled member's header offers "Enable" to track them again. */
  onRestore?: (member: ClaudeUsageMember) => void;
  /** When given, the header offers the soft-budget override (null = team default). */
  onBudgetChange?: (member: ClaudeUsageMember, tokens: number | null) => void;
}) {
  const today = useMemo(() => reportDate(), []);
  const [preset, setPreset] = useState<ActivityPreset>("today");
  const [custom, setCustom] = useState({ from: today, to: today });
  const [project, setProject] = useState<string | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [activity, setActivity] = useState<ClaudeUsageMemberActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ClaudeUsageActivityDay | null>(null);
  const [closing, setClosing] = useState(false);

  const range = presetRange(preset, today, custom);
  const rangeKey = range ? `${range.from}|${range.to}` : "";

  useEffect(() => {
    if (!range) return;
    let cancelled = false;
    // The previous result stays on screen, dimmed, until this one lands.
    // Clearing it collapsed the popup to a one-line "Loading…" and grew it
    // back — re-centring each time — on every range or project switch.
    setLoading(true);
    setError(null);
    setSelectedDay(null);
    fetchMemberActivity(member.id, { from: range.from, to: range.to, project })
      .then((result) => {
        if (cancelled) return;
        setActivity(result);
        // The project picker lists what the unfiltered range contains.
        if (!project) setProjectOptions(result.projects.map((p) => p.name));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Not the previous range's numbers under this range's heading.
        setActivity(null);
        setError(err instanceof Error ? err.message : "Couldn't load this person's activity.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // rangeKey stands in for `range`, which is a new object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id, rangeKey, project]);

  // Starts the fade-out; Modal calls `onClose` (as onExited) once it ends.
  const requestClose = useCallback(() => setClosing(true), []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Esc steps back out of the day detail first, then closes.
      if (selectedDay) setSelectedDay(null);
      else requestClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDay, requestClose]);

  const rangeLabel =
    preset === "custom" && range
      ? range.from === range.to
        ? formatDate(range.from)
        : `${formatDate(range.from)} – ${formatDate(range.to)}`
      : (ACTIVITY_PRESETS.find((p) => p.value === preset)?.label ?? "");
  const singleDay = !!range && range.from === range.to;
  const lastActivity = activity?.sessions[0]?.endedAt ?? null;

  const refreshing = loading && activity !== null;

  return (
    <Modal
      onClose={requestClose}
      animated
      closing={closing}
      onExited={onClose}
      // Sized to its content, up to the viewport (Modal's maxHeight: 100%):
      // compact for an empty range, scrolling inside for a long one.
      className="w-full max-w-4xl overflow-y-auto overscroll-contain rounded-2xl border border-surface-border bg-card shadow-xl"
    >
      <div role="dialog" aria-modal="true" aria-labelledby="user-activity-title" className="p-5 sm:p-7">
        {/* Sticky so the title and close button stay in reach while a long
            activity list scrolls; the negative margins carry its white
            background over the panel's own padding. */}
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-start justify-between gap-4 bg-card px-5 pb-3 pt-5 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
          <div className="flex items-baseline gap-3">
            <h2 id="user-activity-title" className="text-lg font-semibold text-foreground">
              {selectedDay ? "Day detail" : "User Activity"}
            </h2>
            {/* In the title row, not above the content, so it adds no height. */}
            {refreshing && (
              <span role="status" className="text-xs text-muted-foreground">
                Updating…
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={requestClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <MemberHeader
          member={member}
          avatarColor={avatarColor}
          lastActivity={lastActivity}
          onRemove={onRemove}
          onRestore={onRestore}
        />

        {onBudgetChange && member.status !== "removed" && (
          <div className="mt-4 flex flex-col gap-2 rounded-xl border border-surface-border bg-muted-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Soft budget</p>
              <p className="text-xs text-muted-foreground">Weekly; scales to the period selected on the dashboard. Leave empty for the team default.</p>
            </div>
            <BudgetOverrideInput member={member} onChange={onBudgetChange} />
          </div>
        )}

        {selectedDay ? (
          <DayDetail day={selectedDay} onBack={() => setSelectedDay(null)} />
        ) : (
          <>
            <Filters
              preset={preset}
              onPreset={setPreset}
              custom={custom}
              onCustom={setCustom}
              today={today}
              project={project}
              projectOptions={projectOptions}
              onProject={setProject}
            />

            {error && (
              <Alert variant="destructive" className="mt-6">
                {error}
              </Alert>
            )}

            {!activity && !error && range && (
              <SkeletonGroup label="Loading activity" className="mt-6">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="rounded-xl border border-surface-border p-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="mt-2 h-6 w-20" />
                    </div>
                  ))}
                </div>
                <SkeletonTable className="mt-4" rows={5} />
              </SkeletonGroup>
            )}

            {activity && activity.days.length === 0 && (
              <p
                aria-busy={refreshing}
                className={`mt-6 rounded-[10px] border border-surface-border px-4 py-8 text-center text-sm text-muted-foreground transition-opacity duration-200 ${refreshing ? "opacity-50" : ""}`}
              >
                {project ? `No usage on ${project} in this range.` : "No usage reported in this range."}
              </p>
            )}

            {activity && activity.days.length > 0 && (
              <div
                aria-busy={refreshing}
                className={`mt-6 flex flex-col gap-7 transition-opacity duration-200 ${refreshing ? "pointer-events-none opacity-50" : ""}`}
              >
                {activity.daysWithoutActivity > 0 && (
                  <p className="rounded-xl border border-[#e0873c]/30 bg-[#e0873c]/10 px-4 py-3 text-xs text-foreground">
                    {activity.daysWithoutActivity === activity.days.length
                      ? "This range was reported by an older version of the reporter, so requests, sessions, active time and projects aren't available — only tokens."
                      : `${activity.daysWithoutActivity} of ${activity.days.length} days were reported by an older version of the reporter. Their tokens are included; their requests, sessions and active time are not.`}{" "}
                    Updating <code className="font-mono">claude-team-usage</code> and running{" "}
                    <code className="font-mono">claude-team-usage scan --days 30</code> fills them in.
                  </p>
                )}

                <section aria-label="Summary">
                  <SectionTitle title={rangeLabel} subtitle={project ? `Project: ${project}` : undefined} />
                  <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <Metric label="Requests" value={formatCount(activity.summary.requestCount)} />
                    <Metric label="Sessions" value={formatCount(activity.summary.sessionCount)} />
                    <Metric label="Active duration" value={formatDuration(activity.summary.activeSeconds)} />
                    <Metric label="Total tokens" value={formatTokens(activity.summary.totalTokens)} emphasis />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatTokens(activity.summary.inputTokens)} input · {formatTokens(activity.summary.outputTokens)} output
                    {activity.summary.apiCallCount != null && <> · {formatCount(activity.summary.apiCallCount)} API calls</>}
                    {activity.summary.conversationCount != null && (
                      <> · {formatCount(activity.summary.conversationCount)} conversations</>
                    )}
                  </p>
                </section>

                {activity.projects.length > 0 && (
                  <section aria-label="Projects">
                    <SectionTitle
                      title="Projects"
                      action={
                        project ? (
                          <button
                            type="button"
                            onClick={() => setProject(null)}
                            className="text-xs font-semibold text-foreground hover:underline"
                          >
                            All projects
                          </button>
                        ) : null
                      }
                    />
                    <ul className="mt-3 divide-y divide-surface-border overflow-hidden rounded-xl border border-surface-border">
                      {activity.projects.map((p) => (
                        <li key={p.name}>
                          <ProjectRow
                            project={p}
                            singleDay={singleDay}
                            active={project === p.name}
                            onClick={() => setProject((current) => (current === p.name ? null : p.name))}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {activity.sessions.length > 0 && (
                  <section aria-label="Duration">
                    <SectionTitle
                      title="Duration"
                      subtitle={`${formatDuration(activity.summary.activeSeconds)} active across ${activity.sessions.length} ${
                        activity.sessions.length === 1 ? "session" : "sessions"
                      }`}
                    />
                    <SessionList sessions={activity.sessions} showDate={!singleDay} />
                  </section>
                )}

                {activity.projects.length > 0 && (
                  <section aria-label="Token usage by project">
                    <SectionTitle title="Token usage by project" />
                    <ProjectTokenBars projects={activity.projects} />
                  </section>
                )}

                <section aria-label="Daily activity">
                  <SectionTitle title="Daily activity" />
                  <PagedList
                    label="Daily activity"
                    items={activity.days}
                    renderItem={(day) => (
                      <li key={day.date}>
                        <DayRow day={day} onClick={() => setSelectedDay(day)} />
                      </li>
                    )}
                  />
                </section>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">
              A request is one prompt the person sent. A session is continuous activity, ending after 30 minutes with
              none; active duration adds up each session. Times are Phnom Penh time. Prompts themselves are never
              collected.
            </p>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isToday(iso: string | null): boolean {
  return !!iso && reportDate(new Date(iso)) === reportDate();
}

/** A time of day in the team's zone — the same zone the day boundaries are drawn in. */
function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const when = new Date(iso);
  return Number.isNaN(when.getTime())
    ? "—"
    : when.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: REPORT_TZ });
}

/** `date` is a calendar day ("2026-09-16"), not an instant — formatted in UTC so it never shifts a day. */
function formatDate(date: string, options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });
}

function plural(n: number | null, one: string, many: string): string {
  return `${formatCount(n)} ${n === 1 ? one : many}`;
}

// ---------------------------------------------------------------------------

function MemberHeader({
  member,
  avatarColor,
  lastActivity,
  onRemove,
  onRestore,
}: {
  member: ClaudeUsageMember;
  avatarColor: string;
  /** The latest activity the detail knows of; falls back to the dashboard's last report. */
  lastActivity: string | null;
  onRemove?: (member: ClaudeUsageMember) => void;
  onRestore?: (member: ClaudeUsageMember) => void;
}) {
  // A real session end is activity; the fallback is only when the scan last reported.
  const last = lastActivity ?? member.lastActiveAt;
  const label = lastActivity ? "Last active" : "Last reported";
  const activeToday = !!lastActivity && isToday(lastActivity);
  return (
    <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <UserAvatar
          avatarUrl={member.avatarUrl}
          name={member.displayName}
          initials={initialsOf(member.displayName)}
          className="h-14 w-14 shrink-0 !text-lg shadow-sm"
          style={{ backgroundColor: avatarColor }}
        />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{member.displayName}</p>
          <p className="truncate text-sm text-muted-foreground">{member.email}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${activeToday ? "bg-[#1f9d6b]" : "bg-[#c4c4d0]"}`} />
            {label} · {formatLastActive(last)}
          </p>
        </div>
      </div>
      {/* Disable / Enable tracking lives here, not in a separate roster list. */}
      <div className="flex shrink-0 items-center gap-3">
        {onRemove &&
          (member.status !== "removed" ? (
            <button
              type="button"
              onClick={() => onRemove(member)}
              className="inline-flex items-center rounded-[4px] bg-danger/10 px-4 py-1.5 text-sm font-semibold text-danger transition-colors hover:bg-danger/20"
            >
              Disable
            </button>
          ) : onRestore ? (
            <button
              type="button"
              onClick={() => onRestore(member)}
              className="inline-flex items-center rounded-[4px] bg-[#1f9d6b]/10 px-4 py-1.5 text-sm font-semibold text-[#1f9d6b] transition-colors hover:bg-[#1f9d6b]/20"
            >
              Enable
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-[4px] bg-muted-surface px-4 py-1.5 text-sm font-semibold text-muted-foreground"
            >
              Disabled
            </button>
          ))}
      </div>
    </div>
  );
}

function Filters({
  preset,
  onPreset,
  custom,
  onCustom,
  today,
  project,
  projectOptions,
  onProject,
}: {
  preset: ActivityPreset;
  onPreset: (preset: ActivityPreset) => void;
  custom: { from: string; to: string };
  onCustom: (custom: { from: string; to: string }) => void;
  today: string;
  project: string | null;
  projectOptions: string[];
  onProject: (project: string | null) => void;
}) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div role="group" aria-label="Date range" className="flex flex-wrap gap-1.5">
        {ACTIVITY_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={preset === p.value}
            onClick={() => onPreset(p.value)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              preset === p.value
                ? "bg-primary text-primary-foreground"
                : "border border-surface-border bg-card text-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {preset === "custom" && (
          <>
            <DatePicker
              aria-label="From"
              value={custom.from}
              max={custom.to || today}
              onChange={(from) => onCustom({ ...custom, from })}
              className="h-9"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <DatePicker
              aria-label="To"
              value={custom.to}
              min={custom.from}
              max={today}
              onChange={(to) => onCustom({ ...custom, to })}
              className="h-9"
            />
          </>
        )}
        {(projectOptions.length > 1 || project) && (
          <SimpleSelect
            size="sm"
            aria-label="Project"
            value={project ?? ""}
            onValueChange={(v) => onProject(v || null)}
            options={[
              { value: "", label: "All projects" },
              ...[...new Set([...(project ? [project] : []), ...projectOptions])].map((name) => ({ value: name, label: name })),
            ]}
            className="w-auto min-w-40"
          />
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${emphasis ? "border-surface-border bg-secondary" : "border-surface-border bg-[#f8fafc]"}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function ProjectRow({
  project,
  singleDay,
  active,
  onClick,
}: {
  project: ClaudeUsageActivityProject;
  singleDay: boolean;
  active: boolean;
  onClick: () => void;
}) {
  const span = (iso: string | null) =>
    !iso ? "—" : singleDay ? formatTime(iso) : `${formatDate(reportDate(new Date(iso)))} ${formatTime(iso)}`;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-primary/5" : "hover:bg-[#f8fafc]"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{project.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {plural(project.requestCount, "request", "requests")} · {formatTokens(project.totalTokens)} tokens ·{" "}
          {formatDuration(project.activeSeconds)} active
        </p>
      </div>
      <p className="hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
        First used {span(project.firstAt)}
        <br />
        Last used {span(project.lastAt)}
      </p>
      <ChevronRightIcon className={`h-4 w-4 shrink-0 ${active ? "text-foreground" : "text-muted-foreground"}`} />
    </button>
  );
}

function SessionList({ sessions, showDate }: { sessions: ClaudeUsageActivitySession[]; showDate: boolean }) {
  return (
    <PagedList
      label="Sessions"
      items={sessions}
      renderItem={(s) => (
        <li key={s.startedAt} className="flex items-center gap-4 px-4 py-2.5 text-sm">
          <span className="w-32 shrink-0 font-medium tabular-nums text-foreground">
            {showDate && <span className="mr-1.5 text-muted-foreground">{formatDate(s.date)}</span>}
            {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
          </span>
          <span className="w-16 shrink-0 font-semibold tabular-nums text-foreground">{formatDuration(s.durationSeconds)}</span>
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {s.projects.join(", ")} · {plural(s.requestCount, "request", "requests")}
          </span>
        </li>
      )}
    />
  );
}

const LIST_PAGE_SIZE = 5;

/** A bordered list paged five rows at a time, same pager as the usage table.
 *  The pager only appears once there is more than one page's worth at the
 *  smallest size; the page is clamped so a filter change that shrinks the list
 *  never leaves it on an empty page. */
function PagedList<T>({
  label,
  items,
  renderItem,
}: {
  label: string;
  items: T[];
  renderItem: (item: T) => ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(LIST_PAGE_SIZE);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = items.slice((current - 1) * pageSize, current * pageSize);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-surface-border">
      <ul aria-label={label} className="divide-y divide-surface-border">
        {visible.map(renderItem)}
      </ul>
      {items.length > LIST_PAGE_SIZE && (
        <Pagination
          total={items.length}
          page={current}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

function ProjectTokenBars({ projects }: { projects: ClaudeUsageActivityProject[] }) {
  const rows = topProjects(projects);
  const max = Math.max(...rows.map((r) => r.totalTokens), 0);
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center gap-3 text-sm">
          <span className={`w-40 shrink-0 truncate ${row.rest ? "text-muted-foreground" : "text-foreground"}`}>{row.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted-surface">
            <span
              className={`block h-full rounded-full ${row.rest ? "bg-[#c4c4d0]" : "bg-primary"}`}
              style={{ width: `${max > 0 ? Math.max(2, (row.totalTokens / max) * 100) : 0}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-foreground">{formatTokens(row.totalTokens)}</span>
        </li>
      ))}
    </ul>
  );
}

function DayRow({ day, onClick }: { day: ClaudeUsageActivityDay; onClick: () => void }) {
  const reported = day.requestCount != null;
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#f8fafc]">
      <div className="w-14 shrink-0">
        <p className="text-sm font-semibold text-foreground">{formatDate(day.date)}</p>
        <p className="text-xs text-muted-foreground">{formatDate(day.date, { weekday: "short" })}</p>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm text-foreground">
        {reported ? (
          <>
            {plural(day.requestCount, "request", "requests")} · {plural(day.sessionCount, "session", "sessions")} ·{" "}
            {formatDuration(day.activeSeconds)}
          </>
        ) : (
          <span className="text-muted-foreground">Activity not reported</span>
        )}
      </p>
      <p className="shrink-0 text-xs font-medium text-muted-foreground">
        <span className="text-sm font-semibold text-foreground">{formatTokens(day.totalTokens)}</span> tokens
      </p>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

/** The secondary view: everything known about one day, technical detail included. */
function DayDetail({ day, onBack }: { day: ClaudeUsageActivityDay; onBack: () => void }) {
  const reported = new Date(day.reportedAt);
  const fields: [string, string][] = [
    ["Date", formatDate(day.date, { weekday: "long", year: "numeric", month: "long", day: "numeric" })],
    ["Requests", formatCount(day.requestCount)],
    ["Sessions", formatCount(day.sessionCount)],
    ["Active duration", formatDuration(day.activeSeconds)],
    ["API calls", formatCount(day.apiCallCount)],
    ["Conversations", formatCount(day.conversationCount)],
    ["Input tokens", day.inputTokens.toLocaleString("en-US")],
    ["Output tokens", day.outputTokens.toLocaleString("en-US")],
    ["Total tokens", day.totalTokens.toLocaleString("en-US")],
    ["Cache read", day.cacheReadTokens.toLocaleString("en-US")],
    ["Cache write", day.cacheWriteTokens.toLocaleString("en-US")],
    ["Reference cost", day.costUsd == null ? "—" : formatCost(day.costUsd)],
    [
      "Last reported",
      Number.isNaN(reported.getTime())
        ? "—"
        : reported.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: REPORT_TZ }),
    ],
  ];

  return (
    <div className="mt-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:underline">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to activity
      </button>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-surface-border bg-[#f8fafc] p-5 sm:grid-cols-4">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-foreground">{value}</dd>
          </div>
        ))}
      </dl>

      {day.sessions && day.sessions.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-foreground">Sessions</h3>
          <SessionList sessions={day.sessions} showDate={false} />
        </>
      )}

      {day.projects && day.projects.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-foreground">By project</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-surface-border">
            <Table aria-label="By project" className="min-w-[560px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Active</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">First – last</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {day.projects.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium text-foreground">{p.name}</TableCell>
                    <TableCell className="text-right text-foreground">{formatCount(p.requestCount)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatDuration(p.activeSeconds)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatTokens(p.inputTokens)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatTokens(p.outputTokens)}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{formatTokens(p.totalTokens)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatTime(p.firstAt)} – {formatTime(p.lastAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {day.models.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-foreground">By model</h3>
          <div className="mt-3 overflow-hidden rounded-xl border border-surface-border">
            <Table aria-label="By model" className="min-w-[560px]">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cache read / write</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {day.models.map((m) => (
                  <TableRow key={m.model}>
                    <TableCell className="font-medium text-foreground">{modelDisplayName(m.model)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatTokens(m.inputTokens)}</TableCell>
                    <TableCell className="text-right text-foreground">{formatTokens(m.outputTokens)}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{formatTokens(m.totalTokens)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatTokens(m.cacheReadTokens)} / {formatTokens(m.cacheWriteTokens)}
                    </TableCell>
                    <TableCell className="text-right text-foreground">{formatCost(m.costUsd)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
