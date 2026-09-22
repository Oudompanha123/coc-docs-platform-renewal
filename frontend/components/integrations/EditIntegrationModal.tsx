"use client";

import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { KNOWN_EVENTS, type Integration } from "@/lib/admin/integrations";

const EVENT_LABELS: Record<string, string> = {
  "account.registered": "A new account registers",
};

/**
 * Renames an integration and/or changes which events it subscribes to.
 *
 * Provider and target URL are fixed once connected — the backend has no
 * `PATCH` field for either (`ApiDtos.UpdateIntegrationRequest` carries only
 * `name`/`events`), because changing the destination or the signature scheme
 * a receiver already trusts is a reconnect, not an edit. Rotating the secret
 * has its own action ("Rotate secret") for the same reason `ConnectIntegrationModal`
 * keeps connect and rotate separate: only one of the two ever needs the
 * one-time-reveal screen.
 */
export function EditIntegrationModal({
  integration,
  onClose,
  onSave,
}: {
  integration: Integration;
  onClose: () => void;
  /** Throws on failure — the form shows it and stays open, same contract as `ConnectIntegrationModal`'s `onConnect`. */
  onSave: (name: string, events: string[]) => Promise<Integration>;
}) {
  const [name, setName] = useState(integration.name);
  const [events, setEvents] = useState<string[]>(integration.events);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleEvent(event: string) {
    setEvents((current) => (current.includes(event) ? current.filter((e) => e !== event) : [...current, event]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || events.length === 0) return;

    setError(null);
    setBusy(true);
    try {
      await onSave(trimmedName, events);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that change.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit "${integration.name}"`} onClose={onClose}>
      <form onSubmit={submit}>
        <label className="block text-xs font-semibold text-muted" htmlFor="integration-edit-name">
          Name
        </label>
        <input
          id="integration-edit-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        />

        <p className="mt-4 text-xs font-semibold text-muted">Send on</p>
        <div className="mt-1.5 space-y-1.5">
          {KNOWN_EVENTS.map((event) => (
            <label key={event} className="flex items-center gap-2 text-sm text-dash-ink">
              <input type="checkbox" checked={events.includes(event)} onChange={() => toggleEvent(event)} />
              {EVENT_LABELS[event] ?? event}
            </label>
          ))}
        </div>

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
            disabled={busy || events.length === 0}
            className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
