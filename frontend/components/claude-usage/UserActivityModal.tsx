"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { Pagination } from "@/components/users-roles/Pagination";
import { UserAvatar } from "@/components/layout/UserAvatar";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "@/components/layout/icons";
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
}: {
  member: ClaudeUsageMember;
  avatarColor: string;
  onClose: () => void;
}) {
  const today = useMemo(() => reportDate(), []);
  const [preset, setPreset] = useState<ActivityPreset>("today");
  const [custom, setCustom] = useState({ from: today, to: today });
  const [project, setProject] = useState<string | null>(null);
  const [projectOptions, setProjectOptions] = useState<string[]>([]);
  const [activity, setActivity] = useState<ClaudeUsageMemberActivity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<ClaudeUsageActivityDay | null>(null);

  const range = presetRange(preset, today, custom);
  const rangeKey = range ? `${range.from}|${range.to}` : "";

  useEffect(() => {
    if (!range) return;
    let cancelled = false;
    setActivity(null);
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load this person's activity.");
      });
    return () => {
      cancelled = true;
    };
    // rangeKey stands in for `range`, which is a new object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member.id, rangeKey, project]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      // Esc steps back out of the day detail first, then closes.
      if (selectedDay) setSelectedDay(null);
      else onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedDay, onClose]);

  const rangeLabel =
    preset === "custom" && range
      ? range.from === range.to
        ? formatDate(range.from)
        : `${formatDate(range.from)} – ${formatDate(range.to)}`
      : (ACTIVITY_PRESETS.find((p) => p.value === preset)?.label ?? "");
  const singleDay = !!range && range.from === range.to;
  const lastActivity = activity?.sessions[0]?.endedAt ?? null;

  return (
    <Modal
      onClose={onClose}
      className="w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-white shadow-xl"
    >
      <div role="dialog" aria-modal="true" aria-labelledby="user-activity-title" className="p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <h2 id="user-activity-title" className="text-lg font-bold text-dash-ink">
            {selectedDay ? "Day detail" : "User Activity"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-page hover:text-dash-ink"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <MemberHeader member={member} avatarColor={avatarColor} lastActivity={lastActivity} />

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
              <div role="alert" className="mt-6 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            {!activity && !error && range && (
              <p className="mt-6 rounded-[10px] border border-border px-4 py-8 text-center text-sm text-muted">
                Loading activity…
              </p>
            )}

            {activity && activity.days.length === 0 && (
              <p className="mt-6 rounded-[10px] border border-border px-4 py-8 text-center text-sm text-muted">
                {project ? `No usage on ${project} in this range.` : "No usage reported in this range."}
              </p>
            )}

            {activity && activity.days.length > 0 && (
              <div className="mt-6 flex flex-col gap-7">
                {activity.daysWithoutActivity > 0 && (
                  <p className="rounded-[10px] border border-[#e0873c]/30 bg-[#e0873c]/10 px-4 py-3 text-xs text-dash-ink">
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
                  <p className="mt-2 text-xs text-muted">
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
                            className="text-xs font-semibold text-brand-blue hover:underline"
                          >
                            All projects
                          </button>
                        ) : null
                      }
                    />
                    <ul className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
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
                  <ul aria-label="Daily activity" className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border">
                    {activity.days.map((day) => (
                      <li key={day.date}>
                        <DayRow day={day} onClick={() => setSelectedDay(day)} />
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            )}

            <p className="mt-6 text-xs text-muted">
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
}: {
  member: ClaudeUsageMember;
  avatarColor: string;
  /** The latest activity the detail knows of; falls back to the dashboard's last report. */
  lastActivity: string | null;
}) {
  const last = lastActivity ?? member.lastActiveAt;
  const activeToday = isToday(last);
  return (
    <div className="mt-5 flex items-center gap-4">
      <UserAvatar
        avatarUrl={member.avatarUrl}
        name={member.displayName}
        initials={initialsOf(member.displayName)}
        className="h-14 w-14 shrink-0 !text-lg shadow-sm"
        style={{ backgroundColor: avatarColor }}
      />
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-dash-ink">{member.displayName}</p>
        <p className="truncate text-sm text-muted">{member.email}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${activeToday ? "bg-[#1f9d6b]" : "bg-[#c4c4d0]"}`} />
          Last report · {formatLastActive(last)}
        </p>
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
  const inputClass =
    "rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm text-dash-ink focus:outline-none focus-visible:border-brand-purple focus-visible:ring-4 focus-visible:ring-brand-purple/15";
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
                ? "bg-gradient-to-r from-brand-purple to-brand-blue text-white"
                : "border border-border bg-white text-dash-ink hover:border-brand-purple hover:text-brand-purple"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {preset === "custom" && (
          <>
            <input
              type="date"
              aria-label="From"
              value={custom.from}
              max={today}
              onChange={(e) => onCustom({ ...custom, from: e.target.value })}
              className={inputClass}
            />
            <span className="text-sm text-muted">to</span>
            <input
              type="date"
              aria-label="To"
              value={custom.to}
              max={today}
              onChange={(e) => onCustom({ ...custom, to: e.target.value })}
              className={inputClass}
            />
          </>
        )}
        {(projectOptions.length > 1 || project) && (
          <select
            aria-label="Project"
            value={project ?? ""}
            onChange={(e) => onProject(e.target.value || null)}
            className={inputClass}
          >
            <option value="">All projects</option>
            {[...new Set([...(project ? [project] : []), ...projectOptions])].map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-xl border px-4 py-3.5 ${emphasis ? "border-brand-purple/20 bg-brand-purple/5" : "border-border bg-[#f8fafc]"}`}>
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-bold text-dash-ink">{value}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wide text-muted">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
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
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${active ? "bg-brand-blue/5" : "hover:bg-[#f8fafc]"}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-dash-ink">{project.name}</p>
        <p className="mt-0.5 text-xs text-muted">
          {plural(project.requestCount, "request", "requests")} · {formatTokens(project.totalTokens)} tokens ·{" "}
          {formatDuration(project.activeSeconds)} active
        </p>
      </div>
      <p className="hidden shrink-0 text-right text-xs text-muted sm:block">
        First used {span(project.firstAt)}
        <br />
        Last used {span(project.lastAt)}
      </p>
      <ChevronRightIcon className={`h-4 w-4 shrink-0 ${active ? "text-brand-blue" : "text-muted"}`} />
    </button>
  );
}

