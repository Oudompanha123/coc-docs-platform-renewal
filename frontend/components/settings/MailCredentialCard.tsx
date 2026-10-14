"use client";

import { useEffect, useState } from "react";
import { MailIcon } from "@/components/layout/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SessionExpiredError } from "@/lib/auth/api";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  connectGoogleMail,
  loadMailCredential,
  removeMailCredential,
  saveMailCredential,
  type MailCredentialStatus,
} from "@/lib/notify/mailCredential";
import { ConsentDismissedError, requestGmailAuthorizationCode } from "@/lib/notify/googleCodeClient";

/**
 * The same client id sign-in uses. Absent means the OAuth route cannot be
 * offered, and the App Password form is all that shows.
 *
 * <p>Read per render rather than once at module load. Next.js inlines
 * {@code NEXT_PUBLIC_*} at build time either way, so this costs nothing there
 * — but a module-level constant is captured before a test can set it, which
 * made the OAuth cases pass or fail on whether the runner happened to have the
 * variable in its environment.
 */
function googleClientId(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
}

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
  const [oauthError, setOauthError] = useState<string | null>(null);
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
      setStatus({ configured: false, smtpUsername: null, kind: null });
      setSaved(false);
    });

  /**
   * The preferred route (ADR-085). One consent screen, nothing typed, and the
   * grant is scoped to sending and reading rather than being a password that
   * opens the whole account.
   */
  async function connectGoogle() {
    setBusy(true);
    // Its own error state, not the form's. One shared string rendered in both
    // places put the same message on screen twice.
    setOauthError(null);
    setError(null);
    setSaved(false);
    try {
      const code = await requestGmailAuthorizationCode(googleClientId());
      setStatus(await connectGoogleMail(code));
      setExpanded(false);
      setSaved(true);
    } catch (e) {
      // Closing the popup is a decision, not a failure. Saying "something went
      // wrong" to someone who just changed their mind is noise.
      if (e instanceof ConsentDismissedError) return;
      setOauthError(
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

  const configured = status?.configured === true;
  const viaOauth = status?.kind === "oauth";
  // Both halves must be present: the server needs a client secret to exchange
  // the code, and this bundle needs the client id to raise the popup.
  const canUseOauth = status?.oauthAvailable === true && googleClientId() !== "";

  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
            <MailIcon className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Send attendance mail from your own Gmail</p>
            <p className="text-xs text-muted-foreground">
              {configured
                ? `Using ${status?.smtpUsername} — ${
                    viaOauth ? "connected with Google" : "App Password"
                  }. Your attendance report is sent from this address.`
                : "Optional. Without this, your report is sent from the shared address."}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {configured && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void remove()}
              disabled={busy}
              className="text-muted-foreground hover:text-foreground"
            >
              Remove
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
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
          >
            {expanded ? "Cancel" : configured ? "Replace" : "Set up"}
          </Button>
        </div>
      </div>

      {saved && !expanded && (
        <p className="mt-2 pl-12 text-xs font-medium text-emerald-600">Saved.</p>
      )}

      {expanded && (
        <div className="mt-3 pl-12">
          {/* ADR-077 section 4.3: both halves, before anyone stores one. */}
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-foreground">Before you enter this, know what it allows</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
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

          {canUseOauth && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void connectGoogle()}
                disabled={busy}
                className="mt-3 w-full"
              >
                {busy ? "Connecting…" : "Connect with Google"}
              </Button>
              <p className="mt-1 text-xs text-muted-foreground">
                Recommended. One permission screen, nothing to type, and you can revoke it from your Google
                account at any time.
              </p>
              {oauthError && <p className="mt-2 text-xs font-medium text-destructive">{oauthError}</p>}

              <p className="mt-4 text-xs font-medium text-muted-foreground">Or use an App Password instead</p>
            </>
          )}

          <label className="mt-3 block text-xs font-medium text-foreground" htmlFor="smtp-username">
            Gmail address
          </label>
          <Input
            id="smtp-username"
            type="email"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="you@gmail.com"
            className="mt-1"
          />

          <label className="mt-3 block text-xs font-medium text-foreground" htmlFor="app-password">
            App Password
          </label>
          <Input
            id="app-password"
            type="password"
            autoComplete="new-password"
            value={appPassword}
            onChange={(e) => setAppPassword(e.target.value)}
            placeholder="16 characters, spaces are fine"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Not your Google password. Create one at myaccount.google.com → Security → App passwords.
          </p>
          {username.trim() !== "" && username.trim() === loginEmail && (
            <p className="mt-1 text-xs text-muted-foreground">
              Filled in from the account you signed in with. Change it if your HRMS mail arrives somewhere
              else.
            </p>
          )}

          {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}

          <Button
            type="button"
            size="sm"
            onClick={() => void save()}
            disabled={busy || username.trim() === "" || appPassword.trim() === ""}
            className="mt-3"
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}
