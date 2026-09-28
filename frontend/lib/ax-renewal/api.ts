import { AdminApiError, NotPermittedError } from "@/lib/admin/accounts";
import type { AxRenewalAttachStats, FileLayoutEntry } from "./attachStats";

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
  findings: AxRenewalFinding[];
  pagesDetected: AxRenewalPageDetected[];
  /**
   * lines/routes/templates/dependencies/testCoveragePercent — each `null`
   * (or absent) unless a connected local model could support it with real
   * evidence (ADR-043). `{}` on the keyword-stub path. File count and
   * language shares deliberately live on `project.attachStats` instead,
   * since the browser already measures those for real, model or not.
   */
  indexed: AxRenewalIndexedStats;
  /**
   * What the project visibly runs on today, not a migration target (that
   * stays the Plan section's own data). `[]` on the keyword-stub path.
   */
  runningOnToday: AxRenewalRunningOnTodayTag[];
  /**
   * Directories a connected local model actually saw under `source-path` —
   * `[]` on the keyword-stub path or a manifest-only run. Prefer
   * `project.attachStats.fileLayout` when that's present (a full browser
   * scan, not whatever subset the model looked at); this is the fallback
   * for a project attached before that scan existed.
   */
  fileLayout: FileLayoutEntry[];
  /**
   * Which modules import which, traced by a connected local model actually
   * reading source — `{}` (all fields absent) on the keyword-stub path or a
   * manifest-only run. Backs the Architecture panel's "Module coupling"
   * diagram.
   */
  moduleCoupling: AxRenewalModuleCoupling;
  modelConnected: boolean;
  analyzedAt: string;
}

export interface AxRenewalIndexedStats {
  lines?: number | null;
  routes?: number | null;
  templates?: number | null;
  dependencies?: number | null;
  testCoveragePercent?: number | null;
}

export interface AxRenewalRunningOnTodayTag {
  label: string;
  note?: string | null;
}

export interface AxRenewalPageDetected {
  path: string;
  purpose: string;
}

export type AxRenewalFixedBy = "stack_move" | "database" | "architecture" | "decision";

export interface AxRenewalFinding {
  severity: string;
  what: string;
  where: string;
  /**
   * Which part of the renewal already addresses this, when a connected
   * model was confident enough to say so — absent/null far more often than
   * not, since most findings don't cleanly fit one bucket. Never a
   * recommendation for what to change to, just where in the existing plan
   * this gets handled.
   */
  fixedBy?: AxRenewalFixedBy | null;
}

