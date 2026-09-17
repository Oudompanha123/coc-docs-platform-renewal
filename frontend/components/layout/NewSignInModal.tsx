"use client";

import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { revokeSession, type SessionSummary } from "@/lib/auth/api";
import { ShieldIcon } from "@/components/auth/icons";

/**
 * "Somebody signed in to your account. Was that you?"
 *
 * <p>The dialog behind a new-device alert (ADR-027). It exists because an
 * alert that only says something happened is worse than no alert: it worries
 * the reader and then leaves them to find the Settings page and work out which
 * row it meant. Everything needed to answer is here, including the answer.
 *
 * <p><b>Two buttons, deliberately unequal.</b> Ending the session is the
 * destructive one and is styled as such, but it is also the one a person under
 * pressure should be able to hit without reading twice, so it is not hidden
 * behind a confirmation. There is nothing to lose: the worst case is signing
 * your own other browser out, which costs one sign-in.
 *
 * <p><b>The detail is shown here rather than in the banner.</b> The push says
 * only the device, because it renders on a lock screen (ADR-025 decision 6).
 * The address and the exact time are behind a session, which is where anything
 * that describes where a person was belongs.
 */
export function NewSignInModal({
  session,
  onClose,
  onEnded,
}: {
  session: SessionSummary;
  onClose: () => void;
  /** Called after the server has revoked it, so the caller can re-read. */
  onEnded: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function endSession() {
    setBusy(true);
    setError(null);
    try {
      await revokeSession(session.id);
      onEnded();
      onClose();
    } catch (err) {
      // The session is still live, because the server says so.
      setError(err instanceof Error ? err.message : "Couldn't end that session.");
      setBusy(false);
    }
  }

  const when = new Date(session.issuedAt);
  const signedInAt = Number.isNaN(when.getTime()) ? "recently" : when.toLocaleString();

  return (
    <Modal onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-blue text-white">
          <ShieldIcon className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-base font-bold text-dash-ink">New sign-in to your account</h2>
        <p className="mt-1 text-sm text-muted">
          This is the first time your account has been used on this device.
        </p>
      </div>

      <dl className="mt-5 divide-y divide-border rounded-xl border border-border">
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Device</dt>
          <dd className="text-right text-sm font-semibold text-dash-ink">{session.device}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">IP address</dt>
          <dd className="text-right text-sm text-dash-ink">
            {session.ipAddress ?? "Unknown address"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Signed in</dt>
          <dd className="text-right text-sm text-dash-ink">{signedInAt}</dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <p className="mt-4 text-xs text-muted">
        If this was you, there is nothing to do. If it was not, end the session and change your
        password.
      </p>

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:opacity-60"
        >
          This was me
        </button>
        <button
          type="button"
          onClick={() => void endSession()}
          disabled={busy}
          className="rounded-full bg-danger px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Ending…" : "End this session"}
        </button>
      </div>
    </Modal>
  );
}
