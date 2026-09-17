"use client";

import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { CodeBlock } from "./CodeBlock";
import type { TeamRole } from "@/lib/admin/claudeUsage";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export function InviteTeammateModal({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  /** Throws on failure (a duplicate email, a network error) — the form shows it and stays open. */
  onInvite: (email: string, role: TeamRole) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("member");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (sentTo) {
    const snippet = JSON.stringify(
      {
        USER_EMAIL: sentTo,
        INGEST_URL: `${BACKEND_URL}/api/ingest`,
        INGEST_SECRET: "<ask your admin>",
      },
      null,
      2,
    );

    return (
      <Modal title="Invite added" onClose={onClose}>
        <p className="text-sm text-muted">
          <span className="font-semibold text-dash-ink">{sentTo}</span> now shows as invited on this
          dashboard. Send them this config so their own reporting tool knows where and who to report as —
          the ingest secret is shared team-wide and never shown here; ask whoever holds it.
        </p>
        <div className="mt-3">
          <CodeBlock label="setup config" code={snippet} />
        </div>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/90"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Invite teammate" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const trimmed = email.trim();
          if (!trimmed) return;
          setError(null);
          setBusy(true);
          try {
            await onInvite(trimmed, role);
            setSentTo(trimmed);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't add that teammate.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label className="block text-xs font-semibold text-muted" htmlFor="invite-email">
          Email address
        </label>
        <input
          id="invite-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@cocdocs.example"
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        />

        <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="invite-role">
          Role
        </label>
        <select
          id="invite-role"
          value={role}
          onChange={(e) => setRole(e.target.value as TeamRole)}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>

        <p className="mt-3 rounded-xl bg-page px-3 py-2 text-xs text-muted">
          This only adds them to this dashboard&apos;s tracking list. It doesn&apos;t change their
          Claude Code access or force their machine to start reporting usage — that stays their choice.
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:bg-page"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
