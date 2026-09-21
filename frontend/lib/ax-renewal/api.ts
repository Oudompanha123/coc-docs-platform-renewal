import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";
import type { AxRenewalAttachStats } from "./attachStats";

/**
 * The AX Renewal API — `/api/v1/ax-renewal` (ADR-037).
 *
 * Unlike the other admin clients in this app, this surface is NOT
 * exclusively admin: a plain `user` who also holds the `developer` role
 * (ADR-039) can reach the read side and confirm/start-implementation,
 * enforced by the backend's filter chain, not by anything in this file. `credentials:
 * "include"` on every request — the session is an httpOnly cookie on a
 * different origin, so without it the browser sends nothing and the backend
 * sees an anonymous caller.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type PlanSection = "stack_move" | "architecture" | "pages" | "database";

export interface AxRenewalProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  manifestFilename: string | null;
  manifestAttachedAt: string | null;
  attachStats: AxRenewalAttachStats | null;
  createdAt: string;
  updatedAt: string;
}

export interface AxRenewalAnalysis {
  stackDetected: Record<string, string>;
  findings: { severity: string; what: string; where: string }[];
  pagesDetected: unknown[];
  modelConnected: boolean;
  analyzedAt: string;
}

export interface AxRenewalStackLayer {
  layerKey: string;
  oldTarget: string | null;
  newTarget: string | null;
  position: number;
}

export interface AxRenewalArchitecture {
  summary: string | null;
  diagram: unknown;
  updatedAt: string;
}

export interface AxRenewalPageMapping {
  oldPath: string | null;
  newPath: string | null;
  notes: string | null;
  position: number;
}

export interface AxRenewalDbChange {
  changeType: "add_column" | "add_index";
  tableName: string;
  detail: unknown;
  rationale: string | null;
  position: number;
}

export interface AxRenewalDbConnection {
  engine: string | null;
  host: string | null;
  port: number | null;
  databaseName: string | null;
  schemaName: string | null;
  connectedAt: string | null;
}

export interface AxRenewalDestination {
  kind: "git_repo" | "filesystem_path" | "other";
  target: string;
  branch: string | null;
  notes: string | null;
}

export interface AxRenewalConfirmation {
  section: PlanSection;
  confirmedAt: string;
  confirmedBy: string;
  confirmedVia: "super_admin" | "developer_role";
}

export interface AxRenewalImplementationRun {
  id: string;
  status: "running" | "completed" | "failed";
  beforeReport: Record<string, unknown> | null;
  afterReport: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
}

export interface AxRenewalComment {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface AxRenewalProjectDetail {
  project: AxRenewalProject;
  analysis: AxRenewalAnalysis | null;
  stackLayers: AxRenewalStackLayer[];
  architecture: AxRenewalArchitecture | null;
  pageMappings: AxRenewalPageMapping[];
  dbChanges: AxRenewalDbChange[];
  dbConnection: AxRenewalDbConnection | null;
  destination: AxRenewalDestination | null;
  confirmations: Partial<Record<PlanSection, AxRenewalConfirmation>>;
  latestImplementationRun: AxRenewalImplementationRun | null;
  comments: AxRenewalComment[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/ax-renewal${path}`, {
      credentials: "include",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      ...init,
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("You don't have access to AX Renewal.");
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

export function listProjects(): Promise<AxRenewalProject[]> {
  return request<AxRenewalProject[]>("/projects");
}

export function createProject(name: string, description: string | null): Promise<AxRenewalProject> {
  return request<AxRenewalProject>("/projects", {
    method: "POST",
    body: JSON.stringify({ name, description }),
  });
}

export function fetchProjectDetail(projectId: string): Promise<AxRenewalProjectDetail> {
  return request<AxRenewalProjectDetail>(`/projects/${projectId}`);
}

/**
 * `filename`/`content` are null when the attached folder had no recognized
 * dependency manifest — a static site with no `package.json` is still a
 * legitimate project to attach, so this records the attach either way.
 * `stats` is the browser's own computed facts about the folder (see
 * `lib/ax-renewal/attachStats.ts`) — real, measured data, persisted as-is.
 */
