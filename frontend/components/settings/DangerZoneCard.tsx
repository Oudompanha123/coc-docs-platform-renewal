import { DownloadIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";

/**
 * Moved out of SecurityTab into its own full-width card, matching the
 * reference layout's separate red-tinted Danger zone section rather than
 * an inset block inside Security. Markup/behavior is unchanged from
 * SecurityTab's previous version — Export data and Deactivate account are
 * still not wired to anything; that was already true before this move.
 */
export function DangerZoneCard() {
  return (
    <div className="rounded-2xl border border-danger/40 bg-danger/5 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-danger to-[#e0873c] text-white">
          <WarningIcon className="h-5 w-5" />
        </div>
        <p className="text-lg font-bold text-danger">Danger zone</p>
      </div>
      <div className="mt-4 divide-y divide-danger/20">
        <div className="flex items-center justify-between gap-4 py-3.5 first:pt-0">
          <div className="flex items-center gap-3">
            <DownloadIcon className="h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Export your data</p>
              <p className="text-xs text-muted">Download a copy of your profile and activity.</p>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-dash-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-purple/20 hover:shadow"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            Export data
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 py-3.5 last:pb-0">
          <div className="flex items-center gap-3">
            <TrashIcon className="h-4 w-4 shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Deactivate your account</p>
              <p className="text-xs text-muted">You&apos;ll lose access; your content and audit history are preserved.</p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            Deactivate account
          </button>
        </div>
      </div>
    </div>
  );
}
