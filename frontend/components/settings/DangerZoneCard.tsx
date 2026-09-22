"use client";

import { useState } from "react";
import { DownloadIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";
import { Modal } from "@/components/users-roles/Modal";
import { downloadMyData } from "@/lib/settings/export-my-data";
import { listNotifications } from "@/lib/notify/activity";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Moved out of SecurityTab into its own full-width card, matching the
 * reference layout's separate red-tinted Danger zone section rather than
 * an inset block inside Security. Export data is wired (see
 * `lib/settings/export-my-data.ts`); Deactivate account is too, but not to
 * an API call — see its own state/handler below for why.
 */
export function DangerZoneCard() {
  const { user } = useSession();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateInfo, setShowDeactivateInfo] = useState(false);

  async function handleExport() {
    if (!user) return;
    setExporting(true);
    setError(null);
    try {
      // The backend's own cap (NotificationFeedService.MAX_LIMIT) — as much
      // of the caller's own history as this endpoint will ever return.
      const activity = await listNotifications(50);
      downloadMyData(user, activity);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't export your data.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-[10px] border border-danger/40 bg-danger/5 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-danger to-[#e0873c] text-white">
          <WarningIcon className="h-5 w-5" />
        </div>
        <p className="text-lg font-bold text-danger">Danger zone</p>
      </div>
      <div className="mt-4 divide-y divide-danger/20">
        <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0">
          <div className="flex items-start gap-3">
            <DownloadIcon className="h-[25px] w-[25px] shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Export your data</p>
              <p className="text-xs text-muted">
                {error ?? "Download a copy of your profile and activity."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting || !user}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-dash-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-purple/20 hover:shadow disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export data"}
          </button>
        </div>
        <div className="flex items-start justify-between gap-4 py-3.5 last:pb-0">
          <div className="flex items-start gap-3">
            <TrashIcon className="h-[25px] w-[25px] shrink-0 text-danger" />
            <div>
              <p className="text-sm font-semibold text-dash-ink">Deactivate your account</p>
              <p className="text-xs text-muted">You&apos;ll lose access; your content and audit history are preserved.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowDeactivateInfo(true)}
            className="shrink-0 rounded-full border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger/10"
          >
            Deactivate account
          </button>
        </div>
      </div>

      {/*
        No API call behind this — AccountService.setActive refuses it outright
        for anyone, actor or not: "you cannot deactivate your own account"
        (a misclick guard, not a permission check; the recovery is another
        person). The admin-side DeactivateModal already shows this same
        refusal to a super_admin who tries it on their own row; this is that
        message surfaced here instead of a doomed round trip to an endpoint
        that would just 400.
      */}
      {showDeactivateInfo && (
        <Modal title="Can't deactivate your own account" onClose={() => setShowDeactivateInfo(false)}>
          <p className="text-sm text-muted">
            This is refused for every account, including a super admin&apos;s own — it guards against a misclick that
            locks someone out with no one left to undo it.
          </p>
          <p className="mt-3 text-sm text-muted">
            Ask a <strong>super admin</strong> on your team to deactivate this account for you instead. Your content
            and audit history are preserved either way.
          </p>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setShowDeactivateInfo(false)}
              className="rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
