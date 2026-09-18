"use client";

import { useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import { CodeBlock } from "@/components/claude-usage/CodeBlock";
import { KNOWN_EVENTS, type Integration, type IntegrationProvider } from "@/lib/admin/integrations";

const EVENT_LABELS: Record<string, string> = {
  "account.registered": "A new account registers",
};

/**
 * Connect → secret reveal, the same two-phase shape `InviteTeammateModal`
 * already uses for its one-time ingest-config reveal: the form disappears
 * once the call succeeds, replaced by a "copy this now" screen, because the
 * signing secret in the response is the only time this admin will ever see
 * it (ADR-037 — never returned by any later read).
 */
export function ConnectIntegrationModal({
  onClose,
  onConnect,
}: {
  onClose: () => void;
  /** Throws on failure (a bad URL, an unknown event, a 503 when encryption isn't configured) — the form shows it and stays open. */
  onConnect: (provider: IntegrationProvider, name: string, targetUrl: string, events: string[]) => Promise<{ integration: Integration; signingSecret: string }>;
}) {
  const [provider, setProvider] = useState<IntegrationProvider>("webhook");
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [events, setEvents] = useState<string[]>([...KNOWN_EVENTS]);
  const [connected, setConnected] = useState<{ integration: Integration; signingSecret: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (connected) {
    return (
      <Modal title="Integration connected" onClose={onClose}>
        <p className="text-sm text-muted">
          <span className="font-semibold text-dash-ink">{connected.integration.name}</span> is connected. This
          signing secret is shown once — copy it now if the receiving side verifies signed payloads. Losing it just
          means re-running &quot;Rotate secret&quot; later; it does not disconnect anything.
        </p>
        <div className="mt-3">
          <CodeBlock label="signing secret" code={connected.signingSecret} />
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

  function toggleEvent(event: string) {
    setEvents((current) => (current.includes(event) ? current.filter((e) => e !== event) : [...current, event]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedUrl = targetUrl.trim();
    if (!trimmedName || !trimmedUrl || events.length === 0) return;

    setError(null);
    setBusy(true);
    try {
      setConnected(await onConnect(provider, trimmedName, trimmedUrl, events));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect that integration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Connect integration" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="block text-xs font-semibold text-muted" htmlFor="integration-provider">
          Provider
        </label>
        <select
          id="integration-provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as IntegrationProvider)}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        >
          <option value="webhook">Generic webhook</option>
          <option value="slack">Slack incoming webhook</option>
        </select>

        <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="integration-name">
          Name
        </label>
        <input
          id="integration-name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="#eng-docs Slack channel"
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm text-dash-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple"
        />

        <label className="mt-4 block text-xs font-semibold text-muted" htmlFor="integration-target-url">
          Target URL
        </label>
        <input
          id="integration-target-url"
          type="url"
          required
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          placeholder="https://hooks.slack.com/services/…"
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
            {busy ? "Connecting…" : "Connect"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