export interface AxRenewalModuleCoupling {
  /** A representative subset of paths, not every file — the indices below refer into this list. */
  modules?: string[];
  /** `[fromIndex, toIndex]` pairs meaning `modules[fromIndex]` imports `modules[toIndex]`. */
  edges?: [number, number][];
  /** Indices of modules at least three other reported modules import directly. */
  hubs?: number[];
  /** `[a, b]` index pairs the model saw import each other directly. */
  cycles?: [number, number][];
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

export type AxRenewalImplementationStatus =
  | "running"
  | "completed"
  | "failed"
  | "generating"
  | "awaiting_review"
  | "applying"
  | "applied"
  | "rejected"
  | "cancelled";

export interface AxRenewalImplementationRun {
  id: string;
  status: AxRenewalImplementationStatus;
  beforeReport: Record<string, unknown> | null;
  afterReport: Record<string, unknown> | null;
  startedAt: string;
  completedAt: string | null;
  /** Why a {@code failed} run failed, in its own words — null on every other status. */
  failureReason: string | null;
}

export type AxRenewalChangeKind = "create" | "modify" | "delete";

/** One file a Generate run actually found different — real before/after content, never a computed patch format (ADR-044). */
export interface AxRenewalGeneratedChange {
  path: string;
  changeKind: AxRenewalChangeKind;
  beforeContent: string | null;
  afterContent: string | null;
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
  } catch (err) {
    // An abort is the caller stopping on purpose, not the server being
    // unreachable. Folded into the message below it would report a network
    // failure for a button the person just pressed themselves.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
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
 * Deletes a project outright (ADR-050) — every row that hangs off it
 * (analysis, plan, confirmations, comments, implementation runs) cascades
 * away with it on the backend. Refused with a 409 while an implementation
 * run is still active or a local dev server is still running for this
 * project; `request` surfaces that as its `detail` message, not a generic
 * failure.
 */
export function deleteProject(projectId: string): Promise<void> {
  return request<void>(`/projects/${projectId}`, { method: "DELETE" });
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

/**
 * Runs the analysis. Takes a `signal` so Stop can genuinely abort the
 * request rather than only hiding the progress panel -- with a local model
 * reading real source this call can be in flight for minutes, and a Stop
 * button that leaves it running would be a lie about what it did.
 */
export function runAnalysis(
  projectId: string,
  signal?: AbortSignal,
  useModel = true,
): Promise<AxRenewalAnalysis> {
  return request<AxRenewalAnalysis>(`/projects/${projectId}/analysis/run?useModel=${useModel}`, {
    method: "POST",
    signal,
  });
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

/** The files a Generate run actually found different, once it reaches `awaiting_review` (ADR-044). */
export function fetchGeneratedChanges(projectId: string, runId: string): Promise<AxRenewalGeneratedChange[]> {
  return request<AxRenewalGeneratedChange[]>(`/projects/${projectId}/implementation/${runId}/changes`);
}

/** Copies a Generate run's approved changes into the real destination — the one call in this whole feature that writes outside this application's own database. */
export function approveImplementation(projectId: string, runId: string): Promise<AxRenewalImplementationRun> {
  return request<AxRenewalImplementationRun>(`/projects/${projectId}/implementation/${runId}/approve`, {
    method: "POST",
  });
}

/** Discards a Generate run's staged changes — the destination is never touched. */
export function rejectImplementation(projectId: string, runId: string): Promise<AxRenewalImplementationRun> {
  return request<AxRenewalImplementationRun>(`/projects/${projectId}/implementation/${runId}/reject`, {
    method: "POST",
  });
}

/**
 * Stops a run that is still generating — kills the real process on the
 * backend's own machine. The run's status flips to `cancelled` a moment
 * later, once the killed process actually unblocks; the existing poll for
 * `generating` picks that up, this call does not wait for it.
 */
export function cancelImplementation(projectId: string, runId: string): Promise<AxRenewalImplementationRun> {
  return request<AxRenewalImplementationRun>(`/projects/${projectId}/implementation/${runId}/cancel`, {
    method: "POST",
  });
}

export function addComment(projectId: string, body: string): Promise<AxRenewalComment> {
  return request<AxRenewalComment>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

/**
 * Hides one comment from the project thread (ADR-045).
 *
 * Soft on the server: the row stays, so nothing here can rewrite what was
 * said — it stops being shown. Whether this caller may is decided backend-side
 * from the comment's author (their own, or `super_admin`); the button this
 * sits behind is a convenience, never the check.
 */
export function deleteComment(projectId: string, commentId: string): Promise<void> {
  return request<void>(`/projects/${projectId}/comments/${commentId}`, { method: "DELETE" });
}

/** One thing said in the assistant's chat — `"you"` is the person at the keyboard. */
export interface AxRenewalChatTurn {
  role: "you" | "assistant";
  text: string;
}

export interface AxRenewalChatReply {
  reply: string;
  /** Whether the model saw the source, or only what the backend stores. */
  readSource: boolean;
}

/**
 * Asks the local Claude Code installation one question about this project
 * (ADR-046).
 *
 * <p>Nothing here is persisted — not by the backend, and not by this module.
 * `history` is the conversation this tab is holding in React state, replayed
 * so the model has context it cannot get from anywhere else. That also means
 * a refresh genuinely ends the conversation, which is the behaviour the panel
 * advertises.
 *
 * Takes a signal for the same reason `runAnalysis` does: a local model
 * reading real source can take a while, and a Stop button that left the
 * request running would be lying.
 */
export function chatWithAssistant(
  projectId: string,
  message: string,
  history: AxRenewalChatTurn[],
  signal?: AbortSignal,
): Promise<AxRenewalChatReply> {
  return request<AxRenewalChatReply>(`/projects/${projectId}/assistant/chat`, {
    method: "POST",
    body: JSON.stringify({ message, history }),
    signal,
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

/**
 * Whether Run analysis reaches a real model on this deployment (ADR-043).
 *
 * Resolves to "not connected" on any failure rather than throwing. The
 * banner this feeds is an honest disclosure, and the honest answer when we
 * cannot tell is the cautious one — claiming a model is connected because a
 * status call failed would be the one wrong way to get this wrong.
 */
export async function fetchEngineStatus(): Promise<AxRenewalEngineStatus> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/ax-renewal/engine`, { credentials: "include" });
    if (!response.ok) return { connected: false, readsSource: false };
    return (await response.json()) as AxRenewalEngineStatus;
  } catch {
    return { connected: false, readsSource: false };
  }
}

export interface AxRenewalEngineStatus {
  connected: boolean;
  /** Whether the model sees the source, or only the stored dependency manifest. */
  readsSource: boolean;
}

export type AxRenewalRunLocallyState = "starting" | "running" | "stopped" | "failed";

/**
 * Live status of the Run Locally dev server (ADR-048) — in-memory on the
 * backend, never persisted, so this is the whole state there is to know.
 * `log` is the process's own real combined stdout/stderr, a rolling window,
 * never a summary. `url` is null until the process's own output announces
 * it is ready.
 */
export interface AxRenewalRunLocallyStatus {
  status: AxRenewalRunLocallyState;
  log: string[];
  url: string | null;
  startedAt: string | null;
}

export function fetchRunLocallyStatus(projectId: string): Promise<AxRenewalRunLocallyStatus> {
  return request<AxRenewalRunLocallyStatus>(`/projects/${projectId}/run-locally/status`);
}

export function startRunLocally(projectId: string): Promise<AxRenewalRunLocallyStatus> {
  return request<AxRenewalRunLocallyStatus>(`/projects/${projectId}/run-locally/start`, { method: "POST" });
}

export function stopRunLocally(projectId: string): Promise<AxRenewalRunLocallyStatus> {
  return request<AxRenewalRunLocallyStatus>(`/projects/${projectId}/run-locally/stop`, { method: "POST" });
}
