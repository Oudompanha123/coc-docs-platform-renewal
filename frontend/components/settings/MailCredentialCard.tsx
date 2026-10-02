"use client";

import { useEffect, useState } from "react";
import { MailIcon } from "@/components/layout/icons";
import { SessionExpiredError } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  loadMailCredential,
  removeMailCredential,
  saveMailCredential,
  type MailCredentialStatus,
} from "@/lib/notify/mailCredential";

/**
 * Where somebody supplies their own Gmail credential (ADR-063, ADR-077,
 * ADR-084).
 *
 * <p><b>The wording here is part of the decision, not decoration.</b> ADR-077
 * §4.3 records that the consent text had to say both halves of what an App
 * Password grants before anyone besides its author stored one: this
 * application sends as that mailbox <em>and reads it on a timer</em>, and the
 * password itself opens the whole mailbox rather than the attendance corner of
 * it. Someone agreeing to "send my report from my address" has not thereby
 * agreed to the rest. Do not shorten this copy without reading that ADR.
 *
 * <p>Optional everywhere. With no credential, attendance mail is sent by the
 * shared sender exactly as before and no inbox of theirs is opened.
 */
export function MailCredentialCard() {
  const { user } = useSession();
  // The account's own email, which for a Google sign-in is the Gmail address
  // this would authenticate as. Prefilled rather than derived server-side:
  // V56 deliberately keeps smtp_username separate from account.email because
  // somebody may hold their work mail under another address, and guessing it
  // would send as the wrong identity. A visible, editable default gives the
  // common case one less thing to type without taking the choice away.
  const loginEmail = user?.email ?? "";

  const [status, setStatus] = useState<MailCredentialStatus | null>(null);
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        setStatus(await loadMailCredential());
      } catch {
        // A failure to read the status is not worth an error banner on a
        // settings page: the form below still works, and pressing Save reports
        // anything real. Left as "not configured", which is the safe reading.
        setStatus({ configured: false, smtpUsername: null });
      }
    })();
  }, []);

  async function act(run: () => Promise<void>) {
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await run();
    } catch (e) {
      setError(
        e instanceof SessionExpiredError
          ? "You are not signed in any more. Reload the page and sign in."
          : e instanceof Error
            ? e.message
            : "Something went wrong.",
      );
    } finally {
      setBusy(false);
    }
  }

  const save = () =>
    act(async () => {
      const next = await saveMailCredential(username, appPassword);
      setStatus(next);
      // Never keep the password in component state after it has been sent.
      setAppPassword("");
      setUsername("");
      setExpanded(false);
      setSaved(true);
    });

  const remove = () =>
    act(async () => {
      await removeMailCredential();
      setStatus({ configured: false, smtpUsername: null });
      setSaved(false);
    });

  const configured = status?.configured === true;

  return (
    <div className="py-3.5 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10 text-brand-purple">
            <MailIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-dash-ink">Send attendance mail from your own Gmail</p>
            <p className="text-xs text-muted">
              {configured
                ? `Using ${status?.smtpUsername}. Your attendance report is sent from this address.`
                : "Optional. Without this, your report is sent from the shared address."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {configured && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-dash-ink disabled:opacity-40"
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setExpanded((open) => {
                // Seed on open, not on mount: the address a person is
                // replacing is the one already stored, and otherwise their
                // own login address. Either way the common case is that they
                // only have to enter the password.
                if (!open) setUsername(status?.smtpUsername ?? loginEmail);
                setError(null);
                return !open;
              });
            }}
            disabled={busy}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-surface-2 disabled:opacity-40"
          >
            {expanded ? "Cancel" : configured ? "Replace" : "Set up"}
          </button>
        </div>
      </div>

      {saved && !expanded && (
        <p className="mt-2 pl-12 text-xs font-semibold text-emerald-600">Saved.</p>
      )}

      {expanded && (
        <div className="mt-3 pl-12">
          {/* ADR-077 section 4.3: both halves, before anyone stores one. */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-dash-ink">Before you enter this, know what it allows</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted">
              <li>This app will send your attendance report as this address.</li>
              <li>
                It will also <strong>read this mailbox on a schedule</strong>, every 30 minutes, to find your
                HRMS report.
              </li>
              <li>
                A Google App Password is not limited to either of those. It grants full read and send on the
                whole account.
              </li>
              <li>You can remove it here at any time, and revoke it in your Google account.</li>
            </ul>
          </div>

          <label className="mt-3 block text-xs font-semibold text-dash-ink" htmlFor="smtp-username">
            Gmail address
          </label>
          <input
            id="smtp-username"
            type="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="you@gmail.com"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dash-ink outline-none focus:border-brand-purple"
          />

          <label className="mt-3 block text-xs font-semibold text-dash-ink" htmlFor="app-password">
            App Password
          </label>
          <input
            id="app-password"
            type="password"
            autoComplete="new-password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="16 characters, spaces are fine"
            className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-dash-ink outline-none focus:border-brand-purple"
          />
          <p className="mt-1 text-xs text-muted">
            Not your Google password. Create one at myaccount.google.com → Security → App passwords.
          </p>
          {username.trim() !== "" && username.trim() === loginEmail && (
            <p className="mt-1 text-xs text-muted">
              Filled in from the account you signed in with. Change it if your HRMS mail arrives somewhere
              else.
            </p>
          )}

          {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}

          <button
            type="button"
            onClick={() => void save()}
            disabled={busy || username.trim() === "" || appPassword.trim() === ""}
            className="mt-3 rounded-lg bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
