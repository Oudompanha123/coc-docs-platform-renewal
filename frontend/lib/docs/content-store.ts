import { JEX3_SUB_ITEMS_RAW } from "@/components/layout/nav-config";
import { DOCS_HEADERS } from "@/lib/docs/jexmcp-nav";
import type { DocContent } from "./content-types";

export type ProductKey = "jex3-0" | "jex2-0" | "coach" | "idea" | "workflow" | "usage";

export type RegistryItem = {
  productKey: ProductKey;
  productLabel: string;
  slug: string;
  label: string;
  /** Where the public page for this item actually renders. */
  publicHref: string;
};

/** Every product's sub-item list, composed from the existing nav data
 *  (nav-config.ts for Jex3.0, lib/docs/jexmcp-nav.ts for the other 5) — not
 *  re-typed here, so there's one place each product's real label/slug list
 *  is defined. */
export const CONTENT_REGISTRY: RegistryItem[] = [
  ...JEX3_SUB_ITEMS_RAW.map((item) => ({
    productKey: "jex3-0" as ProductKey,
    productLabel: "Jex3.0",
    slug: item.slug,
    label: item.label,
    publicHref: item.slug ? `/jex3-0/${item.slug}` : "/jex3-0",
  })),
  ...DOCS_HEADERS.flatMap((header) =>
    header.items.map((item) => ({
      productKey: header.key as ProductKey,
      productLabel: header.label,
      slug: item.slug,
      label: item.label,
      publicHref: item.slug ? `/docs/${header.key}/${item.slug}` : `/docs/${header.key}`,
    })),
  ),
];

export function contentId(productKey: ProductKey, slug: string): string {
  return `${productKey}--${slug || "index"}`;
}

function findRegistryEntry(id: string): RegistryItem | undefined {
  return CONTENT_REGISTRY.find((r) => contentId(r.productKey, r.slug) === id);
}

const STORAGE_KEY = "coc-docs-content-store";

type StoredContentMap = Record<string, DocContent>;

function readStore(): StoredContentMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredContentMap) : {};
  } catch {
    return {};
  }
}

function writeStore(map: StoredContentMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Storage unavailable (private mode, quota) — edit still works for this render, just won't persist.
  }
}

/** Seed content — the real Jex3.0 copy cloned in Phase 3, converted from
 *  hardcoded JSX into structured data. Used only as the fallback when no
 *  saved edit exists yet for that id. */
