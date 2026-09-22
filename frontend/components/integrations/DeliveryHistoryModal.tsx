"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/users-roles/Modal";
import type { Integration, IntegrationDelivery } from "@/lib/admin/integrations";

const EVENT_LABELS: Record<string, string> = {
  "account.registered": "A new account registers",
  "integration.test": "Test ping",
};

/**
 * The last delivery attempts for one integration — real events and the
 * synthetic `integration.test` pings side by side, since both write to the
 * same `integration_delivery` row (ADR-037 §5) and a reader comparing "did
 * the test I just ran actually reach them" against "is this still receiving
 * real traffic" needs both in one list, not two separate ones.
 *
 * Loads on mount rather than on a "Load" click — this is a read with no side
 * effect, unlike Test/Rotate/Disconnect, so there is nothing to confirm first.
 */
export function DeliveryHistoryModal({
  integration,
  onClose,
  loadDeliveries,
}: {
  integration: Integration;
  onClose: () => void;
  loadDeliveries: (id: string) => Promise<IntegrationDelivery[]>;
}) {
  const [deliveries, setDeliveries] = useState<IntegrationDelivery[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDeliveries(null);
    setError(null);
    loadDeliveries(integration.id)
      .then((result) => {
        if (!cancelled) setDeliveries(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Couldn't load delivery history.");
      });
    return () => {
      cancelled = true;
    };
  }, [integration.id, loadDeliveries]);

  return (
    <Modal
      title={`Delivery history — ${integration.name}`}
      onClose={onClose}
      className="w-full max-w-2xl overflow-y-auto rounded-[10px] border border-border bg-white p-5 shadow-xl"
    >
      {error && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      {!deliveries && !error && <p className="text-sm text-muted">Loading…</p>}

      {deliveries && deliveries.length === 0 && (
        <p className="text-sm text-muted">No deliveries yet — nothing has been sent to this integration.</p>
      )}

      {deliveries && deliveries.length > 0 && (
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Result</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-3 py-2 text-dash-ink">{EVENT_LABELS[delivery.eventType] ?? delivery.eventType}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        delivery.success ? "bg-[#e1f5ec] text-[#1f9d6b]" : "bg-danger/10 text-danger"
                      }`}
                    >
                      {delivery.success ? `OK · ${delivery.httpStatus ?? "—"}` : (delivery.error ?? `HTTP ${delivery.httpStatus ?? "—"}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">{delivery.latencyMs !== null ? `${delivery.latencyMs} ms` : "—"}</td>
                  <td className="px-3 py-2 text-muted">{new Date(delivery.attemptedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-brand-purple px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-purple/90"
        >
          Close
        </button>
      </div>
    </Modal>
  );
}
