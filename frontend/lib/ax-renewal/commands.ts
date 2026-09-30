import type { PlanSection } from "./api";
import type { AxRenewalExplorerKey } from "./explorerGroups";

/**
 * Text commands the AX Assistant panel understands, each mapping 1:1 onto an
 * action that already exists (and is already authorized) elsewhere in this
 * app — confirming/reopening a plan section, running analysis, starting
 * implementation, or jumping to a tab.
 *
 * Deliberately excludes the reference prototype's free-text stack-layer
 * retargeting and page add/remove/rename commands: those mutate structured,
 * multi-field data that `StackMoveSection`/`PagesSection` already handle far
 * more reliably via dropdowns and buttons than regex/fuzzy-matching against
 * an option list would. Fuzzy string matching there was also the highest-risk
 * part of the prototype's own design (silently retargeting the wrong layer
 * on a near-miss). Anything typed here that isn't one of the phrases below
 * falls back to a real, persisted comment instead — never a guess.
 */
export type AxCommand =
  | { type: "confirm"; section: PlanSection }
  | { type: "reopen"; section: PlanSection }
  | { type: "confirm-all" }
  | { type: "run-analysis" }
  | { type: "start-implementation" }
  | { type: "open"; tab: AxRenewalExplorerKey };

const SECTION_ALIASES: Record<string, PlanSection> = {
  stack: "stack_move",
  "stack move": "stack_move",
  "stack-move": "stack_move",
  move: "stack_move",
  architecture: "architecture",
  arch: "architecture",
  pages: "pages",
  database: "database",
  db: "database",
};

const OPEN_TARGETS: Record<string, AxRenewalExplorerKey> = {
  attach: "attach",
  source: "attach",
  codebase: "codebase",
  architecture: "understand-architecture",
  findings: "findings",
  "old-new": "old-new",
  bridge: "old-new",
  "stack move": "stack-move",
  "stack-move": "stack-move",
  pages: "pages",
  database: "database",
  output: "output",
  implementation: "implementation",
  "run locally": "run-locally",
  "ai engine": "ai-engine",
  members: "members",
  team: "members",
  "audit trail": "audit-trail",
};

function parseSection(raw: string): PlanSection | null {
  return SECTION_ALIASES[raw.trim().toLowerCase()] ?? null;
}

/** Returns null when `text` doesn't match a recognized command — the caller should treat that as a plain comment, not an error. */
export function parseCommand(text: string): AxCommand | null {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  if (/^confirm\s+(all|everything)$/.test(lower)) {
    return { type: "confirm-all" };
  }

  let match = /^confirm\s+(.+)$/.exec(lower);
  if (match) {
    const section = parseSection(match[1]!);
    if (section) return { type: "confirm", section };
  }

  match = /^reopen\s+(.+)$/.exec(lower);
  if (match) {
    const section = parseSection(match[1]!);
    if (section) return { type: "reopen", section };
  }

  if (/^run\s+analysis$/.test(lower)) {
    return { type: "run-analysis" };
  }

  if (/^start\s+implementation$/.test(lower)) {
    return { type: "start-implementation" };
  }

  match = /^open\s+(.+)$/.exec(lower);
  if (match) {
    const tab = OPEN_TARGETS[match[1]!.trim()];
    if (tab) return { type: "open", tab };
  }

  return null;
}

/** A short label for the applied/denied effect line under an assistant reply, e.g. "database confirmed". */
export function describeCommand(command: AxCommand): string {
  switch (command.type) {
    case "confirm":
      return `${sectionLabel(command.section)} confirmed`;
    case "reopen":
      return `${sectionLabel(command.section)} reopened`;
    case "confirm-all":
      return "all four sections confirmed";
    case "run-analysis":
      return "analysis started";
    case "start-implementation":
      return "implementation started";
    case "open":
      return `opened ${command.tab}`;
  }
}

function sectionLabel(section: PlanSection): string {
  return { stack_move: "Stack move", architecture: "Architecture", pages: "Pages", database: "Database" }[section];
}