export const SEED_CONTENT: Partial<Record<string, DocContent>> = {
  [contentId("jex3-0", "")]: {
    kind: "hero",
    heading: "jexmcp",
    tagline: "JEX Studio automation for Claude Code.",
    subline: "One install. Every workspace.",
    ctaLabel: "Get started",
    ctaHref: "/jex3-0/get-started",
    eyebrow: "Overview",
    sectionHeading: "Your whole JEX workflow. In one plugin.",
    sectionIntro:
      "Scaffolding. Guardrails. Automation. Open any JEX workspace and everything is ready — no copying folders, no fixing paths.",
    features: [
      {
        icon: "sparkles",
        title: "JexStudio, automated",
        description:
          "Create, update, and clone WSVC, IDO, and packages through 14 MCP tools. Straight to the API — no browser, no clicks.",
      },
      {
        icon: "layers",
        title: "Knows your project",
        description:
          "Auto-detects each workspace's prefix and JexStudio project. Open Claude Code at the root — it figures out the rest.",
      },
      {
        icon: "shield",
        title: "Guarded by design",
        description: "SVN syncs before and after every change. Inputs validated. Destructive operations locked out.",
      },
      {
        icon: "pulse",
        title: "Fixes itself",
        description:
          "Something wrong? doctor finds the cause and prints the fix. status tells you the version and what's new.",
      },
    ],
  },
  [contentId("jex3-0", "get-started")]: {
    kind: "steps",
    eyebrow: "Get started",
    heading: "Up and running in four steps.",
    intro: "Steps 1–2 in a terminal, once per machine. Steps 3–4 inside a Claude Code session.",
    calloutTone: "warning",
    calloutText: "Before you start — get access. Private repo: send your GitHub username to Socheat Hun and accept the invite.",
    steps: [
      {
        title: "Add the marketplace",
        body: "Once per machine. First time, a browser window may ask you to log in to GitHub.",
        command: "claude plugin marketplace add https://github.com/Socheat-Hun/jexmcp3.0.git",
      },
      {
        title: "Install the plugin",
        body: "",
        command: "claude plugin install jexmcp3.0@cocweb",
      },
      {
        title: "Initialize your workspace",
        body: "Open Claude Code at the project root, then run init. It installs everything missing, sets up the project, and asks for your JexStudio login — saved per project in .claude\\jex_auth.json. Restart Claude Code when it finishes.",
        command: "/jexmcp3.0:init",
      },
      {
        title: "Verify",
        body: "Both servers connected — you're ready.",
        command: "/mcp",
        output: "jex (plugin: jexmcp3.0)   ✔ connected\njexstudio30-mcp           ✔ connected",
      },
    ],
  },
  [contentId("jex3-0", "how-to-use")]: {
    kind: "sections",
    eyebrow: "How to use",
    heading: "Just say what you want.",
    intro:
      "You don't memorize tools. Describe the task in plain words — Claude picks the right jex tool, and the hooks keep SVN in sync around every change.",
    calloutText:
      'Example: type "create a new screen for the fund account list in mydata bank" — Claude scaffolds the JSPs, registers both WSVCs, and tells you what\'s left to do. The commands below are the same procedures, invoked explicitly.',
    sections: [
      {
        title: "Build a new screen",
        note: "Scaffolds the view + action JSPs from templates and registers both WSVCs in JexStudio.",
        command: "/jexmcp3.0:jex:new-screen {prefix} {submodule} {seq} {description}",
        exampleLabel: "Show example",
        exampleCommand:
          "# creates mydata_bank_05 (view) + mydata_bank_05_r01 (action):\n/jexmcp3.0:jex:new-screen mydata bank 05 펀드계좌 목록",
      },
      {
        title: "Create an IDO (SQL service)",
        note: "Write ido_input.sql at the workspace root first — a hook validates it before anything is sent.",
        command: "/jexmcp3.0:jex:new-ido {IDO_ID} {SELECT|INSERT|UPDATE|DELETE} {description}",
        exampleLabel: "Show example + ido_input.sql",
        exampleCommand:
          "/jexmcp3.0:jex:new-ido MYDATA_BANK_R0005 SELECT 펀드계좌 조회\n\n# ido_input.sql — what the file looks like:\nSQL:\nSELECT FUND_CD, FUND_NM, BAL_AMT\nFROM TB_FUND\nWHERE MEMB_CD = :MEMB_CD\n\nIN:\nMEMB_CD 회원코드\n\nOUT:\nFUND_CD 펀드코드\nFUND_NM 펀드명\nBAL_AMT 잔액 LONG",
      },
      {
        title: "Link an IDO to an action",
        command: "/jexmcp3.0:jex:update-action {service_id} {IDO_ID}",
        exampleLabel: "Show example",
        exampleCommand:
          "# the action from step 1 now runs the IDO from step 2:\n/jexmcp3.0:jex:update-action mydata_bank_05_r01 MYDATA_BANK_R0005",
      },
      {
        title: "Clone a whole module",
        note: "Reads the source package, then clones package → IDOs → WSVCs in the safe order. A report lands in .claude\\state\\clone-status.md.",
        command: "/jexmcp3.0:jex:clone-module {source_module} {new_module} [name]",
        exampleLabel: "Show example",
        exampleCommand:
          "# copy the whole bank module as the starting point for card:\n/jexmcp3.0:jex:clone-module mydata_bank mydata_card 카드",
      },
      {
        title: "SVN helpers",
        note: "Update, diff, and commit with the team rules built in (UTF-8 commit messages via file, never -m).",
        command:
          "/jexmcp3.0:svn:svn-update   ← pull latest from all repos\n/jexmcp3.0:svn:svn-diff     ← what changed, before committing\n/jexmcp3.0:svn:svn-commit   ← commit with a proper Korean-safe message",
      },
      {
        title: "Health & version — anytime",
        command:
          "/jexmcp3.0:doctor  ← finds problems, prints the exact fix\n/jexmcp3.0:status  ← version + is an update available",
      },
    ],
  },
};

/** Reads a saved edit if one exists, else the seed content, else undefined
 *  (not yet written at all — the editor treats this as "create new"). */
export function getContent(id: string): DocContent | undefined {
  const saved = readStore()[id];
  if (saved) return saved;
  return SEED_CONTENT[id];
}

export function saveContent(id: string, content: DocContent): void {
  const map = readStore();
  map[id] = content;
  writeStore(map);
}

export function hasRegistryEntry(id: string): boolean {
  return Boolean(findRegistryEntry(id));
}

export function registryEntryFor(id: string): RegistryItem | undefined {
  return findRegistryEntry(id);
}
