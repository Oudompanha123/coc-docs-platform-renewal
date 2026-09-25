import type { Role } from "@/lib/auth/api";
import type { IconComponent } from "@/components/layout/icons";
import {
  ArticleIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  GearIcon,
  LayersIcon,
  MonitorIcon,
  NodesIcon,
  PaperclipIcon,
  PlayIcon,
  PlugIcon,
  RenewIcon,
  SparklesIcon,
  TagIcon,
  WarningIcon,
} from "@/components/layout/icons";
import type { AxRenewalProjectDetail, PlanSection } from "./api";

/**
 * Every leaf a caller can select, matching the CodeRenewalPlatform.html
 * prototype's own Explorer tree one-for-one (minus its Team and Appearance
 * tabs, dropped by direct instruction) — reproduced as a nested submenu
 * under "AX Renewal" in the real left sidebar (see Sidebar.tsx), not as an
 * in-page panel, so it lives exactly where that prototype's own Explorer
 * did: as navigation, not as page content.
 */
export type AxRenewalExplorerKey =
  | "attach"
  | "codebase"
  | "understand-architecture"
  | "findings"
  | "old-new"
  | "stack-move"
  | "plan-architecture"
  | "pages"
  | "database"
  | "output"
  | "implementation"
  | "run-locally"
  | "ai-engine"
  | "audit-trail";

/**
 * Written to the shared `section=` query param once every open tab has been
 * closed — distinct from the param being *absent*, which means "nothing
 * chosen yet" and defaults to Attach. Mirrors the reference prototype's own
 * `S.active === null` after its last tab closes, which is what shows its
 * "No tab open. Pick something from the explorer." message.
 */
export const NO_TAB_OPEN = "none";

/**
 * Resolves the shared `section=` query param into the active explorer key —
 * every page/sidebar/topbar component reads this the same way, so the
 * "no tab open" state (see `NO_TAB_OPEN`) reads identically everywhere
 * instead of each place inventing its own null-handling.
 */
export function resolveActiveSection(section: string | null): AxRenewalExplorerKey | null {
  if (section === NO_TAB_OPEN) return null;
  return (section as AxRenewalExplorerKey | null) ?? "attach";
}

export type AxRenewalExplorerItem = {
  key: AxRenewalExplorerKey;
  label: string;
  icon: IconComponent;
  locked?: boolean;
  /**
   * A confirmable Plan item's status dot — matches the prototype's `flag()`
   * helper, which always renders something (a purple ✓ once confirmed, a
   * muted-amber ● while still draft) rather than showing a checkmark only
   * once done and nothing before that.
   */
  flag?: boolean;
  /** Findings' persistent count pill, shown once analysis exists — even a 0 is shown, matching the prototype's `it("find", …, project.findings.length)`. */
  count?: number;
};

export type AxRenewalExplorerGroup = {
  label: string;
  icon: IconComponent;
  badge?: string;
  items: AxRenewalExplorerItem[];
};

/**
 * Static label/group lookup for every key, independent of project state —
 * used by the tab bar and breadcrumb, which need a name for a key before
 * (or after) it's rendered by `buildExplorerGroups`. `section` is set only
 * for the four gated Plan items, since that's what a caller confirms/reopens.
 */
export const EXPLORER_META: Record<
  AxRenewalExplorerKey,
  { label: string; icon: IconComponent; group: "Understand" | "Plan" | "Build" | "Workspace"; section?: PlanSection }
> = {
  attach: { label: "Attach source", icon: PaperclipIcon, group: "Understand" },
  codebase: { label: "Codebase", icon: ArticleIcon, group: "Understand" },
  "understand-architecture": { label: "Architecture", icon: NodesIcon, group: "Understand" },
  findings: { label: "Findings", icon: WarningIcon, group: "Understand" },
  "old-new": { label: "Old → New", icon: RenewIcon, group: "Plan" },
  "stack-move": { label: "Stack move", icon: LayersIcon, group: "Plan", section: "stack_move" },
  "plan-architecture": { label: "Architecture", icon: NodesIcon, group: "Plan", section: "architecture" },
  pages: { label: "Pages", icon: DocumentIcon, group: "Plan", section: "pages" },
  database: { label: "Database", icon: DatabaseIcon, group: "Plan", section: "database" },
  output: { label: "Output", icon: MonitorIcon, group: "Plan" },
  implementation: { label: "Implementation", icon: PlayIcon, group: "Build" },
  "run-locally": { label: "Run locally", icon: PlugIcon, group: "Build" },
  "ai-engine": { label: "AI engine", icon: SparklesIcon, group: "Workspace" },
  "audit-trail": { label: "Audit trail", icon: TagIcon, group: "Workspace" },
};

/**
 * Shared by the sidebar (which renders the tree) and the page (which renders
 * each leaf's content) so the two can never disagree on what is locked.
 *
 * `role` gates only the Workspace group's Audit trail item — the backend
 * serves that read at a `super_admin` floor (every row carries another
 * account's email, NFR-SEC-PII), stricter than the `developer`-capability
 * floor the rest of this page sits at, so the item is left out entirely for
 * anyone else rather than shown and then refused (same "don't advertise
 * what's hidden" pattern as the main admin Sidebar's nav sections).
 */
export function buildExplorerGroups(
  detail: AxRenewalProjectDetail | null,
  role?: Role | null,
): AxRenewalExplorerGroup[] {
  if (!detail) return [];

  const analyzed = detail.analysis != null;
  const confirmedCount = Object.keys(detail.confirmations).length;

  /** label + icon come from EXPLORER_META so the two never drift apart. */
  const item = (
    key: AxRenewalExplorerKey,
    extra?: Partial<Omit<AxRenewalExplorerItem, "key" | "label" | "icon">>,
  ): AxRenewalExplorerItem => ({ key, label: EXPLORER_META[key].label, icon: EXPLORER_META[key].icon, ...extra });

  return [
    {
      label: "Understand",
      icon: FolderIcon,
      items: [
        item("attach"),
        item("codebase", { locked: !analyzed }),
        item("understand-architecture", { locked: !analyzed }),
        item("findings", { locked: !analyzed, count: analyzed ? detail.analysis!.findings.length : undefined }),
      ],
    },
    {
      label: "Plan",
      icon: LayersIcon,
      badge: `${confirmedCount}/4`,
      items: [
        item("old-new", { locked: !analyzed }),
        item("stack-move", { locked: !analyzed, flag: detail.confirmations.stack_move != null }),
        item("plan-architecture", { locked: !analyzed, flag: detail.confirmations.architecture != null }),
        item("pages", { locked: !analyzed, flag: detail.confirmations.pages != null }),
        item("database", { locked: !analyzed, flag: detail.confirmations.database != null }),
        item("output", { locked: !analyzed, flag: detail.destination != null }),
      ],
    },
    {
      label: "Build",
      icon: PlayIcon,
      items: [
        item("implementation", { locked: !analyzed }),
        // Unlocked once the latest implementation run has actually reached
        // applied (ADR-044) -- the real generated build Run Locally needs to
        // point at (ADR-048). A rebuild re-locks this until the new run is
        // itself applied, since the destination is presumed mid-change again.
        item("run-locally", { locked: detail.latestImplementationRun?.status !== "applied" }),
      ],
    },
    {
      label: "Workspace",
      icon: GearIcon,
      items: [item("ai-engine"), ...(role === "super_admin" ? [item("audit-trail")] : [])],
    },
  ];
}
