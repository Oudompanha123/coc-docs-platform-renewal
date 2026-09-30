"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, GlobeIcon, PlugIcon, WarningIcon } from "@/components/layout/icons";
import { AiEnginePanel } from "@/components/ax-renewal/AiEnginePanel";
import { ArchitectureSection } from "@/components/ax-renewal/ArchitectureSection";
import { ModuleCouplingDiagram, SystemContextDiagram } from "@/components/ax-renewal/ArchitectureDiagrams";
import { AttachSourceSection } from "@/components/ax-renewal/AttachSourceSection";
import { AuditTrailPanel } from "@/components/ax-renewal/AuditTrailPanel";
import { AxRenewalLanding } from "@/components/ax-renewal/AxRenewalLanding";
import { DatabaseSection } from "@/components/ax-renewal/DatabaseSection";
import { GeneratedChangesReview } from "@/components/ax-renewal/GeneratedChangesReview";
import { MembersPanel } from "@/components/ax-renewal/MembersPanel";
import { OldToNewDiagram } from "@/components/ax-renewal/OldToNewDiagram";
import { PagesSection } from "@/components/ax-renewal/PagesSection";
import { ProjectPicker } from "@/components/ax-renewal/ProjectPicker";
import { StackMoveSection } from "@/components/ax-renewal/StackMoveSection";
import { Tabs, type Tab } from "@/components/settings/Tabs";
import { useSession } from "@/lib/auth/SessionProvider";
import { formatBytes, languageBreakdown, type FileLayoutEntry } from "@/lib/ax-renewal/attachStats";
import { useAxRenewalProjectContext } from "@/lib/ax-renewal/AxRenewalProjectContext";
import { resolveActiveSection, type AxRenewalExplorerKey } from "@/lib/ax-renewal/explorerGroups";
import { readSourcePathOverride, writeSourcePathOverride } from "@/lib/ax-renewal/engine-preference";
import { axRenewalPermissions } from "@/lib/ax-renewal/permissions";
import { hasRuntimeErrorEvidence, runLocallyGuidance } from "@/lib/ax-renewal/runLocallyGuidance";
import {
  cancelImplementation,
  confirmSection,
  connectDatabase,
  explainRunLocallyFailure,
  fetchEngineStatus,
  fetchRunLocallyStatus,
  listProjects,
  reopenSection,
  revertImplementation,
  setDestination,
  startErrorFixImplementation,
  startImplementation,
  startRunLocally,
  startUiChangeImplementation,
  stopRunLocally,
  updateArchitecture,
  updateDatabasePlan,
  updatePages,
  updateStackMove,
  type AxRenewalEngineStatus,
  type AxRenewalFixedBy,
  type AxRenewalProjectDetail,
  type AxRenewalRunLocallyStatus,
  type PlanSection,
} from "@/lib/ax-renewal/api";

