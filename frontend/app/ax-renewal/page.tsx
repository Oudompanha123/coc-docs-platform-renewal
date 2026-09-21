"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaperclipIcon, PlugIcon, PlusIcon, WarningIcon } from "@/components/layout/icons";
import { ArchitectureSection } from "@/components/ax-renewal/ArchitectureSection";
import { AxRenewalLanding } from "@/components/ax-renewal/AxRenewalLanding";
import { DatabaseSection } from "@/components/ax-renewal/DatabaseSection";
import { PagesSection } from "@/components/ax-renewal/PagesSection";
import { StackMoveSection } from "@/components/ax-renewal/StackMoveSection";
import { useSession } from "@/lib/auth/SessionProvider";
import type { AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { useAxRenewalProject } from "@/lib/ax-renewal/useAxRenewalProject";
import {
  addComment,
  attachManifest,
  confirmSection,
  connectDatabase,
  createProject,
  reopenSection,
  runAnalysis,
  setDestination,
  startImplementation,
  updateArchitecture,
  updateDatabasePlan,
  updatePages,
  updateStackMove,
  type AxRenewalProject,
  type AxRenewalProjectDetail,
  type PlanSection,
} from "@/lib/ax-renewal/api";

/** Recognized manifest filenames, matching AxRenewalService's own RUNTIME_HINTS server-side. */
const MANIFEST_FILENAMES = [
  "package.json",
  "composer.json",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "gemfile",
  "go.mod",
  "cargo.toml",
];

/** Picks the best manifest candidate out of an attached folder's files, or null if none is recognized. */
function findManifest(files: FileList): File | null {
  for (const file of Array.from(files)) {
    const path = file.webkitRelativePath || file.name;
    const basename = path.split("/").pop()?.toLowerCase() ?? "";
    if (MANIFEST_FILENAMES.includes(basename)) {
      return file;
    }
  }
  return null;
}

export default function AxRenewalPage() {
  const { user } = useSession();
  const canEdit = user?.role === "admin" || user?.role === "super_admin";
  // Exact membership, not rank: an Admin does not pass this just by
  // out-ranking Developer (AppRole.exactAuthority(), ADR-039) — matches
  // SecurityConfig's confirm/reopen/start-implementation gate exactly.
  const canConfirm = user?.role === "super_admin" || (user?.roles?.includes("developer") ?? false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, projectId, detail, error: loadError, refresh, setProjects } = useAxRenewalProject();
  const active = (searchParams.get("section") as AxRenewalExplorerKey | null) ?? "attach";

  function goTo(nextProjectId: string, section: AxRenewalExplorerKey = "attach") {
    router.push(`/ax-renewal?project=${nextProjectId}&section=${section}`);
  }

  const picker = (
    <ProjectPicker
      projects={projects}
      projectId={projectId}
      canEdit={canEdit}
      onSelect={(id) => goTo(id)}
      onCreated={(created) => {
        setProjects((prev) => (prev ? [created, ...prev] : [created]));
        goTo(created.id);
      }}
    />
  );

  return (
    <div className="space-y-5">
      {loadError && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {loadError}
        </p>
      )}

      {!detail && <AxRenewalLanding>{picker}</AxRenewalLanding>}

      {detail && (
        <>
          <p className="text-sm text-muted">
            Plan a legacy-code migration: attach, analyze, agree a plan, and record the sign-off.
          </p>

          {picker}

          {/* The Understand/Plan/Build navigation lives in the left sidebar
              (see AxRenewalSidebar.tsx) — this page only renders whichever
              leaf is selected there. */}
          {active === "attach" && <AttachPanel detail={detail} canEdit={canEdit} onChanged={refresh} />}
          {active === "codebase" && <CodebasePanel detail={detail} />}
          {active === "understand-architecture" && <UnderstandArchitecturePanel detail={detail} />}
          {active === "findings" && <FindingsPanel detail={detail} />}
          {active === "old-new" && <OldNewPanel detail={detail} />}

          {active === "stack-move" && (
            <StackMoveSection
              layers={detail.stackLayers}
              confirmation={detail.confirmations.stack_move}
              canEdit={canEdit}
              canConfirm={canConfirm}
              onSave={async (rows) => {
                await updateStackMove(detail.project.id, rows);
                await refresh();
              }}
              onConfirm={() => void confirmSection(detail.project.id, "stack_move").then(refresh)}
              onReopen={() => void reopenSection(detail.project.id, "stack_move").then(refresh)}
            />
          )}
          {active === "plan-architecture" && (
            <ArchitectureSection
              architecture={detail.architecture}
              confirmation={detail.confirmations.architecture}
              canEdit={canEdit}
              canConfirm={canConfirm}
              onSave={async (summary) => {
                await updateArchitecture(detail.project.id, summary || null, null);
                await refresh();
              }}
              onConfirm={() => void confirmSection(detail.project.id, "architecture").then(refresh)}
              onReopen={() => void reopenSection(detail.project.id, "architecture").then(refresh)}
            />
          )}
          {active === "pages" && (
            <PagesSection
              pages={detail.pageMappings}
              confirmation={detail.confirmations.pages}
              canEdit={canEdit}
              canConfirm={canConfirm}
              onSave={async (rows) => {
                await updatePages(detail.project.id, rows);
                await refresh();
              }}
              onConfirm={() => void confirmSection(detail.project.id, "pages").then(refresh)}
              onReopen={() => void reopenSection(detail.project.id, "pages").then(refresh)}
            />
          )}
          {active === "database" && (
            <DatabaseSection
              connection={detail.dbConnection}
              changes={detail.dbChanges}
              confirmation={detail.confirmations.database}
              canEdit={canEdit}
              canConfirm={canConfirm}
              onConnect={async (input) => {
                await connectDatabase(detail.project.id, input);
                await refresh();
              }}
              onSaveChanges={async (rows) => {
                await updateDatabasePlan(detail.project.id, rows);
                await refresh();
              }}
              onConfirm={() => void confirmSection(detail.project.id, "database").then(refresh)}
              onReopen={() => void reopenSection(detail.project.id, "database").then(refresh)}
            />
          )}
          {active === "output" && <OutputPanel detail={detail} canEdit={canEdit} onChanged={refresh} />}

          {active === "implementation" && (
            <ImplementationPanel detail={detail} canConfirm={canConfirm} onChanged={refresh} />
          )}
          {active === "run-locally" && <RunLocallyPanel />}
        </>
      )}
    </div>
  );
}

