import { AVATAR_GRADIENTS } from "@/components/dashboard/tone";
import type { CurrentUser } from "@/lib/mock/overview";

/** Read-only for v1 — no inline-edit pattern exists elsewhere in this app to match. */
export function ProfileCard({ data }: { data: CurrentUser }) {
  const avatar = AVATAR_GRADIENTS[data.tone];

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="flex items-center gap-3">
        <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-white shadow-sm ${avatar}`}>
          {data.initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-dash-ink">{data.name}</p>
          <p className="text-sm text-muted">{data.role}</p>
        </div>
      </div>

      <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 border-l border-border pl-6 sm:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
          <dd className="mt-0.5 truncate text-sm text-dash-ink">{data.email}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Account status</dt>
          <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-dash-ink">
            <span className="h-2 w-2 rounded-full bg-[#1f9d6b]" aria-hidden="true" />
            Active
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Joined</dt>
          <dd className="mt-0.5 text-sm text-dash-ink">{data.joinedDate}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="shrink-0 rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
      >
        Edit profile
      </button>
    </div>
  );
}
