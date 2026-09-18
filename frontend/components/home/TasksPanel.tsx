import { RECENT_PANEL_LIST_HEIGHT } from "@/components/dashboard/RecentActivityPanel";
import { CheckCircleIcon } from "@/components/layout/icons";
import type { Task } from "@/lib/tasks/tasks-api";

/** A readable due date, or nothing for a task that has none. */
function formatDue(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  return Number.isNaN(d.getTime()) ? null : `Due ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

/**
 * "Your Tasks" — real, open tasks from the task backend (ADR-033), read via
 * `GET /api/v1/admin/tasks`, widened to any signed-in role for this page.
 * There is no per-task assignee in the schema (`V17__tasks.sql`), so this
 * lists every open task rather than "assigned to me" — the honest reading of
 * what the API actually returns, not a filter this page can't perform.
 *
 * Same fixed-height, internally-scrolling list as Recent Documents
 * (`RECENT_PANEL_LIST_HEIGHT`), so the two panels stay the same height
 * side by side regardless of item count.
 */
export function TasksPanel({ tasks }: { tasks: Task[] | null }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-white py-5 shadow-sm">
      <div className="flex items-center justify-between pl-5 pr-[15px]">
        <h2 className="text-base font-bold text-dash-ink">Your Tasks</h2>
      </div>
      <div className={`mt-1 divide-y divide-border pl-5 pr-[20px] ${RECENT_PANEL_LIST_HEIGHT}`}>
        {tasks !== null && (
          <div className="animate-entrance">
            {tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">No open tasks right now.</p>
            ) : (
              tasks.map((task) => {
                const due = formatDue(task.dueDate);
                return (
                  <div key={task.id} className="flex items-center gap-3 py-3">
                    <CheckCircleIcon className="h-5 w-5 shrink-0 text-muted" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-dash-ink">{task.title}</p>
                      {due && <p className="truncate text-xs text-muted">{due}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
