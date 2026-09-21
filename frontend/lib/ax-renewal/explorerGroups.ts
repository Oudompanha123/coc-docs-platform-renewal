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

export type AxRenewalExplorerItem = {
  key: AxRenewalExplorerKey;
  label: string;
  icon: IconComponent;
  locked?: boolean;
  done?: boolean;
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
  { label: string; group: "Understand" | "Plan" | "Build" | "Workspace"; section?: PlanSection }
> = {
  attach: { label: "Attach source", group: "Understand" },
  codebase: { label: "Codebase", group: "Understand" },
  "understand-architecture": { label: "Architecture", group: "Understand" },
  findings: { label: "Findings", group: "Understand" },
  "old-new": { label: "Old → New", group: "Plan" },
  "stack-move": { label: "Stack move", group: "Plan", section: "stack_move" },
  "plan-architecture": { label: "Architecture", group: "Plan", section: "architecture" },
  pages: { label: "Pages", group: "Plan", section: "pages" },
  database: { label: "Database", group: "Plan", section: "database" },
  output: { label: "Output", group: "Plan" },
  implementation: { label: "Implementation", group: "Build" },
  "run-locally": { label: "Run locally", group: "Build" },
  "ai-engine": { label: "AI engine", group: "Workspace" },
  "audit-trail": { label: "Audit trail", group: "Workspace" },
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

  return [
    {
      label: "Understand",
      icon: FolderIcon,
      items: [
        { key: "attach", label: "Attach source", icon: PaperclipIcon },
        { key: "codebase", label: "Codebase", icon: ArticleIcon, locked: !analyzed },
        { key: "understand-architecture", label: "Architecture", icon: NodesIcon, locked: !analyzed },
        {
          key: "findings",
          label: "Findings",
          icon: WarningIcon,
          locked: !analyzed,
          done: analyzed && detail.analysis!.findings.length > 0,
        },
      ],
    },
    {
      label: "Plan",
      icon: LayersIcon,
      badge: `${confirmedCount}/4`,
      items: [
        { key: "old-new", label: "Old → New", icon: RenewIcon, locked: !analyzed },
        {
          key: "stack-move",
          label: "Stack move",
          icon: LayersIcon,
          locked: !analyzed,
          done: detail.confirmations.stack_move != null,
        },
        {
          key: "plan-architecture",
          label: "Architecture",
          icon: NodesIcon,
          locked: !analyzed,
          done: detail.confirmations.architecture != null,
        },
        {
          key: "pages",
          label: "Pages",
          icon: DocumentIcon,
          locked: !analyzed,
          done: detail.confirmations.pages != null,
        },
        {
          key: "database",
          label: "Database",
          icon: DatabaseIcon,
          locked: !analyzed,
          done: detail.confirmations.database != null,
        },
        { key: "output", label: "Output", icon: MonitorIcon, locked: !analyzed, done: detail.destination != null },
      ],
    },
    {
      label: "Build",
      icon: PlayIcon,
      items: [
        { key: "implementation", label: "Implementation", icon: PlayIcon, locked: !analyzed },
        // Deferred to a later phase (ADR-037) — a local run/preview needs a
        // real generated build to point at, which this phase does not
        // produce. Kept visible, always locked, rather than removed, so the
        // tree reads the same shape the prototype it replaces used.
        { key: "run-locally", label: "Run locally", icon: PlugIcon, locked: true },
      ],
    },
    {
      label: "Workspace",
      icon: GearIcon,
      items: [
        { key: "ai-engine", label: "AI engine", icon: SparklesIcon },
        ...(role === "super_admin"
          ? [{ key: "audit-trail" as const, label: "Audit trail", icon: TagIcon }]
          : []),
      ],
    },
  ];
}
