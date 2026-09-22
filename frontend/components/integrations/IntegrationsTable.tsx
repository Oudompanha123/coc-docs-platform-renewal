"use client";

import { useState } from "react";
import type { Integration } from "@/lib/admin/integrations";

const STATUS_STYLES: Record<Integration["status"], string> = {
  connected: "bg-[#e1f5ec] text-[#1f9d6b]",
  disabled: "bg-page text-muted",
  error: "bg-danger/10 text-danger",
};

const STATUS_LABELS: Record<Integration["status"], string> = {
  connected: "Connected",
  disabled: "Disconnected",
  error: "Error",
};

function targetHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * Never shows the full {@code targetUrl} or any secret — only the host,
 * matching how this table's own data (`ApiDtos.IntegrationResponse`) has no
 * field for a secret at all. An admin who needs the exact URL again already
 * has it wherever they configured the receiving side.
 */
export function IntegrationsTable({
  integrations,
  onTest,
  onRotate,
  onDisconnect,
  onReconnect,
  onEdit,
  onViewHistory,
}: {
  integrations: Integration[];
  onTest: (integration: Integration) => Promise<void>;
  onRotate: (integration: Integration) => Promise<void>;
  onDisconnect: (integration: Integration) => void;
  onReconnect: (integration: Integration) => Promise<void>;
  onEdit: (integration: Integration) => void;
  onViewHistory: (integration: Integration) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function runTest(integration: Integration) {
    setBusyId(integration.id);
    try {
      await onTest(integration);
    } finally {
      setBusyId(null);
    }
  }

  async function runRotate(integration: Integration) {
    setBusyId(integration.id);
    try {
      await onRotate(integration);
    } finally {
      setBusyId(null);
    }
  }

  async function runReconnect(integration: Integration) {
    setBusyId(integration.id);
    try {
      await onReconnect(integration);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Events</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Last test</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {integrations.map((integration) => {
            const busy = busyId === integration.id;
            const disconnected = integration.status !== "connected";
            return (
              <tr key={integration.id} className="transition-colors hover:bg-[#f8fafc]">
                <td className="px-4 py-4">
                  <p className="font-semibold text-dash-ink">{integration.name}</p>
                  <p className="text-xs text-muted capitalize">{integration.provider}</p>
                </td>
                <td className="px-4 py-4 text-muted">{targetHost(integration.targetUrl)}</td>
                <td className="px-4 py-4 text-muted">{integration.events.join(", ")}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[integration.status]}`}>
                    {STATUS_LABELS[integration.status]}
                  </span>
                </td>
                <td className="px-4 py-4 text-muted">
                  {integration.lastTestStatus
                    ? `${integration.lastTestStatus} · ${new Date(integration.lastTestedAt ?? "").toLocaleString()}`
                    : "Never"}
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onViewHistory(integration)}
                    className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
                  >
                    History
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(integration)}
                    className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => runTest(integration)}
                    disabled={busy || disconnected}
                    className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Test
                  </button>
                  <button
                    type="button"
                    onClick={() => runRotate(integration)}
                    disabled={busy || disconnected}
                    className="mr-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:border-brand-purple hover:text-brand-purple disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Rotate secret
                  </button>
                  {disconnected ? (
                    <button
                      type="button"
                      onClick={() => runReconnect(integration)}
                      disabled={busy}
                      className="inline-flex items-center rounded-full border border-brand-purple/30 px-3 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reconnect
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDisconnect(integration)}
                      disabled={busy}
                      className="inline-flex items-center rounded-full border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