function ProjectPicker({
  projects,
  projectId,
  canEdit,
  onSelect,
  onCreated,
}: {
  projects: AxRenewalProject[] | null;
  projectId: string | null;
  canEdit: boolean;
  onSelect: (id: string) => void;
  onCreated: (project: AxRenewalProject) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await createProject(name.trim(), null);
      onCreated(created);
      setName("");
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that project.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="ax-project" className="text-xs font-semibold text-muted">
          Project
        </label>
        <select
          id="ax-project"
          value={projectId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="min-w-[220px] rounded-xl border border-border bg-white px-3 py-1.5 text-sm font-medium text-dash-ink focus:outline-none"
        >
          {(projects ?? []).length === 0 && <option value="">No projects yet</option>}
          {(projects ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:text-brand-purple"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            New project
          </button>
        )}
      </div>

      {creating && (
        <form onSubmit={(e) => void handleCreate(e)} className="mt-3 flex flex-wrap items-center gap-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            required
            className="rounded-xl border border-border px-3 py-1.5 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            Cancel
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

function AttachPanel({
  detail,
  canEdit,
  onChanged,
}: {
  detail: AxRenewalProjectDetail;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const folderInputRef = useRef<HTMLInputElement>(null);
  // webkitdirectory/directory aren't part of React's typed input props (they
  // predate a standard), so they're set imperatively on the underlying DOM
  // node rather than spread as untyped JSX attributes.
  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [attaching, setAttaching] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleFolderSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setScannedCount(files.length);
    const manifest = findManifest(files);
    setPendingFile(manifest);
    setError(
      manifest
        ? null
        : `No recognized manifest (${MANIFEST_FILENAMES.join(", ")}) was found among the ${files.length} files scanned.`,
    );
  }

  async function handleAttach() {
    if (!pendingFile) return;
    setAttaching(true);
    setError(null);
    try {
      const content = await pendingFile.text();
      const path = pendingFile.webkitRelativePath || pendingFile.name;
      await attachManifest(detail.project.id, path, content);
      setPendingFile(null);
      setScannedCount(0);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't attach that manifest.");
    } finally {
      setAttaching(false);
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      await runAnalysis(detail.project.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't run analysis.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-dash-ink">Attach</h3>
        <p className="mt-1 text-xs text-muted">
          Choose the project&apos;s folder — nothing is uploaded except the one dependency manifest found inside it
          (e.g. <code>package.json</code>), which is what analysis reads.
        </p>

        {detail.project.manifestFilename ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-dash-ink">
            <PaperclipIcon className="h-4 w-4 text-brand-purple" />
            <span className="font-medium">{detail.project.manifestFilename}</span>
            <span className="text-xs text-muted">
              attached {detail.project.manifestAttachedAt ? new Date(detail.project.manifestAttachedAt).toLocaleString() : ""}
            </span>
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">Nothing attached yet.</p>
        )}

        {canEdit && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input ref={folderInputRef} type="file" multiple onChange={handleFolderSelect} className="text-sm" />
            {pendingFile && (
              <span className="text-xs text-muted">
                Found <span className="font-medium text-dash-ink">{pendingFile.webkitRelativePath || pendingFile.name}</span>{" "}
                among {scannedCount} files scanned.
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleAttach()}
              disabled={attaching || !pendingFile}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PaperclipIcon className="h-4 w-4" />
              {attaching ? "Attaching…" : "Attach"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-dash-ink">Run analysis</h3>
          {canEdit && (
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={analyzing}
              className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {analyzing ? "Running…" : "Run analysis"}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          Unlocks Codebase, Architecture and Findings in the Understand group, and every section of Plan.
        </p>
        {!detail.analysis && <p className="mt-3 text-sm text-muted">Not analyzed yet.</p>}
        {detail.analysis && (
          <p className="mt-3 text-sm text-dash-ink">
            Analyzed {new Date(detail.analysis.analyzedAt).toLocaleString()}. See Codebase and Findings for the
            result.
          </p>
        )}
      </div>

      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

/** The honest "no model connected" disclaimer, shared by every Understand panel that reads the analysis. */
function NoModelBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
      <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
      <p className="text-sm text-dash-ink">
        No AI model is connected on this deployment yet — this is a keyword-matched placeholder, not a real reading
        of the attached source.
      </p>
    </div>
  );
}

function CodebasePanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Codebase</h3>
      <p className="mt-1 text-xs text-muted">What was detected from the attached manifest.</p>

      <div className="mt-4 space-y-4">
        {analysis && !analysis.modelConnected && <NoModelBanner />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-page p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Manifest</p>
            <p className="mt-1 text-sm font-medium text-dash-ink">{detail.project.manifestFilename ?? "—"}</p>
          </div>
          <div className="rounded-xl bg-page p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Analyzed</p>
            <p className="mt-1 text-sm font-medium text-dash-ink">
              {analysis ? new Date(analysis.analyzedAt).toLocaleString() : "—"}
            </p>
          </div>
        </div>

        {analysis && Object.keys(analysis.stackDetected).length > 0 && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Detected</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(analysis.stackDetected).map(([key, value]) => (
                <span key={key} className="rounded-full bg-page px-3 py-1 text-xs font-medium text-dash-ink">
                  {key}: {value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function UnderstandArchitecturePanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
      <p className="mt-1 text-xs text-muted">How the current system is put together, from what analysis found.</p>

      <div className="mt-4 space-y-4">
        {analysis && !analysis.modelConnected && <NoModelBanner />}
        <p className="text-sm text-dash-ink">
          {analysis && Object.keys(analysis.stackDetected).length > 0
            ? `Detected runtime: ${Object.values(analysis.stackDetected).join(", ")}. A structural diagram of the ` +
              "current system is a later phase's feature, once a real model is connected — this phase reports " +
              "only what it can actually evidence."
            : "No stack could be detected from the attached manifest."}
        </p>
      </div>
    </div>
  );
}

function FindingsPanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Findings</h3>
      <p className="mt-1 text-xs text-muted">Worst first — what a renewal would need to address.</p>

      <div className="mt-4 space-y-4">
        {analysis && !analysis.modelConnected && <NoModelBanner />}
        {!analysis || analysis.findings.length === 0 ? (
          <p className="text-sm text-muted">No findings yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {analysis.findings.map((f, i) => (
              <li key={i} className="text-sm text-dash-ink">
                <span className="font-semibold uppercase text-muted">{f.severity}</span> — {f.what}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** A read-only synthesis of the Stack Move layers already entered — the bridging summary the prototype's own "Old → New" page showed. */
function OldNewPanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const layers = detail.stackLayers.filter((l) => l.oldTarget || l.newTarget);
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Old → New</h3>
      <p className="mt-1 text-xs text-muted">
        A summary of the move, built from what is entered under Plan → Stack move. Edit it there; this view is
        read-only.
      </p>

      {layers.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing recorded yet — fill in Stack move first.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[#f8fafc] text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="px-3 py-2 text-left">Layer</th>
                <th className="px-3 py-2 text-left text-[#9c4620]">Old</th>
                <th className="px-3 py-2 text-left text-brand-purple">New</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {layers.map((l) => (
                <tr key={l.layerKey}>
                  <td className="px-3 py-2 font-medium text-dash-ink">{l.layerKey}</td>
                  <td className="px-3 py-2 text-dash-ink">{l.oldTarget || "—"}</td>
                  <td className="px-3 py-2 text-dash-ink">{l.newTarget || "stays the same"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-page p-3 text-xs text-muted">
        The database is not copied or recreated — old and new both read the same schema throughout the move (see
        Plan → Database).
      </div>
    </div>
  );
}

function OutputPanel({
  detail,
  canEdit,
  onChanged,
}: {
  detail: AxRenewalProjectDetail;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const [kind, setKind] = useState(detail.destination?.kind ?? "git_repo");
  const [target, setTarget] = useState(detail.destination?.target ?? "");
  const [branch, setBranch] = useState(detail.destination?.branch ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!target.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await setDestination(detail.project.id, {
        kind,
        target: target.trim(),
        branch: branch.trim() || null,
        notes: null,
      });
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the destination.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-dash-ink">Output</h3>
      <p className="mt-1 text-xs text-muted">Where the renewed project would be written.</p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={kind}
          disabled={!canEdit}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm focus:outline-none disabled:bg-page"
        >
          <option value="git_repo">Git repository</option>
          <option value="filesystem_path">Filesystem path</option>
          <option value="other">Other</option>
        </select>
        <input
          value={target}
          disabled={!canEdit}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Target (repo URL or path)"
          className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page sm:col-span-2"
        />
        <input
          value={branch}
          disabled={!canEdit}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch (optional)"
          className="rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page sm:col-span-3"
        />
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !target.trim()}
            className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save destination"}
          </button>
        </div>
      )}
    </div>
  );
}

function ImplementationPanel({
  detail,
  canConfirm,
  onChanged,
}: {
  detail: AxRenewalProjectDetail;
  canConfirm: boolean;
  onChanged: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allConfirmed = (["stack_move", "architecture", "pages", "database"] as PlanSection[]).every(
    (s) => detail.confirmations[s] != null,
  );
  const readyToStart = allConfirmed && detail.destination != null;

  async function handleStart() {
    setStarting(true);
    setError(null);
    try {
      await startImplementation(detail.project.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start implementation.");
    } finally {
      setStarting(false);
    }
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setPostingComment(true);
    try {
      await addComment(detail.project.id, comment.trim());
      setComment("");
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post that comment.");
    } finally {
      setPostingComment(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-dash-ink">Implementation</h3>
        {!readyToStart && (
          <p className="mt-2 text-xs text-muted">Confirm all four plan sections and set a destination before starting.</p>
        )}

        {canConfirm && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={!readyToStart || starting}
              className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? "Starting…" : "Start implementation"}
            </button>
          </div>
        )}

        {detail.latestImplementationRun && (
          <div className="mt-4 rounded-xl border border-border bg-page p-4 text-sm">
            <p className="font-semibold text-dash-ink">Status: {detail.latestImplementationRun.status}</p>
            {detail.latestImplementationRun.afterReport && (
              <p className="mt-2 text-dash-ink">{String(detail.latestImplementationRun.afterReport.note ?? "")}</p>
            )}
          </div>
        )}

        {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-dash-ink">Comments</h3>
        <ul className="mt-3 space-y-2">
          {detail.comments.map((c) => (
            <li key={c.id} className="rounded-xl bg-page px-3 py-2 text-sm text-dash-ink">
              <p>{c.body}</p>
              <p className="mt-1 text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</p>
            </li>
          ))}
          {detail.comments.length === 0 && <p className="text-sm text-muted">No comments yet.</p>}
        </ul>
        <form onSubmit={(e) => void handleComment(e)} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment"
            className="flex-1 rounded-xl border border-border px-3 py-2 text-sm focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
          />
          <button
            type="submit"
            disabled={postingComment || !comment.trim()}
            className="rounded-xl bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

function RunLocallyPanel() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-16 text-center shadow-sm">
      <PlugIcon className="h-8 w-8 text-muted" />
      <p className="mt-3 text-sm font-semibold text-dash-ink">Not available in this phase</p>
      <p className="mt-1 max-w-sm text-xs text-muted">
        A local run and preview needs a real generated build to point at, which this phase does not produce. Planned
        for a later phase, once implementation does real code generation.
      </p>
    </div>
  );
}
