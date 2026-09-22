"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PlugIcon } from "@/components/layout/icons";
import { Modal } from "@/components/users-roles/Modal";
import { CodeBlock } from "@/components/claude-usage/CodeBlock";
import { ConnectIntegrationModal } from "@/components/integrations/ConnectIntegrationModal";
import { DeliveryHistoryModal } from "@/components/integrations/DeliveryHistoryModal";
import { EditIntegrationModal } from "@/components/integrations/EditIntegrationModal";
import { IntegrationsTable } from "@/components/integrations/IntegrationsTable";
import {
  connectIntegration,
  disconnectIntegration,
  listDeliveries,
  listIntegrations,
  rotateSecret,
  testIntegration,
  updateIntegration,
  type Integration,
  type IntegrationProvider,
} from "@/lib/admin/integrations";

/**
 * `/integrations` — connect, test, rotate and disconnect outgoing webhook
 * integrations (ADR-037). Every write here needs `super_admin`; `admin` can
 * see this page (it is nav-gated the same way `/users-roles` is) but every
 * mutation the backend refuses with a message this page shows as-is, the
 * same "hide the link, let the server decide" split every admin screen in
 * this codebase already follows.
 */
export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<{ name: string; secret: string } | null>(null);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [historyFor, setHistoryFor] = useState<Integration | null>(null);

  const reload = useCallback(async () => {
    try {
      setIntegrations(await listIntegrations());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load integrations.");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleConnect(provider: IntegrationProvider, name: string, targetUrl: string, events: string[]) {
    const result = await connectIntegration(provider, name, targetUrl, events);
    await reload();
    return result;
  }

  async function handleTest(integration: Integration) {
    try {
      const { result } = await testIntegration(integration.id);
      await reload();
      if (!result.success) {
        setError(`Test to "${integration.name}" failed: ${result.error ?? `HTTP ${result.httpStatus}`}`);
      } else {
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't test that integration.");
    }
  }

  async function handleRotate(integration: Integration) {
    if (!window.confirm(`Rotate the signing secret for "${integration.name}"? The old secret stops working immediately.`)) {
      return;
    }
    try {
      const rotated = await rotateSecret(integration.id);
      setRevealedSecret({ name: integration.name, secret: rotated.signingSecret });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't rotate that secret.");
    }
  }

  async function handleUpdate(id: string, name: string, events: string[]) {
    const updated = await updateIntegration(id, name, events);
    await reload();
    return updated;
  }

  function handleDisconnect(integration: Integration) {
    if (!window.confirm(`Disconnect "${integration.name}"? Its signing secret is discarded immediately — reconnecting issues a new one.`)) {
      return;
    }
    disconnectIntegration(integration.id)
      .then(() => reload())
      .catch((err) => setError(err instanceof Error ? err.message : "Couldn't disconnect that integration."));
  }

  return (
    <AppShell
      pageTitle="Integrations"
      pageSubtitle="Connect an outgoing webhook to another tool"
      titleIcon={<PlugIcon className="hidden h-8 w-8 shrink-0 text-brand-purple sm:block" />}
    >
      <div className="flex items-center justify-between gap-3">
        {error && <p className="text-xs font-semibold text-[#c94040]">{error}</p>}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setShowConnect(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90"
        >
          <PlugIcon className="h-3.5 w-3.5" />
          Connect integration
        </button>
      </div>

      {!integrations && !error && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {integrations && integrations.length === 0 && (
        <p className="mt-6 rounded-2xl border border-border bg-white p-6 text-center text-sm text-muted shadow-sm">
          No integrations connected yet.
        </p>
      )}

      {integrations && integrations.length > 0 && (
        <div className="mt-6">
          <IntegrationsTable
            integrations={integrations}
            onTest={handleTest}
            onRotate={handleRotate}
            onDisconnect={handleDisconnect}
            onEdit={setEditing}
            onViewHistory={setHistoryFor}
          />
        </div>
      )}

      {showConnect && <ConnectIntegrationModal onClose={() => setShowConnect(false)} onConnect={handleConnect} />}

      {editing && (
        <EditIntegrationModal
          integration={editing}
          onClose={() => setEditing(null)}
          onSave={(name, events) => handleUpdate(editing.id, name, events)}
        />
      )}

      {historyFor && (
        <DeliveryHistoryModal
          integration={historyFor}
          onClose={() => setHistoryFor(null)}
          loadDeliveries={listDeliveries}
        />
      )}

      {revealedSecret && (
        <Modal title="Secret rotated" onClose={() => setRevealedSecret(null)}>
          <p className="text-sm text-muted">
            <span className="font-semibold text-dash-ink">{revealedSecret.name}</span>&apos;s new signing secret is
            shown once — copy it now if the receiving side verifies signed payloads.
          </p>
          <div className="mt-3">
            <CodeBlock label="signing secret" code={revealedSecret.secret} />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => setRevealedSecret(null)}
              className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/90"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