export default function AxRenewalPage() {
  const { user } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { projects, projectId, detail, error: loadError, refresh, setProjects } = useAxRenewalProjectContext();
  // Role decides what, membership decides where (ADR-069) — see
  // permissions.ts. A non-member never gets this far: the backend refuses
  // them the project itself (ADR-070), so `detail` stays null.
  const { canCreate, canEdit, canConfirm } = axRenewalPermissions(user, detail?.project ?? null);
  // The one way to be looking at a project one is not on: being a super
  // admin, who may open any project. Said, so it is never mistaken for
  // being on the team.
  const viewingAsSuperAdminOnly = user?.role === "super_admin" && detail != null && !detail.project.member;
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
      canEdit={canCreate}
      canDelete={canEdit}
      onSelect={(id) => goTo(id)}
      onCreated={(created) => {
        setProjects((prev) => (prev ? [created, ...prev] : [created]));
        goTo(created.id);
      }}
      onDeleted={() => {
        // Re-fetched from the server, not a local filter — and awaited
        // before navigating, so `projects` already excludes the deleted row
        // by the time clearing `project=` lets useAxRenewalProject fall back
        // to `projects[0]`. Otherwise that fallback could briefly land back
        // on the very id that just 404s.
        void (async () => {
          try {
            setProjects(await listProjects());
          } catch {
            // Best-effort refresh only — the delete itself already
            // succeeded and was reported; a failed follow-up list refresh
            // is not a reason to show a second error for the same click.
          }
          router.push("/ax-renewal");
        })();
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

      {viewingAsSuperAdminOnly && (
        <div role="status" className="flex items-start gap-3 rounded-[10px] border border-brand-purple/20 bg-brand-purple/5 px-4 py-3">
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-purple" />
          <p className="text-sm text-dash-ink">
            You&rsquo;re not a member of this project. You can open it because you&rsquo;re a Super Admin; its members
            are listed under <strong className="font-semibold">Workspace → Members</strong>.
          </p>
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
          {active === "understand-pages" && <UnderstandPagesPanel detail={detail} />}
          {active === "old-new" && <OldNewPanel detail={detail} />}

          {/* Every save and Confirm below sends back the revision this
              screen loaded (ADR-067), so a teammate's save in between is
              refused with a 409 instead of being silently overwritten. Confirm
              is awaited, not fire-and-forget, so that 409 reaches the
              section's own error line. */}
          {active === "stack-move" && (
            <StackMoveSection
              layers={detail.stackLayers}
              analysis={detail.analysis}
              confirmation={detail.confirmations.stack_move}
              canEdit={canEdit}
              canConfirm={canConfirm}
              onSave={async (rows) => {
                await updateStackMove(detail.project.id, rows, detail.project.revision);
                await refresh();
              }}
              onConfirm={async () => {
                await confirmSection(detail.project.id, "stack_move", detail.project.revision);
                await refresh();
              }}
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
                await updateArchitecture(detail.project.id, summary || null, null, detail.project.revision);
                await refresh();
              }}
              onConfirm={async () => {
                await confirmSection(detail.project.id, "architecture", detail.project.revision);
                await refresh();
              }}
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
                await updatePages(detail.project.id, rows, detail.project.revision);
                await refresh();
              }}
              onConfirm={async () => {
                await confirmSection(detail.project.id, "pages", detail.project.revision);
                await refresh();
              }}
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
                await connectDatabase(detail.project.id, input, detail.project.revision);
                await refresh();
              }}
              onSaveChanges={async (rows) => {
                await updateDatabasePlan(detail.project.id, rows, detail.project.revision);
                await refresh();
              }}
              onConfirm={async () => {
                await confirmSection(detail.project.id, "database", detail.project.revision);
                await refresh();
              }}
              onReopen={() => void reopenSection(detail.project.id, "database").then(refresh)}
            />
          )}
          {active === "output" && <OutputPanel detail={detail} canEdit={canEdit} onChanged={refresh} />}

          {active === "implementation" && (
            <ImplementationPanel detail={detail} canConfirm={canConfirm} onChanged={refresh} />
          )}
          {active === "run-locally" && (
            <RunLocallyPanel detail={detail} canConfirm={canConfirm} canEdit={canEdit} onChanged={refresh} />
          )}
          {active === "ai-engine" && <AiEnginePanel />}
          {active === "members" && (
            <MembersPanel
              projectId={detail.project.id}
              members={detail.members}
              currentUserId={user?.id ?? null}
              canManage={canEdit}
              onChanged={refresh}
            />
          )}
          {active === "audit-trail" && user?.role === "super_admin" && (
            <AuditTrailPanel projectId={detail.project.id} />
          )}
        </>
      )}
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
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Codebase</h3>
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">Counted at attach time. Detection below comes from analysis.</p>

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
      </div>

      {attachStats && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Indexed</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
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
        </div>
      )}

      {fileLayout.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">File layout</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
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
        </div>
      )}

      {languages.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Languages</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">Share of recognized source files by extension, not by AI guess.</p>
          <div className="mt-3 divide-y divide-border">
            {languages.map((l) => (
              <div key={l.name} className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-muted">{l.name}</span>
                <b className="font-semibold tabular-nums text-dash-ink">{l.percent}%</b>
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

      {runningOnToday.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Running on today</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
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
  const router = useRouter();
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
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Architecture</h3>
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">How the current system is put together, from what analysis found.</p>

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
      </div>

      {/* Matches the reference prototype's own closing panel in vArch(), shown
          under every tab rather than just one of them — general guidance
          about how to use what is above, not a fifth diagram. "Order follows
          the coupling graph" only asserted once there is a real coupling
          graph to follow; the database/framing points are true regardless of
          which tab found what. */}
      {analysis && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Read this before choosing a target stack</h3>
          </div>
          <div className="p-5">
          <ul className="list-disc space-y-2 pl-4 text-sm text-dash-ink">
            <li>
              A slow request or a tangled import graph isn&apos;t fixed by switching frameworks alone — both need a
              change in shape, which is what the rest of Plan sets up.
            </li>
            <li>
              {hasCoupling
                ? "The order of the move follows what Module coupling actually found above — break any cycle and extract any hub before what depends on it — not preference."
                : "Once Module coupling has something to report, let that — not preference — set the order the move happens in."}
            </li>
            <li>
              The database stays where it is throughout the renewal — old and new code read the same schema; see{" "}
              <span className="font-medium">Plan → Database</span> for what, if anything, is changing there.
            </li>
          </ul>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => router.push(`/ax-renewal?project=${detail.project.id}&section=stack-move`)}
              className="rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            >
              Open the stack move
            </button>
          </div>
          </div>
        </div>
      )}
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
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">
            {analysis ? `${findings.length} finding${findings.length === 1 ? "" : "s"}` : "Findings"}
          </h3>
          {findings.length > 0 && <span className="text-xs text-muted">worst first</span>}
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">What a renewal would need to address.</p>

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
      </div>

      {fixedByGroups.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Which of these the renewal fixes</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
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
        </div>
      )}
    </div>
  );
}