export function attachManifest(
  projectId: string,
  filename: string | null,
  content: string | null,
  stats: AxRenewalAttachStats | null,
): Promise<AxRenewalProject> {
  return request<AxRenewalProject>(`/projects/${projectId}/manifest`, {
    method: "POST",
    body: JSON.stringify({ filename, content, stats }),
  });
}

export function runAnalysis(projectId: string): Promise<AxRenewalAnalysis> {
  return request<AxRenewalAnalysis>(`/projects/${projectId}/analysis/run`, { method: "POST" });
}

export function updateStackMove(
  projectId: string,
  layers: { layerKey: string; oldTarget: string | null; newTarget: string | null }[],
): Promise<AxRenewalStackLayer[]> {
  return request<AxRenewalStackLayer[]>(`/projects/${projectId}/plan/stack-move`, {
    method: "PUT",
    body: JSON.stringify({ layers }),
  });
}

export function updateArchitecture(
  projectId: string,
  summary: string | null,
  diagram: unknown,
): Promise<AxRenewalArchitecture> {
  return request<AxRenewalArchitecture>(`/projects/${projectId}/plan/architecture`, {
    method: "PUT",
    body: JSON.stringify({ summary, diagram }),
  });
}

export function updatePages(
  projectId: string,
  pages: { oldPath: string | null; newPath: string | null; notes: string | null }[],
): Promise<AxRenewalPageMapping[]> {
  return request<AxRenewalPageMapping[]>(`/projects/${projectId}/plan/pages`, {
    method: "PUT",
    body: JSON.stringify({ pages }),
  });
}

export function updateDatabasePlan(
  projectId: string,
  changes: { changeType: string; tableName: string; detail: unknown; rationale: string | null }[],
): Promise<AxRenewalDbChange[]> {
  return request<AxRenewalDbChange[]>(`/projects/${projectId}/plan/database`, {
    method: "PUT",
    body: JSON.stringify({ changes }),
  });
}

export function connectDatabase(
  projectId: string,
  input: { engine: string | null; host: string | null; port: number | null; databaseName: string | null; schemaName: string | null },
): Promise<AxRenewalDbConnection> {
  return request<AxRenewalDbConnection>(`/projects/${projectId}/database/connect`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function setDestination(
  projectId: string,
  input: { kind: string; target: string; branch: string | null; notes: string | null },
): Promise<AxRenewalDestination> {
  return request<AxRenewalDestination>(`/projects/${projectId}/destination`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function confirmSection(projectId: string, section: PlanSection): Promise<AxRenewalConfirmation> {
  return request<AxRenewalConfirmation>(`/projects/${projectId}/plan/${section}/confirm`, { method: "POST" });
}

export function reopenSection(projectId: string, section: PlanSection): Promise<void> {
  return request<void>(`/projects/${projectId}/plan/${section}/reopen`, { method: "POST" });
}

export function startImplementation(projectId: string): Promise<AxRenewalImplementationRun> {
  return request<AxRenewalImplementationRun>(`/projects/${projectId}/implementation/start`, { method: "POST" });
}

export function addComment(projectId: string, body: string): Promise<AxRenewalComment> {
  return request<AxRenewalComment>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export interface AxRenewalAuditEntry {
  actorEmail: string;
  action: string;
  targetType: string;
  detail: Record<string, unknown>;
  occurredAt: string;
}

/**
 * This project's own audit trail — `super_admin` only, unlike every other
 * call in this file. It lives under `/api/v1/admin/audit/**`, not
 * `/api/v1/ax-renewal/**`: every row carries another account's email
 * (NFR-SEC-PII), the same reason `/api/v1/admin/accounts/**` sits at that
 * floor, so it must not inherit this feature's lower developer-capability
 * floor. A non-super-admin caller gets `NotPermittedError`, same as any
 * other refused admin call.
 */
export async function fetchAuditTrail(projectId: string, limit = 50): Promise<AxRenewalAuditEntry[]> {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/api/v1/admin/audit/ax-renewal/${projectId}?limit=${limit}`, {
      credentials: "include",
    });
  } catch {
    throw new AdminApiError("Couldn't reach the server. Check your connection and try again.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new NotPermittedError("Only a super admin can view the audit trail.");
  }
  if (!response.ok) {
    throw new AdminApiError("Couldn't load the audit trail.");
  }
  return (await response.json()) as AxRenewalAuditEntry[];
}
