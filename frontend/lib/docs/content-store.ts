import { JEX3_SUB_ITEMS_RAW } from "@/lib/docs/jex3-sub-items";
import { DOCS_HEADERS } from "@/lib/docs/jexmcp-nav";
import type { DocContent } from "./content-types";

export type ProductKey = "jex3-0" | "jex2-0" | "coach" | "team" | "usage";

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
  // jex3-0 is excluded here — it's already covered by the JEX3_SUB_ITEMS_RAW
  // block above with the correct /jex3-0/... paths; DOCS_HEADERS also lists
  // it (for the public docs header-switcher), but with the generic
  // /docs/<key>/... pattern, which isn't where its real content lives.
  ...DOCS_HEADERS.filter((header) => header.key !== "jex3-0").flatMap((header) =>
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
  [contentId("jex3-0", "overview")]: {
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
  [contentId("jex3-0", "flow")]: {
    kind: "sections",
    eyebrow: "Flow",
    heading: "Your tasks and your code, in sync.",
    intro:
      "Since v3.5.0, jexmcp connects your dev work to flow.team — pick a task, work as usual, and Flow gets updated by itself: the task goes in-progress when you start, every SVN commit lands as a comment on it, and closing it writes the summary for you.",
    calloutText:
      "No Flow? No problem. The Flow steps are optional and skip silently when the flow MCP server isn't connected — every jexmcp command keeps working exactly as before.",
    sections: [
      {
        title: "1 · Connect the flow MCP",
        note:
          "Flow integration uses the official flow MCP server (https://flow.team/ai/mcp), connected once per user — no API key, just log in with your Flow account (OAuth). Official guide: https://api.flow.team/docs/mcp. Then verify inside Claude Code:",
        command: "/mcp\n\nflow   ✔ connected",
      },
      {
        title: "2 · How to use — the task loop",
        note:
          "Start a task, work, commit, done. Everything in between is logged for you. The picked task becomes this workspace's active task — from here, new-screen / new-ido / clone-module add breadcrumbs to its worklog, and svn-commit posts each revision + file list as a comment on the task, no manual bookkeeping.",
        command:
          "/jexmcp3.0:flow:start     ← pick a task from your worklist → marked 진행 in Flow\n/jexmcp3.0:flow:plan      ← break the task into concrete jexmcp command steps\n/jexmcp3.0:flow:done      ← closing comment from the worklog, task → 완료",
        exampleLabel: "Show what the closing comment looks like",
        exampleCommand:
          "✅ 작업 완료 — 펀드계좌 목록 화면\n\n- 20260703 scaffolded screen mydata_bank_05 (WSVC x2, JSP x3)\n- 20260703 new IDO MYDATA_BANK_R0005 (SELECT)\n- 20260703 svn r4123 — 펀드계좌 목록 화면 추가 (5 files)",
      },
      {
        title: "3 · Tasks, todos & comments",
        note: "Quick writes without leaving the terminal. With no {taskid}, todo and comment target your active task.",
        command:
          "/jexmcp3.0:flow:task {title} [@project] [~YYYYMMDD] [!priority]  ← quick-create a task\n/jexmcp3.0:flow:todo [taskid] {item, item, …}                  ← checklist items on a task\n/jexmcp3.0:flow:comment [taskid] {text}                        ← comment on the active/given task",
        exampleLabel: "Show examples",
        exampleCommand:
          "# new high-priority task on the Harness board, due July 10:\n/jexmcp3.0:flow:task 펀드계좌 상세 화면 @Harness ~20260710 !high\n\n# three checklist items on task 44300456:\n/jexmcp3.0:flow:todo 44300456 SQL 작성, 화면 연동, 테스트\n\n# comment on the active task:\n/jexmcp3.0:flow:comment 화면은 완료, IDO 검증 남음",
      },
      {
        title: "4 · Find things",
        command:
          '/jexmcp3.0:flow:worklist  ← my urgent tasks + deadlines (add "focus" for a suggestion)\n/jexmcp3.0:flow:search {keyword}   ← posts, tasks, schedules — anywhere in Flow',
        exampleLabel: "Show search filters",
        exampleCommand:
          "/jexmcp3.0:flow:search 펀드계좌            # everything\n/jexmcp3.0:flow:search task: 펀드계좌      # tasks only\n/jexmcp3.0:flow:search project: 마이데이터  # project boards\n/jexmcp3.0:flow:search who: 김대리         # people",
      },
      {
        title: "5 · Meetings & reports",
        command:
          "/jexmcp3.0:flow:event {when} {title} [with people…]  ← calendar event, attendees resolved by name\n/jexmcp3.0:flow:report [project|dept]                ← recent activity summary for weekly reports",
      },
      {
        title: "6 · Daily helpers",
        command:
          "/jexmcp3.0:flow:standup   ← drafts yesterday / today / blockers from Flow + your commits\n/jexmcp3.0:flow:triage    ← unread Flow notifications, grouped by what needs you",
      },
      {
        title: "Safe by default",
        note:
          "Nothing outward-facing happens without your confirmation — comments, posts, events, and marking notifications read are always shown to you first. Every read-only command (worklist, search, report) changes nothing in Flow.",
      },
    ],
  },
  [contentId("jex3-0", "structure")]: {
    kind: "sections",
    eyebrow: "Structure",
    heading: "Where everything lives.",
    intro: "Three places matter: your project checkout, the plugin, and your credentials. Here's the map.",
    sections: [
      {
        title: "Your workspace — where you check out and work",
        note: "Check out from SVN to any folder you like, then run /jexmcp3.0:init at this root.",
        command:
          "MYPROJ\\                        ← workspace root, anywhere on your disk (open Claude Code here)\n├── MYPROJ\\                    web app — JSP action & view files\n├── MYPROJ_ETC\\                service XML — WSVC, IDO (JexStudio commits here)\n├── MYPROJ_STATIC\\             static JS / CSS\n├── CLAUDE.md                  project brief — written by init\n└── .claude\\\n    ├── jex_auth.json          your JexStudio login — never commit\n    ├── jex_project.json       prefix + PRJ_ID — written by init\n    ├── tmp\\                   read / clone tool outputs land here\n    └── state\\clone-status.md  clone progress report",
      },
      {
        title: "The plugin — installed once, managed by Claude Code",
        note: "You never edit these files. Update with one command (see Updating).",
        command:
          "%USERPROFILE%\\.claude\\plugins\\     ← Claude Code's plugin area\n├── marketplaces\\cocweb\\       the downloaded marketplace\n└── cache\\...\\jexmcp3.0\\       the installed plugin: commands, hooks, MCP server",
      },
      {
        title: "Inside the jexmcp plugin",
        note: "What the plugin itself is made of — useful when you wonder where a command or check comes from.",
        command:
          "jexmcp3.0                     ← the plugin (from the cocweb marketplace)\n├── commands                  all /jexmcp3.0:... slash commands\n│   ├── init · doctor · status setup & health\n│   ├── jex                   new-screen, new-ido, update-wsvc, clone-module, ...\n│   ├── svn                   svn-update, svn-diff, svn-commit\n│   ├── flow                  start, done, plan, task, todo, comment, worklist, search, event, report, standup, triage\n│   └── server                run-server, monitor-log, plugin\n├── scripts                   the jex MCP server + its runners (Node)\n├── hooks                     auto SVN sync, ido_input.sql validation, clone report\n├── templates                 JSP skeletons used by new-screen\n└── installers                JexStudio30-MCP companion setup",
      },
      {
        title: "Where clone results go",
        note: "When you run /jexmcp3.0:jex:clone-module, snapshots and reports stay inside the workspace — review them before touching anything else.",
        command:
          ".claude\\tmp\\*.json                 read snapshots of source WSVC / IDO / package\n.claude\\state\\clone-status.md      what was cloned, what still needs review\nMYPROJ_ETC\\xml\\service\\...         the cloned XML — committed by JexStudio itself",
      },
    ],
  },
  [contentId("jex3-0", "updating")]: {
    kind: "steps",
    eyebrow: "Updating",
    heading: "One command. Then restart.",
    intro: "Nothing updates by itself — when a new version ships, run this and restart Claude Code.",
    steps: [
      {
        title: "Pull the latest version",
        body: "",
        command: "claude plugin update jexmcp3.0",
      },
      {
        title: "Restart Claude Code",
        body: "Commands, hooks, and the MCP server only reload on a fresh session.",
      },
      {
        title: "Check where you are — anytime",
        body: "Shows the installed version and whether a newer one exists.",
        command: "/jexmcp3.0:status",
      },
    ],
  },
  [contentId("jex3-0", "releases")]: {
    kind: "sections",
    eyebrow: "Releases",
    heading: "What's new in the plugin.",
    intro: "Only jexmcp plugin updates are listed here — every version, what changed, and when.",
    calloutText:
      "Get the latest: claude plugin update jexmcp3.0 → restart Claude Code. Check what you're running with /jexmcp3.0:status.",
    sections: [
      {
        title: "v3.7 — Never blocked by a server outage",
        note: "Latest · 2026-07-06",
        command:
          "• Read tools switch to the backup Studio server automatically when the primary is down — and switch back by themselves when it recovers\n• Switching servers for writes is one config line, effective on the next tool call — no restart needed; the error message itself shows the exact line\n• Sessions are kept per server, so switching never breaks your login\n• doctor probes both servers and reports which one is in use\n• ido_input.sql validation now matches the docs — INSERT/UPDATE/DELETE no longer require an OUT: section, and the IDO type is inferred correctly from 4-digit IDs",
      },
      {
        title: "v3.6 — Flow, fully loaded",
        note: "2026-07-03",
        command:
          "• 7 new flow commands — task, todo, comment, worklist, search, event, report\n• Quick-create tasks with @project ~due !priority, checklists on any task, comments on the active one\n• Search everything in Flow (tasks, posts, projects, people) and check your worklist without leaving the terminal\n• Calendar events with attendees resolved by name; project / department activity summaries for weekly reports",
      },
      {
        title: "v3.5 — Flow (flow.team) integration",
        note: "2026-07-03",
        command:
          "• New /jexmcp3.0:flow:* commands — start, done, plan, standup, triage\n• svn-commit posts the revision + file list as a comment on your active Flow task\n• new-screen / new-ido / clone-module log breadcrumbs — flow:done writes the closing summary from them\n• Fully optional — without the flow MCP server, every command works as before (Flow steps skip silently)",
      },
      {
        title: "v3.4 — Cleaner, safer, more flexible",
        note: "2026-03-10",
        command:
          "• One shared HTTP core — different JexStudio server is now a single config line (STUDIO_HOST)\n• No more silent failures — every operation reports clearly, expired sessions explain themselves\n• Works with both _r001 (default) and _r01 service suffixes; l (list) op recognized\n• Templates & commands fully generic — Java base package, session key, Tomcat settings all per-project\n• Faster reads — SVN sync no longer runs on read-only tools",
      },
      {
        title: "v3.3 — Per-project credentials",
        note: "2026-02-18",
        command:
          "• Each workspace keeps its own JexStudio login at .claude\\jex_auth.json — one computer, many projects, different accounts\n• init asks for your ID/password and creates the file — one standard for everyone",
      },
      {
        title: "v3.1 — Companion installer bundled",
        note: "2026-02-05",
        command:
          "• JexStudio30-MCP setup ships inside the plugin — init silently installs it when missing\n• doctor checks the companion and prints the exact fix",
      },
      {
        title: "v3.0 — jexmcp3.0",
        note: "2026-01-22",
        command: "• Plugin renamed — install is jexmcp3.0@cocweb, commands are /jexmcp3.0:...",
      },
      {
        title: "v2.x — First release",
        note: "2026-01-10",
        command:
          "• One plugin for every JEX workspace — prefix auto-detected from *_ETC\n• 14 MCP tools, SVN guard hooks, screen templates, doctor & status\n• 4-step install via the cocweb marketplace on GitHub",
      },
    ],
  },
  [contentId("jex3-0", "faq")]: {
    kind: "sections",
    eyebrow: "FAQ",
    heading: "Quick answers.",
    intro: "For anything not covered here, one command finds the cause and prints the fix: /jexmcp3.0:doctor",
    sections: [
      {
        title: "JexStudio server not responding (network error / timeout)",
        note:
          "Since v3.7, read tools switch to the backup server (studio30.jexframe.com) automatically and switch back when the primary recovers — no action needed. Note the backup is on the internal network, so VPN may be required. For create/update/clone tools, the error message itself shows the fix — add one line to .claude\\jex_project.json. It takes effect on the next tool call — no restart needed. Login happens automatically after switching. Remove the line when the primary server (jexstudio.coocon.co.kr) is back.",
        command: '{ "STUDIO_HOST": "studio30.jexframe.com" }',
      },
      {
        title: 'Error says "session probably expired"',
        note:
          "The saved login cookie went stale. Usually the next call re-logins automatically; if it keeps failing, delete %USERPROFILE%\\.jexmcp\\cookies_<PROJECT>.txt and retry — a fresh login is created from your .claude\\jex_auth.json.",
      },
      {
        title: "FAILED: … SVN conflict / working copy problems",
        note:
          "The tools sync SVN around every change and stop when your working copy has conflicts. Resolve them (svn resolve), or run /jexmcp3.0:svn:svn-update to see exactly which files conflict — then retry the tool.",
      },
      {
        title: "jex doesn't appear in /mcp",
        note:
          "The plugin isn't installed, or Claude Code wasn't restarted after install. Run /jexmcp3.0:doctor — it checks dependencies and prints the exact fix.",
      },
      {
        title: "Login failed / asks for credentials",
        note:
          "Each project keeps its own login at .claude\\jex_auth.json — /jexmcp3.0:init creates it. Check the ID/password inside, and that your account has access to this JexStudio project.",
      },
      {
        title: "Command /jexmcp3.0:... not found",
        note:
          "Restart Claude Code — commands load at session start. Still missing? claude plugin list should show jexmcp3.0; if not, reinstall with claude plugin install jexmcp3.0@cocweb.",
      },
      {
        title: "Flow commands say the flow MCP is not connected",
        note:
          "The flow MCP server is per-user and not bundled with the plugin. Follow the official Flow MCP guide (https://api.flow.team/docs/mcp) to connect it, then check with /mcp — flow ✔ connected should appear. Everything else in jexmcp works fine without it.",
      },
      {
        title: "Can I use this on a brand-new project?",
        note:
          "Yes — that's the point. Any workspace with the *_ETC layout works: check out from SVN, run /jexmcp3.0:init, done. No plugin changes needed.",
      },
    ],
  },
  [contentId("jex2-0", "")]: {
    kind: "hero",
    heading: "jex2.0",
    tagline: "JexStudio v2 automation for CHECKPAY-family projects.",
    subline: "The zip is retired. It's a plugin now.",
    ctaLabel: "Get started",
    ctaHref: "/docs/jex2-0/get-started",
    eyebrow: "Overview",
    sectionHeading: "Same engine. No more copying zips.",
    sectionIntro:
      "jex2.0 automates IDO work on the internal JexStudio v2 server for any workspace with the *_BT / *_DOMAIN / *_PT layout — DUREADMIN, CHECKPAY, and every future project of that family; the ones jexmcp3.0 doesn't cover. Your project prefix can be anything — MYPROJ in these docs stands for it. It replaces the old jex_mcp_dist.zip + setup_jex_mcp.bat flow: install once from the cocweb marketplace, run /jex2.0:init in any CHECKPAY workspace, done.",
    features: [
      {
        icon: "pulse",
        title: "Three IDO tools",
        description:
          "Create, update, and list IDOs straight against the Studio v2 API — jex_new_ido, jex_update_ido, jex_read_ido. No browser, no clicks.",
      },
      {
        icon: "shield",
        title: "Guarded by design",
        description:
          "SVN updates before and after every write, and ido_input.sql is validated before any tool runs — same guardrails the dist version had.",
      },
      {
        icon: "sparkles",
        title: "Session that heals itself",
        description:
          "Cookie expired? It re-logs into Studio v2 automatically with your stored credentials. You enter the password once, at init.",
      },
      {
        icon: "layers",
        title: "One install, every project",
        description:
          "The plugin lives on your machine; each workspace keeps only its own small config + credentials in .claude/.",
      },
    ],
    closingNote:
      "jex2.0 vs jexmcp3.0 — jex2.0 targets the *_BT / *_DOMAIN / *_ETC / *_PT workspace layout (DUREADMIN, CHECKPAY) against the internal Studio v2 server, with 3 IDO-only tools and an explicit jex_project.json written by init. jexmcp3.0 targets the PREFIX / PREFIX_ETC / PREFIX_STATIC layout (PLUGIN, LOAN, INSU…) against jexstudio.coocon.co.kr, with 14 tools (WSVC / IDO / package / clone) and project config auto-detected from *_ETC. Both can be installed side by side — each workspace simply uses the one that matches its layout.",
  },
  [contentId("jex2-0", "get-started")]: {
    kind: "steps",
    eyebrow: "Get started",
    heading: "Three steps. One password prompt.",
    intro:
      "Steps 1–2 once per machine, step 3 once per workspace. If you already use jexmcp3.0, the marketplace is already added — skip step 1.",
    calloutTone: "warning",
    calloutText:
      "Requirements: Node.js LTS, SVN CLI, access to the internal network (Studio v2 is not reachable from outside), and a GitHub account invited to the private repo.",
    steps: [
      {
        title: "Add the cocweb marketplace",
        body: "Once per machine — same marketplace that serves jexmcp3.0.",
        command: "claude plugin marketplace add https://github.com/Socheat-Hun/jexmcp3.0.git",
      },
      {
        title: "Install the plugin",
        body: "",
        command: "claude plugin install jex2.0@cocweb",
      },
      {
        title: "Initialize the workspace",
        body:
          "Open Claude Code at the workspace root (the folder holding MYPROJ_BT, MYPROJ_ETC…) and run this. It installs npm dependencies, writes .claude/jex_project.json, asks your JexStudio ID/password once, and verifies the login. Then restart Claude Code so the jex2 MCP server starts.",
        command: "/jex2.0:init",
      },
      {
        title: "Verify",
        body: "If not connected, run /jex2.0:init again — it reports exactly what's missing.",
        command: "/mcp",
        output: "jex2   ✔ connected",
      },
    ],
  },
  [contentId("jex2-0", "how-to-use")]: {
    kind: "sections",
    eyebrow: "How to use",
    heading: "Write the SQL file. Say what you want.",
    intro:
      "Every IDO operation starts from one file — ido_input.sql at the workspace root — and one sentence to Claude. The plugin does the rest: validation, Studio API call, SVN sync.",
    calloutText:
      "Don't commit IDO XML by hand. JexStudio generates and commits the files itself — your job ends at the tool call; the post-sync brings Studio's commit into your checkout.",
    sections: [
      {
        title: "1 · The ido_input.sql format",
        note:
          "Three sections. OUT: only for SELECT; IN: optional when there are no bind parameters. Field lines are ENG_ID 한글명 [TYPE] — omit the type for VARCHAR, or use LONG / NUMBER / INT / FLOAT. For a runtime-injected WHERE clause, put ?? in the SQL and a DYNAMIC DYNAMIC DYNAMIC line under IN:.",
        command:
          "SQL:\nSELECT ACCT_NO, ACCT_NM, BAL_AMT\nFROM TB_ACCT\nWHERE MEMB_CD = :MEMB_CD\n\nIN:\nMEMB_CD 회원코드\n\nOUT:\nACCT_NO 계좌번호\nACCT_NM 계좌명\nBAL_AMT 잔액 LONG",
      },
      {
        title: "2 · Create / update / list",
        note:
          '"Create IDO ACCT_R0023, account list query" runs jex_new_ido (reads ido_input.sql) — IDO created in Studio, committed to SVN by Studio. "Update ACCT_R0023 with the new SQL" runs jex_update_ido (hash regenerated) — existing IDO replaced, SVN synced. "List all ACCT IDOs" runs jex_read_ido — snapshot at .claude/tmp/ACCT_ido.json. The SQL type is inferred from the ID suffix — _R### SELECT, _C### INSERT, _U### UPDATE, _D### DELETE — or say it explicitly.',
      },
      {
        title: "3 · What the guardrails catch",
        note:
          "ido_input.sql validation — before new/update, blocks if the file is missing or the SQL:/IN:/OUT: sections are malformed. SVN pre-update — before every write, blocks if any SVN_DIRS repo fails to update (conflicts…). SVN post-sync — after every successful write, pulls Studio's commit down to you.",
      },
    ],
  },
  [contentId("jex2-0", "structure")]: {
    kind: "sections",
    eyebrow: "Structure",
    heading: "Where everything lives.",
    intro: "Two maps: a CHECKPAY-family workspace with its per-project files, and the plugin itself.",
    sections: [
      {
        title: "Your workspace",
        note:
          "MYPROJ = your project prefix — DUREADMIN, CHECKPAY, or any other. /jex2.0:init detects it from the folders that actually exist.",
        command:
          "MYPROJ\\                     ← workspace root (open Claude Code here)\n├── MYPROJ_BT\\                 batch\n├── MYPROJ_DOMAIN\\             domain logic\n├── MYPROJ_DOMAIN_SVC\\         domain services (if present)\n├── MYPROJ_ETC\\                service XML — IDOs land here via Studio\n├── MYPROJ_PT\\                 presentation\n├── MYPROJ_PT_STATIC\\          static JS / CSS\n├── ido_input.sql                 SQL / IN / OUT — you edit this per IDO\n└── .claude\\\n    ├── jex_project.json          HOST · PORT · PRJ_ID · SVR_ID · SVN_DIRS — written by init\n    ├── jex_v2.json               { USR_ID } — your Studio login id\n    ├── jex_v2.local.json         { PWD } — never commit, never share\n    ├── jex_cookies2.txt          Studio v2 session cookie (auto-managed)\n    └── tmp\\                      jex_read_ido snapshots",
      },
      {
        title: "The plugin (installed once, managed by Claude Code)",
        command:
          "jex2.0                        ← from the cocweb marketplace (branch jex2.0)\n├── commands\\                     init · new-ido · update-ido\n├── scripts\\                      jex2 MCP server + Studio v2 runners (Node)\n├── hooks\\                        ido_input.sql validation · SVN pre/post sync\n└── templates\\                    config file examples",
      },
      {
        title: "Env overrides",
        note:
          "JEX_SVN_ROOT — project root override (default: the folder Claude Code was opened in). JEX_SKIP_SVN_UPDATE=1 — skip all SVN sync (pre + post). JEX_SKIP_SVN_PREFLIGHT=1 — skip the pre-sync only.",
      },
    ],
  },
  [contentId("jex2-0", "faq")]: {
    kind: "sections",
    eyebrow: "FAQ",
    heading: "When something doesn't work.",
    intro: "The short answers first — every one of these has bitten someone.",
    sections: [
      {
        title: "Login fails with connection refused / timeout",
        note:
          "Studio v2 lives on the internal network only. Check VPN / office network first — then retry /jex2.0:init step 4.",
      },
      {
        title: "Wrong password — where do I fix it?",
        note:
          "Edit .claude/jex_v2.local.json (the PWD value) and try again. Changed your Studio password recently? Same fix.",
      },
      {
        title: '"jex_project.json not found"',
        note:
          "Init step 2 was skipped or you opened Claude Code in the wrong folder. Open it at the workspace root (the parent of *_BT / *_ETC) and run /jex2.0:init.",
      },
      {
        title: "The tool is blocked before it runs",
        note:
          "That's the validation hook: ido_input.sql is missing or lacks its SQL: / IN: / OUT: sections. The hook message says exactly which part.",
      },
      {
        title: "SVN conflict stops everything",
        note:
          "The pre-update hook refuses to write over a dirty checkout. Resolve the conflict (or svn revert), then repeat the request.",
      },
      {
        title: "Session expired mid-day?",
        note:
          "Nothing to do — the next tool call detects the dead JSESSIONID_studio20 cookie and re-logs in automatically.",
      },
      {
        title: "Can I use jex2.0 and jexmcp3.0 on the same machine?",
        note:
          "Yes — install both. They register different MCP servers (jex2 vs jex) and different commands; each workspace uses whichever matches its layout.",
      },
      {
        title: "Where did /install-mcp and /share-mcp go?",
        note:
          "Retired with the zip. Installation is claude plugin install jex2.0@cocweb now, and sharing = inviting a teammate to the GitHub repo — no more zip passing.",
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