/**
 * Best-effort cross-reference of one detected page against the directories/
 * files analysis actually saw (`fileLayout` — the same real, counted data
 * Understand → Codebase's own "File layout" card shows), used by the "Files"
 * card below. Matches on the page's own path segments ("/products/:id" →
 * "products"), case-insensitively, against each entry's directory and
 * filenames — a real filter over real data, but a guess about relevance all
 * the same, since analysis reports no actual route-to-file mapping today.
 */
function relatedFilePaths(path: string, fileLayout: FileLayoutEntry[]): string[] {
  const tokens = path
    .toLowerCase()
    .split(/[/:._-]+/)
    .filter((t) => t.length > 2);
  if (tokens.length === 0) return [];
  const matches: string[] = [];
  for (const entry of fileLayout) {
    for (const file of entry.files) {
      const full = entry.dir ? `${entry.dir}/${file}` : file;
      if (tokens.some((t) => full.toLowerCase().includes(t))) {
        matches.push(full);
      }
    }
  }
  return matches;
}

/**
 * Understand → Pages, following CodeRenewalPlatform.html's `vPage()` layout —
 * browse every route/screen analysis actually detected, one at a time, read
 * only (this is what analysis found on the *current* system; mapping each to
 * where it goes next is Plan → Pages, a separate, editable table), through
 * the same four cards the reference prototype shows for one: Page view,
 * Processing flow, Files, Issues on this page.
 *
 * Two of those stay honest rather than reproducing the reference's fixed
 * demo content: its screen preview is a hand-built mockup of one fictional
 * e-commerce page, meaningless (and actively misleading) against an
 * arbitrary attached project, so Page view here shows the page's own
 * detected path and purpose inside the same browser-chrome frame instead of
 * a fabricated render; Processing flow's per-step millisecond timings need a
 * real, instrumented run against live traffic to produce honestly (same
 * reason Architecture → Request lifecycle stays a `HonestlyUnavailable`
 * notice, not invented numbers). Files and Issues on this page are both real
 * data, cross-referenced against this one page — but both best-effort text
 * matches, not a route-to-file or finding-to-page mapping analysis actually
 * reports, so a short list (or none) is an honest answer, not a gap.
 */
