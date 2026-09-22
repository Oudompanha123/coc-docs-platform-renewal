import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";

/**
 * The Integrations API — `/api/v1/admin/integrations` (ADR-037).
 *
 * Unlike `claudeUsage.ts`, the two floors here are not the same: `GET`s need
 * `admin` or `super_admin`, but every write (connect/update/test/rotate/
 * disconnect) needs `super_admin` — it stores, rotates or discards a signing
 * secret, or makes a live outbound call to an admin-supplied URL. The
 * backend enforces this in `SecurityConfig`; this module just reflects it
 * back as a clear message rather than a generic 403.
 *
 * `credentials: "include"` on every request, same reason `claudeUsage.ts`
 * documents: the session is an httpOnly cookie on a different origin.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type IntegrationProvider = "webhook" | "slack";
export type IntegrationStatus = "connected" | "disabled" | "error";

/** The one event type a connected integration can subscribe to today (ADR-037's `IntegrationEvents`). */
export const KNOWN_EVENTS = ["account.registered"] as const;
export type IntegrationEventType = (typeof KNOWN_EVENTS)[number];

export interface Integration {
  id: string;
  provider: IntegrationProvider;
  name: string;
  targetUrl: string;
  events: string[];
  status: IntegrationStatus;
  lastTestedAt: string | null;
  lastTestStatus: string | null;
  createdAt: string;
}

export interface IntegrationDelivery {
  id: number;
  eventType: string;
  httpStatus: number | null;
  success: boolean;
  error: string | null;
  latencyMs: number | null;
  attemptedAt: string;
}

/** What `connect` and `rotateSecret` return — the only two calls that ever see the plaintext secret. */
export interface IntegrationWithSecret {
  integration: Integration;
  signingSecret: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/integrations${path}`, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }

  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only a super admin can manage integrations.");
  }

  if (!response.ok) {
    let detail: string | null = null;
    try {
      const problem = (await response.json()) as { detail?: string };
      detail = problem.detail ?? null;
    } catch {
      // Not a problem document. Fall through to the generic message.
    }
    throw new AdminApiError(detail ?? "That change could not be saved. Please try again.");
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function listIntegrations(): Promise<Integration[]> {
  return request<Integration[]>("");
}

export function listDeliveries(id: string): Promise<IntegrationDelivery[]> {
  return request<IntegrationDelivery[]>(`/${id}/deliveries`);
}

/** The signing secret in the response is shown to the caller exactly once — it is never retrievable again. */
export function connectIntegration(
  provider: IntegrationProvider,
  name: string,
  targetUrl: string,
  events: string[],
): Promise<IntegrationWithSecret> {
  return request<IntegrationWithSecret>("", {
    method: "POST",
    body: JSON.stringify({ provider, name, targetUrl, events }),
  });
}

export function updateIntegration(id: string, name: string, events: string[]): Promise<Integration> {
  return request<Integration>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name, events }),
  });
}

/** Fires a synchronous, signed test ping and returns its outcome immediately. */
export function testIntegration(id: string): Promise<{ result: IntegrationDelivery }> {
  return request<{ result: IntegrationDelivery }>(`/${id}/test`, { method: "POST" });
}

/** Issues a new signing secret, shown once. The old one stops working immediately. */
export function rotateSecret(id: string): Promise<IntegrationWithSecret> {
  return request<IntegrationWithSecret>(`/${id}/rotate-secret`, { method: "POST" });
}

/** Disconnects — the secret is discarded, but delivery history and the row itself survive. */
export function disconnectIntegration(id: string): Promise<Integration> {
  return request<Integration>(`/${id}`, { method: "DELETE" });
}

/** Re-activates a disconnected row in place with a freshly issued secret, shown once. */
export function reconnectIntegration(id: string): Promise<IntegrationWithSecret> {
  return request<IntegrationWithSecret>(`/${id}/reconnect`, { method: "POST" });
}
