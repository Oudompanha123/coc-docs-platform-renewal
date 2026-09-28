import type { DocContent } from "./content-types";

/** The 5 products with real seed content today. Products created later
 *  through the nav-editing UI are plain strings — see nav-api.ts's
 *  `NavProduct` — and never have a SEED_CONTENT entry, which is fine:
 *  getContent's fallback chain ends in `undefined` ("not written") for
 *  those, same as any never-edited item. */
export type ProductKey = "jex3-0" | "jex2-0" | "coach" | "team" | "usage";

export function contentId(productKey: string, slug: string): string {
  return `${productKey}--${slug || "index"}`;
}

/** The inverse of contentId — splits on the first "--", since a product
 *  key or slug is always a single kebab-case token that never itself
 *  contains "--". Used by docs-content-api.ts so it can build the real
 *  API's URL from just the id string, without depending on the nav
 *  structure being loaded. */
export function parseContentId(id: string): { productKey: string; slug: string } {
  const separatorIndex = id.indexOf("--");
  if (separatorIndex === -1) return { productKey: id, slug: "" };
  const productKey = id.slice(0, separatorIndex);
  const rest = id.slice(separatorIndex + 2);
  return { productKey, slug: rest === "index" ? "" : rest };
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
    ctaHref: "/docs/jex3-0/get-started",
    eyebrow: "Overview",
    sectionHeading: "Your whole JEX workflow. In one plugin.",
    sectionIntro:
      "**Scaffolding. Guardrails. Automation.** Open any **JEX workspace** and everything is ready — no copying folders, no fixing paths.",
    features: [
      {
        icon: "sparkles",
        title: "JexStudio, automated",
        description:
          "Create, update, and clone **WSVC**, **IDO**, and packages through **14 MCP tools**. Straight to the API — no browser, no clicks.",
      },
      {
        icon: "layers",
        title: "Knows your project",
        description:
          "Auto-detects each workspace's **prefix** and **JexStudio project**. Open **Claude Code** at the root — it figures out the rest.",
      },
      {
        icon: "shield",
        title: "Guarded by design",
        description: "**SVN** syncs before and after every change. Inputs validated. Destructive operations locked out.",
      },
      {
        icon: "pulse",
        title: "Fixes itself",
        description:
          "Something wrong? **doctor** finds the cause and prints the fix. **status** tells you the version and what's new.",
      },
    ],
  },
  [contentId("jex3-0", "get-started")]: {
    kind: "steps",
    eyebrow: "Get started",
    heading: "Up and running in four steps.",
    intro: "Steps **1–2** in a terminal, once per machine. Steps **3–4** inside a **Claude Code** session.",
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
        body: "Open **Claude Code** at the project root, then run **init**. It installs everything missing, sets up the project, and asks for your **JexStudio** login — saved per project in **.claude\\jex_auth.json**. Restart Claude Code when it finishes.",
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
      "You don't memorize tools. Describe the task in plain words — Claude picks the right **jex tool**, and the **hooks** keep **SVN** in sync around every change.",
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
      "Since **v3.5.0**, **jexmcp** connects your dev work to **flow.team** — pick a task, work as usual, and **Flow** gets updated by itself: the task goes **in-progress** when you start, every **SVN commit** lands as a comment on it, and closing it writes the summary for you.",
    calloutText:
      "No **Flow**? No problem. The **Flow** steps are optional and skip silently when the **flow MCP server** isn't connected — every **jexmcp** command keeps working exactly as before.",
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
  [contentId("jex3-0", "from-scratch")]: {
    kind: "steps",
    eyebrow: "From scratch",
    heading: "Setting up a project that's never used jexmcp before.",
    intro:
      "Same install, a new workspace. Here's the full walkthrough for a project called NEWPROJ — swap in your own prefix.",
    calloutTone: "warning",
    calloutText:
      "Always open Claude Code at the workspace root — the folder containing NEWPROJ_ETC (or whatever your prefix is). That's how the plugin knows which project it's working on.",
    steps: [
      {
        title: "Check out the workspace from SVN",
        body: "No .claude folder needed — the plugin carries everything with it. A fresh checkout looks like this:",
        command:
          "NEWPROJ\\\n├── NEWPROJ\\            web app — JSP action & view\n├── NEWPROJ_CONFIG\\\n├── NEWPROJ_ETC\\        service XML — this dir tells the plugin the prefix\n├── NEWPROJ_JEXSETTING\\\n└── NEWPROJ_STATIC\\     static JS / CSS",
      },
      {
        title: "Open Claude Code at the workspace root",
        body: "",
        command: 'cd "C:\\Projects Workspace\\NEWPROJ"\nclaude',
      },
      {
        title: "Initialize the project",
        body: "Asks for your prefixes and packages, then generates CLAUDE.md, creates .claude\\tmp and .claude\\state, and checks your credentials.",
        command: "/jexmcp3.0:init",
      },
      {
        title: "Verify everything works",
        body: "See the Verify tab for what a full pass looks like.",
        command: "/jexmcp3.0:doctor",
      },
      {
        title: "Start working",
        body: "See the How to use tab for the full command reference.",
      },
    ],
  },
  [contentId("jex3-0", "verify")]: {
    kind: "steps",
    eyebrow: "Verify",
    heading: "Two checks worth knowing.",
    intro:
      "One right after install, one anytime something feels off — both point at the same command underneath.",
    steps: [
      {
        title: "Right after install — are the MCP servers connected?",
        body: "Run this after restarting Claude Code. If either line is missing or says failed, run /jexmcp3.0:doctor next — it finds the cause and prints the exact fix.",
        command: "/mcp",
        output:
          "jex (plugin: jexmcp3.0)   ✔ connected    ← 14 jex_* tools (API automation)\njexstudio30-mcp           ✔ connected    ← jexstudio_* tools (interactive)",
      },
      {
        title: "Anytime — a full health check",
        body: "Checks dependencies, workspace layout, SVN, and your JexStudio login, in that order. First move for any problem.",
        command: "/jexmcp3.0:doctor",
        output:
          "[OK  ] plugin dependencies — sdk + zod loadable\n[OK  ] workspace layout — found: PLUGIN, PLUGIN_ETC, PLUGIN_DOC, PLUGIN_STATIC\n[OK  ] svn CLI — version 1.14.5\n[OK  ] svn working copies — no conflicts\n[OK  ] jex_auth.json — found\n[OK  ] JexStudio session — login OK, saved\n\njexmcp doctor: all checks passed.",
      },
      {
        title: "Where you stand — version & sync",
        body: "Shows the installed plugin version, git sync vs GitHub (behind / ahead / up-to-date), and the current project's settings.",
        command: "/jexmcp3.0:status",
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
      "• Automates IDO work on the internal **JexStudio v2** server for any workspace using the *_BT / *_DOMAIN / *_PT layout — **DUREADMIN**, **CHECKPAY**, and every future project of that family; the ones **jexmcp3.0** doesn't cover.\n• Your project prefix can be anything — **MYPROJ** in these docs stands for it.\n• Replaces the old **jex_mcp_dist.zip** + **setup_jex_mcp.bat** flow: install once from the cocweb marketplace, run **/jex2.0:init** in any **CHECKPAY** workspace, done.",
    features: [
      {
        icon: "pulse",
        title: "Three IDO tools",
        description:
          "Create, update, and list **IDOs** straight against the **Studio v2 API** — **jex_new_ido**, **jex_update_ido**, **jex_read_ido**. No browser, no clicks.",
      },
      {
        icon: "shield",
        title: "Guarded by design",
        description:
          "**SVN** updates before and after every write, and **ido_input.sql** is validated before any tool runs — same guardrails the dist version had.",
      },
      {
        icon: "sparkles",
        title: "Session that heals itself",
        description:
          "Cookie expired? It re-logs into **Studio v2** automatically with your stored credentials. You enter the password once, at **init**.",
      },
      {
        icon: "layers",
        title: "One install, every project",
        description:
          "The plugin lives on your machine; each workspace keeps only its own small config + credentials in **.claude/**.",
      },
    ],
    closingNote:
      "jex2.0 vs jexmcp3.0\n• **jex2.0** targets the *_BT / *_DOMAIN / *_ETC / *_PT workspace layout (**DUREADMIN**, **CHECKPAY**) against the internal Studio v2 server — **3 IDO-only tools**, explicit jex_project.json written by init.\n• **jexmcp3.0** targets the PREFIX / PREFIX_ETC / PREFIX_STATIC layout (**PLUGIN**, **LOAN**, **INSU**…) against jexstudio.coocon.co.kr — **14 tools** (WSVC / IDO / package / clone), project config auto-detected from *_ETC.\n• Both can be installed side by side — each workspace simply uses the one that matches its layout.",
  },
  [contentId("jex2-0", "get-started")]: {
    kind: "steps",
    eyebrow: "Get started",
    heading: "Three steps. One password prompt.",
    intro:
      "Steps **1–2** once per machine, step **3** once per workspace. If you already use **jexmcp3.0**, the marketplace is already added — skip step 1.",
    calloutTone: "warning",
    calloutText:
      "Requirements: **Node.js LTS**, **SVN CLI**, access to the **internal network** (Studio v2 is not reachable from outside), and a **GitHub** account invited to the **private repo**.",
    steps: [
      {
        title: "Add the cocweb marketplace",
        body: "Once per machine — same marketplace that serves **jexmcp3.0**.",
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
          "Open **Claude Code** at the workspace root (the folder holding **MYPROJ_BT**, **MYPROJ_ETC**…) and run this. It installs **npm dependencies**, writes **.claude/jex_project.json**, asks your **JexStudio** ID/password once, and verifies the login. Then restart Claude Code so the **jex2 MCP server** starts.",
        command: "/jex2.0:init",
      },
      {
        title: "Verify",
        body: "If not connected, run **/jex2.0:init** again — it reports exactly what's missing.",
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
      "Every **IDO operation** starts from one file — **ido_input.sql** at the workspace root — and one sentence to Claude. The plugin does the rest: validation, **Studio API** call, **SVN sync**.",
    calloutText:
      "Don't commit **IDO XML** by hand. **JexStudio** generates and commits the files itself — your job ends at the tool call; the **post-sync** brings Studio's commit into your checkout.",
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
    intro: "Two maps: a **CHECKPAY**-family workspace with its per-project files, and the plugin itself.",
    sections: [
      {
        title: "Your workspace",
        note:
          "**MYPROJ** = your project prefix — **DUREADMIN**, **CHECKPAY**, or any other. **/jex2.0:init** detects it from the folders that actually exist.",
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
  [contentId("coach", "")]: {
    kind: "hero",
    heading: "Coach",
    tagline: "Workflow coaching for your AI agents.",
    subline: "Define once. Coach every run.",
    ctaLabel: "Get started",
    ctaHref: "/docs/coach/quick-start",
    eyebrow: "Overview",
    sectionHeading: "Every agent, coached the same way.",
    sectionIntro:
      "Coach wraps your agents with consistent **skills**, **guardrails**, and **templates** — so every run follows the same playbook, whether it's the first one or the thousandth.",
    features: [
      {
        icon: "layers",
        title: "Skills, reusable",
        description:
          "Package a capability once as a **skill**, then attach it to any agent that needs it. No copy-pasted prompt logic between agents.",
      },
      {
        icon: "pulse",
        title: "Guided workflows",
        description: "Coach sequences **multi-step agent workflows** and hands off context between steps automatically.",
      },
      {
        icon: "shield",
        title: "Security & gates",
        description: "Sensitive or destructive steps pause for **approval** before Coach lets an agent proceed.",
      },
      {
        icon: "sparkles",
        title: "Template-driven setup",
        description: "Start new agents from a **template** instead of from scratch, with **skills** and **gates** already wired in.",
      },
    ],
  },
  [contentId("coach", "quick-start")]: {
    kind: "steps",
    eyebrow: "Quick start",
    heading: "Get your first agent coached.",
    intro: "Six steps from install to a tracked run.",
    steps: [
      { title: "Install Coach", body: "Install Coach into your workspace so it can see your existing agents." },
      { title: "Register your first agent", body: "Point Coach at the agent's config or definition file." },
      {
        title: "Attach a skill",
        body: "Pick a skill from the skill library so the agent has at least one coached capability.",
      },
      {
        title: "Add a security gate",
        body: "Add a gate on any step that writes, deletes, or calls an external service.",
      },
      {
        title: "Run the agent through Coach",
        body: "Run it through Coach instead of directly, so its steps and gates are tracked.",
      },
      { title: "Check the run log", body: "Confirm each step, skill call, and gate passed as expected." },
    ],
  },
  [contentId("coach", "how-to-use")]: {
    kind: "sections",
    eyebrow: "How to use",
    heading: "Running and reading a coached agent.",
    intro: "The five things you'll do most often once an agent is registered.",
    sections: [
      {
        title: "Starting a run",
        note: "Trigger an agent through Coach's runner rather than calling it directly — this is what gives you skills, gates, and logging.",
      },
      {
        title: "Choosing skills",
        note: "Pick from the skill library per agent; skills can be shared across multiple agents.",
      },
      {
        title: "Handling gates",
        note: "When a run hits a security gate, Coach pauses and notifies the assigned approver; approve or reject from the run's detail view.",
      },
      {
        title: "Reading output",
        note: "Each run keeps a step-by-step trace — which skill ran, what it returned, and which gates fired — so you can debug a failed run without re-running it blind.",
      },
      {
        title: "Updating an agent",
        note: "Edit its config, re-attach skills as needed, and Coach revalidates the workflow before the next run.",
      },
    ],
  },
  [contentId("coach", "workflow")]: {
    kind: "sections",
    eyebrow: "Workflow",
    heading: "Steps, declared — not hardcoded.",
    intro:
      "A Coach workflow is an **ordered sequence of steps**, where each step is either a **skill call**, a **gate check**, or a **handoff** to another agent. Workflows are defined **declaratively** — not hardcoded in the agent's own logic — so the same agent can be re-sequenced without touching its underlying code. This also means workflows can be reviewed and approved independently of the agent implementation.",
    sections: [],
  },
  [contentId("coach", "structure")]: {
    kind: "sections",
    eyebrow: "Structure",
    heading: "Where everything lives.",
    intro: "A typical Coach project is organized around five directories.",
    sections: [
      { title: "agents/", note: "One definition per agent — name, entry point, attached skills, workflow reference." },
      { title: "skills/", note: "Reusable skill definitions agents can attach to." },
      { title: "templates/", note: "Starter agent configs with recommended skills/gates pre-attached." },
      { title: "gates/", note: "Security/approval gate definitions, referenced by workflows." },
      { title: "workflows/", note: "The ordered step sequences that tie agents, skills, and gates together." },
    ],
  },
  [contentId("coach", "skills")]: {
    kind: "sections",
    eyebrow: "Skills",
    heading: "One capability, attach it anywhere.",
    intro:
      "A **skill** is a single reusable capability — a defined **input/output contract** plus the logic behind it — that any registered agent can attach. Skills are **versioned independently** of the agents that use them, so improving a skill benefits every agent that already has it attached, without needing to touch each agent individually.",
    sections: [],
  },
  [contentId("coach", "agents")]: {
    kind: "sections",
    eyebrow: "Agents",
    heading: "What Coach knows about an agent.",
    intro:
      "An agent in Coach is a named, registered entity with: an **entry point** (what actually runs), a list of **attached skills**, a **workflow** defining its step order, and any **gates** that apply to its steps. Coach doesn't dictate what an agent's underlying logic does — it wraps that logic with consistent skills, structure, and oversight.",
    sections: [],
  },
  [contentId("coach", "templates")]: {
    kind: "sections",
    eyebrow: "Templates",
    heading: "Start from a good default.",
    intro:
      'Templates are starter agent configurations for common patterns (e.g. **"research agent"**, **"support agent"**, **"data-processing agent"**), each pre-wired with a sensible set of **skills** and **gates**. Starting a new agent from a template means you inherit good defaults instead of assembling skills and gates from zero.',
    sections: [],
  },
  [contentId("coach", "security-gates")]: {
    kind: "sections",
    eyebrow: "Security & gates",
    heading: "A checkpoint before anything sensitive.",
    intro:
      "A **gate** is a **checkpoint** inserted into a workflow before a **sensitive step** (e.g. sending data externally, deleting records, spending budget). When a run reaches a gate, Coach **pauses execution** and requires **explicit approval** before continuing. Gates are attached at the **workflow level**, so the same gate can protect the same kind of step across every agent that uses it — you define the gate once, not per agent.",
    sections: [],
  },
  [contentId("team", "")]: {
    kind: "hero",
    heading: "Team",
    tagline: "One workspace for how your team actually works.",
    subline: "Shared tools. Shared visibility. No status meetings required.",
    ctaLabel: "Get started",
    ctaHref: "/docs/team/roadmap",
    eyebrow: "Overview",
    sectionHeading: "Everyone's work, in one place.",
    sectionIntro:
      "Team brings your group's **workspace**, **tools**, and **progress** together — so anyone can see what's planned, what's in motion, and how it's going without asking around.",
    features: [
      {
        icon: "layers",
        title: "Shared workspace",
        description: "One place for the team's files, links, and active work, instead of scattered across chats and folders.",
      },
      {
        icon: "tag",
        title: "Roadmap visibility",
        description: "See what's planned and its status without a separate planning tool.",
      },
      {
        icon: "sparkles",
        title: "Connected tools",
        description: "Link the tools your team already uses so nothing lives in a silo.",
      },
      {
        icon: "pulse",
        title: "Metrics at a glance",
        description: "Track team activity and progress without asking for a status update.",
      },
    ],
  },
  [contentId("team", "roadmap")]: {
    kind: "sections",
    eyebrow: "Roadmap",
    heading: "What's planned, in motion, and shipped.",
    intro:
      "The **Roadmap** gives the team a shared view of what's **planned**, **in progress**, and **shipped**. Items move through stages (e.g. **Planned → In progress → Done**) so anyone can check status without a separate meeting. Roadmap items can link out to the actual work — a doc, a ticket, a demo — for more detail.",
    sections: [],
  },
  [contentId("team", "tools")]: {
    kind: "sections",
    eyebrow: "Tools",
    heading: "What's already connected.",
    intro:
      "**Tools** lists the external services and **integrations** connected to this team's workspace — the things the team already uses, linked in rather than duplicated. Connecting a tool here makes it visible and accessible from the team's workspace instead of requiring people to remember separate logins and links.",
    sections: [],
  },
  [contentId("team", "workspace")]: {
    kind: "sections",
    eyebrow: "Workspace",
    heading: "The team's shared home base.",
    intro:
      "The **Workspace** is the team's shared home base: **files**, **links**, and **active work** in one place. Anyone on the team can see what's there and what's currently being worked on, instead of information being scattered across individual chats or personal folders.",
    sections: [],
  },
  [contentId("team", "agents")]: {
    kind: "sections",
    eyebrow: "Agents",
    heading: "What's automated versus manual.",
    intro:
      "**Agents** lists any **automated helpers** the team relies on — for example, ones that post updates, summarize activity, or handle routine tasks on the team's behalf. This section documents what each agent does and where it's configured, so the team knows what's **automated** versus **manual**.",
    sections: [],
  },
  [contentId("team", "metrics")]: {
    kind: "sections",
    eyebrow: "Metrics",
    heading: "How things are going, at a glance.",
    intro:
      "**Metrics** tracks team activity and progress over time — for example, work completed, **tool usage**, or roadmap items shipped per period. The goal is to give the team (and anyone checking in) a quick read on how things are going without asking for a manual **status update**.",
    sections: [],
  },
  [contentId("usage", "")]: {
    kind: "hero",
    heading: "Usage",
    tagline: "Track your team's Claude Code token usage in one place.",
    subline: "Token counts, API-equivalent costs, and active users — updated each time a teammate runs the reporter.",
    ctaLabel: "Open Claude Usage",
    ctaHref: "/claude-usage",
    eyebrow: "Overview",
    sectionHeading: "One tool, full team visibility.",
    sectionIntro:
      "**Usage** collects token data reported by each teammate's local reporter script and shows it in a **single dashboard** — broken down by person, model, and day.",
    features: [
      {
        icon: "coins",
        title: "Real token counts",
        description: "Actual tokens from **Claude Code transcripts**, summed daily and sent by each person from their own machine — not estimates.",
      },
      {
        icon: "pulse",
        title: "Per-person breakdown",
        description: "See **who's using what**: input / output tokens, total, **API-equivalent cost**, last-active time, and models per teammate.",
      },
      {
        icon: "shield",
        title: "Soft budget alerts",
        description: "Set a **weekly token limit** per person. The dashboard shows a **progress bar** and flags anyone approaching their limit.",
      },
      {
        icon: "sparkles",
        title: "Privacy-first by design",
        description: "Each person **runs the reporter on their own machine** and controls when they send. The dashboard shows only what people choose to report.",
      },
    ],
  },
  [contentId("usage", "setup-guide")]: {
    kind: "steps",
    eyebrow: "Setup guide",
    heading: "Report your Claude Code usage to the team dashboard.",
    intro:
      "Ten minutes, once per machine. The dashboard only knows what each machine tells it — nothing here reads anyone else's Anthropic account. If you don't run the reporter, you simply don't appear.",
    calloutTone: "info",
    calloutText:
      "**What gets sent** — your name and email, the date, today's token counts, and which models, as daily totals only (one row per person per day). **Never sent** — prompts, code, file names, project names, per-message rows, transcripts, or anything Anthropic holds.",
    steps: [
      {
        title: "Download your script",
        body: "No clone, no install, no build step, and no config file to fill in. **Node 20 or newer**, one download, one click.\n\nAny signed-in account can do this — admin/super_admin from **Claude Code Usage** (link below), everyone else from the **Claude Usage** section on your **Home** page. Click the **push-usage.mjs** download link — that's it, nothing to label or type first. It downloads a `push-usage.mjs` already filled in with your email, your name, the dashboard's ingest URL, and a personal token scoped to just your own account. Put it anywhere and run it; you can revoke the token later from the same panel if a laptop is retired.\n\nThe token inside is tied to the account that generated it, so a copy only ever reports as **that** account — it cannot be handed to a teammate to report as them. If you need this for CI or Docker rather than your own machine, see **manual setup** below instead.",
      },
      {
        title: "Check it first — nothing is sent",
        body: "A dry run prints exactly what *would* be sent and posts nothing.\n\nCompare the total against `ccusage` or `/usage` inside Claude Code. Add `--verbose` if you want to see how many files and responses it read.",
        command: "node push-usage.mjs --dry-run",
      },
      {
        title: "Push it",
        body: "No flags. This is the one that actually sends.\n\nNow run it again. The dashboard must still show one row for today with the same total — the script recomputes the whole day and overwrites, so a double run changes nothing. That is the check worth doing, because it is what makes the every-10-minutes schedule safe.",
        command: "node push-usage.mjs",
        output: "sent 428818 tokens for 2026-08-27 (Your Name <you@company.com>)",
      },
      {
        title: "Schedule it every 10 minutes",
        body: '**Windows** — download the two wrapper files below into the same folder as the script, then register the task so it runs the `.vbs` (not `push-usage.mjs` directly): the `.vbs` launches `run-push-usage.cmd` with no console window, and the `.cmd` runs Node and appends each result to `push-usage.log` next to it, so a scheduled run leaves a trail you can check without opening Task Scheduler. The `.cmd` assumes Node is installed at `C:\\Program Files\\nodejs\\node.exe` — open it in a text editor and fix that one line first if yours lives elsewhere.\n\n**Linux** — `crontab -e`:\n`*/10 * * * * USER_EMAIL=you@company.com INGEST_URL=https://your-backend.com/api/ingest INGEST_SECRET=xxx /usr/bin/node /home/you/push-usage.mjs`\n\n**macOS** — a plist in `~/Library/LaunchAgents/` with `StartInterval` 600 and the three values under `EnvironmentVariables`, then `launchctl load` it.',
        downloads: [
          { label: "run-push-usage.cmd", href: "/downloads/run-push-usage.cmd" },
          { label: "run-push-usage.vbs", href: "/downloads/run-push-usage.vbs" },
        ],
        command:
          '$action  = New-ScheduledTaskAction -Execute "wscript.exe" `\n         -Argument "C:\\claude-usage\\run-push-usage.vbs" -WorkingDirectory "C:\\claude-usage"\n$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `\n         -RepetitionInterval (New-TimeSpan -Minutes 10)\nRegister-ScheduledTask -TaskName "Claude usage report" -Action $action -Trigger $trigger `\n         -Settings (New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd)',
      },
      {
        title: "Backfilling older days",
        body: "By default the reporter sends **today only** — that is what the scheduled run should keep doing. If you are setting up after already using Claude Code for a while, `--days N` reports the last N days instead, so the history still sitting in your transcripts lands on the dashboard.\n\n• Today, the normal run: `node push-usage.mjs`\n• This week and last: `node push-usage.mjs --days 14`\n• The past month: `node push-usage.mjs --days 30`\n• Everything still on disk: `node push-usage.mjs --days 90`\n\nIt prints one line per day as it goes. Days with no usage are skipped rather than recorded as zero, since a zero is indistinguishable from a machine that never reported. Re-running is safe: every day is an independent upsert keyed on (you, date), so numbers are replaced rather than added.\n\n**It can only recover what is still on your machine.** The reporter reads your Claude Code transcripts in `~/.claude/projects`. Whatever has been pruned from there is gone, so a large `--days` may find fewer days than you expect. Run the backfill once, then leave the schedule on its default.\n\nOn the dashboard, the arrows either side of Day / Week / Month step back through history — that is how you look at last month once it has backfilled.",
        command: "node push-usage.mjs --dry-run --days 30",
      },
      {
        title: "If it doesn't work",
        body: "The script exits `0` on success and `1` with a one-line reason otherwise, so the scheduler's last-result column is meaningful.\n\n• **rejected (401)** — your `INGEST_SECRET` doesn't match the server's, or it was a personal token that got revoked from Claude Code Usage → Download push-usage.mjs. Generate a fresh script and swap it in.\n• **no ingest route at…** — the URL must end in `/api/ingest`.\n• **a proxy or DLP agent is intercepting HTTPS** — a company HTTPS-inspecting proxy. Fixed once per machine — see Configuration.\n• **cannot resolve the host** — typo in the URL.",
      },
      {
        title: "Manual setup (CI or Docker)",
        body: "The one-click script above needs a signed-in session to mint its embedded token, so it does not fit an unattended CI job or a container. For those, download the **generic** `push-usage.mjs` below and configure it the old way — environment variables, since there is no companion config file to place beside it anymore.\n\nMint a personal token yourself (Claude Code Usage or your Home page → Download push-usage.mjs; paste just the token value out of the downloaded file rather than sharing the file itself) or use the shared secret, if one is configured for this deployment. Leave **USER_NAME** out and the script asks for it once on first run in a real terminal, then remembers it — skip that too and it falls back to the email's local part, which is what a non-interactive job needs anyway.",
        downloads: [{ label: "push-usage.mjs", href: "/downloads/push-usage.mjs" }],
        command:
          'USER_EMAIL=you@company.com \\\nUSER_NAME="Your Name" \\\nINGEST_URL=https://your-backend.com/api/ingest \\\nINGEST_SECRET=<personal token or shared secret> \\\nnode push-usage.mjs',
      },
    ],
  },
  [contentId("usage", "configuration")]: {
    kind: "sections",
    eyebrow: "Configuration",
    heading: "The settings behind the dashboard.",
    intro:
      "Most configuration is **per-reporter** (embedded in your downloaded `push-usage.mjs`, or environment variables for manual/CI setups) or **per-session** (the time-period toggle on the Claude Usage page). There is nothing to deploy or restart.",
    sections: [
      {
        title: "What the percentage means",
        note: "The percentage on the Claude Usage dashboard is **not** an Anthropic limit — Pro/Max plans are rolling 5-hour windows plus a weekly cap, and no API exposes how much is left. It measures usage against a soft budget this team set for itself, to answer **\"is this person burning through more than we planned for the week?\"** For the exact remaining quota, run `/usage` inside Claude Code — that is the only exact source.",
      },
      {
        title: "Reporter config",
        note: "**Claude Code Usage → Download push-usage.mjs** generates a single, self-contained script with your email, name, ingest URL, and a personal token baked in — no separate config file to place beside it, nothing to fill in by hand. For CI, Docker, or an account that can't mint its own token, the generic `push-usage.mjs` still reads `USER_EMAIL`, `USER_NAME`, `INGEST_URL`, and `INGEST_SECRET` as environment variables (see **Manual setup** in the setup guide) — those always take priority over whatever a downloaded script has embedded.",
      },
      {
        title: "Custom transcript directory",
        note: "By default the reporter reads `~/.claude/projects`. If your Claude Code transcripts live elsewhere, set `CLAUDE_PROJECTS_DIR` as an environment variable.",
      },
      {
        title: "Soft budget overrides",
        note: "The default limit is **1.2 M tokens per person per week**. To override it for a specific person, open **Claude Usage** → scroll to **Soft budget overrides** → enter a new value next to their name. Changes take effect immediately — no redeploy needed.",
      },
      {
        title: "Near-limit threshold",
        note: "Each teammate's soft-budget bar is **green** below **70%**, **amber** from **70–89%**, and **red** at **90%** and above, of their effective budget for the selected period — scaled down for Day or up for Month, so the bar means the same thing whichever period is selected. **Near Limit** on the summary counts amber and red together. A red row also gets a **Hand off** tag, a nudge to hand off work before hitting the wall. None of this is an Anthropic API limit, just where this team decided to start paying attention.",
      },
      {
        title: "Counted toward budget",
        note: "Input and output tokens count toward the weekly budget and the percentage shown. Cache reads and cache writes are recorded and shown on the dashboard, but never counted toward the budget or the percentage.",
      },
      {
        title: "Reporting period",
        note: "The **Day / Week / Month** toggle on the Claude Usage page changes how tokens are aggregated. It is a per-session display setting — no configuration file is involved.",
      },
      {
        title: "Reporting timezone",
        note: "Every day boundary is computed in **Asia/Phnom_Penh**, fixed for everyone regardless of which timezone a teammate's own machine is set to. This is what makes one person's \"today\" match everyone else's on the dashboard.",
      },
      {
        title: "Week starts",
        note: "Weeks run **Monday through Sunday**, fixed for everyone — this is not configurable per team or per person.",
      },
      {
        title: "Adding teammates",
        note: "Any teammate who runs the reporter at least once is added to the dashboard automatically. No admin action is needed to enrol them — the dashboard picks up whoever sends data.",
      },
      {
        title: "Where the rows live",
        note: "One row per person per day, in the backend's Postgres database, upserted on **(member, date)** — a repeat report for the same day replaces that row rather than adding to it, so a double-run of the scheduled task can never double-count. Removing someone from the dashboard (Claude Usage → Remove) only hides them from view; it never deletes their history.",
      },
      {
        title: "About the money figure",
        note: "Everyone here is on a flat-rate Claude plan, so **nobody is billed these amounts**. The figure answers a different question: what would this usage have cost on the Anthropic API? Useful for seeing who is doing the heavy lifting, never actual spend. Pricing is applied per model, in the backend, at real Anthropic API rates (ADR-036) — a mixed Opus-and-Sonnet day is costed correctly rather than averaged, and a price change takes effect on the next deploy without every teammate updating their copy of the script. Cache reads and cache writes are recorded but never added to the cost figure, however large they are.",
      },
      {
        title: "Company HTTPS inspection (one-off, per machine)",
        note: "If the reporter fails with **\"a proxy or DLP agent is intercepting HTTPS\"**, your company's network re-signs HTTPS traffic with its own certificate. Windows and your browser trust it because it's installed in the Windows certificate store — but **Node ships its own trusted-authority list and doesn't read that store**, so it refuses the connection instead. The script below finds that certificate and points Node at it via `NODE_EXTRA_CA_CERTS`, set as a **real system environment variable** (Node reads it once at process start, so it can't come from `claude-usage.config.json`) — reopen your terminal before trying again. **Never set** `NODE_TLS_REJECT_UNAUTHORIZED=0` to work around this — it turns off certificate checking for every connection the reporter makes, including the one carrying your `INGEST_SECRET`.",
        downloads: [{ label: "fix-node-ca.ps1", href: "/downloads/fix-node-ca.ps1" }],
        command: "powershell -ExecutionPolicy Bypass -File fix-node-ca.ps1 -TargetHost your-backend-host",
      },
      {
        title: "Backend environment",
        note: "Only one setting is needed for ingestion to work at all: `app.claude-usage.ingest-secret`, the shared bearer secret `/api/ingest` checks — never logged, never returned by any API response. There is no separate budget, threshold, or timezone environment variable: the weekly default, the near-limit threshold, and the reporting timezone are fixed in the backend's own code, and per-person budget overrides are set through the Claude Usage UI, not an env var. Exactly where that one setting is configured operationally is still open — the backend's hosting target is deferred (ADR-012).",
      },
      {
        title: "How a number gets here",
        note: "**Your machine reads its own transcripts** — the scheduled script scans `~/.claude/projects/**/*.jsonl` on that machine only. **It sums today, deduplicating** on message id + request id — Claude Code writes one line per content block and repeats the usage object on each, so summing naively inflates totals by roughly 2.4×. **It posts the running day total** to `/api/ingest` with the shared bearer secret — the one route exempt from the backend's normal session check, since it carries its own check instead. **The row is upserted, never appended** — keyed on (member, date), and the client always sends the full day total rather than a delta, so repeats and retries converge instead of drifting. **The dashboard reads the backend's Postgres database directly** when you open Claude Usage — no separate cache step, and no credentials ever reach the browser.",
      },
    ],
  },
};
