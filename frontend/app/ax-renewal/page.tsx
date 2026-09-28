"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobeIcon, PlugIcon, PlusIcon, WarningIcon } from "@/components/layout/icons";
import { AiEnginePanel } from "@/components/ax-renewal/AiEnginePanel";
import { ArchitectureSection } from "@/components/ax-renewal/ArchitectureSection";
import { ModuleCouplingDiagram, SystemContextDiagram } from "@/components/ax-renewal/ArchitectureDiagrams";
import { AttachSourceSection } from "@/components/ax-renewal/AttachSourceSection";
import { AuditTrailPanel } from "@/components/ax-renewal/AuditTrailPanel";
import { AxRenewalLanding } from "@/components/ax-renewal/AxRenewalLanding";
import { DatabaseSection } from "@/components/ax-renewal/DatabaseSection";
import { GeneratedChangesReview } from "@/components/ax-renewal/GeneratedChangesReview";
import { OldToNewDiagram } from "@/components/ax-renewal/OldToNewDiagram";
import { PagesSection } from "@/components/ax-renewal/PagesSection";
import { ProjectSwitcher } from "@/components/ax-renewal/ProjectSwitcher";
import { StackMoveSection } from "@/components/ax-renewal/StackMoveSection";
import { Tabs, type Tab } from "@/components/settings/Tabs";
import { useSession } from "@/lib/auth/SessionProvider";
import { formatBytes, languageBreakdown, type FileLayoutEntry } from "@/lib/ax-renewal/attachStats";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { resolveActiveSection, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import {
  cancelImplementation,
  confirmSection,
  connectDatabase,
  createProject,
  fetchRunLocallyStatus,
  reopenSection,
  setDestination,
  startImplementation,
  startRunLocally,
  stopRunLocally,
  updateArchitecture,
  updateDatabasePlan,
  updatePages,
  updateStackMove,
  type AxRenewalFixedBy,
  type AxRenewalProject,
  type AxRenewalProjectDetail,
  type AxRenewalRunLocallyStatus,
  type PlanSection,
} from "@/lib/ax-renewal/api";

export default function AxRenewalPage() {
  const { user } = useSession();
  const canEdit = user?.role === "admin" || user?.role === "super_admin";
  // Exact membership, not rank: an Admin does not pass this just by
  // out-ranking Developer (AppRole.exactAuthority(), ADR-039) — matches
  // SecurityConfig's confirm/reopen/start-implementation gate exactly.
  const canConfirm = user?.role === "super_admin" || (user?.roles?.includes("developer") ?? false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, projectId, detail, error: loadError, refresh, setProjects } = useAxRenewalProjectContext();
  const active = resolveActiveSection(searchParams.get("section"));

  function goTo(nextProjectId: string, section: AxRenewalExplorerKey = "attach") {
    router.push(`/ax-renewal?project=${nextProjectId}&section=${section}`);
  }

  // One picker, two placements. With no project open it sits inside the
  // landing card, which is the only thing on screen and whose whole job is
  // to get somebody to pick or create one; with a project open it sits
  // above the workspace as a switcher. Kept as a const so the two
  // placements cannot drift apart.
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
      {!detail && <AxRenewalLanding>{picker}</AxRenewalLanding>}

      {detail && active != null && (
        <p className="text-sm text-muted">
          Plan a legacy-code migration: attach, analyze, agree a plan, and record the sign-off.
        </p>
      )}

      {detail && active != null && picker}

      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-[10px] border border-danger/30 bg-danger/10 px-4 py-3">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm font-medium text-danger">{loadError}</p>
        </div>
      )}

      {detail && active == null && <NoTabOpenState />}

      {detail && active != null && (
        <>
          {/* The Understand/Plan/Build/Workspace navigation lives in the
              left sidebar (see AxRenewalSidebar.tsx) — this page only
              renders whichever leaf is selected there. */}
          {active === "attach" && <AttachSourceSection detail={detail} canEdit={canEdit} onChanged={refresh} />}
          {active === "codebase" && <CodebasePanel detail={detail} />}
          {active === "understand-architecture" && <UnderstandArchitecturePanel detail={detail} />}
          {active === "findings" && <FindingsPanel detail={detail} />}
          {active === "old-new" && <OldNewPanel detail={detail} />}

          {active === "stack-move" && (
            <StackMoveSection
              layers={detail.stackLayers}
              analysis={detail.analysis}
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
              analysis={detail.analysis}
              stackLayers={detail.stackLayers}
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
              analysis={detail.analysis}
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
          {active === "run-locally" && <RunLocallyPanel detail={detail} canConfirm={canConfirm} />}
          {active === "ai-engine" && <AiEnginePanel />}
          {active === "audit-trail" && user?.role === "super_admin" && (
            <AuditTrailPanel projectId={detail.project.id} />
          )}
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
    <div className="rounded-[10px] border border-border bg-page p-4">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="ax-project" className="text-xs font-semibold text-muted">
          Project
        </label>
        <ProjectSwitcher projects={projects} projectId={projectId} onSelect={onSelect} />

        {canEdit && !creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-[10px] border border-dashed border-border px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-brand-purple hover:text-brand-purple"
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
            className="rounded-xl border border-border px-3 py-1.5 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => setCreating(false)}
            className="rounded-[10px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink hover:bg-page"
          >
            Cancel
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-2 text-xs font-medium text-danger">{error}</p>}
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

/**
 * What a panel shows before Run analysis has been pressed.
 *
 * Every analysis-fed panel used to fall back to a bare "No findings yet." or
 * "No stack could be detected", which reads as a failure — the same blank a
 * broken panel would show. The distinction that matters is: nothing has been
 * asked for yet. The prototype filled this gap with hardcoded sample data
 * labelled "these are not your findings"; saying what to press is more use
 * and invents nothing.
 */
function NotAnalysedYet({ what }: { what: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
      <p className="text-sm font-medium text-dash-ink">Nothing analysed yet</p>
      <p className="mt-1 text-xs text-muted">
        Press <b className="font-semibold text-dash-ink">Run analysis</b> under Understand → Attach source, and {what}{" "}
        appears here.
      </p>
    </div>
  );
}

/**
 * Matches the reference prototype's own `renderView()` once its last tab is
 * closed (`S.active === null`) — this is the main content area's own empty
 * state, distinct from AxRenewalBreadcrumb's separate "no tab open" label in
 * the tab-bar strip above, which is untouched by this.
 *
 * Two overlapping tab-shaped cards (a plain notch-and-body silhouette, built
 * from div borders rather than a new SVG/image asset) plus a soft accent
 * glow and a small cursor dot — the accent tint/border reuse the exact same
 * blue already established for AX Renewal's active nav pill in both themes
 * (see .ax-empty-tab-accent/.ax-empty-tab-dot in globals.css), not a new
 * color.
 */
function NoTabOpenState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center gap-4 py-12 text-center">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center" aria-hidden="true">
        <div className="ax-empty-tab-accent absolute h-24 w-24 rounded-full blur-2xl" />
        <div className="ax-empty-tab-back absolute left-2 top-4 h-11 w-14 rounded-[6px] border">
          <div className="ax-empty-tab-back h-2.5 w-5 rounded-t-[6px] border-b" />
        </div>
        <div className="ax-empty-tab-accent absolute -left-1 top-0 h-11 w-14 rounded-[6px] border">
          <div className="ax-empty-tab-accent h-2.5 w-5 rounded-t-[6px] border-b" />
        </div>
        <span className="ax-empty-tab-dot absolute bottom-2 right-1 h-2 w-2 rounded-full" />
      </div>
      <div>
        <p className="text-sm font-bold text-dash-ink">No tab open</p>
        <p className="mt-1 text-xs text-muted">Pick something from the Explorer to get started.</p>
      </div>
    </div>
  );
}

function CodebasePanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  const attachStats = detail.project.attachStats;
  const indexed = analysis?.indexed ?? {};
  const languages = languageBreakdown(attachStats?.extensions ?? {});
  const runningOnToday = analysis?.runningOnToday ?? [];
  // Two independent sources for the same fact: the browser's own attach-time
  // scan (a full listing, but only as fresh as the last attach — attachStats
  // is stored as whatever the browser computed then, opaque JSON, persisted
  // as-is, so a project attached before fileLayout existed has stats with no
  // such field at all) and a connected local model's own read of source-path
  // (only ever a subset it chose to look at, but available immediately on
  // the next "Run analysis" with no re-attach needed). Prefer the fuller one.
  const attachFileLayout = attachStats?.fileLayout ?? [];
  const fileLayout: FileLayoutEntry[] = attachFileLayout.length > 0 ? attachFileLayout : (analysis?.fileLayout ?? []);
  // The extension breakdown, biggest first. Measured at attach time from the
  // real file list, so this is the one part of the workspace that is true
  // whether or not a model has ever run.
  const topExtensions = attachStats
    ? Object.entries(attachStats.extensions)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
    : [];

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">Codebase</h3>
        <p className="mt-1 text-xs text-muted">Counted at attach time. Detection below comes from analysis.</p>

        <div className="mt-4 space-y-4">
          {analysis && !analysis.modelConnected && <NoModelBanner />}

          {attachStats ? (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-4">
              {[
                { label: "project files", value: attachStats.fileCount.toLocaleString() },
                { label: "on disk", value: formatBytes(attachStats.totalBytes) },
                { label: "file types", value: Object.keys(attachStats.extensions).length.toLocaleString() },
                { label: "runtime", value: attachStats.runtime ?? "—" },
              ].map((cell) => (
                <div key={cell.label} className="bg-white p-3">
                  <b className="block text-lg font-bold tracking-tight text-dash-ink">{cell.value}</b>
                  <span className="text-xs text-muted">{cell.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">Nothing attached yet — start at Understand → Attach source.</p>
          )}

          {topExtensions.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted">By file type</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {topExtensions.map(([ext, count]) => (
                  <span key={ext} className="rounded-full bg-page px-3 py-1 text-xs font-medium text-dash-ink">
                    .{ext} <span className="text-muted">{count.toLocaleString()}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-page p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Manifest</p>
              <p className="mt-1 text-sm font-medium text-dash-ink">{detail.project.manifestFilename ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-page p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Analyzed</p>
              <p className="mt-1 text-sm font-medium text-dash-ink">
                {analysis ? new Date(analysis.analyzedAt).toLocaleString() : "not yet — press Run analysis"}
              </p>
            </div>
          </div>

          {analysis && Object.keys(analysis.stackDetected).length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Detected</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* "notes" is prose, not a short tag — a pill stretched around a
                    whole sentence is the broken-looking oval this excludes it from;
                    it gets its own paragraph below instead. */}
                {Object.entries(analysis.stackDetected)
                  .filter(([key]) => key !== "notes")
                  .map(([key, value]) => (
                    <span key={key} className="rounded-full bg-page px-3 py-1 text-xs font-medium text-dash-ink">
                      {key}: {value}
                    </span>
                  ))}
              </div>
              {analysis.stackDetected.notes && (
                <p className="mt-2 text-sm text-dash-ink">{analysis.stackDetected.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {attachStats && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">Indexed</h3>
          <p className="mt-1 text-xs text-muted">
            Files, size and runtime above are counted at attach time; lines, routes, templates, dependencies and
            test coverage need a connected local model reading the source —{" "}
            <span className="font-medium text-dash-ink">—</span> means it hasn&apos;t reported one.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "lines", value: formatCount(indexed.lines) },
              { label: "routes", value: formatCount(indexed.routes) },
              { label: "templates", value: formatCount(indexed.templates) },
              { label: "dependencies", value: formatCount(indexed.dependencies) },
              {
                label: "test coverage",
                value: indexed.testCoveragePercent != null ? `${indexed.testCoveragePercent}%` : "—",
              },
            ].map((cell) => (
              <div key={cell.label} className="rounded-xl bg-page p-3">
                <p className="text-xl font-bold tabular-nums tracking-tight text-dash-ink">{cell.value}</p>
                <p className="text-xs text-muted">{cell.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {fileLayout.length > 0 && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">File layout</h3>
          <p className="mt-1 text-xs text-muted">
            {attachFileLayout.length > 0
              ? "The largest directories in the attached folder, by file count — read from the browser's own scan, not a guess."
              : "Directories a connected local model actually looked at while reading the source — not a full scan, and not a guess."}
          </p>
          <div className="mt-3 space-y-1.5 font-mono text-xs">
            {fileLayout.map((entry) => (
              <div key={entry.dir || "(root)"} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-semibold text-dash-ink">{entry.dir ? `${entry.dir}/` : "(root)"}</span>
                {entry.files.map((name) => {
                  const risky = entry.riskFiles.includes(name);
                  return (
                    <span key={name} className={risky ? "font-semibold text-danger" : "text-muted"}>
                      {name}
                    </span>
                  );
                })}
                {entry.truncated && <span className="text-muted">+{entry.fileCount - entry.files.length} more</span>}
                {entry.riskFiles.length > 0 && (
                  <span className="text-danger">— possible credentials in {entry.riskFiles.join(", ")}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {languages.length > 0 && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">Languages</h3>
          <p className="mt-1 text-xs text-muted">Share of recognized source files by extension, not by AI guess.</p>
          <div className="mt-3 divide-y divide-border">
            {languages.map((l) => (
              <div key={l.name} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted">{l.name}</span>
                <b className="font-semibold tabular-nums text-dash-ink">{l.percent}%</b>
              </div>
            ))}
          </div>
        </div>
      )}

      {runningOnToday.length > 0 && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">Running on today</h3>
          <p className="mt-1 text-xs text-muted">
            What the connected model actually found in place — not a recommendation for what to move to.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {runningOnToday.map((tag) => (
              <span
                key={tag.label}
                className={`rounded-md border px-2.5 py-1 font-mono text-xs ${
                  tag.note
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-border bg-page text-dash-ink"
                }`}
              >
                {tag.label}
                {tag.note ? ` · ${tag.note}` : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** "—" for a count that hasn't been reported, otherwise the number as-is — never a guess in place of the dash. */
function formatCount(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString();
}

const ARCHITECTURE_TABS: Tab[] = [
  { id: "context", label: "System context" },
  { id: "sequence", label: "Request lifecycle" },
  { id: "coupling", label: "Module coupling" },
  { id: "deploy", label: "Deployment" },
];

/** The "What this shows" / "Why it matters" pair from CodeRenewalPlatform.html's own diagram tabs, written to describe real data rather than the prototype's fixed demo commentary. */
function ArchExplainer({ what, why }: { what: string; why: string }) {
  return (
    <div className="space-y-3 border-t border-border pt-3 text-sm text-dash-ink">
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted">What this shows</h4>
        <p className="mt-1">{what}</p>
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wide text-muted">Why it matters for the move</h4>
        <p className="mt-1">{why}</p>
      </div>
    </div>
  );
}

/**
 * A tab whose diagram genuinely cannot be produced honestly — not "not
 * analysed yet", but "this tool has no way to know this, connected model or
 * not". Request lifecycle needs a timed run against real traffic; Deployment
 * needs a person describing how they actually ship. Neither is answerable
 * from reading source, so this says why instead of showing a placeholder
 * shape or (worse) inventing numbers the way the reference prototype's own
 * fixed demo timings do.
 */
function HonestlyUnavailable({ reason }: { reason: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
      <p className="text-sm font-medium text-dash-ink">Not something this tool can answer</p>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted">{reason}</p>
    </div>
  );
}

function UnderstandArchitecturePanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  const attachStats = detail.project.attachStats;
  const [archTab, setArchTab] = useState<string>("context");

  const attachFileLayout = attachStats?.fileLayout ?? [];
  const fileLayout: FileLayoutEntry[] =
    attachFileLayout.length > 0 ? attachFileLayout : (analysis?.fileLayout ?? []);
  const routeCount = analysis?.pagesDetected.length ?? 0;
  const runtime = analysis?.stackDetected.runtime ?? attachStats?.runtime ?? null;
  const framework = analysis?.stackDetected.framework ?? null;
  const coupling = analysis?.moduleCoupling ?? {};
  const hasCoupling = (coupling.modules?.length ?? 0) > 0;
  const hasContext = runtime != null || framework != null || fileLayout.length > 0;

  return (
    <div className="rounded-[5px] border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
      <p className="mt-1 text-xs text-muted">How the current system is put together, from what analysis found.</p>

      <div className="mt-4 space-y-4">
        {analysis && !analysis.modelConnected && <NoModelBanner />}

        {!analysis ? (
          <NotAnalysedYet what="the detected architecture" />
        ) : (
          <>
            <Tabs tabs={ARCHITECTURE_TABS} active={archTab} onChange={setArchTab} />

            {archTab === "context" &&
              (hasContext ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-page p-3">
                    <SystemContextDiagram
                      runtime={runtime}
                      framework={framework}
                      fileLayout={fileLayout}
                      routeCount={routeCount}
                    />
                  </div>
                  <ArchExplainer
                    what="Everything detected so far runs as one process — the browser talks to it directly, and the directories shown are real ones the attach step or analysis actually found inside it."
                    why="A fuller picture (data stores, external services this talks to) needs more than static analysis can honestly tell — either a connected model reading further, or someone confirming what else the system depends on."
                  />
                </div>
              ) : (
                <p className="text-sm text-muted">Not enough detected yet to draw this — attach a folder and run analysis first.</p>
              ))}

            {archTab === "sequence" && (
              <HonestlyUnavailable reason="Seeing what actually happens on one request — which queries run, how long each step takes — means running the application with real traffic and measuring it. Static analysis, connected model or not, cannot produce those numbers without executing the code." />
            )}

            {archTab === "coupling" &&
              (hasCoupling ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-border bg-page p-3">
                    <ModuleCouplingDiagram coupling={coupling} />
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm border border-danger bg-danger/10" /> hub — imported by
                      several modules
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 bg-danger" /> circular dependency
                    </span>
                  </div>
                  <ArchExplainer
                    what="Which files import which, as actually traced by the connected model reading source — not every file in the project, just the ones it judged central enough to report."
                    why="A hub means many other files depend on its behavior, so it needs to become an injected dependency before anything around it can be tested in isolation. A cycle means neither file involved can be moved or replaced on its own until it's broken."
                  />
                </div>
              ) : (
                <HonestlyUnavailable reason="Tracing real imports between files needs a connected local model actually reading the source (source-path configured, not just the manifest) — this project hasn't reported one yet." />
              ))}

            {archTab === "deploy" && (
              <HonestlyUnavailable reason="How this project actually reaches production — build steps, hosting, rollback — isn't visible from its source code at all. That has to come from a person who runs the deploy, not from analysis." />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Worst first, matching the panel's own subtitle — order is a display concern, not something a run has to get right. */
const SEVERITY_ORDER: Record<string, number> = { risk: 0, warn: 1, info: 2 };

function severityBadgeClasses(severity: string): string {
  if (severity === "risk") return "bg-danger/10 text-danger";
  if (severity === "warn") return "bg-amber-50 text-amber-800";
  return "bg-page text-muted";
}

const FIXED_BY_LABELS: { key: AxRenewalFixedBy; label: string }[] = [
  { key: "stack_move", label: "Fixed by the stack move" },
  { key: "database", label: "Fixed by the database plan" },
  { key: "architecture", label: "Fixed by the architecture" },
  { key: "decision", label: "Needs a decision from you" },
];

function FindingsPanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  const findings = analysis
    ? [...analysis.findings].sort(
        (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
      )
    : [];
  const fixedByGroups = FIXED_BY_LABELS.map(({ key, label }) => ({
    key,
    label,
    findings: findings.filter((f) => f.fixedBy === key),
  })).filter((g) => g.findings.length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-dash-ink">
            {analysis ? `${findings.length} finding${findings.length === 1 ? "" : "s"}` : "Findings"}
          </h3>
          {findings.length > 0 && <span className="text-xs text-muted">worst first</span>}
        </div>
        <p className="mt-1 text-xs text-muted">What a renewal would need to address.</p>

        <div className="mt-4 space-y-4">
          {analysis && !analysis.modelConnected && <NoModelBanner />}
          {!analysis ? (
            <NotAnalysedYet what="what a renewal would have to deal with" />
          ) : findings.length === 0 ? (
            <p className="text-sm text-muted">Nothing flagged — the analysis found no issues worth raising.</p>
          ) : (
            <ul className="divide-y divide-border">
              {findings.map((f, i) => (
                <li key={i} className="flex items-start gap-3 py-2.5">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${severityBadgeClasses(f.severity)}`}
                  >
                    {f.severity === "info" ? "·" : "!"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-dash-ink">{f.what}</span>
                    <span className="mt-0.5 block font-mono text-xs text-muted">{f.where}</span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${severityBadgeClasses(f.severity)}`}
                  >
                    {f.severity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {fixedByGroups.length > 0 && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">Which of these the renewal fixes</h3>
          <p className="mt-1 text-xs text-muted">
            Only findings the connected model was confident enough to place — most findings are not categorized
            below, and that&apos;s the honest answer, not a gap.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-dash-ink">
            {fixedByGroups.map((group) => (
              <li key={group.key}>
                <b className="font-semibold">{group.label}:</b>{" "}
                {group.findings.map((f) => f.what).join(" · ")}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Plan → Old → New, following CodeRenewalPlatform.html's `vBridge()` layout
 * (a diagram, a side-by-side list, "what does not change", two navigation
 * buttons) — entirely from real Plan data (stack layers, database plan,
 * page mappings), never that prototype's fixed nine-layer fictional
 * migration or its hardcoded incident numbers. Read-only, same as before:
 * every fact here is edited under its own Plan section, not here.
 */
function OldNewPanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const router = useRouter();
  const layers = detail.stackLayers.filter((l) => l.oldTarget || l.newTarget);
  const dbChanges = detail.dbChanges;
  const mappedPages = detail.pageMappings.filter((p) => p.oldPath && p.newPath);
  const changedPaths = mappedPages.filter((p) => p.oldPath !== p.newPath);
  const samePaths = mappedPages.filter((p) => p.oldPath === p.newPath);
  const sameDatabase = dbChanges.length > 0 || detail.dbConnection != null;
  // Confirming Database with nothing entered is itself a real decision — "this
  // renewal doesn't use one" — not the same as not having gotten to it yet.
  // Distinguishing the two needs no new field: the confirmation already
  // records that a person reviewed this section and signed off on it as-is.
  const noDatabaseNeeded = detail.confirmations.database != null && !sameDatabase;

  function goTo(section: AxRenewalExplorerKey) {
    router.push(`/ax-renewal?project=${detail.project.id}&section=${section}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">How the old becomes the new</h3>
        <p className="mt-1 text-xs text-muted">The whole move on one page, built from what is entered under Plan.</p>
        <div className="mt-3 rounded-xl border border-border bg-page p-3">
          {layers.length > 0 ? (
            <OldToNewDiagram layers={layers} sameDatabase={sameDatabase} />
          ) : (
            <p className="py-6 text-center text-sm text-muted">
              Nothing recorded yet — fill in Plan → Stack move first.
            </p>
          )}
        </div>
      </div>

      {layers.length > 0 && (
        <div className="rounded-[5px] border border-border bg-white p-5">
          <h3 className="text-sm font-bold text-dash-ink">Side by side</h3>
          <p className="mt-1 text-xs text-muted">
            Every layer entered under Plan → Stack move. Edit it there; this view is read-only.
          </p>
          <div className="mt-3 grid grid-cols-1 divide-y divide-border overflow-hidden rounded-xl border border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="bg-[#fdf1e3]/30 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#9c4620]">Old</h4>
              <div className="mt-2 space-y-1.5">
                {layers.map((l) => (
                  <p key={l.layerKey} className="text-sm text-dash-ink">
                    {l.oldTarget || "—"} <span className="text-xs text-muted">{l.layerKey}</span>
                  </p>
                ))}
              </div>
            </div>
            <div className="bg-brand-purple/5 p-3">
              <h4 className="text-xs font-bold uppercase tracking-wide text-brand-purple">New</h4>
              <div className="mt-2 space-y-1.5">
                {layers.map((l) => (
                  <p key={l.layerKey} className="text-sm text-dash-ink">
                    {l.newTarget || `stays on ${l.oldTarget || "—"}`}{" "}
                    <span className="text-xs text-muted">{l.layerKey}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">What does not change</h3>
        <ul className="mt-3 space-y-2.5 text-sm text-dash-ink">
          <li>
            <b className="font-semibold">The database.</b>{" "}
            {dbChanges.length > 0
              ? `Same schema throughout — ${dbChanges.length} additive change${dbChanges.length === 1 ? "" : "s"} planned (columns/indexes only, see Plan → Database); nothing is dropped or recreated.`
              : detail.dbConnection
                ? `Connected to ${detail.dbConnection.engine ?? "the existing database"} — read-only so far, no changes planned yet.`
                : noDatabaseNeeded
                  ? "No database required for this renewal — confirmed under Plan → Database."
                  : "No database changes planned yet — see Plan → Database."}
          </li>
          <li>
            <b className="font-semibold">The URLs.</b>{" "}
            {mappedPages.length === 0
              ? "No page mappings entered yet — see Plan → Pages."
              : changedPaths.length === 0
                ? `All ${samePaths.length} mapped page${samePaths.length === 1 ? "" : "s"} keep their existing path.`
                : `${changedPaths.length} page${changedPaths.length === 1 ? "" : "s"} change path: ${changedPaths
                    .map((p) => `${p.oldPath} → ${p.newPath}`)
                    .join(", ")}${
                    samePaths.length > 0
                      ? `; ${samePaths.length} other${samePaths.length === 1 ? "" : "s"} stay the same`
                      : ""
                  }.`}
          </li>
          <li>
            <b className="font-semibold">The old system.</b> Nothing here edits it — it keeps serving every request
            until you decide to cut traffic over, so reverting at any point is a routing change, not a restore.
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => goTo("stack-move")}
            className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            Choose the target stack
          </button>
          <button
            type="button"
            onClick={() => goTo("output")}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page"
          >
            Set where the code goes
          </button>
        </div>
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
    <div className="rounded-[5px] border border-border bg-white p-5">
      <h3 className="text-sm font-bold text-dash-ink">Output</h3>
      <p className="mt-1 text-xs text-muted">Where the renewed project would be written.</p>
      {kind === "filesystem_path" && (
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          Unlike the source path in AI engine, this one is shared for the whole project, not set per machine —
          whoever clicks Approve or Run Locally writes to or reads from exactly this path on <em>their own</em>{" "}
          computer. On a team where more than one person does that, it only behaves consistently if this path
          actually exists (or can be created) the same way on each of those machines — e.g. the same drive letter
          mapped to the same real folder, or everyone treating one particular machine as the one that approves/runs.
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={kind}
          disabled={!canEdit}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm text-dash-ink focus:outline-none disabled:bg-page"
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
          className="rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page sm:col-span-2"
        />
        <input
          value={branch}
          disabled={!canEdit}
          onChange={(e) => setBranch(e.target.value)}
          placeholder="Branch (optional)"
          className="rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:bg-page sm:col-span-3"
        />
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !target.trim()}
            className="rounded-[5px] border border-border px-4 py-2 text-sm font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save destination"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Comments used to have their own card here — they now live in the AxAssistantPanel column, which is the one comment thread for the whole project, not just this tab. */
/** Statuses the backend is still actively working on — the frontend needs to keep checking back on its own, nobody is going to click anything to move these along. */
const POLLING_STATUSES = new Set(["generating", "applying"]);

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
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const run = detail.latestImplementationRun;

  const allConfirmed = (["stack_move", "architecture", "pages", "database"] as PlanSection[]).every(
    (s) => detail.confirmations[s] != null,
  );
  const readyToStart = allConfirmed && detail.destination != null;
  // Editing any Plan section clears that section's confirmation (already the
  // existing behaviour, unchanged here), so `readyToStart` only goes back to
  // true after everything is reconfirmed — "Rebuild" only becomes clickable
  // once the *latest confirmed* Plan is what it's about to build from, per
  // what was asked for, not the moment something was edited.
  const isActive = run != null && POLLING_STATUSES.has(run.status);

  // Generate/Apply run in the background (ADR-044) — nothing on this screen
  // triggers the next step for them, so this polls project detail every few
  // seconds while a run is at one of those statuses, and stops the moment
  // it isn't (awaiting_review needs a person, everything else is terminal).
  useEffect(() => {
    if (!run || !POLLING_STATUSES.has(run.status)) return;
    const id = setInterval(() => void onChanged(), 4000);
    return () => clearInterval(id);
  }, [run, onChanged]);

  // A real elapsed-time count, not a fabricated percentage — nothing reports
  // how far a generation run actually is, so this is honest about what it
  // can show: how long it has actually been running.
  useEffect(() => {
    if (!run || !isActive) return;
    const startedAtMs = new Date(run.startedAt).getTime();
    const tick = () => setElapsedSecs(Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [run, isActive]);

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

  // Kills the real process on the backend's own machine (ADR-049) — the run
  // moves on to "cancelled" a moment later, once the kill actually unblocks
  // it, picked up by the same poll that already watches "generating".
  async function handleCancel() {
    if (!run) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelImplementation(detail.project.id, run.id);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't cancel the rebuild.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">Implementation</h3>
        {!readyToStart && (
          <p className="mt-2 text-xs text-muted">Confirm all four plan sections and set a destination before starting.</p>
        )}

        {canConfirm && !isActive && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => void handleStart()}
              disabled={!readyToStart || starting}
              className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {starting ? "Starting…" : run ? "Rebuild" : "Start implementation"}
            </button>
            {run && !readyToStart && (
              <p className="mt-1.5 text-xs text-muted">
                A Plan section changed since the last build — reconfirm all four sections above to rebuild.
              </p>
            )}
          </div>
        )}

        {run && (
          <div className="mt-4 rounded-xl border border-border bg-page p-4 text-sm">
            {isActive ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-purple/30 border-t-brand-purple"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold text-dash-ink">
                      {run.status === "generating" ? "Rebuilding…" : "Applying…"}
                    </p>
                    <p className="text-xs text-muted">{elapsedSecs}s elapsed</p>
                  </div>
                </div>
                {canConfirm && run.status === "generating" && (
                  <button
                    type="button"
                    onClick={() => void handleCancel()}
                    disabled={cancelling}
                    className="rounded-[5px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling…" : "Cancel"}
                  </button>
                )}
              </div>
            ) : (
              <p className="font-semibold text-dash-ink">Status: {run.status.replace(/_/g, " ")}</p>
            )}

            {run.status === "generating" && (
              <p className="mt-2 text-dash-ink">
                Copying the attached source, asking your local model to carry out the confirmed plan against that
                copy, then comparing the result — this can take up to 20 minutes. Nothing is written to the
                destination until you approve it.
              </p>
            )}
            {run.status === "applying" && <p className="mt-2 text-dash-ink">Copying the approved changes into the destination…</p>}
            {run.status === "failed" && run.failureReason && (
              <p className="mt-2 text-danger">{run.failureReason}</p>
            )}
            {run.status === "cancelled" && (
              <p className="mt-2 text-dash-ink">Cancelled — nothing was written to the destination.</p>
            )}
            {(run.status === "completed" || run.status === "applied" || run.status === "rejected") &&
              run.afterReport && <p className="mt-2 text-dash-ink">{String(run.afterReport.note ?? "")}</p>}
            {run.status === "applied" && typeof run.afterReport?.filesApplied === "number" && (
              <p className="mt-1 text-dash-ink">{run.afterReport.filesApplied} file(s) written to the destination.</p>
            )}

            {run.status === "awaiting_review" && (
              <GeneratedChangesReview
                projectId={detail.project.id}
                runId={run.id}
                canConfirm={canConfirm}
                onChanged={onChanged}
              />
            )}
          </div>
        )}

        {error && <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </div>
    </div>
  );
}

/** Statuses the backend is still actively working on — polled the same way ImplementationPanel polls a Generate/Apply run. */
const RUN_LOCALLY_POLLING_STATUSES = new Set<AxRenewalRunLocallyStatus["status"]>(["starting", "running"]);

function RunLocallyPanel({ detail, canConfirm }: { detail: AxRenewalProjectDetail; canConfirm: boolean }) {
  // The exact "a real generated build to point at" precondition the tab has
  // always been locked behind (ADR-048) -- Approve (ADR-044) is what makes
  // this true. A rebuild started since re-locks it, since the destination is
  // presumed mid-change again.
  const unlocked = detail.latestImplementationRun?.status === "applied";

  const [status, setStatus] = useState<AxRenewalRunLocallyStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    void fetchRunLocallyStatus(detail.project.id).then((s) => {
      if (!cancelled) setStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, [unlocked, detail.project.id]);

  useEffect(() => {
    if (!unlocked || !status || !RUN_LOCALLY_POLLING_STATUSES.has(status.status)) return;
    const id = setInterval(() => void fetchRunLocallyStatus(detail.project.id).then(setStatus), 1500);
    return () => clearInterval(id);
  }, [unlocked, status, detail.project.id]);

  // A live log a person is meant to watch scroll, not one they have to
  // manually scroll down to catch up with.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [status?.log.length]);

  const active = status != null && RUN_LOCALLY_POLLING_STATUSES.has(status.status);

  async function handleStart() {
    setBusy(true);
    setError(null);
    try {
      setStatus(await startRunLocally(detail.project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the local dev server.");
    } finally {
      setBusy(false);
    }
  }

  async function handleStop() {
    setBusy(true);
    setError(null);
    try {
      setStatus(await stopRunLocally(detail.project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't stop the local dev server.");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[5px] border border-border bg-white p-16 text-center">
        <PlugIcon className="h-8 w-8 text-muted" />
        <p className="mt-3 text-sm font-semibold text-dash-ink">Not available yet</p>
        <p className="mt-1 max-w-sm text-xs text-muted">
          Run Locally needs a real, applied build to point at — confirm the Plan and approve an Implementation run
          first. This unlocks the moment one reaches <span className="font-medium text-dash-ink">applied</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-dash-ink">Run locally</h3>
          {canConfirm && (
            <button
              type="button"
              onClick={() => void (active ? handleStop() : handleStart())}
              disabled={busy}
              className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (active ? "Stopping…" : "Starting…") : active ? "Stop" : "Start"}
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Runs this project&apos;s own <code>npm install &amp;&amp; npm run dev</code> as a background process on
          this machine, and shows its real output below — nothing here is simulated or estimated.
        </p>

        {status && (
          <div className="mt-3 flex items-center gap-3">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                status.status === "running"
                  ? "bg-brand-purple"
                  : status.status === "starting"
                    ? "animate-pulse bg-amber-400"
                    : status.status === "failed"
                      ? "bg-danger"
                      : "bg-muted"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-dash-ink">{status.status}</span>
            {status.startedAt && (
              <span className="text-xs text-muted">
                since {new Date(status.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        )}

        {status?.url && (
          <a
            href={status.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-purple hover:underline"
          >
            <GlobeIcon className="h-4 w-4" />
            Open {status.url}
          </a>
        )}
      </div>

      {status && status.log.length > 0 && (
        <pre
          ref={logRef}
          className="max-h-96 overflow-auto whitespace-pre-wrap break-all rounded-[5px] border border-border bg-[#0b0d12] p-4 font-mono text-xs leading-relaxed text-[#c9d1d9]"
        >
          {status.log.join("\n")}
        </pre>
      )}

      {error && <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
