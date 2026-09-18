import type { IconComponent } from "@/components/layout/icons";
import {
  ArticleIcon,
  DatabaseIcon,
  DocumentIcon,
  FolderIcon,
  LayersIcon,
  MonitorIcon,
  NodesIcon,
  PaperclipIcon,
  PlayIcon,
  PlugIcon,
  RenewIcon,
  WarningIcon,
} from "@/components/layout/icons";
import type { AxRenewalProjectDetail } from "./api";

/**
 * Every leaf a caller can select, matching the CodeRenewalPlatform.html
 * prototype's own Explorer tree one-for-one — reproduced as a nested
 * submenu under "AX Renewal" in the real left sidebar (see Sidebar.tsx),
 * not as an in-page panel, so it lives exactly where that prototype's own
 * Explorer did: as navigation, not as page content.
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
  | "run-locally";

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

/** Shared by the sidebar (which renders the tree) and the page (which renders each leaf's content) so the two can never disagree on what is locked. */
export function buildExplorerGroups(detail: AxRenewalProjectDetail | null): AxRenewalExplorerGroup[] {
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
  ];
}
