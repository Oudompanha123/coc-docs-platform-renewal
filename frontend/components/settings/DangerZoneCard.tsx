"use client";

import { useState } from "react";
import { ChevronRightIcon, DownloadIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";
import {
  deactivateMyAccount,
  AuthApiError,
  SessionExpiredError,
  DEACTIVATION_GRACE_PERIOD_DAYS_OPTIONS,
  type DeactivationGracePeriodDays,
} from "@/lib/auth/api";
import { downloadMyData } from "@/lib/settings/export-my-data";
import { listNotifications } from "@/lib/notify/activity";
import { useSession } from "@/lib/auth/SessionProvider";

const DEFAULT_GRACE_PERIOD_DAYS: DeactivationGracePeriodDays = 7;

/**
 * Moved out of SecurityTab into its own full-width card, matching the
 * reference layout's separate red-tinted Danger zone section rather than
 * an inset block inside Security. Export data is wired (see
 * `lib/settings/export-my-data.ts`); Deactivate account is too (revision of
 * ADR-042) — an in-place confirm panel, not a popup, since that is
 * specifically what this card moved away from.
 */
export function DangerZoneCard() {
  const { user, signOut, refresh } = useSession();
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [graceDays, setGraceDays] = useState<DeactivationGracePeriodDays>(DEFAULT_GRACE_PERIOD_DAYS);
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

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

  async function handleConfirmDeactivate() {
    setDeactivating(true);
    setDeactivateError(null);
    try {
      await deactivateMyAccount(graceDays);
      // The backend has already revoked every session for this account,
      // including this one — signOut() is client-side cleanup (local state,
      // redirect), not the thing that actually ends the session.
      await signOut();
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        // Not "the deactivation failed" — the session backing this page was
        // already gone before the click (expired, or a stale tab after an
        // earlier sign-out elsewhere). Retrying just 401s again, so this
        // shows the real reason and hands off to the same "you're signed
        // out" flow useNotifications.ts uses: refresh() re-asks /auth/me,
        // finds nobody, and RequireSession sends the caller to /login.
        setDeactivateError(err.message);
        setDeactivating(false);
        void refresh();
        return;
      }
      setDeactivateError(
        err instanceof AuthApiError ? err.message : "Couldn't deactivate your account. Please try again.",
      );
      setDeactivating(false);
    }
  }

  function handleCancelDeactivate() {
    setShowDeactivateConfirm(false);
    setDeactivateError(null);
    setGraceDays(DEFAULT_GRACE_PERIOD_DAYS);
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
        <div className="py-3.5 last:pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <TrashIcon className="h-[25px] w-[25px] shrink-0 text-danger" />
              <div>
                <p className="text-sm font-semibold text-dash-ink">Deactivate your account</p>
                <p className="text-xs text-muted">
                  {deactivateError ?? "You'll lose access; your content and audit history are preserved."}
                </p>
              </div>
            </div>
            {/* A plain link-style row, not a bordered button — a quiet menu
                row you can still find, not one that reads as an alarm
                before you've even opened it. Opens the confirm panel below,
                in place — no popup (ADR-042). */}
            {!showDeactivateConfirm && (
              <button
                type="button"
                onClick={() => setShowDeactivateConfirm(true)}
                className="inline-flex shrink-0 items-center gap-1 rounded-md py-2 text-sm font-semibold text-muted transition-colors hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40"
              >
                Deactivate account
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/*
            Revision of ADR-042: self-deactivation now schedules a future
            deactivation, via POST /api/v1/auth/me/deactivate, rather than
            flipping it immediately. Every session for the account,
            including this one, is still revoked server-side right away —
            signing back in before the grace period ends is what cancels
            the schedule, and that has to require actually signing in
            again, not just still holding a live cookie. The refusal cases
            (an out-of-range choice, or the last active super admin)
            surface here, not above — this panel is only ever "are you
            sure", never "here's why you can't".
          */}
          {showDeactivateConfirm && (
            <div className="mt-3 rounded-lg border border-danger/30 bg-white p-4">
              <p className="text-sm font-semibold text-dash-ink">Deactivate your account?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEACTIVATION_GRACE_PERIOD_DAYS_OPTIONS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setGraceDays(days)}
                    disabled={deactivating}
                    aria-pressed={graceDays === days}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      graceDays === days
                        ? "border-danger bg-danger/10 text-danger"
                        : "border-border text-dash-ink hover:border-danger/40"
                    }`}
                  >
                    {days} days
                  </button>
                ))}
              </div>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted">
                <li>You&apos;ll be signed out on every device immediately.</li>
                <li>
                  Your account stays active for {graceDays} days — signing back in before then cancels this and
                  keeps it active.
                </li>
                <li>
                  After {graceDays} days with no sign-in, your account is deactivated. From that point, only a
                  super admin can reactivate it.
                </li>
                <li>Your content and audit history are preserved either way.</li>
              </ul>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelDeactivate}
                  disabled={deactivating}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleConfirmDeactivate()}
                  disabled={deactivating}
                  aria-busy={deactivating}
                  className="rounded-full border border-danger px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deactivating ? "Deactivating…" : `Yes, deactivate in ${graceDays} days`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
