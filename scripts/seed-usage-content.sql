-- Seed Usage product nav items and content
-- Run: psql -h 192.168.178.41 -U cocdocs -d cocdocs -f scripts/seed-usage-content.sql
SET search_path TO cocdocs_dev;

-- 1. Nav items
INSERT INTO nav_item (product_key, slug, label, sort_order) VALUES
  ('usage', '',             'Overview',    1),
  ('usage', 'setup-guide',  'Setup guide', 2),
  ('usage', 'configuration','Configuration',3)
ON CONFLICT (product_key, slug) DO NOTHING;

-- 2. Overview page (hero layout)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', '', 'hero',
  '{
    "layout": "centered",
    "heading": "Track your team''s Claude Code usage.",
    "tagline": "See who is using Claude Code, how much, and what it costs — in one shared dashboard.",
    "subline": "Daily token counts, cost estimates, per-member budgets, and exportable reports.",
    "ctaLabel": "Set up the reporter",
    "ctaHref": "/docs/usage/setup-guide",
    "eyebrow": "Overview",
    "sectionHeading": "What you get",
    "sectionIntro": "The Usage dashboard gives your team a single place to see Claude Code activity across every developer.",
    "features": [
      {
        "icon": "barChart",
        "title": "Daily token breakdown",
        "description": "Input, output, cache read, and cache creation tokens reported each day per team member."
      },
      {
        "icon": "shield",
        "title": "Budget alerts",
        "description": "Set a team-wide weekly token budget or override it per person. The chart turns amber at 80%, red above 100%."
      },
      {
        "icon": "download",
        "title": "Export reports",
        "description": "Download the full usage table as XLSX or a date-range ZIP. Useful for billing reconciliation or quarterly reviews."
      }
    ],
    "closingNote": "Numbers are estimates at a blended token rate, not a real invoice. See Configuration for details on how cost is calculated."
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

-- 3. Setup guide page (steps)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', 'setup-guide', 'steps',
  '{
    "eyebrow": "Setup guide",
    "heading": "Get the dashboard reporting real numbers.",
    "intro": "Install one command, sign in once in your browser, and your usage reports itself.",
    "calloutTone": "info",
    "calloutText": "You need Node.js 18.18 or newer (Claude Code already requires it). Nothing to download, copy, or configure — the first scan signs you in through this site. Step 4 (inviting teammates) requires admin or super_admin role on this platform.",
    "steps": [
      {
        "title": "Install the CLI",
        "body": "Install claude-team-usage from npm. It reads only this machine''s own Claude Code transcripts (~/.claude/projects) and never talks to Anthropic.",
        "command": "npm install -g claude-team-usage",
        "output": null
      },
      {
        "title": "Run your first scan",
        "body": "The first time, your browser opens Coc Docs. Sign in as usual and click Authorize — the terminal then finishes by itself. Your personal token is saved on this machine and reports for your account only. You can see and revoke every connected machine on My Claude Usage.",
        "command": "claude-team-usage scan",
        "output": "Opening your browser to sign in to Coc Docs…\nsigned in as Your Name <you@company.com>\nscanning ~/.claude/projects for 2026-09-29 (Asia/Phnom_Penh)\n  2026-09-29  41,562 tokens  ✓ created\nsent 41,562 tokens for 2026-09-29"
      },
      {
        "title": "Schedule it to run daily",
        "body": "Later runs need no browser and no input, so a scheduled task works as-is. Running it twice on the same day overwrites, not doubles, that day''s row. To backfill history still on disk, run once with --days 30.",
        "command": "# Windows (Task Scheduler):\nschtasks /Create /TN \"Claude Usage Push\" /SC DAILY /ST 23:30 /TR \"cmd /c claude-team-usage scan\"\n\n# macOS / Linux (crontab -e):\n30 23 * * * claude-team-usage scan",
        "output": null
      },
      {
        "title": "Invite team members to the dashboard",
        "body": "Go to Claude Usage → Members and click Invite teammate. Enter their email address (must match the one Claude Code uses on their machine). Once invited, their next daily report will flip their status from Invited to Active automatically. You can also set a per-member weekly token budget at invite time, or adjust it later from the Budget overrides panel.",
        "command": null,
        "output": null
      }
    ]
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

-- 4. Configuration page (sections)
INSERT INTO docs_content (product_key, slug, kind, body) VALUES (
  'usage', 'configuration', 'sections',
  '{
    "eyebrow": "Configuration",
    "heading": "Manage your team''s usage settings.",
    "intro": "Roles, budgets, connected machines, and reporting periods — everything configurable on the Claude Usage dashboard.",
    "sections": [
      {
        "title": "Roles",
        "note": "The Usage dashboard has its own two-level role system, independent of your platform role. Admin can invite and remove members, set budget overrides, view the ingest secret, and export reports. Member can view the usage table and chart for the current period.",
        "command": null
      },
      {
        "title": "Budget overrides",
        "note": "Set a team-wide default weekly token budget in Configuration. Override it per member in the Budget overrides panel — leave blank to revert to the team default. Budgets scale automatically when switching between Day / Week / Month views so the comparison always makes sense.",
        "command": null
      },
      {
        "title": "Connected machines",
        "note": "Each teammate''s claude-team-usage CLI holds a personal token, created when they click Authorize in the browser. It can only report usage for that person''s own account. My Claude Usage → Connected machines lists every one; Revoke stops that machine immediately. A deactivated or downgraded account''s tokens stop working on their next use, with nothing to revoke by hand.",
        "command": null
      },
      {
        "title": "Reporting period",
        "note": "The period selector (Day / Week / Month) controls which rows are summed for the usage table and chart. Day shows today vs 1/7 of the weekly budget, Week shows this calendar week vs the full weekly budget, Month shows this calendar month vs 4x the weekly budget.",
        "command": null
      }
    ]
  }'::jsonb
)
ON CONFLICT (product_key, slug) DO UPDATE SET kind = EXCLUDED.kind, body = EXCLUDED.body, updated_at = now();

SELECT 'Done — Usage nav items and content seeded.' AS result;
