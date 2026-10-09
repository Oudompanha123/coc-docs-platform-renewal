"use client";

import { useState } from "react";
import { Modal, ModalFooter } from "@/components/users-roles/Modal";
import { Button } from "@/components/ui/button";
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
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-foreground">
          <ShieldIcon className="size-5" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-foreground">New sign-in to your account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This is the first time your account has been used on this device.
        </p>
      </div>

      <dl className="mt-4 divide-y divide-surface-border rounded-lg border border-surface-border">
        <div className="flex items-start justify-between gap-4 px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">Device</dt>
          <dd className="text-right text-sm font-medium text-foreground">{session.device}</dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">IP address</dt>
          <dd className="text-right text-sm text-foreground">
            {session.ipAddress ?? "Unknown address"}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 px-3 py-2.5">
          <dt className="text-xs text-muted-foreground">Signed in</dt>
          <dd className="text-right text-sm text-foreground">{signedInAt}</dd>
        </div>
      </dl>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <p className="mt-4 text-xs text-muted-foreground">
        If this was you, there is nothing to do. If it was not, end the session and change your
        password.
      </p>

      <ModalFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          This was me
        </Button>
        <Button type="button" variant="destructive" onClick={() => void endSession()} disabled={busy}>
          {busy ? "Ending…" : "End this session"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
