"use client";

import { useState } from "react";
import { ChevronRightIcon, DownloadIcon, TrashIcon, WarningIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
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
          {/* Keeps its lift-on-hover: an override rather than a variant,
              because one button in the app does this and a variant nobody
              else uses is just a class string with extra steps. */}
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={() => void handleExport()}
            disabled={exporting || !user}
            className="shrink-0 gap-1.5 rounded-full bg-white text-dash-ink shadow-sm transition-all hover:bg-white hover:border-brand-purple/20 hover:shadow hover:-translate-y-0.5 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
          >
            <DownloadIcon className="h-3.5 w-3.5" />
            {exporting ? "Exporting…" : "Export data"}
          </Button>
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
              <Button
                type="button"
                variant="ghost"
                size="inline"
                onClick={() => setShowDeactivateConfirm(true)}
                className="shrink-0 gap-1 rounded-md py-2 text-sm hover:text-danger focus-visible:ring-danger/40 focus-visible:ring-offset-0"
              >
                Deactivate account
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
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
                  // A chip in a single-choice group, driven by aria-pressed and
                  // styled from the selection rather than from a variant. It
                  // belongs to a ToggleGroup primitive, with the other form
                  // controls (ADR-104 §4.3) — same shape as the theme cards in
                  // components/account/AppearanceCard.
                  // eslint-disable-next-line react/forbid-elements
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDeactivate}
                  disabled={deactivating}
                  className="text-dash-ink"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructiveOutline"
                  size="sm"
                  onClick={() => void handleConfirmDeactivate()}
                  disabled={deactivating}
                  aria-busy={deactivating}
                  className="rounded-full"
                >
                  {deactivating ? "Deactivating…" : `Yes, deactivate in ${graceDays} days`}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