const SESSION_PAGE_SIZE = 5;

function SessionList({ sessions, showDate }: { sessions: ClaudeUsageActivitySession[]; showDate: boolean }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(SESSION_PAGE_SIZE);

  // A new range is a new list — start it from its first page, not wherever
  // the previous range was left.
  useEffect(() => setPage(1), [sessions]);

  // Clamp here too, not just in <Pagination>, so a shorter list never slices
  // past its end and renders an empty page.
  const pageCount = Math.max(1, Math.ceil(sessions.length / pageSize));
  const current = Math.min(page, pageCount);
  const offset = (current - 1) * pageSize;
  const visible = sessions.slice(offset, offset + pageSize);

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-border">
      <ul aria-label="Sessions" className="divide-y divide-border">
        {visible.map((s) => (
          <li key={s.startedAt} className="flex items-center gap-4 px-4 py-2.5 text-sm">
            <span className="w-32 shrink-0 font-medium tabular-nums text-dash-ink">
              {showDate && <span className="mr-1.5 text-muted">{formatDate(s.date)}</span>}
              {formatTime(s.startedAt)} – {formatTime(s.endedAt)}
            </span>
            <span className="w-16 shrink-0 font-semibold tabular-nums text-dash-ink">{formatDuration(s.durationSeconds)}</span>
            <span className="min-w-0 flex-1 truncate text-xs text-muted">
              {s.projects.join(", ")} · {plural(s.requestCount, "request", "requests")}
            </span>
          </li>
        ))}
      </ul>
      {/* One page's worth needs no controls. */}
      {sessions.length > SESSION_PAGE_SIZE && (
        <Pagination
          total={sessions.length}
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
          <span className={`w-40 shrink-0 truncate ${row.rest ? "text-muted" : "text-dash-ink"}`}>{row.name}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-page">
            <span
              className={`block h-full rounded-full ${row.rest ? "bg-[#c4c4d0]" : "bg-brand-blue"}`}
              style={{ width: `${max > 0 ? Math.max(2, (row.totalTokens / max) * 100) : 0}%` }}
            />
          </span>
          <span className="w-14 shrink-0 text-right font-semibold tabular-nums text-dash-ink">{formatTokens(row.totalTokens)}</span>
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
        <p className="text-sm font-semibold text-dash-ink">{formatDate(day.date)}</p>
        <p className="text-xs text-muted">{formatDate(day.date, { weekday: "short" })}</p>
      </div>
      <p className="min-w-0 flex-1 truncate text-sm text-dash-ink">
        {reported ? (
          <>
            {plural(day.requestCount, "request", "requests")} · {plural(day.sessionCount, "session", "sessions")} ·{" "}
            {formatDuration(day.activeSeconds)}
          </>
        ) : (
          <span className="text-muted">Activity not reported</span>
        )}
      </p>
      <p className="shrink-0 text-xs font-medium text-muted">
        <span className="text-sm font-semibold text-dash-ink">{formatTokens(day.totalTokens)}</span> tokens
      </p>
      <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
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
  const tableClass = "w-full min-w-[560px] text-left text-sm";
  const headClass = "border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted";

  return (
    <div className="mt-6">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
        <ChevronLeftIcon className="h-4 w-4" />
        Back to activity
      </button>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-[#f8fafc] p-5 sm:grid-cols-4">
        {fields.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs font-medium text-muted">{label}</dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-dash-ink">{value}</dd>
          </div>
        ))}
      </dl>

      {day.sessions && day.sessions.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-dash-ink">Sessions</h3>
          <SessionList sessions={day.sessions} showDate={false} />
        </>
      )}

      {day.projects && day.projects.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-dash-ink">By project</h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table aria-label="By project" className={tableClass}>
              <thead>
                <tr className={headClass}>
                  <th className="px-4 py-2.5">Project</th>
                  <th className="px-4 py-2.5 text-right">Requests</th>
                  <th className="px-4 py-2.5 text-right">Active</th>
                  <th className="px-4 py-2.5 text-right">Input</th>
                  <th className="px-4 py-2.5 text-right">Output</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">First – last</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {day.projects.map((p) => (
                  <tr key={p.name}>
                    <td className="px-4 py-3 font-medium text-dash-ink">{p.name}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatCount(p.requestCount)}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatDuration(p.activeSeconds)}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatTokens(p.inputTokens)}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatTokens(p.outputTokens)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-dash-ink">{formatTokens(p.totalTokens)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {formatTime(p.firstAt)} – {formatTime(p.lastAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {day.models.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-dash-ink">By model</h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border">
            <table aria-label="By model" className={tableClass}>
              <thead>
                <tr className={headClass}>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5 text-right">Input</th>
                  <th className="px-4 py-2.5 text-right">Output</th>
                  <th className="px-4 py-2.5 text-right">Total</th>
                  <th className="px-4 py-2.5 text-right">Cache read / write</th>
                  <th className="px-4 py-2.5 text-right">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {day.models.map((m) => (
                  <tr key={m.model}>
                    <td className="px-4 py-3 font-medium text-dash-ink">{modelDisplayName(m.model)}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatTokens(m.inputTokens)}</td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatTokens(m.outputTokens)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-dash-ink">{formatTokens(m.totalTokens)}</td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatTokens(m.cacheReadTokens)} / {formatTokens(m.cacheWriteTokens)}
                    </td>
                    <td className="px-4 py-3 text-right text-dash-ink">{formatCost(m.costUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
