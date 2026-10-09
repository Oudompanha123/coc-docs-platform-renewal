"use client";

import { emailViolations, isEmailAcceptable } from "@/lib/auth/emailPolicy";
import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import type { TeamRole } from "@/lib/admin/claudeUsage";
import { inputBaseClass } from "@/components/ui/input";

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
    return (
      <Modal title="Invite added" onClose={onClose}>
        <p className="text-sm text-muted">
          <span className="font-semibold text-dash-ink">{sentTo}</span> now shows as invited on this
          dashboard. Once they run the reporter it becomes active automatically — nothing else to send
          them by hand. If they need help setting it up, point them at{" "}
          <span className="font-semibold text-dash-ink">Claude Code Usage → Download push-usage.mjs</span>{" "}
          (or their own Home page): it downloads a script already filled in with their identity and a
          personal token, so there is no shared secret to hand over.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
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
          // Previously only "not empty", so a typo reached the backend and came
          // back as a validation error with no field attached (ADR-088).
          if (!isEmailAcceptable(trimmed)) {
            setError(emailViolations(trimmed).join(" "));
            return;
          }
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
          className={`${inputBaseClass} mt-1.5 w-full`}
        />

        <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="invite-role">
          Role
        </label>
        <div className="relative mt-1.5">
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            className={`${inputBaseClass} w-full appearance-none`}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M6 9.5 12 15l6-5.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="mt-3 rounded-[10px] bg-page px-3 py-2 text-xs text-muted">
          This only adds them to this dashboard&apos;s tracking list. It doesn&apos;t change their
          Claude Code access or force their machine to start reporting usage — that stays their choice.
        </p>

        {error && (
          <p role="alert" className="mt-3 rounded-[10px] bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
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
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send invite"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