function UnderstandPagesPanel({ detail }: { detail: AxRenewalProjectDetail }) {
  const analysis = detail.analysis;
  const pages = analysis?.pagesDetected ?? [];
  const [index, setIndex] = useState(0);
  // Clamps rather than trusting stale state, in case a re-run of analysis
  // came back with fewer pages than the one that was selected before.
  const current = pages.length === 0 ? null : (pages[Math.min(index, pages.length - 1)] ?? null);
  const safeIndex = pages.length === 0 ? 0 : Math.min(index, pages.length - 1);

  const attachFileLayout = detail.project.attachStats?.fileLayout ?? [];
  const fileLayout: FileLayoutEntry[] = attachFileLayout.length > 0 ? attachFileLayout : (analysis?.fileLayout ?? []);
  const matchedFiles = current ? relatedFilePaths(current.path, fileLayout) : [];

  const relatedFindings = current
    ? (analysis?.findings ?? []).filter((f) => f.where.includes(current.path))
    : [];

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">Pages</h3>
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">Every route or screen analysis actually detected, one at a time.</p>

        <div className="mt-4 space-y-4">
          {analysis && !analysis.modelConnected && <NoModelBanner />}

          {!analysis ? (
            <NotAnalysedYet what="every page it detected" />
          ) : pages.length === 0 ? (
            <p className="text-sm text-muted">No pages or routes were detected.</p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <button
                  type="button"
                  onClick={() => setIndex(safeIndex - 1)}
                  disabled={safeIndex === 0}
                  className="flex min-w-0 items-center gap-1 rounded-[5px] border border-border px-2.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{safeIndex > 0 ? pages[safeIndex - 1]!.path : "first"}</span>
                </button>
                <span className="shrink-0 font-mono text-xs text-muted">
                  {safeIndex + 1} / {pages.length}
                </span>
                <button
                  type="button"
                  onClick={() => setIndex(safeIndex + 1)}
                  disabled={safeIndex === pages.length - 1}
                  className="flex min-w-0 items-center gap-1 rounded-[5px] border border-border px-2.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span className="truncate">{safeIndex < pages.length - 1 ? pages[safeIndex + 1]!.path : "last"}</span>
                  <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {pages.map((p, i) => (
                  <button
                    key={`${p.path}-${i}`}
                    type="button"
                    aria-current={i === safeIndex ? "true" : undefined}
                    onClick={() => setIndex(i)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-xs transition-colors ${
                      i === safeIndex
                        ? "border-brand-purple bg-brand-purple/10 text-brand-purple"
                        : "border-border text-muted hover:bg-page"
                    }`}
                  >
                    {p.path}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {analysis && current && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[5px] border border-border bg-white">
            <div className="border-b border-border bg-page px-5 py-3">
              <h3 className="text-sm font-bold text-dash-ink">Page view</h3>
            </div>
            <div className="p-5">
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-page px-3 py-2 font-mono text-xs text-muted">
                {current.path}
              </div>
              <div className="bg-white p-4">
                <p className="text-sm text-dash-ink">{current.purpose}</p>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              A rendered screenshot needs a real, running instance of the page — this shows what analysis actually
              read about it instead of a fabricated one.
            </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[5px] border border-border bg-white">
            <div className="border-b border-border bg-page px-5 py-3">
              <h3 className="text-sm font-bold text-dash-ink">Processing flow</h3>
            </div>
            <div className="p-5">
              <HonestlyUnavailable reason="Seeing what actually happens on one request to this page — which queries run, how long each step takes — means running the application with real traffic and measuring it, the same as Architecture → Request lifecycle. Static analysis, connected model or not, cannot produce those numbers without executing the code." />
            </div>
          </div>
        </div>
      )}

      {analysis && current && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Files</h3>
            {matchedFiles.length > 0 && <span className="text-xs text-muted">{matchedFiles.length}</span>}
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
            A best-effort text match against the directories and files Understand → Codebase already saw — analysis
            doesn&apos;t report which files implement which page, so this is worth checking, not a guarantee.
          </p>
          <div className="mt-3">
            {matchedFiles.length === 0 ? (
              <p className="text-sm text-muted">Nothing in what analysis saw matched this page&apos;s path.</p>
            ) : (
              <div className="space-y-1 font-mono text-xs text-dash-ink">
                {matchedFiles.map((f) => (
                  <p key={f}>{f}</p>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {analysis && current && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Issues on this page</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
            Findings whose location mentions <span className="font-mono">{current.path}</span> — most findings
            don&apos;t name a specific page, so a shorter list here (or none) is the honest answer, not a gap. The
            full list is under Understand → Findings.
          </p>
          <div className="mt-3">
            {relatedFindings.length === 0 ? (
              <p className="text-sm text-muted">Nothing found that names this page specifically.</p>
            ) : (
              <ul className="divide-y divide-border">
                {relatedFindings.map((f, i) => (
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
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
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
      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">How the old becomes the new</h3>
        </div>
        <div className="p-5">
        <p className="text-xs text-muted">The whole move on one page, built from what is entered under Plan.</p>
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
      </div>

      {layers.length > 0 && (
        <div className="overflow-hidden rounded-[5px] border border-border bg-white">
          <div className="border-b border-border bg-page px-5 py-3">
            <h3 className="text-sm font-bold text-dash-ink">Side by side</h3>
          </div>
          <div className="p-5">
          <p className="text-xs text-muted">
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
        </div>
      )}

      <div className="overflow-hidden rounded-[5px] border border-border bg-white">
        <div className="border-b border-border bg-page px-5 py-3">
          <h3 className="text-sm font-bold text-dash-ink">What does not change</h3>
        </div>
        <div className="p-5">
        <ul className="space-y-2.5 text-sm text-dash-ink">
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
      await setDestination(
        detail.project.id,
        {
          kind,
          target: target.trim(),
          branch: branch.trim() || null,
          notes: null,
        },
        detail.project.revision,
      );
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the destination.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[5px] border border-border bg-white">
      <div className="flex items-center justify-between border-b border-border bg-page px-5 py-3">
        <h3 className="text-sm font-bold text-dash-ink">Output</h3>
        <span className="text-xs text-muted">{detail.destination ? "set" : "not set"}</span>
      </div>
      <div className="p-5">
        <p className="text-xs text-muted">Where the renewed project would be written.</p>
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

  // UI Customization (ADR-062 Phase 2): a natural-language description
  // against the renewed project's own UI — never this admin app's own.
  // Offered only once there is an applied build to point at, the same
  // precondition an error fix and Run Locally itself already require.
  const [uiChangeText, setUiChangeText] = useState("");
  const [startingUiChange, setStartingUiChange] = useState(false);
  const [uiChangeError, setUiChangeError] = useState<string | null>(null);

  // Reverting one specific applied run (ADR-062 §revert) — only offered on
  // the current latest run while it is actually applied, matching the
  // backend's own "must still be the latest applied run" safety check.
  const [reverting, setReverting] = useState(false);
  const [revertError, setRevertError] = useState<string | null>(null);

  // Same per-project, per-browser path Attach source offers (ADR-055) — read
  // independently here rather than shared state, so setting it in either
  // place is reflected the next time this panel mounts. Only offered where a
  // local model actually answers at all; the placeholder path this project
  // takes without one never looks at it.
  const [engine, setEngine] = useState<AxRenewalEngineStatus | null>(null);
  useEffect(() => {
    void fetchEngineStatus().then(setEngine);
  }, []);
  const [sourcePath, setSourcePath] = useState("");
  useEffect(() => {
    setSourcePath(readSourcePathOverride(detail.project.id));
  }, [detail.project.id]);
  function handleSourcePathChange(value: string) {
    setSourcePath(value);
    writeSourcePathOverride(detail.project.id, value);
  }

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
      await startImplementation(detail.project.id, sourcePath);
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

  async function handleStartUiChange() {
    const description = uiChangeText.trim();
    if (!description) return;
    setStartingUiChange(true);
    setUiChangeError(null);
    try {
      await startUiChangeImplementation(detail.project.id, description);
      setUiChangeText("");
      await onChanged();
    } catch (err) {
      setUiChangeError(err instanceof Error ? err.message : "Couldn't start generating this change.");
    } finally {
      setStartingUiChange(false);
    }
  }

  async function handleRevert() {
    if (!run) return;
    setReverting(true);
    setRevertError(null);
    try {
      await revertImplementation(detail.project.id, run.id);
      await onChanged();
    } catch (err) {
      setRevertError(err instanceof Error ? err.message : "Couldn't revert this run.");
    } finally {
      setReverting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[5px] border border-border bg-white p-5">
        <h3 className="text-sm font-bold text-dash-ink">Implementation</h3>
        {!readyToStart && (
          <p className="mt-2 text-xs text-muted">Confirm all four plan sections and set a destination before starting.</p>
        )}

        {canConfirm && engine?.connected && !isActive && (
          <div className="mt-3">
            <label htmlFor="ax-implementation-source-path" className="text-xs font-semibold text-muted">
              Your legacy project&apos;s path on this machine
            </label>
            <p className="mt-1 text-xs text-muted">
              Needed to generate real code changes — without it, this still records the confirmed plan but writes
              nothing.
            </p>
            <input
              id="ax-implementation-source-path"
              value={sourcePath}
              onChange={(e) => handleSourcePathChange(e.target.value)}
              disabled={starting}
              placeholder="e.g. C:\Users\you\projects\legacy-app"
              spellCheck={false}
              autoComplete="off"
              className="mt-2 w-full rounded-xl border border-border px-3 py-1.5 font-mono text-xs text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
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

        {/* UI Customization (ADR-062 Phase 2) — a natural-language change
            against the renewed project's own UI, offered once there is an
            applied build to point at. A separate Generate → Review → Apply
            run from Rebuild's own confirmed-Plan one, reviewed the same way
            below once it reaches awaiting_review. */}
        {canConfirm && !isActive && run?.status === "applied" && (
          <div className="mt-4 rounded-xl border border-border bg-page p-4">
            <label htmlFor="ax-ui-change-description" className="text-xs font-semibold text-dash-ink">
              Describe a UI change
            </label>
            <p className="mt-1 text-xs text-muted">
              Colors, layout, fonts, spacing, component styles — against the renewed project&apos;s own UI, in your
              own words. Reviewed as a diff before anything is written, same as Rebuild.
            </p>
            <textarea
              id="ax-ui-change-description"
              value={uiChangeText}
              onChange={(e) => setUiChangeText(e.target.value)}
              disabled={startingUiChange}
              rows={2}
              placeholder="e.g. make the primary button purple and increase the page padding"
              className="mt-2 w-full resize-none rounded-xl border border-border px-3 py-2 text-sm text-dash-ink placeholder:text-muted focus:outline-none focus-visible:border-brand-purple focus-visible:ring-2 focus-visible:ring-brand-purple/20 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => void handleStartUiChange()}
              disabled={startingUiChange || !uiChangeText.trim()}
              className="mt-2 rounded-[5px] bg-gradient-to-r from-brand-purple to-brand-blue px-3.5 py-1.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {startingUiChange ? "Starting…" : "Generate this change"}
            </button>
            {uiChangeError && (
              <p role="alert" className="mt-2 text-xs font-medium text-danger">
                {uiChangeError}
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
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-dash-ink">
                  Status: {run.status.replace(/_/g, " ")}
                  {run.runKind !== "plan" && (
                    <span className="ml-2 rounded-full bg-brand-purple/10 px-2 py-0.5 text-[11px] font-semibold uppercase text-brand-purple">
                      {run.runKind === "error_fix" ? "error fix" : "UI change"}
                    </span>
                  )}
                </p>
                {canConfirm && run.status === "applied" && (
                  <button
                    type="button"
                    onClick={() => void handleRevert()}
                    disabled={reverting}
                    className="rounded-[5px] border border-border px-3.5 py-1.5 text-xs font-semibold text-dash-ink transition-colors hover:bg-danger/10 hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reverting ? "Reverting…" : "Revert this run"}
                  </button>
                )}
              </div>
            )}
            {revertError && <p role="alert" className="mt-2 text-xs font-medium text-danger">{revertError}</p>}
            {run.instruction && (
              <p className="mt-2 whitespace-pre-wrap break-words text-xs text-muted">
                {run.runKind === "error_fix" ? "Fixing: " : "Requested: "}
                {run.instruction}
              </p>
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

            {run.status === "awaiting_review" && run.beforeReport?.mode === "replay" && (
              <p className="mt-2 text-dash-ink">
                This reproduces the exact result already approved for this project — the confirmed plan hasn&rsquo;t
                changed, so nothing was generated again.
              </p>
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

function RunLocallyPanel({
  detail,
  canConfirm,
  canEdit,
  onChanged,
}: {
  detail: AxRenewalProjectDetail;
  canConfirm: boolean;
  canEdit: boolean;
  onChanged: () => Promise<void>;
}) {
  const router = useRouter();
  // The exact "a real generated build to point at" precondition the tab has
  // always been locked behind (ADR-048) -- Approve (ADR-044) is what makes
  // this true. A rebuild started since re-locks it, since the destination is
  // presumed mid-change again.
  const unlocked = detail.latestImplementationRun?.status === "applied";

  const [status, setStatus] = useState<AxRenewalRunLocallyStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement>(null);

  // AI Error Assistant, phase 1 (ADR-062): a real answer from the local
  // model about the real failure above, or nothing at all — never a guess
  // shown while one is pending. Cleared the moment the run is retried, since
  // an explanation of the last failure would otherwise linger on screen
  // looking like it describes whatever is happening now.
  const [explaining, setExplaining] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);

  // AI Error Assistant, phase 2 (ADR-062): a real Generate run against the
  // destination itself, reviewed the same way any other proposed change is
  // (GeneratedChangesReview on the Implementation tab) — this only starts
  // it and says so; nothing here writes to the destination on its own.
  const [fixing, setFixing] = useState(false);
  const [fixError, setFixError] = useState<string | null>(null);

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
  const guidance = status ? runLocallyGuidance(status) : null;
  // A process exit is not the only real failure Run Locally can show: a dev
  // server that renders an unhandled error for one request stays up (Next.js
  // catches it and answers 500) or gets stopped by hand afterward — neither
  // ever reaches `failed`. Real evidence in the log, not the bare status
  // word, is what actually says there is something to explain or fix.
  const hasActionableFailure =
    status != null &&
    status.status !== "starting" &&
    (status.status === "failed" || hasRuntimeErrorEvidence(status.log));

  async function handleStart() {
    setBusy(true);
    setError(null);
    setExplanation(null);
    setExplainError(null);
    try {
      setStatus(await startRunLocally(detail.project.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the local dev server.");
    } finally {
      setBusy(false);
    }
  }

  async function handleExplain() {
    setExplaining(true);
    setExplainError(null);
    try {
      const { reply } = await explainRunLocallyFailure(detail.project.id);
      setExplanation(reply);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : "Couldn't get an explanation for this failure.");
    } finally {
      setExplaining(false);
    }
  }

  async function handleApplyFix() {
    setFixing(true);
    setFixError(null);
    try {
      await startErrorFixImplementation(detail.project.id);
      await onChanged();
      router.push(`/ax-renewal?project=${detail.project.id}&section=implementation`);
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "Couldn't start generating a fix.");
    } finally {
      setFixing(false);
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

        {/* Always one of a few honest, actionable messages — never just the
            bare status word above with nothing to do about it. On failure
            this checks the process's own real log for a handful of standard,
            unambiguous Node/npm error codes (a real fact read off real
            output, the same way the backend's own URL detection works) —
            never a guessed diagnosis; see runLocallyGuidance's own doc
            comment for the exact patterns and the honest fallback. */}
        {guidance && (
          <p
            role={guidance.tone === "error" ? "alert" : undefined}
            className={`mt-3 rounded-xl border px-3 py-2 text-xs ${
              guidance.tone === "success"
                ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                : guidance.tone === "error"
                  ? "border-danger/30 bg-danger/10 text-danger"
                  : "border-brand-purple/20 bg-brand-purple/5 text-dash-ink"
            }`}
          >
            {guidance.message}
          </p>
        )}

        {/* AI Error Assistant, phase 1 (ADR-062) — offered only once there is
            an actual failure to explain, and only at the same read floor
            Chat sits at (an Admin, Developer or Super Admin — never a plain
            User): it can point the local model at the applied destination to
            read it, so it is not the plain status read just above. Read-only
            end to end — it explains, it never edits a file. */}
        {hasActionableFailure && canEdit && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleExplain()}
                disabled={explaining}
                className="rounded-[10px] border border-brand-purple/30 bg-brand-purple/5 px-3 py-1.5 text-xs font-semibold text-brand-purple transition-colors hover:bg-brand-purple/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {explaining ? "Asking the local model…" : "Ask AI to explain this"}
              </button>
              {/* AI Error Assistant, phase 2 (ADR-062) — Super-Admin-or-
                  Developer-exact only, the same write floor Approve/Reject
                  sit at, since this actually generates a candidate fix (never
                  applied without a separate review/approve). */}
              {canConfirm && (
                <button
                  type="button"
                  onClick={() => void handleApplyFix()}
                  disabled={fixing}
                  className="rounded-[10px] bg-gradient-to-r from-brand-purple to-brand-blue px-3 py-1.5 text-xs font-semibold text-white shadow transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {fixing ? "Starting…" : "Generate a fix"}
                </button>
              )}
            </div>
            {explanation && (
              <div className="mt-2 whitespace-pre-wrap break-words rounded-[10px] border border-border bg-white px-3 py-2 text-sm text-dash-ink">
                {explanation}
              </div>
            )}
            {explainError && (
              <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                {explainError}
              </p>
            )}
            {fixError && (
              <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
                {fixError}
              </p>
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
