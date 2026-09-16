"use client";

import { useState } from "react";
import { MailIcon, WarningIcon } from "@/components/layout/icons";
import { SettingsCard } from "@/components/settings/SettingsCard";
import { sendActivityDigest, type DigestResult } from "@/lib/admin/notifications";
import { useSession } from "@/lib/auth/SessionProvider";

/**
 * Sends the content-activity digest on demand.
 *
 * The digest normally fires by itself at 08:00; this is for the mornings it
 * did not — a backend that was down, a recipient list that was wrong, a change
 * someone wants to see before tomorrow.
 *
 * Unlike {@link NotificationsCard}, which is local preference state, every
 * button here reaches the real backend and really sends mail to real people.
 * That is why the button says "Send digest now" rather than "Save", and why
 * the outcome is reported in words rather than as a checkmark: "sent" and "not
 * sent, because nothing happened that day" are both successful outcomes, and
 * the reader needs to know which one they got.
 *
 * Hidden below `super_admin` — which hides the control, not the capability.
 * The backend refuses the call regardless (`hasRole(SUPER_ADMIN)` on this
 * path); this only avoids showing a button that would 403.
 *
 * It renders its own {@link SettingsCard}, heading and spacing rather than
 * being wrapped in one by the page. Returning null from inside a wrapper would
 * leave an empty titled card and its margin on the settings screen of every
 * admin and every ordinary user — a section announcing something is there and
 * then showing nothing.
 */
export function ActivityDigestCard() {
  const { user } = useSession();
  const [day, setDay] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<DigestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    setError(null);
    try {
      setResult(await sendActivityDigest(day.trim() || undefined));
    } catch (e) {
      // The backend's wording where there is one — it says what to do
      // differently, which a generic failure message cannot.
      setError(e instanceof Error ? e.message : "The digest could not be sent.");
    } finally {
      setSending(false);
    }
  }

  if (user?.role !== "super_admin") {
    return null;
  }

  return (
    <div className="animate-entrance mt-5 [animation-delay:105ms]">
      <SettingsCard
        title="Team notifications"
        description="Digests this workspace sends to its administrators"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
              <MailIcon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-dash-ink">Content activity digest</p>
              <p className="text-xs text-muted">
                Emails every admin a summary of the pages that changed — who edited them, and what
                still needs publishing. Sends automatically each morning.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="digest-day" className="block text-xs font-semibold text-dash-ink">
                Day to report on
              </label>
              <input
                id="digest-day"
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-dash-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
              />
              <p className="mt-1 text-xs text-muted">
                Leave empty for yesterday, the day the automatic send covers.
              </p>
            </div>

            <button
              type="button"
              onClick={send}
              disabled={sending}
              className="rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send digest now"}
            </button>
          </div>

          {/*
            aria-live: the button stays where it is and only this region
            changes, so without it a screen-reader user is never told what
            happened.
          */}
          <div aria-live="polite">
            {error && (
              <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                <WarningIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}

            {result && !error && (
              <div
                className={`rounded-lg px-3 py-2 text-xs ${
                  result.sent ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"
                }`}
              >
                <p className="font-semibold">
                  {result.sent
                    ? `Sent to ${result.recipients} recipient${result.recipients === 1 ? "" : "s"}`
                    : "Nothing was sent"}
                </p>
                <p className="mt-0.5">
                  {result.day} — {result.reason}
                  {result.pagesChanged > 0 &&
                    ` · ${result.pagesChanged} page${result.pagesChanged === 1 ? "" : "s"} across ${result.sections} section${result.sections === 1 ? "" : "s"}`}
                </p>
              </div>
            )}
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
